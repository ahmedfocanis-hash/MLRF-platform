import {AuditLogModel} from '../models/index.js';

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
export const auditRepository = {
  create(entry: CreateAuditEntry) {
    return AuditLogModel.create(entry);
  },
  findRecent(limit = 50, filter: {role?: string; action?: string; userLabel?: string} = {}) {
    const query: Record<string, unknown> = {};
    if (filter.role) query.role = filter.role;
    if (filter.action) query.action = filter.action;
    if (filter.userLabel) query.userLabel = {$regex: escapeRegex(filter.userLabel), $options: 'i'};
    return AuditLogModel.find(query).sort({createdAt: -1, _id: -1}).limit(Math.min(Math.max(limit, 1), 200)).lean();
  },
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
