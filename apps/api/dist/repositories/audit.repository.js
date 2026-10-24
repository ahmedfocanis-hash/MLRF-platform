import { AuditLogModel } from '../models/index.js';
/** Persistence boundary for audit data; controllers and services must not use Mongoose directly. */
export const auditRepository = {
    create(entry) {
        return AuditLogModel.create(entry);
    },
    findRecent(limit = 50, filter = {}) {
        const query = {};
        if (filter.role)
            query.role = filter.role;
        if (filter.action)
            query.action = filter.action;
        if (filter.userLabel)
            query.userLabel = { $regex: escapeRegex(filter.userLabel), $options: 'i' };
        return AuditLogModel.find(query).sort({ createdAt: -1, _id: -1 }).limit(Math.min(Math.max(limit, 1), 200)).lean();
    },
};
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
//# sourceMappingURL=audit.repository.js.map