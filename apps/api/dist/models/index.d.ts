import mongoose, { type InferSchemaType } from 'mongoose';
declare const userSchema: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    readonly timestamps: true;
    readonly versionKey: false;
}, {
    status: "pending_verification" | "incomplete" | "pending_completion" | "active" | "expired";
    name: string;
    phone: string;
    email: string;
    role: "super_admin" | "finance_admin" | "practitioner_analyst" | "facility_analyst" | "claims_admin" | "inspector" | "subscriber";
    passwordHash: string;
    phoneVerifiedAt?: NativeDate | null;
    emailVerifiedAt?: NativeDate | null;
    refreshTokenHash?: string | null;
    lastLoginAt?: NativeDate | null;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    status: "pending_verification" | "incomplete" | "pending_completion" | "active" | "expired";
    name: string;
    phone: string;
    email: string;
    role: "super_admin" | "finance_admin" | "practitioner_analyst" | "facility_analyst" | "claims_admin" | "inspector" | "subscriber";
    passwordHash: string;
    phoneVerifiedAt?: NativeDate | null;
    emailVerifiedAt?: NativeDate | null;
    refreshTokenHash?: string | null;
    lastLoginAt?: NativeDate | null;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    readonly timestamps: true;
    readonly versionKey: false;
}>> & mongoose.FlatRecord<{
    status: "pending_verification" | "incomplete" | "pending_completion" | "active" | "expired";
    name: string;
    phone: string;
    email: string;
    role: "super_admin" | "finance_admin" | "practitioner_analyst" | "facility_analyst" | "claims_admin" | "inspector" | "subscriber";
    passwordHash: string;
    phoneVerifiedAt?: NativeDate | null;
    emailVerifiedAt?: NativeDate | null;
    refreshTokenHash?: string | null;
    lastLoginAt?: NativeDate | null;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
}>;
export declare const RoleModel: any;
export declare const UserModel: any;
export declare const SpecialtyTierModel: any;
export declare const SubscriberProfileModel: any;
export declare const SubscriptionModel: any;
export declare const PaymentModel: any;
export declare const CertificateModel: any;
export declare const BulkBatchModel: any;
export declare const ClaimModel: any;
export declare const AuditLogModel: any;
export declare const SmsOutboxModel: any;
export declare const CompletionTokenModel: any;
export type UserRecord = InferSchemaType<typeof userSchema>;
export {};
