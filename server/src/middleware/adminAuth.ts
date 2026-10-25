import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "./errorHandler";

export interface AdminAuthRequest extends Request {
  adminId?: number;
  adminEmail?: string;
  adminRole?: string;
}

export type AdminRequest = AdminAuthRequest;

export const authenticateAdmin = (
  req: AdminAuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Admin access required. Please login.", 401));
  }

  const token = authHeader.split(" ")[1];

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
    return next(
      new AppError("Invalid or expired admin token. Please login again.", 401)
    );
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AdminAuthRequest, _res: Response, next: NextFunction) => {
    if (
      !req.adminRole ||
      (!roles.includes(req.adminRole) &&
        req.adminRole !== "admin" &&
        req.adminRole !== "super_admin")
    ) {
      return next(new AppError("Insufficient permissions", 403));
    }
    return next();
  };
};