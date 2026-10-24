export type CreateAuditEntry = {
    userId?: string | null;
    userLabel: string;
    role: string;
    action: string;
    entityType: string;
    entityId?: string | null;
    ipAddress: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
};
/** Persistence boundary for audit data; controllers and services must not use Mongoose directly. */
export declare const auditRepository: {
    create(entry: CreateAuditEntry): any;
    findRecent(limit?: number, filter?: {
        role?: string;
        action?: string;
        userLabel?: string;
    }): any;
};
