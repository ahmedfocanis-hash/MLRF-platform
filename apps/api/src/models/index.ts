import crypto from 'node:crypto';
import { db } from '../config/db.js';

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

function wrapRow<T extends Record<string, any>>(tableName: string, row: T | null | undefined): any {
  if (!row) return null;
  const wrapped: any = {
    ...row,
    _id: row.id,
    id: row.id,
    toObject() {
      const copy = { ...wrapped };
      delete copy.toObject;
      delete copy.save;
      return copy;
    },
    async save() {
      const updates = { ...wrapped };
      delete updates.toObject;
      delete updates.save;
      delete updates._id;
      const id = updates.id;
      delete updates.id;
      updates.updatedAt = new Date().toISOString();
      const keys = Object.keys(updates);
      if (!keys.length) return wrapped;
      const setClause = keys.map((k) => `${k} = ?`).join(', ');
      const args = keys.map((k) => {
        const val = updates[k];
        if (val instanceof Date) return val.toISOString();
        if (typeof val === 'object' && val !== null) return JSON.stringify(val);
        return val;
      });
      args.push(id);
      await db.execute({
        sql: `UPDATE ${tableName} SET ${setClause} WHERE id = ?`,
        args,
      });
      return wrapped;
    },
  };
  return wrapped;
}

function createQuery<T>(executor: (ctx: any) => Promise<T>): any {
  const ctx: any = {
    sortField: 'createdAt',
    sortOrder: 'DESC',
    limitCount: 100,
    populates: [],
    selectFields: '*',
  };
  let promise: Promise<T> | null = null;
  function getPromise(): Promise<T> {
    if (!promise) promise = executor(ctx);
    return promise;
  }
  const helper: any = {
    then(onfulfilled?: any, onrejected?: any) {
      return getPromise().then(onfulfilled, onrejected);
    },
    catch(onrejected?: any) {
      return getPromise().catch(onrejected);
    },
    finally(onfinally?: any) {
      return getPromise().finally(onfinally);
    },
    lean() {
      return getPromise();
    },
    session(_s: any) {
      return helper;
    },
    sort(s: any) {
      if (s?.createdAt === -1 || s?.createdAt === 'desc') {
        ctx.sortField = 'createdAt';
        ctx.sortOrder = 'DESC';
      } else if (s?.createdAt === 1 || s?.createdAt === 'asc') {
        ctx.sortField = 'createdAt';
        ctx.sortOrder = 'ASC';
      }
      return helper;
    },
    select(sel: string) {
      ctx.selectFields = sel;
      return helper;
    },
    populate(path: any, select?: any) {
      ctx.populates.push({ path, select });
      return helper;
    },
    limit(l: number) {
      ctx.limitCount = l;
      return helper;
    },
  };
  return helper;
}

export const RoleModel = {
  async countDocuments(): Promise<number> {
    const res = await db.execute(`SELECT COUNT(*) as c FROM roles`);
    return Number(res.rows[0]?.c ?? 0);
  },

  async updateOne(filter: any, update: any, _opts: any = {}): Promise<any> {
    const name = filter.name;
    const setObj = update.$set || update;
    const permissionsJson =
      typeof setObj.permissionsJson === 'string'
        ? setObj.permissionsJson
        : JSON.stringify(setObj.permissionsJson ?? []);
    const now = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO roles (name, permissionsJson, createdAt, updatedAt)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(name) DO UPDATE SET permissionsJson = excluded.permissionsJson, updatedAt = excluded.updatedAt`,
      args: [name, permissionsJson, now, now],
    });
  },

  async deleteMany(_filter: any = {}): Promise<any> {
    await db.execute(`DELETE FROM roles`);
  },
};

export const UserModel = {
  async countDocuments(): Promise<number> {
    const res = await db.execute(`SELECT COUNT(*) as c FROM users`);
    return Number(res.rows[0]?.c ?? 0);
  },

  async exists(filter: any): Promise<boolean> {
    if (filter.$or) {
      const conditions: string[] = [];
      const args: any[] = [];
      for (const cond of filter.$or) {
        if (cond.email) {
          conditions.push('email = ?');
          args.push(cond.email.toLowerCase());
        }
        if (cond.phone) {
          conditions.push('phone = ?');
          args.push(cond.phone);
        }
      }
      if (!conditions.length) return false;
      const res = await db.execute({
        sql: `SELECT 1 FROM users WHERE ${conditions.join(' OR ')} LIMIT 1`,
        args,
      });
      return res.rows.length > 0;
    }
    const conditions: string[] = [];
    const args: any[] = [];
    if (filter.email) {
      conditions.push('email = ?');
      args.push(filter.email.toLowerCase());
    }
    if (filter.phone) {
      conditions.push('phone = ?');
      args.push(filter.phone);
    }
    if (filter.id || filter._id) {
      conditions.push('id = ?');
      args.push(filter.id || filter._id);
    }
    if (!conditions.length) return false;
    const res = await db.execute({
      sql: `SELECT 1 FROM users WHERE ${conditions.join(' AND ')} LIMIT 1`,
      args,
    });
    return res.rows.length > 0;
  },

  async create(data: any): Promise<any> {
    const id = data.id || data._id || crypto.randomUUID();
    const now = new Date().toISOString();
    const email = (data.email || '').toLowerCase();
    await db.execute({
      sql: `INSERT INTO users (id, name, email, phone, passwordHash, role, status, phoneVerifiedAt, emailVerifiedAt, refreshTokenHash, lastLoginAt, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        data.name,
        email,
        data.phone,
        data.passwordHash,
        data.role,
        data.status ?? 'pending_verification',
        data.phoneVerifiedAt ? new Date(data.phoneVerifiedAt).toISOString() : null,
        data.emailVerifiedAt ? new Date(data.emailVerifiedAt).toISOString() : null,
        data.refreshTokenHash ?? null,
        data.lastLoginAt ? new Date(data.lastLoginAt).toISOString() : null,
        data.createdAt ? new Date(data.createdAt).toISOString() : now,
        data.updatedAt ? new Date(data.updatedAt).toISOString() : now,
      ],
    });
    return wrapRow('users', {
      id,
      name: data.name,
      email,
      phone: data.phone,
      passwordHash: data.passwordHash,
      role: data.role,
      status: data.status ?? 'pending_verification',
      phoneVerifiedAt: data.phoneVerifiedAt ?? null,
      emailVerifiedAt: data.emailVerifiedAt ?? null,
      refreshTokenHash: data.refreshTokenHash ?? null,
      lastLoginAt: data.lastLoginAt ?? null,
      createdAt: now,
      updatedAt: now,
    });
  },

  findOne(filter: any): any {
    return createQuery(async (_ctx) => {
      const conditions: string[] = [];
      const args: any[] = [];
      if (filter.email) {
        conditions.push('email = ?');
        args.push(filter.email.toLowerCase());
      }
      if (filter.phone) {
        conditions.push('phone = ?');
        args.push(filter.phone);
      }
      if (filter.role) {
        conditions.push('role = ?');
        args.push(filter.role);
      }
      if (filter.id || filter._id) {
        conditions.push('id = ?');
        args.push(filter.id || filter._id);
      }
      if (filter.status) {
        conditions.push('status = ?');
        args.push(filter.status);
      }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const res = await db.execute({
        sql: `SELECT * FROM users ${where} ORDER BY createdAt ASC LIMIT 1`,
        args,
      });
      return wrapRow('users', (res.rows[0] as any) ?? null);
    });
  },

  findById(id: any): any {
    const targetId = String(id?._id ?? id?.id ?? id);
    return createQuery(async (_ctx) => {
      const res = await db.execute({
        sql: `SELECT * FROM users WHERE id = ? LIMIT 1`,
        args: [targetId],
      });
      return wrapRow('users', (res.rows[0] as any) ?? null);
    });
  },

  async findOneAndUpdate(filter: any, update: any, opts: any = {}): Promise<any> {
    const email = filter.email ? filter.email.toLowerCase() : undefined;
    const phone = filter.phone;
    const id = filter._id || filter.id;

    const existingRes = await db.execute({
      sql: `SELECT * FROM users WHERE ${id ? 'id = ?' : email ? 'email = ?' : 'phone = ?'} LIMIT 1`,
      args: [id || email || phone],
    });

    const setObj = update.$set || update;
    const now = new Date().toISOString();

    if (!existingRes.rows.length) {
      if (opts.upsert) {
        const newId = crypto.randomUUID();
        const userObj = {
          id: newId,
          name: setObj.name ?? 'User',
          email: (setObj.email ?? email ?? '').toLowerCase(),
          phone: setObj.phone ?? phone ?? '',
          passwordHash: setObj.passwordHash ?? '',
          role: setObj.role ?? 'subscriber',
          status: setObj.status ?? 'pending_verification',
          createdAt: now,
          updatedAt: now,
        };
        await db.execute({
          sql: `INSERT INTO users (id, name, email, phone, passwordHash, role, status, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            userObj.id,
            userObj.name,
            userObj.email,
            userObj.phone,
            userObj.passwordHash,
            userObj.role,
            userObj.status,
            now,
            now,
          ],
        });
        return wrapRow('users', userObj);
      }
      return null;
    }

    const row = existingRes.rows[0] as any;
    const keys = Object.keys(setObj);
    if (keys.length) {
      const setSql = keys.map((k) => `${k} = ?`).join(', ');
      const args = keys.map((k) => {
        const v = setObj[k];
        return v instanceof Date ? v.toISOString() : v;
      });
      args.push(row.id);
      await db.execute({
        sql: `UPDATE users SET ${setSql}, updatedAt = '${now}' WHERE id = ?`,
        args,
      });
    }

    const updatedRes = await db.execute({
      sql: `SELECT * FROM users WHERE id = ? LIMIT 1`,
      args: [row.id],
    });
    return wrapRow('users', updatedRes.rows[0] as any);
  },

  async updateOne(filter: any, update: any, opts: any = {}): Promise<any> {
    return this.findOneAndUpdate(filter, update, opts);
  },

  async deleteOne(filter: any): Promise<any> {
    const id = filter._id || filter.id;
    if (id) {
      await db.execute({ sql: `DELETE FROM users WHERE id = ?`, args: [String(id)] });
    }
  },

  async deleteMany(filter: any): Promise<any> {
    if (!filter || Object.keys(filter).length === 0) {
      await db.execute(`DELETE FROM users`);
      return;
    }
    if (filter.userId?.$in) {
      const ids = filter.userId.$in.map(String);
      if (ids.length) {
        const placeholders = ids.map(() => '?').join(',');
        await db.execute({ sql: `DELETE FROM users WHERE id IN (${placeholders})`, args: ids });
      }
    }
  },
};

export const SubscriberProfileModel = {
  async countDocuments(): Promise<number> {
    const res = await db.execute(`SELECT COUNT(*) as c FROM subscriber_profiles`);
    return Number(res.rows[0]?.c ?? 0);
  },

  async exists(filter: any): Promise<boolean> {
    const conditions: string[] = [];
    const args: any[] = [];
    if (filter.nationalId) {
      conditions.push('nationalId = ?');
      args.push(filter.nationalId);
    }
    if (filter.userId) {
      conditions.push('userId = ?');
      args.push(String(filter.userId));
    }
    if (!conditions.length) return false;
    const res = await db.execute({
      sql: `SELECT 1 FROM subscriber_profiles WHERE ${conditions.join(' AND ')} LIMIT 1`,
      args,
    });
    return res.rows.length > 0;
  },

  findOne(filter: any): any {
    return createQuery(async (_ctx) => {
      const conditions: string[] = [];
      const args: any[] = [];
      if (filter.userId) {
        conditions.push('userId = ?');
        args.push(String(filter.userId));
      }
      if (filter.nationalId) {
        conditions.push('nationalId = ?');
        args.push(filter.nationalId);
      }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const res = await db.execute({
        sql: `SELECT * FROM subscriber_profiles ${where} LIMIT 1`,
        args,
      });
      return wrapRow('subscriber_profiles', (res.rows[0] as any) ?? null);
    });
  },

  async create(data: any): Promise<any> {
    const id = data.id || data._id || crypto.randomUUID();
    const now = new Date().toISOString();
    await db.execute({
      sql: `INSERT INTO subscriber_profiles (id, userId, entityType, nationalId, syndicateId, facilityLicense, governorate, address, completionPercent, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        String(data.userId),
        data.entityType,
        data.nationalId ?? null,
        data.syndicateId ?? null,
        data.facilityLicense ?? null,
        data.governorate,
        data.address ?? null,
        data.completionPercent ?? 25,
        now,
        now,
      ],
    });
    return wrapRow('subscriber_profiles', { id, ...data, createdAt: now, updatedAt: now });
  },

  async findOneAndUpdate(filter: any, update: any, opts: any = {}): Promise<any> {
    const userId = String(filter.userId);
    const existing = await this.findOne({ userId });
    const setObj = update.$set || update;
    const now = new Date().toISOString();

    if (!existing) {
      if (opts.upsert) {
        return this.create({ userId, ...setObj });
      }
      return null;
    }

    const keys = Object.keys(setObj);
    if (keys.length) {
      const setSql = keys.map((k) => `${k} = ?`).join(', ');
      const args = keys.map((k) => setObj[k]);
      args.push(existing.id);
      await db.execute({
        sql: `UPDATE subscriber_profiles SET ${setSql}, updatedAt = '${now}' WHERE id = ?`,
        args,
      });
    }
    return this.findOne({ userId });
  },

  async updateOne(filter: any, update: any, opts: any = {}): Promise<any> {
    return this.findOneAndUpdate(filter, update, opts);
  },

  async deleteMany(filter: any): Promise<any> {
    if (!filter || Object.keys(filter).length === 0) {
      await db.execute(`DELETE FROM subscriber_profiles`);
      return;
    }
    if (filter.userId?.$in) {
      const ids = filter.userId.$in.map(String);
      if (ids.length) {
        const placeholders = ids.map(() => '?').join(',');
        await db.execute({ sql: `DELETE FROM subscriber_profiles WHERE userId IN (${placeholders})`, args: ids });
      }
    }
  },
};

export const SpecialtyTierModel = {
  async countDocuments(): Promise<number> {
    const res = await db.execute(`SELECT COUNT(*) as c FROM specialty_tiers`);
    return Number(res.rows[0]?.c ?? 0);
  },

  findOne(filter: any): any {
    return createQuery(async (_ctx) => {
      const conditions: string[] = [];
      const args: any[] = [];
      if (filter.code) {
        conditions.push('code = ?');
        args.push(filter.code);
      }
      if (filter.id || filter._id) {
        conditions.push('id = ?');
        args.push(filter.id || filter._id);
      }
      if (filter.entityType) {
        conditions.push('entityType = ?');
        args.push(filter.entityType);
      }
      if (filter.active !== undefined) {
        conditions.push('active = ?');
        args.push(filter.active ? 1 : 0);
      }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const res = await db.execute({
        sql: `SELECT * FROM specialty_tiers ${where} LIMIT 1`,
        args,
      });
      return wrapRow('specialty_tiers', (res.rows[0] as any) ?? null);
    });
  },

  async updateOne(filter: any, update: any, opts: any = {}): Promise<any> {
    const code = filter.code;
    const existing = await this.findOne({ code });
    const setObj = update.$set || update;
    const now = new Date().toISOString();
    if (!existing) {
      if (opts.upsert) {
        const id = crypto.randomUUID();
        await db.execute({
          sql: `INSERT INTO specialty_tiers (id, code, name, nameAr, entityType, fee, risk, active, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            id,
            code,
            setObj.name,
            setObj.nameAr,
            setObj.entityType,
            setObj.fee,
            setObj.risk,
            setObj.active ? 1 : 0,
            now,
            now,
          ],
        });
        return { id, code, ...setObj };
      }
      return null;
    }
    const keys = Object.keys(setObj);
    if (keys.length) {
      const setSql = keys.map((k) => `${k} = ?`).join(', ');
      const args = keys.map((k) => (k === 'active' ? (setObj[k] ? 1 : 0) : setObj[k]));
      args.push(existing.id);
      await db.execute({
        sql: `UPDATE specialty_tiers SET ${setSql}, updatedAt = '${now}' WHERE id = ?`,
        args,
      });
    }
    return this.findOne({ code });
  },

  async deleteMany(_filter: any = {}): Promise<any> {
    await db.execute(`DELETE FROM specialty_tiers`);
  },
};

export const SubscriptionModel = {
  async countDocuments(): Promise<number> {
    const res = await db.execute(`SELECT COUNT(*) as c FROM subscriptions`);
    return Number(res.rows[0]?.c ?? 0);
  },

  findOne(filter: any): any {
    return createQuery(async (ctx) => {
      const conditions: string[] = [];
      const args: any[] = [];
      if (filter.userId) {
        conditions.push('s.userId = ?');
        args.push(String(filter.userId));
      }
      if (filter.fiscalYear) {
        conditions.push('s.fiscalYear = ?');
        args.push(filter.fiscalYear);
      }
      if (filter.status) {
        conditions.push('s.status = ?');
        args.push(filter.status);
      }
      if (filter.id || filter._id) {
        conditions.push('s.id = ?');
        args.push(filter.id || filter._id);
      }

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const populated = ctx.populates && ctx.populates.length > 0;
      const sql = populated
        ? `SELECT s.*, t.name as tierName, t.nameAr as tierNameAr, t.code as tierCode, t.fee as tierFee, t.risk as tierRisk, t.entityType as tierEntityType
           FROM subscriptions s
           LEFT JOIN specialty_tiers t ON s.tierId = t.id OR s.tierId = t.code
           ${where}
           ORDER BY s.${ctx.sortField} ${ctx.sortOrder}
           LIMIT 1`
        : `SELECT s.* FROM subscriptions s ${where} ORDER BY s.${ctx.sortField} ${ctx.sortOrder} LIMIT 1`;

      const res = await db.execute({ sql, args });
      if (!res.rows.length) return null;
      const row = res.rows[0] as any;
      if (populated && row.tierName) {
        row.tierId = {
          _id: row.tierId,
          id: row.tierId,
          code: row.tierCode,
          name: row.tierName,
          nameAr: row.tierNameAr,
          fee: row.tierFee,
          risk: row.tierRisk,
          entityType: row.tierEntityType,
        };
      }
      return wrapRow('subscriptions', row);
    });
  },

  findById(id: any): any {
    const targetId = String(id?._id ?? id?.id ?? id);
    return createQuery(async (_ctx) => {
      const res = await db.execute({
        sql: `SELECT * FROM subscriptions WHERE id = ? LIMIT 1`,
        args: [targetId],
      });
      return wrapRow('subscriptions', (res.rows[0] as any) ?? null);
    });
  },

  async create(data: any): Promise<any> {
    const id = data.id || data._id || crypto.randomUUID();
    const now = new Date().toISOString();
    await db.execute({
      sql: `INSERT INTO subscriptions (id, userId, tierId, fiscalYear, renewalStatus, status, amountDue, startsAt, expiresAt, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        String(data.userId),
        String(data.tierId),
        data.fiscalYear,
        data.renewalStatus ?? 'new',
        data.status ?? 'pending_payment',
        data.amountDue,
        data.startsAt ? new Date(data.startsAt).toISOString() : null,
        data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
        now,
        now,
      ],
    });
    return wrapRow('subscriptions', { id, ...data, createdAt: now, updatedAt: now });
  },

  async findOneAndUpdate(filter: any, update: any, opts: any = {}): Promise<any> {
    const userId = String(filter.userId);
    const fiscalYear = filter.fiscalYear;
    const existing = await this.findOne({ userId, fiscalYear });
    const setObj = update.$set || update;
    const now = new Date().toISOString();

    if (!existing) {
      if (opts.upsert) {
        return this.create({ userId, fiscalYear, ...setObj });
      }
      return null;
    }

    const keys = Object.keys(setObj);
    if (keys.length) {
      const setSql = keys.map((k) => `${k} = ?`).join(', ');
      const args = keys.map((k) => {
        const v = setObj[k];
        return v instanceof Date ? v.toISOString() : k === 'userId' || k === 'tierId' ? String(v) : v;
      });
      args.push(existing.id);
      await db.execute({
        sql: `UPDATE subscriptions SET ${setSql}, updatedAt = '${now}' WHERE id = ?`,
        args,
      });
    }
    return this.findOne({ userId, fiscalYear });
  },

  async findByIdAndUpdate(id: string, update: any, _opts: any = {}): Promise<any> {
    const setObj = update.$set || update;
    const now = new Date().toISOString();
    const keys = Object.keys(setObj);
    if (keys.length) {
      const setSql = keys.map((k) => `${k} = ?`).join(', ');
      const args = keys.map((k) => {
        const v = setObj[k];
        return v instanceof Date ? v.toISOString() : v;
      });
      args.push(id);
      await db.execute({
        sql: `UPDATE subscriptions SET ${setSql}, updatedAt = '${now}' WHERE id = ?`,
        args,
      });
    }
    return this.findById(id);
  },

  async deleteMany(filter: any): Promise<any> {
    if (!filter || Object.keys(filter).length === 0) {
      await db.execute(`DELETE FROM subscriptions`);
      return;
    }
    if (filter.userId?.$in) {
      const ids = filter.userId.$in.map(String);
      if (ids.length) {
        const placeholders = ids.map(() => '?').join(',');
        await db.execute({ sql: `DELETE FROM subscriptions WHERE userId IN (${placeholders})`, args: ids });
      }
    }
  },
};

export const PaymentModel = {
  async countDocuments(): Promise<number> {
    const res = await db.execute(`SELECT COUNT(*) as c FROM payments`);
    return Number(res.rows[0]?.c ?? 0);
  },

  async create(data: any): Promise<any> {
    const id = data.id || data._id || crypto.randomUUID();
    const now = new Date().toISOString();
    await db.execute({
      sql: `INSERT INTO payments (id, userId, subscriptionId, amount, currency, channel, status, gatewayReference, webhookReference, bulkBatchId, paidAt, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        String(data.userId),
        String(data.subscriptionId),
        data.amount,
        data.currency ?? 'EGP',
        data.channel,
        data.status ?? 'pending',
        data.gatewayReference ?? null,
        data.webhookReference ?? null,
        data.bulkBatchId ? String(data.bulkBatchId) : null,
        data.paidAt ? new Date(data.paidAt).toISOString() : null,
        now,
        now,
      ],
    });
    return wrapRow('payments', { id, ...data, createdAt: now, updatedAt: now });
  },

  findById(id: any): any {
    const targetId = String(id?._id ?? id?.id ?? id);
    return createQuery(async (_ctx) => {
      const res = await db.execute({
        sql: `SELECT * FROM payments WHERE id = ? LIMIT 1`,
        args: [targetId],
      });
      return wrapRow('payments', (res.rows[0] as any) ?? null);
    });
  },

  findOne(filter: any): any {
    return createQuery(async (_ctx) => {
      const conditions: string[] = [];
      const args: any[] = [];
      if (filter.webhookReference) {
        conditions.push('webhookReference = ?');
        args.push(filter.webhookReference);
      }
      if (filter.gatewayReference) {
        conditions.push('gatewayReference = ?');
        args.push(filter.gatewayReference);
      }
      if (filter.id || filter._id) {
        conditions.push('id = ?');
        args.push(filter.id || filter._id);
      }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const res = await db.execute({
        sql: `SELECT * FROM payments ${where} LIMIT 1`,
        args,
      });
      return wrapRow('payments', (res.rows[0] as any) ?? null);
    });
  },

  async updateOne(filter: any, update: any, opts: any = {}): Promise<any> {
    const existing = await this.findOne(filter);
    const setObj = update.$set || update;
    const now = new Date().toISOString();
    if (!existing) {
      if (opts.upsert) {
        return this.create({ ...filter, ...setObj });
      }
      return null;
    }
    const keys = Object.keys(setObj);
    if (keys.length) {
      const setSql = keys.map((k) => `${k} = ?`).join(', ');
      const args = keys.map((k) => {
        const v = setObj[k];
        return v instanceof Date ? v.toISOString() : k === 'userId' || k === 'subscriptionId' ? String(v) : v;
      });
      args.push(existing.id);
      await db.execute({
        sql: `UPDATE payments SET ${setSql}, updatedAt = '${now}' WHERE id = ?`,
        args,
      });
    }
    return this.findOne(filter);
  },

  async deleteMany(filter: any): Promise<any> {
    if (!filter || Object.keys(filter).length === 0) {
      await db.execute(`DELETE FROM payments`);
      return;
    }
    if (filter.userId?.$in) {
      const ids = filter.userId.$in.map(String);
      if (ids.length) {
        const placeholders = ids.map(() => '?').join(',');
        await db.execute({ sql: `DELETE FROM payments WHERE userId IN (${placeholders})`, args: ids });
      }
    }
  },
};

export const CertificateModel = {
  async countDocuments(filter: any = {}): Promise<number> {
    const conditions: string[] = [];
    const args: any[] = [];
    if (filter.subscriptionId) {
      conditions.push('subscriptionId = ?');
      args.push(String(filter.subscriptionId));
    }
    if (filter.userId) {
      conditions.push('userId = ?');
      args.push(String(filter.userId));
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const res = await db.execute({
      sql: `SELECT COUNT(*) as c FROM certificates ${where}`,
      args,
    });
    return Number(res.rows[0]?.c ?? 0);
  },

  async create(data: any, _opts?: any): Promise<any> {
    const items = Array.isArray(data) ? data : [data];
    const created: any[] = [];
    const now = new Date().toISOString();
    for (const item of items) {
      const id = item.id || item._id || crypto.randomUUID();
      await db.execute({
        sql: `INSERT INTO certificates (id, userId, subscriptionId, certNumber, qrHash, issuedAt, expiresAt, status, revokedAt, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id,
          String(item.userId),
          String(item.subscriptionId),
          item.certNumber,
          item.qrHash,
          new Date(item.issuedAt).toISOString(),
          new Date(item.expiresAt).toISOString(),
          item.status ?? 'valid',
          item.revokedAt ? new Date(item.revokedAt).toISOString() : null,
          now,
          now,
        ],
      });
      created.push(wrapRow('certificates', { id, ...item, createdAt: now, updatedAt: now }));
    }
    return Array.isArray(data) ? created : created[0];
  },

  find(filter: any = {}): any {
    return createQuery(async (ctx) => {
      const conditions: string[] = [];
      const args: any[] = [];
      if (filter.userId) {
        conditions.push('userId = ?');
        args.push(String(filter.userId));
      }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const res = await db.execute({
        sql: `SELECT * FROM certificates ${where} ORDER BY ${ctx.sortField} ${ctx.sortOrder}`,
        args,
      });
      return res.rows.map((r) => wrapRow('certificates', r as any));
    });
  },

  findOne(filter: any): any {
    return createQuery(async (ctx) => {
      const conditions: string[] = [];
      const args: any[] = [];
      if (filter.id || filter._id) {
        conditions.push('id = ?');
        args.push(String(filter.id || filter._id));
      }
      if (filter.userId) {
        conditions.push('userId = ?');
        args.push(String(filter.userId));
      }
      if (filter.subscriptionId) {
        conditions.push('subscriptionId = ?');
        args.push(String(filter.subscriptionId));
      }
      if (filter.qrHash) {
        conditions.push('qrHash = ?');
        args.push(filter.qrHash);
      }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const res = await db.execute({
        sql: `SELECT * FROM certificates ${where} LIMIT 1`,
        args,
      });
      if (!res.rows.length) return null;
      const row = res.rows[0] as any;
      const cert = wrapRow('certificates', row);

      const populates = ctx.populates ?? [];
      if (populates.some((p: any) => p.path === 'userId' || p === 'userId')) {
        const uRes = await db.execute({
          sql: `SELECT id, name FROM users WHERE id = ? LIMIT 1`,
          args: [cert.userId],
        });
        cert.userId = uRes.rows[0] ? { _id: uRes.rows[0].id, id: uRes.rows[0].id, name: uRes.rows[0].name } : null;
      }
      if (populates.some((p: any) => p.path === 'subscriptionId' || p === 'subscriptionId')) {
        const sRes = await db.execute({
          sql: `SELECT s.*, t.name as tierName, t.nameAr as tierNameAr FROM subscriptions s LEFT JOIN specialty_tiers t ON s.tierId = t.id OR s.tierId = t.code WHERE s.id = ? LIMIT 1`,
          args: [cert.subscriptionId],
        });
        if (sRes.rows[0]) {
          const sRow = sRes.rows[0] as any;
          cert.subscriptionId = {
            _id: sRow.id,
            id: sRow.id,
            tierId: { name: sRow.tierName, nameAr: sRow.tierNameAr },
          };
        }
      }
      return cert;
    });
  },

  async updateOne(filter: any, update: any, opts: any = {}): Promise<any> {
    const existing = await this.findOne(filter);
    const setObj = update.$set || update;
    const now = new Date().toISOString();
    if (!existing) {
      if (opts.upsert) {
        return this.create({ ...filter, ...setObj });
      }
      return null;
    }
    const keys = Object.keys(setObj);
    if (keys.length) {
      const setSql = keys.map((k) => `${k} = ?`).join(', ');
      const args = keys.map((k) => {
        const v = setObj[k];
        return v instanceof Date ? v.toISOString() : k === 'userId' || k === 'subscriptionId' ? String(v) : v;
      });
      args.push(existing.id);
      await db.execute({
        sql: `UPDATE certificates SET ${setSql}, updatedAt = '${now}' WHERE id = ?`,
        args,
      });
    }
    return this.findOne(filter);
  },

  async deleteMany(filter: any): Promise<any> {
    if (!filter || Object.keys(filter).length === 0) {
      await db.execute(`DELETE FROM certificates`);
      return;
    }
    if (filter.userId?.$in) {
      const ids = filter.userId.$in.map(String);
      if (ids.length) {
        const placeholders = ids.map(() => '?').join(',');
        await db.execute({ sql: `DELETE FROM certificates WHERE userId IN (${placeholders})`, args: ids });
      }
    }
  },
};

export const BulkBatchModel = {
  async create(data: any): Promise<any> {
    const id = data.id || data._id || crypto.randomUUID();
    const now = new Date().toISOString();
    await db.execute({
      sql: `INSERT INTO bulk_batches (id, createdBy, filename, fiscalYear, status, totalRows, createdCount, duplicateCount, invalidCount, committedAt, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        String(data.createdBy),
        data.filename,
        data.fiscalYear,
        data.status ?? 'previewed',
        data.totalRows ?? 0,
        data.createdCount ?? 0,
        data.duplicateCount ?? 0,
        data.invalidCount ?? 0,
        data.committedAt ? new Date(data.committedAt).toISOString() : null,
        now,
        now,
      ],
    });
    return wrapRow('bulk_batches', { id, ...data, createdAt: now, updatedAt: now });
  },

  find(): any {
    return createQuery(async (ctx) => {
      const res = await db.execute({
        sql: `SELECT * FROM bulk_batches ORDER BY createdAt DESC LIMIT ?`,
        args: [ctx.limitCount ?? 100],
      });
      return res.rows.map((r) => wrapRow('bulk_batches', r as any));
    });
  },

  findById(id: any): any {
    const targetId = String(id?._id ?? id?.id ?? id);
    return createQuery(async (_ctx) => {
      const res = await db.execute({
        sql: `SELECT * FROM bulk_batches WHERE id = ? LIMIT 1`,
        args: [targetId],
      });
      return wrapRow('bulk_batches', (res.rows[0] as any) ?? null);
    });
  },

  async deleteMany(_filter: any = {}): Promise<any> {
    await db.execute(`DELETE FROM bulk_batches`);
  },
};

export const ClaimModel = {
  async countDocuments(): Promise<number> {
    const res = await db.execute(`SELECT COUNT(*) as c FROM claims`);
    return Number(res.rows[0]?.c ?? 0);
  },

  async updateOne(filter: any, update: any, opts: any = {}): Promise<any> {
    const claimNumber = filter.claimNumber;
    const setObj = update.$set || update;
    const now = new Date().toISOString();
    const existing = await db.execute({
      sql: `SELECT * FROM claims WHERE claimNumber = ? LIMIT 1`,
      args: [claimNumber],
    });
    if (!existing.rows.length) {
      if (opts.upsert) {
        const id = crypto.randomUUID();
        await db.execute({
          sql: `INSERT INTO claims (id, claimNumber, subscriberId, facilityName, specialty, governorate, stage, incidentAt, filedAt, verdictAt, payoutAt, awardedAmount, paidAmount, beneficiary, notes, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            id,
            claimNumber,
            String(setObj.subscriberId),
            setObj.facilityName,
            setObj.specialty,
            setObj.governorate,
            setObj.stage,
            new Date(setObj.incidentAt).toISOString(),
            setObj.filedAt ? new Date(setObj.filedAt).toISOString() : null,
            setObj.verdictAt ? new Date(setObj.verdictAt).toISOString() : null,
            setObj.payoutAt ? new Date(setObj.payoutAt).toISOString() : null,
            setObj.awardedAmount ?? 0,
            setObj.paidAmount ?? 0,
            setObj.beneficiary,
            setObj.notes ?? null,
            now,
            now,
          ],
        });
        return { id, claimNumber, ...setObj };
      }
      return null;
    }
    const row = existing.rows[0] as any;
    const keys = Object.keys(setObj);
    if (keys.length) {
      const setSql = keys.map((k) => `${k} = ?`).join(', ');
      const args = keys.map((k) => {
        const v = setObj[k];
        return v instanceof Date ? v.toISOString() : k === 'subscriberId' ? String(v) : v;
      });
      args.push(row.id);
      await db.execute({
        sql: `UPDATE claims SET ${setSql}, updatedAt = '${now}' WHERE id = ?`,
        args,
      });
    }
    return { id: row.id, claimNumber, ...setObj };
  },

  async deleteMany(_filter: any = {}): Promise<any> {
    await db.execute(`DELETE FROM claims`);
  },
};

export const AuditLogModel = {
  async countDocuments(filter: any = {}): Promise<number> {
    const conditions: string[] = [];
    const args: any[] = [];
    if (filter.entityId) {
      conditions.push('entityId = ?');
      args.push(String(filter.entityId));
    }
    if (filter.userId) {
      conditions.push('userId = ?');
      args.push(String(filter.userId));
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const res = await db.execute({
      sql: `SELECT COUNT(*) as c FROM audit_logs ${where}`,
      args,
    });
    return Number(res.rows[0]?.c ?? 0);
  },

  async updateOne(filter: any, update: any, opts: any = {}): Promise<any> {
    const entityId = filter.entityId;
    const setObj = update.$set || update;
    if (entityId) {
      const existing = await db.execute({
        sql: `SELECT id FROM audit_logs WHERE entityId = ? LIMIT 1`,
        args: [entityId],
      });
      if (!existing.rows.length && opts.upsert) {
        return this.create({ ...setObj, entityId });
      }
    }
    return this.create(setObj);
  },

  async create(data: any, _opts?: any): Promise<any> {
    const items = Array.isArray(data) ? data : [data];
    const created: any[] = [];
    const now = new Date().toISOString();
    for (const item of items) {
      const id = item.id || item._id || crypto.randomUUID();
      await db.execute({
        sql: `INSERT INTO audit_logs (id, userId, userLabel, role, action, entityType, entityId, ipAddress, userAgent, metadata, createdAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id,
          item.userId ? String(item.userId) : null,
          item.userLabel,
          item.role,
          item.action,
          item.entityType,
          item.entityId ? String(item.entityId) : null,
          item.ipAddress,
          item.userAgent ?? '',
          item.metadata
            ? typeof item.metadata === 'string'
              ? item.metadata
              : JSON.stringify(item.metadata)
            : null,
          now,
        ],
      });
      created.push(wrapRow('audit_logs', { id, ...item, createdAt: now }));
    }
    return Array.isArray(data) ? created : created[0];
  },

  find(filter: any = {}): any {
    return createQuery(async (ctx) => {
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
        const regexStr = filter.userLabel?.$regex ?? filter.userLabel;
        conditions.push('userLabel LIKE ?');
        args.push(`%${regexStr}%`);
      }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      args.push(ctx.limitCount ?? 50);
      const res = await db.execute({
        sql: `SELECT * FROM audit_logs ${where} ORDER BY createdAt DESC, id DESC LIMIT ?`,
        args,
      });
      return res.rows.map((r) => wrapRow('audit_logs', r as any));
    });
  },

  async deleteMany(filter: any): Promise<any> {
    if (!filter || Object.keys(filter).length === 0) {
      await db.execute(`DELETE FROM audit_logs`);
      return;
    }
    if (filter.userId?.$in) {
      const ids = filter.userId.$in.map(String);
      if (ids.length) {
        const placeholders = ids.map(() => '?').join(',');
        await db.execute({ sql: `DELETE FROM audit_logs WHERE userId IN (${placeholders})`, args: ids });
      }
    }
  },
};

export const SmsOutboxModel = {
  async create(data: any): Promise<any> {
    const id = data.id || data._id || crypto.randomUUID();
    const now = new Date().toISOString();
    await db.execute({
      sql: `INSERT INTO sms_outbox (id, userId, phone, body, status, attempts, sentAt, lastError, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        data.userId ? String(data.userId) : null,
        data.phone,
        data.body,
        data.status ?? 'queued',
        data.attempts ?? 0,
        data.sentAt ? new Date(data.sentAt).toISOString() : null,
        data.lastError ?? null,
        now,
        now,
      ],
    });
    return wrapRow('sms_outbox', { id, ...data, createdAt: now, updatedAt: now });
  },

  find(): any {
    return createQuery(async (ctx) => {
      const res = await db.execute({
        sql: `SELECT id, phone, body, status, createdAt, sentAt FROM sms_outbox ORDER BY createdAt DESC LIMIT ?`,
        args: [ctx.limitCount ?? 100],
      });
      return res.rows.map((r) => wrapRow('sms_outbox', r as any));
    });
  },

  async deleteMany(filter: any): Promise<any> {
    if (!filter || Object.keys(filter).length === 0) {
      await db.execute(`DELETE FROM sms_outbox`);
      return;
    }
    if (filter.userId?.$in) {
      const ids = filter.userId.$in.map(String);
      if (ids.length) {
        const placeholders = ids.map(() => '?').join(',');
        await db.execute({ sql: `DELETE FROM sms_outbox WHERE userId IN (${placeholders})`, args: ids });
      }
    }
  },
};

export const CompletionTokenModel = {
  async create(data: any): Promise<any> {
    const id = data.id || data._id || crypto.randomUUID();
    const now = new Date().toISOString();
    await db.execute({
      sql: `INSERT INTO completion_tokens (id, userId, tokenHash, expiresAt, usedAt, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        String(data.userId),
        data.tokenHash,
        new Date(data.expiresAt).toISOString(),
        data.usedAt ? new Date(data.usedAt).toISOString() : null,
        now,
        now,
      ],
    });
    return wrapRow('completion_tokens', { id, ...data, createdAt: now, updatedAt: now });
  },

  findOneAndUpdate(filter: any, update: any, _opts: any = {}): any {
    const tokenHash = filter.tokenHash;
    const setObj = update.$set || update;
    const usedAt = setObj.usedAt ? new Date(setObj.usedAt).toISOString() : new Date().toISOString();

    return createQuery(async (_ctx) => {
      const nowIso = new Date().toISOString();
      const existing = await db.execute({
        sql: `SELECT * FROM completion_tokens WHERE tokenHash = ? AND usedAt IS NULL AND expiresAt > ? LIMIT 1`,
        args: [tokenHash, nowIso],
      });
      if (!existing.rows.length) return null;
      const row = existing.rows[0] as any;
      await db.execute({
        sql: `UPDATE completion_tokens SET usedAt = ?, updatedAt = ? WHERE id = ?`,
        args: [usedAt, usedAt, row.id],
      });
      return wrapRow('completion_tokens', { ...row, usedAt, updatedAt: usedAt });
    });
  },

  async updateOne(filter: any, update: any): Promise<any> {
    const setObj = update.$set || update;
    const now = new Date().toISOString();
    const id = filter._id || filter.id;
    if (id) {
      await db.execute({
        sql: `UPDATE completion_tokens SET usedAt = ?, updatedAt = ? WHERE id = ?`,
        args: [setObj.usedAt ? new Date(setObj.usedAt).toISOString() : null, now, String(id)],
      });
    }
  },

  async deleteMany(filter: any): Promise<any> {
    if (!filter || Object.keys(filter).length === 0) {
      await db.execute(`DELETE FROM completion_tokens`);
      return;
    }
    if (filter.userId?.$in) {
      const ids = filter.userId.$in.map(String);
      if (ids.length) {
        const placeholders = ids.map(() => '?').join(',');
        await db.execute({ sql: `DELETE FROM completion_tokens WHERE userId IN (${placeholders})`, args: ids });
      }
    }
  },
};
