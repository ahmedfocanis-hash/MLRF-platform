import {SubscriptionModel} from '../models/index.js';

export const subscriptionRepository = {
  findForUserAndYear(userId: string, fiscalYear: number) {
    return SubscriptionModel.findOne({userId, fiscalYear}).lean();
  },
  createPending(input: {userId: string; tierId: string; fiscalYear: number; amountDue: number}) {
    return SubscriptionModel.create({...input, renewalStatus: 'new', status: 'pending_payment'});
  },
  activate(id: string, startsAt = new Date()) {
    const expiresAt = new Date(startsAt);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    return SubscriptionModel.findByIdAndUpdate(id, {status: 'active', startsAt, expiresAt}, {new: true, runValidators: true});
  },
};
