import crypto from 'crypto';
import { count, gte } from 'drizzle-orm';
import type { DbClient } from '../config/db';
import { orders, type User, type Admin } from '../schemas';
import { ApiError } from './ApiError';

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function generateToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(-11);
}

export function parseId(value: string | undefined, name = 'id'): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new ApiError(400, `Invalid ${name}`);
  return n;
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export function toDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function sanitizeUser(user: User) {
  const { password, otpCode, otpExpiresAt, resetToken, resetTokenExpiresAt, ...safe } = user;
  return safe;
}

export function sanitizeAdmin(admin: Admin) {
  const { password, ...safe } = admin;
  return safe;
}

export async function generateOrderNumber(dbc: DbClient): Promise<string> {
  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const [{ c }] = await dbc.select({ c: count() }).from(orders).where(gte(orders.createdAt, startOfDay(now)));
  return `NB-${ymd}-${String(c + 1).padStart(4, '0')}`;
}