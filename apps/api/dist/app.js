import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { initDatabase } from './config/db.js';
import { errorHandler } from './middleware/errors.js';
import { apiRouter } from './routes/index.js';
export const app = express();
// Trust reverse proxies and rate limiters on Vercel
app.set('trust proxy', 1);
app.disable('x-powered-by');
// Native request logging directly to console.log for Vercel Dashboard streaming
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[HTTP] ${req.method} ${req.originalUrl || req.url} ${res.statusCode} - ${duration}ms`);
    });
    next();
});
// Serverless DB connection verification middleware
app.use(async (_req, _res, next) => {
    try {
        if (process.env.TURSO_DATABASE_URL || process.env.NODE_ENV === 'production' || process.env.CONNECT_TURSO === 'true') {
            await initDatabase();
        }
        next();
    }
    catch (error) {
        console.error('[DB Middleware] Connection error:', error);
        next();
    }
});
app.use(helmet());
app.use(cors({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        const allowed = [env.WEB_ORIGIN, env.PUBLIC_WEB_URL, 'http://localhost:5173'];
        if (allowed.includes(origin) || origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true,
}));
app.use(rateLimit({
    windowMs: 60_000,
    limit: 180,
    standardHeaders: true,
    legacyHeaders: false,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.get('/api/v1/health', (_req, res) => res.json({
    success: true,
    data: {
        status: 'ok',
        service: 'mlrf-api',
        mode: env.DEMO_MODE ? 'demo' : 'standard',
        timestamp: new Date().toISOString(),
    },
    error: null,
}));
app.use('/api/v1', apiRouter);
app.use((_req, res) => res.status(404).json({
    success: false,
    data: null,
    error: { code: 'NOT_FOUND', message: 'Route not found' },
}));
app.use(errorHandler);
//# sourceMappingURL=app.js.map