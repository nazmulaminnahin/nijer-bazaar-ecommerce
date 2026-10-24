import { Request } from 'express';
import { db } from '../config/db';
import { staffLogs } from '../schemas';

export async function logStaffAction(
  req: Request,
  action: string,
  module: string,
  targetId?: number | null,
  details?: Record<string, unknown>
): Promise<void> {
  if (!req.admin) return;
  try {
    await db.insert(staffLogs).values({
      adminId: req.admin.id,
      action,
      module,
      targetId: targetId ?? null,
      details,
      ipAddress: req.ip ?? null,
    });
  } catch (err) {
    console.error('⚠️ Staff log failed:', (err as Error).message);
  }
}