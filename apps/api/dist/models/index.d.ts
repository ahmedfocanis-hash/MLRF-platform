export type UserRecord = {
    id: string;
    name: string;
    email: string;
    phone: string;
    passwordHash: string;
    role: string;
    status: string;
    phoneVerifiedAt: Date | null;
    emailVerifiedAt: Date | null;
    refreshTokenHash: string | null;
    lastLoginAt: Date | null;
    createdAt?: string;
    updatedAt?: string;
};
export declare const RoleModel: {
    countDocuments(): Promise<number>;
    updateOne(filter: any, update: any, _opts?: any): Promise<any>;
    deleteMany(_filter?: any): Promise<any>;
};
export declare const UserModel: {
    countDocuments(): Promise<number>;
    exists(filter: any): Promise<boolean>;
    create(data: any): Promise<any>;
    findOne(filter: any): any;
    findById(id: any): any;
    findOneAndUpdate(filter: any, update: any, opts?: any): Promise<any>;
    updateOne(filter: any, update: any, opts?: any): Promise<any>;
    deleteOne(filter: any): Promise<any>;
    deleteMany(filter: any): Promise<any>;
};
export declare const SubscriberProfileModel: {
    countDocuments(): Promise<number>;
    exists(filter: any): Promise<boolean>;
    findOne(filter: any): any;
    create(data: any): Promise<any>;
    findOneAndUpdate(filter: any, update: any, opts?: any): Promise<any>;
    updateOne(filter: any, update: any, opts?: any): Promise<any>;
    deleteMany(filter: any): Promise<any>;
};
export declare const SpecialtyTierModel: {
    countDocuments(): Promise<number>;
    findOne(filter: any): any;
    updateOne(filter: any, update: any, opts?: any): Promise<any>;
    deleteMany(_filter?: any): Promise<any>;
};
export declare const SubscriptionModel: {
    countDocuments(): Promise<number>;
    findOne(filter: any): any;
    findById(id: any): any;
    create(data: any): Promise<any>;
    findOneAndUpdate(filter: any, update: any, opts?: any): Promise<any>;
    findByIdAndUpdate(id: string, update: any, _opts?: any): Promise<any>;
    deleteMany(filter: any): Promise<any>;
};
export declare const PaymentModel: {
    countDocuments(): Promise<number>;
    create(data: any): Promise<any>;
    findById(id: any): any;
    findOne(filter: any): any;
    updateOne(filter: any, update: any, opts?: any): Promise<any>;
    deleteMany(filter: any): Promise<any>;
};
export declare const CertificateModel: {
    countDocuments(filter?: any): Promise<number>;
    create(data: any, _opts?: any): Promise<any>;
    find(filter?: any): any;
    findOne(filter: any): any;
    updateOne(filter: any, update: any, opts?: any): Promise<any>;
    deleteMany(filter: any): Promise<any>;
};
export declare const BulkBatchModel: {
    create(data: any): Promise<any>;
    find(): any;
    findById(id: any): any;
    deleteMany(_filter?: any): Promise<any>;
};
export declare const ClaimModel: {
    countDocuments(): Promise<number>;
    updateOne(filter: any, update: any, opts?: any): Promise<any>;
    deleteMany(_filter?: any): Promise<any>;
};
export declare const AuditLogModel: {
    countDocuments(filter?: any): Promise<number>;
    updateOne(filter: any, update: any, opts?: any): Promise<any>;
    create(data: any, _opts?: any): Promise<any>;
    find(filter?: any): any;
    deleteMany(filter: any): Promise<any>;
};
export declare const SmsOutboxModel: {
    create(data: any): Promise<any>;
    find(): any;
    deleteMany(filter: any): Promise<any>;
};
export declare const CompletionTokenModel: {
    create(data: any): Promise<any>;
    findOneAndUpdate(filter: any, update: any, _opts?: any): any;
    updateOne(filter: any, update: any): Promise<any>;
    deleteMany(filter: any): Promise<any>;
};
