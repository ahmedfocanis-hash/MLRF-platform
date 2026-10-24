import crypto from 'node:crypto';
import { AppError } from '../middleware/errors.js';
import { CertificateModel, PaymentModel, SubscriptionModel, UserModel, AuditLogModel } from '../models/index.js';
import { env } from '../config/env.js';

export type PaymentOutcome = 'success' | 'failure';

function makeCertificateNumber() {
  const year = new Date().getFullYear();
  const suffix = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
  return `MLRF-${year}-${suffix}`;
}

export async function issueCertificate(
  userId: string | any,
  subscriptionId: string | any,
  session?: any,
) {
  const existingQuery = CertificateModel.findOne({ subscriptionId }).select('+qrHash');
  if (session && existingQuery.session) existingQuery.session(session);
  const existing = await existingQuery;
  if (existing) return existing;

  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt);
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const certificate = {
        userId: String(userId?._id ?? userId?.id ?? userId),
        subscriptionId: String(subscriptionId?._id ?? subscriptionId?.id ?? subscriptionId),
        certNumber: makeCertificateNumber(),
        qrHash: crypto.randomBytes(16).toString('hex'),
        issuedAt,
        expiresAt,
        status: 'valid' as const,
      };
      const created = await CertificateModel.create([certificate], session ? { session } : undefined);
      return Array.isArray(created) ? created[0] : created;
    } catch (error) {
      if (attempt === 3) throw error;
    }
  }
  throw new AppError(500, 'CERTIFICATE_ISSUE_FAILED', 'Could not issue a unique certificate');
}

/**
 * Applies a payment outcome using Turso / libSQL.
 */
export async function settlePayment(paymentId: string, outcome: PaymentOutcome, webhookReference?: string) {
  if (!paymentId || typeof paymentId !== 'string' || !paymentId.trim()) {
    throw new AppError(400, 'PAYMENT_ID_INVALID', 'Payment ID is invalid');
  }

  const payment = await PaymentModel.findById(paymentId);
  if (!payment) throw new AppError(404, 'PAYMENT_NOT_FOUND', 'Payment not found');

  if (webhookReference) {
    const previouslyProcessed = await PaymentModel.findOne({ webhookReference });
    if (previouslyProcessed) {
      if (String(previouslyProcessed._id ?? previouslyProcessed.id) !== paymentId) {
        throw new AppError(409, 'WEBHOOK_REFERENCE_REUSED', 'Webhook reference was already used for another payment');
      }
      return { payment: previouslyProcessed, duplicate: true };
    }
  }

  if (payment.status === 'paid') {
    if (outcome === 'failure') throw new AppError(409, 'PAYMENT_ALREADY_PAID', 'A paid payment cannot be changed to failed');
    if (webhookReference && !payment.webhookReference) {
      payment.webhookReference = webhookReference;
      await payment.save();
    } else if (webhookReference && payment.webhookReference !== webhookReference) {
      throw new AppError(409, 'PAYMENT_ALREADY_SETTLED', 'Payment has already been settled by another gateway event');
    }
    return { payment, duplicate: true };
  }
  if (payment.status === 'failed' && outcome === 'success') {
    throw new AppError(409, 'PAYMENT_ALREADY_FAILED', 'A failed payment cannot be changed to paid; initiate a new payment');
  }

  if (outcome === 'failure') {
    payment.status = 'failed';
    if (webhookReference) payment.webhookReference = webhookReference;
    await payment.save();
    await AuditLogModel.create([{
      userId: payment.userId,
      userLabel: 'payment-gateway',
      role: 'finance_admin',
      action: 'PAYMENT_FAILED',
      entityType: 'payment',
      entityId: String(payment._id ?? payment.id),
      ipAddress: 'gateway',
      userAgent: 'mock-gateway',
    }]);
    return { payment, duplicate: false };
  }

  const subscription = await SubscriptionModel.findById(payment.subscriptionId);
  const user = await UserModel.findById(payment.userId);
  if (!subscription || !user) throw new AppError(409, 'PAYMENT_LINK_BROKEN', 'Payment is missing its user or subscription');
  if (payment.amount !== subscription.amountDue) {
    throw new AppError(409, 'PAYMENT_AMOUNT_MISMATCH', 'Payment amount does not match the subscription amount');
  }

  payment.status = 'paid';
  payment.paidAt = new Date();
  if (webhookReference) payment.webhookReference = webhookReference;
  await payment.save();

  subscription.status = 'active';
  subscription.startsAt = new Date();
  subscription.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  await subscription.save();

  user.status = 'active';
  await user.save();
  const certificate = await issueCertificate(user._id ?? user.id, subscription._id ?? subscription.id);
  await AuditLogModel.create([{
    userId: user._id ?? user.id,
    userLabel: user.email,
    role: user.role,
    action: 'PAYMENT_SUCCEEDED',
    entityType: 'payment',
    entityId: String(payment._id ?? payment.id),
    ipAddress: 'gateway',
    userAgent: 'mock-gateway',
  }]);

  return { payment, certificate, user, duplicate: false };
}

export const settleTursoPayment = settlePayment;

export function isValidWebhookSignature(body: unknown, signature: string) {
  const expected = crypto.createHmac('sha256', env.PAYMENT_WEBHOOK_SECRET).update(JSON.stringify(body)).digest();
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
  const provided = Buffer.from(signature, 'hex');
  return provided.length === expected.length && crypto.timingSafeEqual(provided, expected);
}
