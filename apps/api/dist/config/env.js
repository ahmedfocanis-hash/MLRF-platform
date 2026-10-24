import 'dotenv/config';
import { z } from 'zod';
const schema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    WEB_ORIGIN: z.string().url().default('http://localhost:5173'),
    TURSO_DATABASE_URL: z.string().default('libsql://mlrf-platform-ahmedfocanis-hash.aws-eu-west-1.turso.io'),
    TURSO_AUTH_TOKEN: z.string().default('eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTI4NTUwNzIsImlkIjoiMDFhMTZlN2MtNTEwMS03ZTI1LWJmMmUtNDdiYjRhNjM5MjhkIiwia2lkIjoiX0pLaktrVjUxZjZvQW92eE5BcnFyNXZqTGdBYnItZlZaTlE1S29nYW45WSIsInJpZCI6ImE0OWVkNzUxLWU3NWYtNDcyMC04NTQwLTRlYzk0YzEyNzg0YyJ9.vFDLX03x3k5PjNnKkPDp7_dfqKJS-fNQTz9Mn1fM7UY6j3JOyoQXVzKqthbXVC2potzlkGo4E7_qvsxnt0kdCw'),
    JWT_ACCESS_SECRET: z.string().min(16).default('development-access-secret-change-this'),
    JWT_REFRESH_SECRET: z.string().min(16).default('development-refresh-secret-change-this'),
    PAYMENT_WEBHOOK_SECRET: z.string().min(8).default('demo-webhook-secret-change-me'),
    PUBLIC_WEB_URL: z.string().url().default('http://localhost:5173'),
    DEMO_MODE: z.string().default('true').transform((v) => v === 'true'),
    UPLOAD_DIR: z.string().default('./uploads'),
});
export const env = schema.parse(process.env);
//# sourceMappingURL=env.js.map