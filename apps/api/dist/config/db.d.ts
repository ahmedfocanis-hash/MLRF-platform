import mongoose from 'mongoose';
interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}
declare global {
    var mongooseCache: MongooseCache | undefined;
}
/**
 * Connect to MongoDB with connection reuse and global caching
 * for serverless cold start optimization.
 */
export declare function connectMongo(): Promise<typeof mongoose | undefined>;
export {};
