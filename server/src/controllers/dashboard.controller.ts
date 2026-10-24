import { Request, Response } from 'express';
import { eq, desc, gte, sql, and } from 'drizzle-orm';
import { db } from '../config/db';
import { orders, users, products, orderItems } from '../schemas/index';
import { asyncHandler } from '../middleware/errorHandler';

// GET /api/admin/dashboard
export const getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const [
    todayOrders,
    yesterdayOrders,
    totalCustomers,
    newCustomersToday,
    totalRevenue,
    lastMonthRevenue,
    recentOrders,
    topProducts,
    orderStatusCounts,
    lowStockProducts,
  ] = await Promise.all([
    // Today's orders
    db.select({ count: sql<number>`count(*)`, total: sql<number>`coalesce(sum(total), 0)` })
      .from(orders).where(gte(orders.createdAt, today)),
    // Yesterday's orders
    db.select({ count: sql<number>`count(*)`, total: sql<number>`coalesce(sum(total), 0)` })
      .from(orders).where(and(gte(orders.createdAt, yesterday), sql`${orders.createdAt} < ${today}`)),
    // Total customers
    db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, 'customer')),
    // New customers today
    db.select({ count: sql<number>`count(*)` }).from(users)
      .where(and(eq(users.role, 'customer'), gte(users.createdAt, today))),
    // Total revenue (all time)
    db.select({ total: sql<number>`coalesce(sum(total), 0)` }).from(orders)
      .where(eq(orders.status, 'delivered')),
    // Last month revenue
    db.select({ total: sql<number>`coalesce(sum(total), 0)` }).from(orders)
      .where(and(eq(orders.status, 'delivered'), gte(orders.createdAt, lastMonth))),
    // Recent 10 orders
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(10),
    // Top 5 selling products
    db.select({
      productId: orderItems.productId,
      productName: orderItems.productName,
      totalSold: sql<number>`sum(${orderItems.quantity})`,
      revenue: sql<number>`sum(${orderItems.price} * ${orderItems.quantity})`,
    }).from(orderItems)
      .groupBy(orderItems.productId, orderItems.productName)
      .orderBy(desc(sql`sum(${orderItems.quantity})`))
      .limit(5),
    // Order status breakdown
    db.select({
      status: orders.status,
      count: sql<number>`count(*)`,
    }).from(orders).groupBy(orders.status),
    // Low stock products
    db.select({ id: products.id, name: products.name, stock: products.stock, sku: products.sku })
      .from(products)
      .where(and(eq(products.isActive, true), sql`${products.stock} <= ${products.lowStockThreshold}`))
      .limit(10),
  ]);

  // Sales chart — last 7 days
  const salesChart = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const dayData = await db.select({
      count: sql<number>`count(*)`,
      revenue: sql<number>`coalesce(sum(total), 0)`,
    }).from(orders).where(and(gte(orders.createdAt, date), sql`${orders.createdAt} < ${nextDate}`));

    salesChart.push({
      date: date.toLocaleDateString('en-BD', { month: 'short', day: 'numeric' }),
      orders: Number(dayData[0]?.count || 0),
      revenue: Number(dayData[0]?.revenue || 0),
    });
  }

  const todayData = todayOrders[0];
  const yesterdayData = yesterdayOrders[0];

  const ordersChange = yesterdayData?.count > 0
    ? Math.round(((Number(todayData?.count) - Number(yesterdayData?.count)) / Number(yesterdayData?.count)) * 100)
    : 0;

  return res.json({
    success: true,
    data: {
      stats: {
        totalSalesToday: Number(todayData?.total || 0),
        totalOrdersToday: Number(todayData?.count || 0),
        totalCustomers: Number(totalCustomers[0]?.count || 0),
        newCustomersToday: Number(newCustomersToday[0]?.count || 0),
        totalRevenue: Number(totalRevenue[0]?.total || 0),
        lastMonthRevenue: Number(lastMonthRevenue[0]?.total || 0),
        ordersChange,
      },
      salesChart,
      recentOrders,
      topProducts,
      orderStatusCounts,
      lowStockProducts,
    },
  });
});