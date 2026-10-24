import jwt from 'jsonwebtoken';
import { ROLE_PERMISSIONS } from '@mlrf/shared';
import { env } from '../config/env.js';
import { AppError } from './errors.js';
export function signAccess(user) { return jwt.sign({ sub: user.id, name: user.name, role: user.role, email: user.email }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' }); }
export function requireAuth(req, _res, next) { const h = req.headers.authorization; const token = h?.startsWith('Bearer ') ? h.slice(7) : undefined; if (!token) {
    next(new AppError(401, 'UNAUTHENTICATED', 'Please sign in'));
    return;
} try {
    const p = jwt.verify(token, env.JWT_ACCESS_SECRET);
    req.user = { id: String(p.sub), name: String(p.name), role: p.role, email: String(p.email) };
    next();
}
catch {
    next(new AppError(401, 'INVALID_SESSION', 'Session is invalid or expired'));
} }
export function requirePermission(permission) { return (req, _res, next) => { if (!req.user) {
    next(new AppError(401, 'UNAUTHENTICATED', 'Please sign in'));
    return;
} if (!ROLE_PERMISSIONS[req.user.role]?.includes(permission)) {
    next(new AppError(403, 'FORBIDDEN', 'You do not have permission for this action', { permission }));
    return;
} next(); }; }
//# sourceMappingURL=auth.js.map