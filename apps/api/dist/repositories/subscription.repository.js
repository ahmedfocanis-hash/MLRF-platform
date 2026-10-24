import crypto from 'node:crypto';
import { db, sanitizeSqlArgs } from '../config/db.js';
export const subscriptionRepository = {
    async findForUserAndYear(userId, fiscalYear) {
        const result = await db.execute({
            sql: `SELECT * FROM subscriptions WHERE userId = ? AND fiscalYear = ? LIMIT 1`,
            args: sanitizeSqlArgs([userId, fiscalYear]),
        });
        if (!result.rows.length)
            return null;
        const row = result.rows[0];
        return {
            _id: row.id,
            ...row,
        };
    },
    async createPending(input) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        await db.execute({
            sql: `INSERT INTO subscriptions (id, userId, tierId, fiscalYear, renewalStatus, status, amountDue, startsAt, expiresAt, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?)`,
            args: sanitizeSqlArgs([id, input.userId, input.tierId, input.fiscalYear, 'new', 'pending_payment', input.amountDue, now, now]),
        });
        return {
            _id: id,
            id,
            ...input,
            renewalStatus: 'new',
            status: 'pending_payment',
            createdAt: now,
            updatedAt: now,
        };
    },
    async activate(id, startsAt = new Date()) {
        const expiresAt = new Date(startsAt);
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        const now = new Date().toISOString();
        await db.execute({
            sql: `UPDATE subscriptions SET status = 'active', startsAt = ?, expiresAt = ?, updatedAt = ? WHERE id = ?`,
            args: sanitizeSqlArgs([startsAt.toISOString(), expiresAt.toISOString(), now, id]),
        });
        const result = await db.execute({
            sql: `SELECT * FROM subscriptions WHERE id = ? LIMIT 1`,
            args: sanitizeSqlArgs([id]),
        });
        if (!result.rows.length)
            return null;
        const row = result.rows[0];
        return {
            _id: row.id,
            ...row,
        };
    },
};
//# sourceMappingURL=subscription.repository.js.map