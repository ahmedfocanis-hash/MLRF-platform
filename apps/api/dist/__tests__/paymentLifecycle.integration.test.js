import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { UserModel, SubscriptionModel, PaymentModel, CertificateModel, AuditLogModel } from '../models/index.js';
import { settleMongoPayment } from '../services/paymentLifecycle.js';
const mongoTestUri = process.env.MONGO_TEST_URI;
const integration = describe.skipIf(!mongoTestUri);
integration('MongoDB payment lifecycle integration', () => {
    let userId = new mongoose.Types.ObjectId();
    let subscriptionId = new mongoose.Types.ObjectId();
    let paymentId = '';
    let hasFixture = false;
    beforeAll(async () => {
        await mongoose.connect(mongoTestUri);
    });
    async function cleanPreviousFixture() {
        if (!hasFixture)
            return;
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
        userId = user._id;
        const subscription = await SubscriptionModel.create({
            userId,
            tierId: new mongoose.Types.ObjectId(),
            fiscalYear: 2098,
            status: 'pending_payment',
            amountDue: 1250,
        });
        subscriptionId = subscription._id;
        const payment = await PaymentModel.create({
            userId,
            subscriptionId,
            amount: 1250,
            channel: 'gateway',
            status: 'pending',
            gatewayReference: `gw-${crypto.randomUUID()}`,
        });
        paymentId = String(payment._id);
        hasFixture = true;
    });
    afterAll(async () => {
        await cleanPreviousFixture();
        await mongoose.disconnect();
    });
    it('settles success atomically and repeated success does not duplicate the certificate', async () => {
        const first = await settleMongoPayment(paymentId, 'success', 'evt-integration-success');
        const second = await settleMongoPayment(paymentId, 'success', 'evt-integration-success');
        expect(first.payment.status).toBe('paid');
        expect(second.duplicate).toBe(true);
        expect(await CertificateModel.countDocuments({ subscriptionId })).toBe(1);
        expect((await SubscriptionModel.findById(subscriptionId))?.status).toBe('active');
        expect((await UserModel.findById(userId))?.status).toBe('active');
    });
    it('rolls back every settlement write when the payment amount does not match', async () => {
        await PaymentModel.updateOne({ _id: paymentId }, { $set: { amount: 1 } });
        await expect(settleMongoPayment(paymentId, 'success', 'evt-integration-mismatch')).rejects.toMatchObject({ code: 'PAYMENT_AMOUNT_MISMATCH' });
        expect((await PaymentModel.findById(paymentId))?.status).toBe('pending');
        expect((await SubscriptionModel.findById(subscriptionId))?.status).toBe('pending_payment');
        expect((await UserModel.findById(userId))?.status).toBe('pending_verification');
        expect(await CertificateModel.countDocuments({ subscriptionId })).toBe(0);
        expect(await AuditLogModel.countDocuments({ entityId: paymentId })).toBe(0);
    });
});
//# sourceMappingURL=paymentLifecycle.integration.test.js.map