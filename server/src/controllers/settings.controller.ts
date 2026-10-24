import { Request, Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../config/db';
import { settings } from '../schemas/index';
import { asyncHandler } from '../middleware/errorHandler';

// GET /api/admin/settings
export const getSettings = asyncHandler(async (_req: Request, res: Response) => {
  const allSettings = await db.select().from(settings);
  const settingsMap: Record<string, string | null> = {};
  allSettings.forEach(s => { settingsMap[s.key] = s.value; });
  return res.json({ success: true, data: settingsMap });
});

// PUT /api/admin/settings
export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const updates = req.body as Record<string, string>;

  for (const [key, value] of Object.entries(updates)) {
    await db.update(settings)
      .set({ value: value.toString(), updatedAt: new Date() })
      .where(eq(settings.key, key));
  }

  return res.json({ success: true, message: 'Settings updated successfully' });
});