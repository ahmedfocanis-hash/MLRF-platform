import mongoose, {Schema, model, type InferSchemaType} from 'mongoose';
import {ROLES, ACCOUNT_STATUSES, PAYMENT_CHANNELS} from '@mlrf/shared';

const timestamps = {timestamps: true, versionKey: false} as const;

const roleSchema = new Schema({
  name: {type: String, enum: ROLES, required: true, unique: true},
  permissionsJson: {type: [String], required: true, default: []},
}, timestamps);

const userSchema = new Schema({
  name: {type: String, required: true, trim: true, maxlength: 120},
  email: {type: String, required: true, lowercase: true, trim: true, unique: true, index: true},
  phone: {type: String, required: true, trim: true, unique: true, index: true},
  passwordHash: {type: String, required: true, select: false},
  role: {type: String, enum: ROLES, required: true, index: true},
  status: {type: String, enum: ACCOUNT_STATUSES, required: true, default: 'pending_verification', index: true},
  phoneVerifiedAt: {type: Date, default: null}, emailVerifiedAt: {type: Date, default: null},
  refreshTokenHash: {type: String, default: null, select: false},
  lastLoginAt: {type: Date, default: null},
}, timestamps);

const specialtyTierSchema = new Schema({
  code: {type: String, required: true, unique: true}, name: {type: String, required: true}, nameAr: {type: String, required: true},
  entityType: {type: String, enum: ['individual', 'facility'], required: true, index: true},
  fee: {type: Number, required: true, min: 0}, risk: {type: String, enum: ['standard', 'medium', 'high', 'very-high'], required: true}, active: {type: Boolean, default: true},
}, timestamps);

const subscriberProfileSchema = new Schema({
  userId: {type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true},
  entityType: {type: String, enum: ['individual', 'facility'], required: true, index: true},
  nationalId: {type: String, sparse: true, unique: true, match: /^\d{14}$/},
  syndicateId: {type: String, sparse: true, unique: true, trim: true},
  facilityLicense: {type: String, sparse: true, unique: true, trim: true},
  governorate: {type: String, required: true, index: true},
  address: {type: String, trim: true, maxlength: 500},
  documents: [{kind: {type: String, required: true}, storageKey: {type: String, required: true}, mimeType: {type: String, required: true}, size: {type: Number, required: true, min: 1}, uploadedAt: {type: Date, default: Date.now}}],
  completionPercent: {type: Number, min: 0, max: 100, default: 25},
}, timestamps);

const subscriptionSchema = new Schema({
  userId: {type: Schema.Types.ObjectId, ref: 'User', required: true, index: true},
  tierId: {type: Schema.Types.ObjectId, ref: 'SpecialtyTier', required: true},
  fiscalYear: {type: Number, required: true, index: true},
  renewalStatus: {type: String, enum: ['new', 'renewed', 'unrenewed', 'churned'], required: true, default: 'new', index: true},
  status: {type: String, enum: ['pending_payment', 'active', 'expired', 'cancelled'], required: true, default: 'pending_payment', index: true},
  amountDue: {type: Number, required: true, min: 0},
  startsAt: {type: Date, default: null}, expiresAt: {type: Date, default: null},
}, timestamps);
subscriptionSchema.index({userId: 1, fiscalYear: 1}, {unique: true});
subscriptionSchema.index({fiscalYear: 1, tierId: 1, renewalStatus: 1});

const paymentSchema = new Schema({
  userId: {type: Schema.Types.ObjectId, ref: 'User', required: true, index: true},
  subscriptionId: {type: Schema.Types.ObjectId, ref: 'Subscription', required: true, index: true},
  amount: {type: Number, required: true, min: 0},
  currency: {type: String, enum: ['EGP'], default: 'EGP'},
  channel: {type: String, enum: PAYMENT_CHANNELS, required: true},
  status: {type: String, enum: ['pending', 'paid', 'failed', 'refunded'], required: true, default: 'pending', index: true},
  gatewayReference: {type: String, sparse: true, unique: true}, webhookReference: {type: String, sparse: true, unique: true},
  bulkBatchId: {type: Schema.Types.ObjectId, ref: 'BulkBatch', default: null}, paidAt: {type: Date, default: null},
}, timestamps);

const certificateSchema = new Schema({
  userId: {type: Schema.Types.ObjectId, ref: 'User', required: true, index: true},
  subscriptionId: {type: Schema.Types.ObjectId, ref: 'Subscription', required: true, index: true},
  certNumber: {type: String, required: true, unique: true}, qrHash: {type: String, required: true, unique: true, select: false},
  issuedAt: {type: Date, required: true}, expiresAt: {type: Date, required: true, index: true},
  status: {type: String, enum: ['valid', 'revoked'], required: true, default: 'valid', index: true}, revokedAt: {type: Date, default: null},
}, timestamps);
certificateSchema.index({subscriptionId: 1}, {unique: true});

const bulkBatchSchema = new Schema({
  createdBy: {type: Schema.Types.ObjectId, ref: 'User', required: true}, filename: {type: String, required: true}, fiscalYear: {type: Number, required: true, index: true},
  status: {type: String, enum: ['previewed', 'committed', 'failed'], default: 'previewed', index: true},
  totalRows: {type: Number, default: 0}, createdCount: {type: Number, default: 0}, duplicateCount: {type: Number, default: 0}, invalidCount: {type: Number, default: 0}, committedAt: {type: Date, default: null},
}, timestamps);

const claimSchema = new Schema({
  claimNumber: {type: String, required: true, unique: true}, subscriberId: {type: Schema.Types.ObjectId, ref: 'User', required: true, index: true},
  facilityName: {type: String, required: true}, specialty: {type: String, required: true, index: true}, governorate: {type: String, required: true, index: true},
  stage: {type: String, enum: ['incident', 'claim_filed', 'legal_review', 'court_verdict', 'payout'], required: true, index: true},
  incidentAt: {type: Date, required: true}, filedAt: {type: Date, default: null}, verdictAt: {type: Date, default: null}, payoutAt: {type: Date, default: null},
  awardedAmount: {type: Number, min: 0, default: 0}, paidAmount: {type: Number, min: 0, default: 0}, beneficiary: {type: String, required: true}, notes: {type: String, maxlength: 5000},
}, timestamps);
claimSchema.index({stage: 1, specialty: 1, governorate: 1});

const auditLogSchema = new Schema({
  userId: {type: Schema.Types.ObjectId, ref: 'User', default: null, index: true}, userLabel: {type: String, required: true}, role: {type: String, enum: ROLES, required: true, index: true},
  action: {type: String, required: true, index: true}, entityType: {type: String, required: true}, entityId: {type: String, default: null}, ipAddress: {type: String, required: true}, userAgent: {type: String, default: ''}, metadata: {type: Schema.Types.Mixed, default: {}},
}, {...timestamps, versionKey: false});
auditLogSchema.index({createdAt: -1, _id: -1});

const completionTokenSchema = new Schema({
  userId: {type: Schema.Types.ObjectId, ref: 'User', required: true, index: true},
  tokenHash: {type: String, required: true, unique: true, select: false},
  expiresAt: {type: Date, required: true, index: true}, usedAt: {type: Date, default: null},
}, timestamps);

const smsOutboxSchema = new Schema({
  userId: {type: Schema.Types.ObjectId, ref: 'User', default: null, index: true}, phone: {type: String, required: true}, body: {type: String, required: true},
  status: {type: String, enum: ['queued', 'sent', 'failed'], default: 'queued', index: true}, attempts: {type: Number, default: 0}, sentAt: {type: Date, default: null}, lastError: {type: String, default: null},
}, timestamps);

function registered(name: string, schema: any) { return (mongoose.models[name] as any) ?? model(name, schema); }
export const RoleModel = registered('Role', roleSchema);
export const UserModel = registered('User', userSchema);
export const SpecialtyTierModel = registered('SpecialtyTier', specialtyTierSchema);
export const SubscriberProfileModel = registered('SubscriberProfile', subscriberProfileSchema);
export const SubscriptionModel = registered('Subscription', subscriptionSchema);
export const PaymentModel = registered('Payment', paymentSchema);
export const CertificateModel = registered('Certificate', certificateSchema);
export const BulkBatchModel = registered('BulkBatch', bulkBatchSchema);
export const ClaimModel = registered('Claim', claimSchema);
export const AuditLogModel = registered('AuditLog', auditLogSchema);
export const SmsOutboxModel = registered('SmsOutbox', smsOutboxSchema);
export const CompletionTokenModel = registered('CompletionToken', completionTokenSchema);
export type UserRecord = InferSchemaType<typeof userSchema>;
