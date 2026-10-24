import { Request, Response, NextFunction } from 'express';
import { eq, desc, and, like, or, sql, gte, lte } from 'drizzle-orm';
import { db } from '../config/db';
import {
  orders, orderItems, orderStatusHistory,
  products, users, coupons
} from '../schemas/index';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { AdminRequest } from '../middleware/adminAuth';

// Generate order number
const generateOrderNumber = (): string => {
  const prefix = 'NB';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
};

// ============================
// CUSTOMER ORDERS
// ============================

// POST /api/orders — Place new order
export const placeOrder = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const {
    items, shippingAddress, paymentMethod,
    couponCode, notes
  } = req.body;

  if (!items || items.length === 0) {
    return next(new AppError('No items in order', 400));
  }

  if (!shippingAddress || !paymentMethod) {
    return next(new AppError('Shipping address and payment method are required', 400));
  }

  // Calculate order totals
  let subtotal = 0;
  const orderItemsData = [];

  for (const item of items) {
    const [product] = await db.select().from(products)
      .where(eq(products.id, item.productId));

    if (!product) {
      return next(new AppError(`Product ID ${item.productId} not found`, 404));
    }

    if (product.stock < item.quantity) {
      return next(new AppError(`Insufficient stock for ${product.name}`, 400));
    }

    const price = Number(product.salePrice || product.price);
    subtotal += price * item.quantity;

    orderItemsData.push({
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      price: price.toString(),
      variant: item.variant || null,
    });
  }

  // Apply coupon
  let discount = 0;
  let couponId = null;

  if (couponCode) {
    const [coupon] = await db.select().from(coupons)
      .where(and(eq(coupons.code, couponCode), eq(coupons.isActive, true)));

    if (coupon && new Date(coupon.expiryDate) > new Date()) {
      if (!coupon.minOrderAmount || subtotal >= Number(coupon.minOrderAmount)) {
        if (coupon.type === 'flat') {
          discount = Number(coupon.value);
        } else if (coupon.type === 'percentage') {
          discount = (subtotal * Number(coupon.value)) / 100;
          if (coupon.maxDiscountAmount) {
            discount = Math.min(discount, Number(coupon.maxDiscountAmount));
          }
        }
        couponId = coupon.id;

        // Increment usage
        await db.update(coupons)
          .set({ usedCount: sql`${coupons.usedCount} + 1` })
          .where(eq(coupons.id, coupon.id));
      }
    }
  }

  // Shipping cost
  const shippingCost = shippingAddress.city?.toLowerCase().includes('dhaka') ? 60 : 120;
  const total = subtotal - discount + shippingCost;

  // Create order
  const orderNumber = generateOrderNumber();

  const [newOrder] = await db.insert(orders).values({
    orderNumber,
    userId: req.userId!,
    shippingAddress,
    status: 'pending',
    paymentMethod,
    paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
    subtotal: subtotal.toString(),
    shippingCost: shippingCost.toString(),
    discount: discount.toString(),
    total: total.toString(),
    couponId,
    notes,
  }).returning();

  // Create order items
  for (const item of orderItemsData) {
    await db.insert(orderItems).values({
      orderId: newOrder.id,
      ...item,
    });
  }

  // Update product stock
  for (const item of items) {
    await db.update(products)
      .set({
        stock: sql`${products.stock} - ${item.quantity}`,
        totalSold: sql`${products.totalSold} + ${item.quantity}`,
      })
      .where(eq(products.id, item.productId));
  }

  // Add status history
  await db.insert(orderStatusHistory).values({
    orderId: newOrder.id,
    status: 'pending',
    note: 'Order placed by customer',
  });

  return res.status(201).json({
    success: true,
    message: 'Order placed successfully!',
    data: {
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      total: newOrder.total,
      status: newOrder.status,
    },
  });
});

// GET /api/orders — Customer's own orders
export const getMyOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '10' } = req.query;
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const offset = (pageNum - 1) * limitNum;

  const [myOrders, totalCount] = await Promise.all([
    db.select().from(orders)
      .where(eq(orders.userId, req.userId!))
      .orderBy(desc(orders.createdAt))
      .limit(limitNum)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(orders)
      .where(eq(orders.userId, req.userId!)),
  ]);

  // Get items for each order
  const ordersWithItems = await Promise.all(
    myOrders.map(async (order) => {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      return { ...order, items };
    })
  );

  return res.json({
    success: true,
    data: ordersWithItems,
    total: Number(totalCount[0]?.count || 0),
    page: pageNum,
    limit: limitNum,
  });
});

// GET /api/orders/track — Track order by order number
export const trackOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { orderNumber, phone } = req.query;

  if (!orderNumber) {
    return next(new AppError('Order number is required', 400));
  }

  const [order] = await db.select().from(orders)
    .where(eq(orders.orderNumber, orderNumber as string));

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  const [items, statusHistory] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
    db.select().from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, order.id))
      .orderBy(desc(orderStatusHistory.createdAt)),
  ]);

  return res.json({
    success: true,
    data: {
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      total: order.total,
      shippingAddress: order.shippingAddress,
      trackingNumber: order.trackingNumber,
      estimatedDelivery: order.estimatedDelivery,
      createdAt: order.createdAt,
      items,
      timeline: statusHistory,
    },
  });
});

// ============================
// ADMIN ORDER CONTROLLERS
// ============================

// GET /api/admin/orders
export const adminGetOrders = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = '1', limit = '20',
    status, search, dateFrom, dateTo,
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  if (status && status !== 'all') conditions.push(eq(orders.status, status as string));
  if (search) conditions.push(or(like(orders.orderNumber, `%${search}%`))!);
  if (dateFrom) conditions.push(gte(orders.createdAt, new Date(dateFrom as string)));
  if (dateTo) conditions.push(lte(orders.createdAt, new Date(dateTo as string)));

  const [allOrders, totalCount] = await Promise.all([
    db.select().from(orders)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(orders.createdAt))
      .limit(limitNum)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(orders)
      .where(conditions.length > 0 ? and(...conditions) : undefined),
  ]);

  // Get customer info
  const ordersWithDetails = await Promise.all(
    allOrders.map(async (order) => {
      const [customer, items] = await Promise.all([
        order.userId
          ? db.select({ id: users.id, name: users.name, email: users.email, phone: users.phone })
              .from(users).where(eq(users.id, order.userId)).limit(1)
          : Promise.resolve([]),
        db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
      ]);
      return { ...order, customer: customer[0] || null, items };
    })
  );

  return res.json({
    success: true,
    data: ordersWithDetails,
    total: Number(totalCount[0]?.count || 0),
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(Number(totalCount[0]?.count || 0) / limitNum),
  });
});

// GET /api/admin/orders/:id
export const adminGetOrderById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const [order] = await db.select().from(orders).where(eq(orders.id, parseInt(id)));
  if (!order) return next(new AppError('Order not found', 404));

  const [items, statusHistory, customer] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
    db.select().from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, order.id))
      .orderBy(desc(orderStatusHistory.createdAt)),
    order.userId
      ? db.select().from(users).where(eq(users.id, order.userId)).limit(1)
      : Promise.resolve([]),
  ]);

  return res.json({
    success: true,
    data: { ...order, items, statusHistory, customer: customer[0] || null },
  });
});

// PUT /api/admin/orders/:id/status
export const adminUpdateOrderStatus = asyncHandler(async (req: AdminRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { status, note, trackingNumber, courierId } = req.body;

  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
  if (!validStatuses.includes(status)) {
    return next(new AppError('Invalid status', 400));
  }

  const updateData: Record<string, unknown> = { status, updatedAt: new Date() };
  if (trackingNumber) updateData.trackingNumber = trackingNumber;
  if (courierId) updateData.courierId = parseInt(courierId);
  if (status === 'delivered') updateData.deliveredAt = new Date();

  const [updated] = await db.update(orders)
    .set(updateData)
    .where(eq(orders.id, parseInt(id)))
    .returning();

  if (!updated) return next(new AppError('Order not found', 404));

  // Add to status history
  await db.insert(orderStatusHistory).values({
    orderId: parseInt(id),
    status,
    note,
    changedBy: req.adminId,
  });

  return res.json({
    success: true,
    message: `Order status updated to ${status}`,
    data: updated,
  });
});

// GET /api/admin/orders/stats — Order status counts
export const adminGetOrderStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await db.select({
    status: orders.status,
    count: sql<number>`count(*)`,
    total: sql<number>`sum(${orders.total})`,
  }).from(orders).groupBy(orders.status);

  return res.json({ success: true, data: stats });
});