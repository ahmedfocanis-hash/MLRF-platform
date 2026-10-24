import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ROLE_PERMISSIONS, type Role } from '@mlrf/shared';
import { env } from '../config/env.js';
import { AppError } from './errors.js';
export type SessionUser = { id: string; name: string; role: Role; email: string };
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}
export function signAccess(user: SessionUser) {
  return jwt.sign(
    { sub: user.id, name: user.name, role: user.role, email: user.email },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' },
  );
}
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  const token = h?.startsWith('Bearer ') ? h.slice(7) : undefined;
  if (!token) {
    next(new AppError(401, 'UNAUTHENTICATED', 'Please sign in'));
    return;
  }
  try {
    const p = jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload;
    req.user = {
      id: String(p.sub),
      name: String(p.name),
      role: p.role as Role,
      email: String(p.email),
    };
    next();
  } catch {
    next(new AppError(401, 'INVALID_SESSION', 'Session is invalid or expired'));
  }
}
export function requirePermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new AppError(401, 'UNAUTHENTICATED', 'Please sign in'));
      return;
    }
    if (!ROLE_PERMISSIONS[req.user.role]?.includes(permission)) {
      next(
        new AppError(403, 'FORBIDDEN', 'You do not have permission for this action', {
          permission,
        }),
      );
      return;
    }
    next();
  };
}
