import 'dotenv/config';
import { type Client } from '@libsql/client';
export declare const db: Client;
/**
 * Ensures required Turso/libSQL relational tables are provisioned.
 */
export declare function initDatabase(): Promise<void>;
export declare const initDb: typeof initDatabase;
export default db;
