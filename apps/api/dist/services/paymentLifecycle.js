import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { AppError } from '../middleware/errors.js';
import { CertificateModel, PaymentModel, SubscriptionModel, UserModel, AuditLogModel } from '../models/index.js';
import { env } from '../config/env.js';
function makeCertificateNumber() {
    const year = new Date().getFullYear();
    const suffix = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
    return `MLRF-${year}-${suffix}`;
}
export async function issueCertificate(userId, subscriptionId, session) {
    const existingQuery = CertificateModel.findOne({ subscriptionId }).select('+qrHash');
    if (session)
        existingQuery.session(session);
    const existing = await existingQuery;
    if (existing)
        return existing;
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    for (let attempt = 0; attempt < 4; attempt += 1) {
        try {
            const certificate = {
                userId,
                subscriptionId,
                certNumber: makeCertificateNumber(),
                qrHash: crypto.randomBytes(16).toString('hex'),
                issuedAt,
                expiresAt,
                status: 'valid',
            };
            const created = await CertificateModel.create([certificate], session ? { session } : undefined);
            return created[0];
        }
        catch (error) {
            if (attempt === 3 || !(error instanceof Error) || !('code' in error && error.code === 11000))
                throw error;
        }
    }
    throw new AppError(500, 'CERTIFICATE_ISSUE_FAILED', 'Could not issue a unique certificate');
}
/**
 * Applies a payment outcome in a MongoDB transaction. The Mongo deployment must
 * support transactions (for example, a replica set). If any related write fails,
 * payment, subscription, user, certificate and audit changes roll back together.
 */
export async function settleMongoPayment(paymentId, outcome, webhookReference) {
    if (!mongoose.isValidObjectId(paymentId))
        throw new AppError(400, 'PAYMENT_ID_INVALID', 'Payment ID is invalid');
    const session = await mongoose.startSession();
    let result;
    try {
        await session.withTransaction(async () => {
            const payment = await PaymentModel.findById(paymentId).session(session);
            if (!payment)
                throw new AppError(404, 'PAYMENT_NOT_FOUND', 'Payment not found');
            if (webhookReference) {
                const previouslyProcessed = await PaymentModel.findOne({ webhookReference }).session(session);
                if (previouslyProcessed) {
                    if (String(previouslyProcessed._id) !== paymentId) {
                        throw new AppError(409, 'WEBHOOK_REFERENCE_REUSED', 'Webhook reference was already used for another payment');
                    }
                    result = { payment: previouslyProcessed, duplicate: true };
                    return;
                }
            }
            if (payment.status === 'paid') {
                if (outcome === 'failure')
                    throw new AppError(409, 'PAYMENT_ALREADY_PAID', 'A paid payment cannot be changed to failed');
                if (webhookReference && !payment.webhookReference) {
                    payment.webhookReference = webhookReference;
                    await payment.save({ session });
                }
                else if (webhookReference && payment.webhookReference !== webhookReference) {
                    throw new AppError(409, 'PAYMENT_ALREADY_SETTLED', 'Payment has already been settled by another gateway event');
                }
                result = { payment, duplicate: true };
                return;
            }
            if (payment.status === 'failed' && outcome === 'success') {
                throw new AppError(409, 'PAYMENT_ALREADY_FAILED', 'A failed payment cannot be changed to paid; initiate a new payment');
            }
            if (outcome === 'failure') {
                payment.status = 'failed';
                if (webhookReference)
                    payment.webhookReference = webhookReference;
                await payment.save({ session });
                await AuditLogModel.create([{
                        userId: payment.userId,
                        userLabel: 'payment-gateway',
                        role: 'finance_admin',
                        action: 'PAYMENT_FAILED',
                        entityType: 'payment',
                        entityId: String(payment._id),
                        ipAddress: 'gateway',
                        userAgent: 'mock-gateway',
                    }], { session });
                result = { payment, duplicate: false };
                return;
            }
            const subscription = await SubscriptionModel.findById(payment.subscriptionId).session(session);
            const user = await UserModel.findById(payment.userId).session(session);
            if (!subscription || !user)
                throw new AppError(409, 'PAYMENT_LINK_BROKEN', 'Payment is missing its user or subscription');
            if (payment.amount !== subscription.amountDue) {
                throw new AppError(409, 'PAYMENT_AMOUNT_MISMATCH', 'Payment amount does not match the subscription amount');
            }
            payment.status = 'paid';
            payment.paidAt = new Date();
            if (webhookReference)
                payment.webhookReference = webhookReference;
            await payment.save({ session });
            subscription.status = 'active';
            subscription.startsAt = new Date();
            subscription.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
            await subscription.save({ session });
            user.status = 'active';
            await user.save({ session });
            const certificate = await issueCertificate(user._id, subscription._id, session);
            await AuditLogModel.create([{
                    userId: user._id,
                    userLabel: user.email,
                    role: user.role,
                    action: 'PAYMENT_SUCCEEDED',
                    entityType: 'payment',
                    entityId: String(payment._id),
                    ipAddress: 'gateway',
                    userAgent: 'mock-gateway',
                }], { session });
            result = { payment, certificate, user, duplicate: false };
        });
        if (!result)
            throw new AppError(500, 'PAYMENT_SETTLEMENT_FAILED', 'Payment settlement did not produce a result');
        return result;
    }
    finally {
        await session.endSession();
    }
}
export function isValidWebhookSignature(body, signature) {
    const expected = crypto.createHmac('sha256', env.PAYMENT_WEBHOOK_SECRET).update(JSON.stringify(body)).digest();
    if (!/^[a-f0-9]{64}$/i.test(signature))
        return false;
    const provided = Buffer.from(signature, 'hex');
    return provided.length === expected.length && crypto.timingSafeEqual(provided, expected);
}
//# sourceMappingURL=paymentLifecycle.js.map