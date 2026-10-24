import { Request, Response, NextFunction } from 'express';
import { eq, asc, isNull } from 'drizzle-orm';
import { db } from '../config/db';
import { categories } from '../schemas/index';
import { AppError, asyncHandler } from '../middleware/errorHandler';

// GET /api/categories
export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const allCategories = await db.select().from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.sortOrder));

  // Build tree structure
  const topLevel = allCategories.filter(c => !c.parentId);
  const tree = topLevel.map(parent => ({
    ...parent,
    children: allCategories.filter(c => c.parentId === parent.id),
  }));

  return res.json({ success: true, data: tree });
});

// Admin CRUD
export const adminGetCategories = asyncHandler(async (_req: Request, res: Response) => {
  const allCategories = await db.select().from(categories).orderBy(asc(categories.sortOrder));
  return res.json({ success: true, data: allCategories });
});

export const adminCreateCategory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { name, slug, description, image, parentId, sortOrder, isActive, isFeatured } = req.body;

  if (!name || !slug) return next(new AppError('Name and slug are required', 400));

  const existing = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  if (existing.length > 0) return next(new AppError('Slug already exists', 409));

  const [newCat] = await db.insert(categories).values({
    name, slug, description, image,
    parentId: parentId ? parseInt(parentId) : null,
    sortOrder: sortOrder || 0,
    isActive: isActive !== undefined ? isActive : true,
    isFeatured: isFeatured || false,
  }).returning();

  return res.status(201).json({ success: true, message: 'Category created', data: newCat });
});

export const adminUpdateCategory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { name, slug, description, image, parentId, sortOrder, isActive, isFeatured } = req.body;

  const [updated] = await db.update(categories)
    .set({ name, slug, description, image, parentId, sortOrder, isActive, isFeatured, updatedAt: new Date() })
    .where(eq(categories.id, parseInt(id)))
    .returning();

  if (!updated) return next(new AppError('Category not found', 404));

  return res.json({ success: true, message: 'Category updated', data: updated });
});

export const adminDeleteCategory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const [existing] = await db.select().from(categories).where(eq(categories.id, parseInt(id)));
  if (!existing) return next(new AppError('Category not found', 404));

  await db.update(categories).set({ isActive: false }).where(eq(categories.id, parseInt(id)));
  return res.json({ success: true, message: 'Category deleted' });
});