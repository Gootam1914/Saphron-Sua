import { httpError } from '../utils/asyncHandler.js';

/**
 * Server-side role gate. Usage: router.get('/x', ...requireAuth, requireRole('admin'), handler)
 * Roles are checked against req.user.role which is loaded from the database - never
 * from client-supplied data. This is the authoritative RBAC layer; the UI hiding
 * things is only cosmetic.
 */
export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(httpError(401, 'Not authenticated.'));
  if (!roles.includes(req.user.role)) {
    return next(httpError(403, `Requires role: ${roles.join(' or ')}.`));
  }
  next();
};

export const isAdmin = (req) => req.user?.role === 'admin';
