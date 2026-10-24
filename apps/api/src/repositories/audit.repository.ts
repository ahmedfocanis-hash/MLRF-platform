import crypto from 'node:crypto';
import { db, sanitizeSqlArgs } from '../config/db.js';

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
export const auditRepository = {
  async create(entry: CreateAuditEntry) {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    await db.execute({
      sql: `INSERT INTO audit_logs (id, userId, userLabel, role, action, entityType, entityId, ipAddress, userAgent, metadata, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: sanitizeSqlArgs([
        id,
        entry.userId ?? null,
        entry.userLabel,
        entry.role,
        entry.action,
        entry.entityType,
        entry.entityId ?? null,
        entry.ipAddress,
        entry.userAgent ?? '',
        entry.metadata ? JSON.stringify(entry.metadata) : null,
        createdAt,
      ]),
    });
    return {
      _id: id,
      id,
      ...entry,
      createdAt,
    };
  },

  async findRecent(limit = 50, filter: { role?: string; action?: string; userLabel?: string } = {}) {
    const conditions: string[] = [];
    const args: any[] = [];

    if (filter.role) {
      conditions.push('role = ?');
      args.push(filter.role);
    }
    if (filter.action) {
      conditions.push('action = ?');
      args.push(filter.action);
    }
    if (filter.userLabel) {
      conditions.push('userLabel LIKE ?');
      args.push(`%${filter.userLabel}%`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const safeLimit = Math.min(Math.max(limit, 1), 200);
    args.push(safeLimit);

    const result = await db.execute({
      sql: `SELECT * FROM audit_logs ${whereClause} ORDER BY createdAt DESC, id DESC LIMIT ?`,
      args: sanitizeSqlArgs(args),
    });

    return result.rows.map((row: any) => ({
      _id: row.id,
      ...row,
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : {},
    }));
  },
};
