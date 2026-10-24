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
/** Persistence boundary for audit data using raw SQL queries via Turso client. */
export declare const auditRepository: {
    create(entry: CreateAuditEntry): Promise<{
        createdAt: string;
        userId?: string | null;
        userLabel: string;
        role: string;
        action: string;
        entityType: string;
        entityId?: string | null;
        ipAddress: string;
        userAgent?: string;
        metadata?: Record<string, unknown>;
        _id: `${string}-${string}-${string}-${string}-${string}`;
        id: `${string}-${string}-${string}-${string}-${string}`;
    }>;
    findRecent(limit?: number, filter?: {
        role?: string;
        action?: string;
        userLabel?: string;
    }): Promise<any[]>;
};
