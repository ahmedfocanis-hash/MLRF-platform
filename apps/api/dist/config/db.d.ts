import { type Client } from '@libsql/client';
export declare const db: Client;
/**
 * Ensures required Turso/libSQL relational tables are provisioned.
 */
export declare function initDb(): Promise<void>;
/** Backward compatibility helper for legacy connectMongo calls */
export declare function connectMongo(): Promise<Client>;
export default db;
