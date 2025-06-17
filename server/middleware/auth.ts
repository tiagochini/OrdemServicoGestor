import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../auth/jwt.js';
import { UserRole } from '../../shared/schema.js';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const user = verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
}

export function requireRole(roles: string | string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  return requireRole(UserRole.ADMIN)(req, res, next);
}

export function requireManagerOrAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  return requireRole([UserRole.ADMIN, UserRole.MANAGER])(req, res, next);
}

export function requireTechnician(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  return requireRole([UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN])(req, res, next);
}