import crypto from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { initDatabase } from '../config/db.js';
import { UserModel, SubscriptionModel, PaymentModel, CertificateModel, AuditLogModel } from '../models/index.js';
import { settlePayment } from '../services/paymentLifecycle.js';

const isTestDbEnabled = Boolean(process.env.TURSO_DATABASE_URL || process.env.TEST_TURSO);
const integration = describe.skipIf(!isTestDbEnabled);

integration('Turso payment lifecycle integration', () => {
  let userId = crypto.randomUUID();
  let subscriptionId = crypto.randomUUID();
  let paymentId = '';
  let hasFixture = false;

  beforeAll(async () => {
    await initDatabase();
  });

  async function cleanPreviousFixture() {
    if (!hasFixture) return;
    await Promise.all([
      CertificateModel.deleteMany({ userId }),
      AuditLogModel.deleteMany({ userId }),
      PaymentModel.deleteMany({ userId }),
      SubscriptionModel.deleteMany({ userId }),
      UserModel.deleteOne({ _id: userId }),
    ]);
  }

  beforeEach(async () => {
    await cleanPreviousFixture();
    const user = await UserModel.create({
      name: 'Payment Integration Test',
      email: `payment-test-${crypto.randomUUID()}@example.test`,
      phone: `+1555${String(Math.floor(Math.random() * 1_000_000_000)).padStart(9, '0')}`,
      passwordHash: 'test-hash-not-for-login',
      role: 'subscriber',
      status: 'pending_verification',
    });
    userId = user._id ?? user.id;
    const subscription = await SubscriptionModel.create({
      userId,
      tierId: crypto.randomUUID(),
      fiscalYear: 2098,
      status: 'pending_payment',
      amountDue: 1250,
    });
    subscriptionId = subscription._id ?? subscription.id;
    const payment = await PaymentModel.create({
      userId,
      subscriptionId,
      amount: 1250,
      channel: 'gateway',
      status: 'pending',
      gatewayReference: `gw-${crypto.randomUUID()}`,
    });
    paymentId = String(payment._id ?? payment.id);
    hasFixture = true;
  });

  afterAll(async () => {
    await cleanPreviousFixture();
  });

  it('settles success atomically and repeated success does not duplicate the certificate', async () => {
    const webhookRef = `evt-integration-success-${crypto.randomUUID()}`;
    const first = await settlePayment(paymentId, 'success', webhookRef);
    const second = await settlePayment(paymentId, 'success', webhookRef);
    expect(first.payment.status).toBe('paid');
    expect(second.duplicate).toBe(true);
    expect(await CertificateModel.countDocuments({ subscriptionId })).toBe(1);
    expect((await SubscriptionModel.findById(subscriptionId))?.status).toBe('active');
    expect((await UserModel.findById(userId))?.status).toBe('active');
  });

  it('rolls back every settlement write when the payment amount does not match', async () => {
    const mismatchRef = `evt-integration-mismatch-${crypto.randomUUID()}`;
    await PaymentModel.updateOne({ _id: paymentId }, { $set: { amount: 1 } });
    await expect(settlePayment(paymentId, 'success', mismatchRef)).rejects.toMatchObject({ code: 'PAYMENT_AMOUNT_MISMATCH' });
    expect((await PaymentModel.findById(paymentId))?.status).toBe('pending');
    expect((await SubscriptionModel.findById(subscriptionId))?.status).toBe('pending_payment');
    expect((await UserModel.findById(userId))?.status).toBe('pending_verification');
    expect(await CertificateModel.countDocuments({ subscriptionId })).toBe(0);
    expect(await AuditLogModel.countDocuments({ entityId: paymentId })).toBe(0);
  });
});
