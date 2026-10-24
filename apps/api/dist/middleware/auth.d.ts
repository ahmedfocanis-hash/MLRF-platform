import type { Request, Response, NextFunction } from 'express';
import { type Role } from '@mlrf/shared';
export type SessionUser = {
    id: string;
    name: string;
    role: Role;
    email: string;
};
declare global {
    namespace Express {
        interface Request {
            user?: SessionUser;
        }
    }
}
export declare function signAccess(user: SessionUser): string;
export declare function requireAuth(req: Request, _res: Response, next: NextFunction): void;
export declare function requirePermission(permission: string): (req: Request, _res: Response, next: NextFunction) => void;
