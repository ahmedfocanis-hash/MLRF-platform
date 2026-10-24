import type { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    statusCode: number;
    code: string;
    details?: unknown | undefined;
    constructor(statusCode: number, code: string, message: string, details?: unknown | undefined);
}
export declare const asyncHandler: (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => Promise<unknown>;
export declare function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void;
export declare function ok<T>(res: Response, data: T, status?: number): Response<any, Record<string, any>>;
