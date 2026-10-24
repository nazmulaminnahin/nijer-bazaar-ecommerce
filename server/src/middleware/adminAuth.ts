import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './errorHandler';

export interface AdminRequest extends Request {
  adminId?: number;
  adminEmail?: string;
  adminRole?: string;
}

export const authenticateAdmin = (
  req: AdminRequest,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Admin access denied. No token.', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_ADMIN_SECRET) as {
      adminId: number;
      email: string;
      role: string;
    };
    req.adminId = decoded.adminId;
    req.adminEmail = decoded.email;
    req.adminRole = decoded.role;
    return next();
  } catch {
    return next(new AppError('Invalid or expired admin token.', 401));
  }
};

// Role-based access control
export const requireRole = (...roles: string[]) => {
  return (req: AdminRequest, _res: Response, next: NextFunction) => {
    if (!req.adminRole) {
      return next(new AppError('No admin role found.', 403));
    }

    // super_admin can do everything
    if (req.adminRole === 'super_admin') {
      return next();
    }

    if (!roles.includes(req.adminRole)) {
      return next(new AppError(`Access denied. Required roles: ${roles.join(', ')}`, 403));
    }

    return next();
  };
};