import 'dotenv/config';
import { type Client } from '@libsql/client/web';
export declare function sanitizeSqlArgs(args: any): any;
export declare const db: Client;
/**
 * Ensures required Turso/libSQL relational tables are provisioned.
 */
export declare function initDatabase(): Promise<void>;
export declare const initDb: typeof initDatabase;
export default db;
