import mongoose from 'mongoose';
import { env } from './env.js';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = globalThis.mongooseCache || { conn: null, promise: null };
if (!globalThis.mongooseCache) {
  globalThis.mongooseCache = cached;
}

/**
 * Connect to MongoDB with connection reuse and global caching
 * for serverless cold start optimization.
 */
export async function connectMongo(): Promise<typeof mongoose | undefined> {
  // 1. Connection check: if already connected or connecting, return immediately
  if (mongoose.connection.readyState >= 1) {
    return mongoose;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const uri = env.MONGODB_URI;
    if (!uri) {
      console.warn('[MongoDB] MONGODB_URI not configured. Skipping connection.');
      return;
    }

    console.log('[MongoDB] Connecting to MongoDB Atlas...');
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose
      .connect(uri, opts)
      .then((m) => {
        console.log('[MongoDB] Successfully connected to MongoDB Atlas');
        return m;
      })
      .catch((err) => {
        cached.promise = null;
        console.error('[MongoDB] Connection error:', err);
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
