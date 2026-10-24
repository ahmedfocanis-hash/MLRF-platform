import 'dotenv/config';
import { createClient } from '@libsql/client/web';
import { env } from './env.js';
const url = env.TURSO_DATABASE_URL;
const authToken = env.TURSO_AUTH_TOKEN;
const config = {
    url,
    authToken,
};
function sanitizeSqlValue(val) {
    if (val === undefined)
        return null;
    if (typeof val === 'boolean')
        return val ? 1 : 0;
    if (typeof val === 'object') {
        if (val === null)
            return null;
        if (val instanceof Date)
            return val.toISOString();
        if ((typeof Buffer !== 'undefined' && Buffer.isBuffer(val)) ||
            val instanceof Uint8Array ||
            val instanceof ArrayBuffer) {
            return val;
        }
        return JSON.stringify(val);
    }
    return val;
}
export function sanitizeSqlArgs(args) {
    if (!args)
        return [];
    if (Array.isArray(args)) {
        return args.map(sanitizeSqlValue);
    }
    if (typeof args === 'object') {
        const sanitized = {};
        for (const key of Object.keys(args)) {
            sanitized[key] = sanitizeSqlValue(args[key]);
        }
        return sanitized;
    }
    return args;
}
export const db = createClient(config);
const originalExecute = db.execute.bind(db);
db.execute = function (stmt, ...rest) {
    let sanitizedArgs = undefined;
    if (stmt && typeof stmt === 'object') {
        if (stmt.args !== undefined) {
            stmt.args = sanitizeSqlArgs(stmt.args);
        }
        sanitizedArgs = stmt.args;
    }
    else if (rest.length > 0) {
        rest[0] = sanitizeSqlArgs(rest[0]);
        sanitizedArgs = rest[0];
    }
    console.log('[TURSO EXECUTE]', typeof stmt === 'string' ? stmt : stmt.sql);
    console.log('[TURSO ARGS]', sanitizedArgs);
    return originalExecute(stmt, ...rest);
};
let dbInitialized = false;
let initPromise = null;
/**
 * Ensures required Turso/libSQL relational tables are provisioned.
 */
export async function initDatabase() {
    if (dbInitialized)
        return;
    if (!initPromise) {
        initPromise = (async () => {
            await db.batch([
                `CREATE TABLE IF NOT EXISTS roles (
          name TEXT PRIMARY KEY,
      permissionsJson TEXT NOT NULL DEFAULT '[]',
      createdAt TEXT,
      updatedAt TEXT
    );`,
                `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending_verification',
      phoneVerifiedAt TEXT,
      emailVerifiedAt TEXT,
      refreshTokenHash TEXT,
      lastLoginAt TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );`,
                `CREATE TABLE IF NOT EXISTS specialty_tiers (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      nameAr TEXT NOT NULL,
      entityType TEXT NOT NULL,
      fee REAL NOT NULL,
      risk TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT,
      updatedAt TEXT
    );`,
                `CREATE TABLE IF NOT EXISTS subscriber_profiles (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL UNIQUE,
      entityType TEXT NOT NULL,
      nationalId TEXT UNIQUE,
      syndicateId TEXT UNIQUE,
      facilityLicense TEXT UNIQUE,
      governorate TEXT NOT NULL,
      address TEXT,
      completionPercent REAL NOT NULL DEFAULT 25,
      createdAt TEXT,
      updatedAt TEXT
    );`,
                `CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      tierId TEXT NOT NULL,
      fiscalYear INTEGER NOT NULL,
      renewalStatus TEXT NOT NULL DEFAULT 'new',
      status TEXT NOT NULL DEFAULT 'pending_payment',
      amountDue REAL NOT NULL,
      startsAt TEXT,
      expiresAt TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );`,
                `CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      subscriptionId TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'EGP',
      channel TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      gatewayReference TEXT UNIQUE,
      webhookReference TEXT UNIQUE,
      bulkBatchId TEXT,
      paidAt TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );`,
                `CREATE TABLE IF NOT EXISTS certificates (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      subscriptionId TEXT NOT NULL UNIQUE,
      certNumber TEXT NOT NULL UNIQUE,
      qrHash TEXT NOT NULL UNIQUE,
      issuedAt TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'valid',
      revokedAt TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );`,
                `CREATE TABLE IF NOT EXISTS bulk_batches (
      id TEXT PRIMARY KEY,
      createdBy TEXT NOT NULL,
      filename TEXT NOT NULL,
      fiscalYear INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'previewed',
      totalRows INTEGER NOT NULL DEFAULT 0,
      createdCount INTEGER NOT NULL DEFAULT 0,
      duplicateCount INTEGER NOT NULL DEFAULT 0,
      invalidCount INTEGER NOT NULL DEFAULT 0,
      committedAt TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );`,
                `CREATE TABLE IF NOT EXISTS claims (
      id TEXT PRIMARY KEY,
      claimNumber TEXT NOT NULL UNIQUE,
      subscriberId TEXT NOT NULL,
      facilityName TEXT NOT NULL,
      specialty TEXT NOT NULL,
      governorate TEXT NOT NULL,
      stage TEXT NOT NULL,
      incidentAt TEXT NOT NULL,
      filedAt TEXT,
      verdictAt TEXT,
      payoutAt TEXT,
      awardedAmount REAL NOT NULL DEFAULT 0,
      paidAmount REAL NOT NULL DEFAULT 0,
      beneficiary TEXT NOT NULL,
      notes TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );`,
                `CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      userId TEXT,
      userLabel TEXT NOT NULL,
      role TEXT NOT NULL,
      action TEXT NOT NULL,
      entityType TEXT NOT NULL,
      entityId TEXT,
      ipAddress TEXT NOT NULL,
      userAgent TEXT,
      metadata TEXT,
      createdAt TEXT
    );`,
                `CREATE TABLE IF NOT EXISTS sms_outbox (
      id TEXT PRIMARY KEY,
      userId TEXT,
      phone TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued',
      attempts INTEGER NOT NULL DEFAULT 0,
      sentAt TEXT,
      lastError TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );`,
                `CREATE TABLE IF NOT EXISTS completion_tokens (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      tokenHash TEXT NOT NULL UNIQUE,
      expiresAt TEXT NOT NULL,
      usedAt TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );`,
            ]);
            dbInitialized = true;
        })().catch((err) => {
            initPromise = null;
            throw err;
        });
    }
    return initPromise;
}
export const initDb = initDatabase;
export default db;
//# sourceMappingURL=db.js.map