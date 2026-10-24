import { SubscriptionModel } from '../models/index.js';
export const subscriptionRepository = {
    findForUserAndYear(userId, fiscalYear) {
        return SubscriptionModel.findOne({ userId, fiscalYear }).lean();
    },
    createPending(input) {
        return SubscriptionModel.create({ ...input, renewalStatus: 'new', status: 'pending_payment' });
    },
    activate(id, startsAt = new Date()) {
        const expiresAt = new Date(startsAt);
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        return SubscriptionModel.findByIdAndUpdate(id, { status: 'active', startsAt, expiresAt }, { new: true, runValidators: true });
    },
};
//# sourceMappingURL=subscription.repository.js.map