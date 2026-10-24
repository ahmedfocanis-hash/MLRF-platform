import { ZodError } from 'zod';
import multer from 'multer';
export class AppError extends Error {
    statusCode;
    code;
    details;
    constructor(statusCode, code, message, details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.name = 'AppError';
    }
}
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
export function errorHandler(error, _req, res, _next) { const e = error instanceof AppError ? error : error instanceof ZodError ? new AppError(400, 'VALIDATION_ERROR', 'Request validation failed', error.flatten()) : error instanceof multer.MulterError ? new AppError(400, 'UPLOAD_ERROR', error.code === 'LIMIT_FILE_SIZE' ? 'File exceeds the 5 MB limit' : 'File upload was rejected', { code: error.code }) : new AppError(500, 'INTERNAL_ERROR', 'An unexpected error occurred'); if (e.statusCode >= 500)
    console.error(error); res.status(e.statusCode).json({ success: false, data: null, error: { code: e.code, message: e.message, ...(e.details === undefined ? {} : { details: e.details }) } }); }
export function ok(res, data, status = 200) { return res.status(status).json({ success: true, data, error: null }); }
//# sourceMappingURL=errors.js.map