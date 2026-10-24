import { Request, Response, NextFunction } from 'express';
import { eq, desc, like, or, sql } from 'drizzle-orm';
import { db } from '../config/db';
import { users, orders, crmNotes, customerSegments } from '../schemas/index';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AdminRequest } from '../middleware/adminAuth';

// GET /api/admin/customers
export const adminGetCustomers = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', search, segment } = req.query;
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const offset = (pageNum - 1) * limitNum;

  const conditions = [eq(users.role, 'customer')];
  if (search) {
    conditions.push(
      or(
        like(users.name, `%${search}%`),
        like(users.email, `%${search}%`),
        like(users.phone, `%${search}%`)
      )!
    );
  }

  const [allCustomers, totalCount] = await Promise.all([
    db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      avatar: users.avatar,
      isActive: users.isActive,
      loyaltyPoints: users.loyaltyPoints,
      createdAt: users.createdAt,
    }).from(users)
      .where(conditions.length > 0 ? sql`${conditions.join(' AND ')}` : eq(users.role, 'customer'))
      .orderBy(desc(users.createdAt))
      .limit(limitNum)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(users)
      .where(eq(users.role, 'customer')),
  ]);

  // Get order count for each customer
  const customersWithStats = await Promise.all(
    allCustomers.map(async (customer) => {
      const orderStats = await db.select({
        count: sql<number>`count(*)`,
        total: sql<number>`coalesce(sum(total), 0)`,
      }).from(orders).where(eq(orders.userId, customer.id));

      return {
        ...customer,
        totalOrders: Number(orderStats[0]?.count || 0),
        totalSpent: Number(orderStats[0]?.total || 0),
      };
    })
  );

  return res.json({
    success: true,
    data: customersWithStats,
    total: Number(totalCount[0]?.count || 0),
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(Number(totalCount[0]?.count || 0) / limitNum),
  });
});

// GET /api/admin/customers/:id
export const adminGetCustomerById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const [customer] = await db.select().from(users).where(eq(users.id, parseInt(id)));
  if (!customer) return next(new AppError('Customer not found', 404));

  const [customerOrders, notes, segment] = await Promise.all([
    db.select().from(orders).where(eq(orders.userId, parseInt(id))).orderBy(desc(orders.createdAt)).limit(20),
    db.select().from(crmNotes).where(eq(crmNotes.userId, parseInt(id))).orderBy(desc(crmNotes.createdAt)),
    db.select().from(customerSegments).where(eq(customerSegments.userId, parseInt(id))).limit(1),
  ]);

  return res.json({
    success: true,
    data: {
      ...customer,
      orders: customerOrders,
      notes,
      segment: segment[0]?.segment || 'new',
    },
  });
});

// POST /api/admin/customers/:id/notes
export const adminAddCrmNote = asyncHandler(async (req: AdminRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { note, type } = req.body;

  if (!note) return next(new AppError('Note is required', 400));

  const [newNote] = await db.insert(crmNotes).values({
    userId: parseInt(id),
    adminId: req.adminId,
    note,
    type: type || 'general',
  }).returning();

  return res.status(201).json({ success: true, message: 'Note added', data: newNote });
});

// PUT /api/admin/customers/:id/status
export const adminToggleCustomerStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const [customer] = await db.select().from(users).where(eq(users.id, parseInt(id)));
  if (!customer) return next(new AppError('Customer not found', 404));

  const [updated] = await db.update(users)
    .set({ isActive: !customer.isActive, updatedAt: new Date() })
    .where(eq(users.id, parseInt(id)))
    .returning();

  return res.json({
    success: true,
    message: `Customer ${updated.isActive ? 'activated' : 'deactivated'}`,
    data: { isActive: updated.isActive },
  });
});