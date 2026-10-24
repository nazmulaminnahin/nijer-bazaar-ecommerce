import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';
import type { AuthUser, AuthAdmin } from '../types';

export type UserTokenPayload = AuthUser & { type: 'user' };
export type AdminTokenPayload = AuthAdmin & { type: 'admin' };

export function signUserToken(user: AuthUser): string {
  return jwt.sign({ ...user, type: 'user' }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

export function signAdminToken(admin: AuthAdmin): string {
  return jwt.sign({ ...admin, type: 'admin' }, env.JWT_ADMIN_SECRET, {
    expiresIn: env.JWT_ADMIN_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

export function verifyUserToken(token: string): UserTokenPayload & JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as UserTokenPayload & JwtPayload;
}

export function verifyAdminToken(token: string): AdminTokenPayload & JwtPayload {
  return jwt.verify(token, env.JWT_ADMIN_SECRET) as AdminTokenPayload & JwtPayload;
}