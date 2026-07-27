import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';
import { JWTPayload, TenantContext } from '../types/index.js';

export interface AuthenticatedRequest extends Request {
  tenant?: TenantContext;
  userId?: string;
  schoolId?: string;
}

/**
 * Verify JWT token and set tenant context
 */
export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): Response | void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Missing or invalid token' });
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      logger.error('JWT_SECRET not configured');
      return res.status(500).json({ error: 'Server error', message: 'JWT configuration error' });
    }

    const payload = jwt.verify(token, secret) as JWTPayload;

    // Set tenant context on request
    req.tenant = {
      userId: payload.userId,
      schoolId: payload.schoolId,
      role: payload.role,
    };
    req.userId = payload.userId;
    req.schoolId = payload.schoolId;

    logger.debug(`Auth middleware: User ${payload.userId} authenticated for school ${payload.schoolId}`);

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Token expired' });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
    }

    logger.error('Auth middleware error', error);
    return res.status(500).json({ error: 'Server error', message: 'Internal server error' });
  }
}

/**
 * Check if user has specific role
 */
export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): Response | void => {
    if (!req.tenant) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Not authenticated' });
    }

    if (!roles.includes(req.tenant.role)) {
      return res
        .status(403)
        .json({ error: 'Forbidden', message: `This action requires one of these roles: ${roles.join(', ')}` });
    }

    next();
  };
}

/**
 * Create JWT token
 */
export function createToken(userId: string, schoolId: string, role: string, email: string): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }

  const payload: JWTPayload = {
    userId,
    schoolId,
    role: role as TenantContext['role'],
    email,
  };

  return jwt.sign(payload, secret as jwt.Secret, {
    expiresIn: (process.env.JWT_EXPIRY || '24h') as jwt.SignOptions['expiresIn'],
  });
}
