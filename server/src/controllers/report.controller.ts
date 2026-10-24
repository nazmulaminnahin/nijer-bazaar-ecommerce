import { Request, Response } from 'express';
import { eq, gte, lte, and, sql, desc } from 'drizzle-orm';
import { db } from '../config/db';
import { orders, orderItems, users, products } from '../schemas/index';
import { asyncHandler } from '../middleware/errorHandler';

// GET /api/admin/reports/sales
export const getSalesReport = asyncHandler(async (req: Request, res: Response) => {
  const { from, to, groupBy = 'day' } = req.query;

  const dateFrom = from ? new Date(from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const dateTo = to ? new Date(to as string) : new Date();

  const conditions = [gte(orders.createdAt, dateFrom), lte(orders.createdAt, dateTo)];

  const salesData = await db.select({
    date: sql<string>`date_trunc(${groupBy}, ${orders.createdAt})`,
    revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
    orders: sql<number>`count(*)`,
    avgOrderValue: sql<number>`coalesce(avg(${orders.total}), 0)`,
  }).from(orders)
    .where(and(...conditions))
    .groupBy(sql`date_trunc(${groupBy}, ${orders.createdAt})`)
    .orderBy(sql`date_trunc(${groupBy}, ${orders.createdAt})`);

  const summary = await db.select({
    totalRevenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
    totalOrders: sql<number>`count(*)`,
    avgOrderValue: sql<number>`coalesce(avg(${orders.total}), 0)`,
    deliveredOrders: sql<number>`count(*) filter (where ${orders.status} = 'delivered')`,
  }).from(orders).where(and(...conditions));

  return res.json({
    success: true,
    data: { salesData, summary: summary[0] },
  });
});

// GET /api/admin/reports/products
export const getProductsReport = asyncHandler(async (req: Request, res: Response) => {
  const topSelling = await db.select({
    productId: orderItems.productId,
    productName: orderItems.productName,
    totalQuantity: sql<number>`sum(${orderItems.quantity})`,
    totalRevenue: sql<number>`sum(${orderItems.price} * ${orderItems.quantity})`,
  }).from(orderItems)
    .groupBy(orderItems.productId, orderItems.productName)
    .orderBy(desc(sql`sum(${orderItems.quantity})`))
    .limit(20);

  return res.json({ success: true, data: topSelling });
});

// GET /api/admin/reports/customers
export const getCustomersReport = asyncHandler(async (req: Request, res: Response) => {
  const { from, to } = req.query;
  const dateFrom = from ? new Date(from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const dateTo = to ? new Date(to as string) : new Date();

  const newCustomers = await db.select({
    date: sql<string>`date_trunc('day', ${users.createdAt})`,
    count: sql<number>`count(*)`,
  }).from(users)
    .where(and(
      eq(users.role, 'customer'),
      gte(users.createdAt, dateFrom),
      lte(users.createdAt, dateTo)
    ))
    .groupBy(sql`date_trunc('day', ${users.createdAt})`)
    .orderBy(sql`date_trunc('day', ${users.createdAt})`);

  const totalCustomers = await db.select({ count: sql<number>`count(*)` })
    .from(users).where(eq(users.role, 'customer'));

  return res.json({
    success: true,
    data: { newCustomers, totalCustomers: Number(totalCustomers[0]?.count || 0) },
  });
});