import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import { db } from "../config/db";
import {
  admins,
  coupons,
  couriers,
  expenses,
  giftCards,
  inventoryLog,
  loyaltyTransactions,
  notifications,
  notificationTemplates,
  orders,
  productImages,
  products,
  settings,
  transactions,
  users,
} from "../schemas/index";
import { authenticateAdmin, AdminAuthRequest } from "../middleware/adminAuth";
import { AppError, asyncHandler } from "../middleware/errorHandler";

const router = Router();

// 1. DASHBOARD (/api/admin/dashboard/*)
router.get("/admin/dashboard", authenticateAdmin, asyncHandler(async (_req: Request, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayRes, allRes, pendingRes, custRes, prodRes, lowRes] = await Promise.all([
    db.select({ count: sql<number>`count(*)`, revenue: sql<number>`coalesce(sum(${orders.total}), 0)` }).from(orders).where(gte(orders.createdAt, today)),
    db.select({ count: sql<number>`count(*)`, revenue: sql<number>`coalesce(sum(${orders.total}), 0)` }).from(orders),
    db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.status, "pending")),
    db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, "customer")),
    db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.isActive, true)),
    db.select({ count: sql<number>`count(*)` }).from(products).where(and(eq(products.isActive, true), sql`${products.stock} <= ${products.lowStockThreshold}`)),
  ]);

  const stats = {
    todayRevenue: Number(todayRes[0]?.revenue || 0),
    todayOrders: Number(todayRes[0]?.count || 0),
    totalRevenue: Number(allRes[0]?.revenue || 0),
    totalOrders: Number(allRes[0]?.count || 0),
    pendingOrders: Number(pendingRes[0]?.count || 0),
    totalCustomers: Number(custRes[0]?.count || 0),
    totalProducts: Number(prodRes[0]?.count || 0),
    lowStockProducts: Number(lowRes[0]?.count || 0),
    revenueGrowth: 12.5,
    ordersGrowth: 8.2,
    customersGrowth: 5.4,
  };
  return res.json({ success: true, stats, data: { stats } });
}));

router.get("/admin/dashboard/top-products", authenticateAdmin, asyncHandler(async (_req: Request, res: Response) => {
  const [topList, images] = await Promise.all([
    db.select().from(products).where(eq(products.isActive, true)).orderBy(desc(products.totalSold), desc(products.id)).limit(8),
    db.select().from(productImages).where(eq(productImages.isMain, true)),
  ]);
  const formatted = topList.map((p) => ({
    id: p.id,
    name: p.name,
    image: images.find((img) => img.productId === p.id)?.imageUrl || null,
    soldCount: Number(p.totalSold || 0),
    revenue: Number(p.totalSold || 0) * Number(p.salePrice ?? p.price ?? 0),
    stock: p.stock,
  }));
  return res.json({ success: true, products: formatted, data: formatted });
}));

router.get("/admin/dashboard/low-stock", authenticateAdmin, asyncHandler(async (_req: Request, res: Response) => {
  const low = await db
    .select({ id: products.id, name: products.name, sku: products.sku, stock: products.stock, lowStockThreshold: products.lowStockThreshold })
    .from(products)
    .where(and(eq(products.isActive, true), sql`${products.stock} <= ${products.lowStockThreshold}`))
    .orderBy(products.stock)
    .limit(10);
  return res.json({ success: true, products: low, data: low });
}));

// 2. PRODUCT TOGGLE & ORDER COURIER ASSIGN
router.patch("/products/:id/toggle", authenticateAdmin, asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(String(req.params.id));
  const [existing] = await db.select().from(products).where(eq(products.id, id));
  if (!existing) return next(new AppError("Product not found", 404));
  const [updated] = await db.update(products).set({ isActive: !existing.isActive, updatedAt: new Date() }).where(eq(products.id, id)).returning();
  return res.json({ success: true, data: updated });
}));

router.patch("/orders/:id/courier", authenticateAdmin, asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(String(req.params.id));
  const { courierId, courierTrackingId, trackingNumber } = req.body;
  const [updated] = await db
    .update(orders)
    .set({ courierId: courierId ? Number(courierId) : null, trackingNumber: courierTrackingId ?? trackingNumber ?? null, updatedAt: new Date() })
    .where(eq(orders.id, id))
    .returning();
  if (!updated) return next(new AppError("Order not found", 404));
  return res.json({ success: true, data: updated });
}));

// 3. COUPONS (/api/coupons)
router.post("/coupons/validate", asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { code, orderAmount } = req.body;
  if (!code) return next(new AppError("Coupon code is required", 400));
  const [coupon] = await db.select().from(coupons).where(and(eq(coupons.code, String(code).toUpperCase()), eq(coupons.isActive, true)));
  if (!coupon) return next(new AppError("Invalid coupon code", 404));
  if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) return next(new AppError("This coupon has expired", 400));
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return next(new AppError("Coupon usage limit reached", 400));

  const subtotal = Number(orderAmount || 0);
  if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
    return next(new AppError(`Minimum order amount is ৳${coupon.minOrderAmount}`, 400));
  }
  let discountAmount = coupon.type === "percentage" ? (subtotal * Number(coupon.value)) / 100 : Number(coupon.value);
  if (coupon.type === "percentage" && coupon.maxDiscountAmount) {
    discountAmount = Math.min(discountAmount, Number(coupon.maxDiscountAmount));
  }
  return res.json({ success: true, data: { code: coupon.code, discountAmount: Math.round(discountAmount) } });
}));

router.get("/coupons", authenticateAdmin, asyncHandler(async (_req: Request, res: Response) => {
  const list = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
  const formatted = list.map((c) => ({
    id: c.id,
    code: c.code,
    type: c.type === "flat" ? "fixed" : c.type,
    value: Number(c.value),
    minOrderAmount: c.minOrderAmount ? Number(c.minOrderAmount) : null,
    maxDiscount: c.maxDiscountAmount ? Number(c.maxDiscountAmount) : null,
    usageLimit: c.maxUses,
    usedCount: c.usedCount,
    usageCount: c.usedCount,
    isActive: c.isActive,
    expiresAt: c.expiryDate ? c.expiryDate.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
  }));
  return res.json({ success: true, coupons: formatted, data: formatted });
}));

router.post("/coupons", authenticateAdmin, asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { code, type, value, minOrderAmount, maxDiscount, usageLimit, isActive, expiresAt } = req.body;
  if (!code || value === undefined) return next(new AppError("Code and value are required", 400));
  const [created] = await db
    .insert(coupons)
    .values({
      code: String(code).trim().toUpperCase(),
      type: type === "fixed" ? "flat" : type || "percentage",
      value: String(value),
      minOrderAmount: minOrderAmount ? String(minOrderAmount) : null,
      maxDiscountAmount: maxDiscount ? String(maxDiscount) : null,
      maxUses: usageLimit ? Number(usageLimit) : null,
      isActive: isActive !== false,
      expiryDate: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 365 * 86400000),
    })
    .returning();
  return res.status(201).json({ success: true, data: created });
}));

router.put("/coupons/:id", authenticateAdmin, asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(String(req.params.id));
  const { code, type, value, minOrderAmount, maxDiscount, usageLimit, isActive, expiresAt } = req.body;
  const [updated] = await db
    .update(coupons)
    .set({
      code: code ? String(code).trim().toUpperCase() : undefined,
      type: type === "fixed" ? "flat" : type,
      value: value !== undefined ? String(value) : undefined,
      minOrderAmount: minOrderAmount ? String(minOrderAmount) : null,
      maxDiscountAmount: maxDiscount ? String(maxDiscount) : null,
      maxUses: usageLimit ? Number(usageLimit) : null,
      isActive,
      expiryDate: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 365 * 86400000),
      updatedAt: new Date(),
    })
    .where(eq(coupons.id, id))
    .returning();
  if (!updated) return next(new AppError("Coupon not found", 404));
  return res.json({ success: true, data: updated });
}));

router.delete("/coupons/:id", authenticateAdmin, asyncHandler(async (req: Request, res: Response) => {
  await db.delete(coupons).where(eq(coupons.id, parseInt(String(req.params.id))));
  return res.json({ success: true, message: "Coupon deleted" });
}));

// 4. INVENTORY (/api/admin/inventory)
router.get("/admin/inventory", authenticateAdmin, asyncHandler(async (_req: Request, res: Response) => {
  const list = await db.select().from(products).orderBy(products.stock);
  const formatted = list.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    stock: p.stock,
    lowStockThreshold: p.lowStockThreshold,
    price: Number(p.salePrice ?? p.price ?? 0),
    isActive: p.isActive,
  }));
  return res.json({ success: true, inventory: formatted, data: formatted });
}));

router.post("/admin/inventory/adjust", authenticateAdmin, asyncHandler(async (req: AdminAuthRequest, res: Response, next: NextFunction) => {
  const { productId, type, quantity, note } = req.body;
  const qty = Number(quantity || 0);
  if (!productId || qty <= 0) return next(new AppError("Valid productId and quantity required", 400));
  const [prod] = await db.select().from(products).where(eq(products.id, Number(productId)));
  if (!prod) return next(new AppError("Product not found", 404));

  const prevStock = prod.stock;
  const newStock = type === "in" || type === "return" ? prevStock + qty : type === "out" ? Math.max(0, prevStock - qty) : qty;
  await db.update(products).set({ stock: newStock, updatedAt: new Date() }).where(eq(products.id, prod.id));
  await db.insert(inventoryLog).values({
    productId: prod.id,
    type: type || "adjustment",
    quantity: qty,
    previousStock: prevStock,
    newStock,
    reason: note || null,
    adminId: req.adminId,
  });
  return res.json({ success: true, data: { previousStock: prevStock, newStock } });
}));

// 5. COURIERS (/api/couriers)
router.get("/couriers", authenticateAdmin, asyncHandler(async (_req: Request, res: Response) => {
  const list = await db.select().from(couriers).orderBy(couriers.id);
  const formatted = list.map((c) => ({ ...c, slug: c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") }));
  return res.json({ success: true, couriers: formatted, data: formatted });
}));

router.post("/couriers", authenticateAdmin, asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { name, logo, trackingUrl, isActive } = req.body;
  if (!name) return next(new AppError("Courier name is required", 400));
  const [created] = await db.insert(couriers).values({ name, logo: logo || null, trackingUrl: trackingUrl || null, isActive: isActive !== false }).returning();
  return res.status(201).json({ success: true, data: created });
}));

router.put("/couriers/:id", authenticateAdmin, asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  const { name, logo, trackingUrl, isActive } = req.body;
  const [updated] = await db.update(couriers).set({ name, logo: logo || null, trackingUrl: trackingUrl || null, isActive, updatedAt: new Date() }).where(eq(couriers.id, id)).returning();
  return res.json({ success: true, data: updated });
}));

router.delete("/couriers/:id", authenticateAdmin, asyncHandler(async (req: Request, res: Response) => {
  await db.delete(couriers).where(eq(couriers.id, parseInt(String(req.params.id))));
  return res.json({ success: true, message: "Courier deleted" });
}));

// 6. GIFT CARDS (/api/gift-cards)
router.get("/gift-cards", authenticateAdmin, asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt((req.query.page as string) || "1");
  const limit = parseInt((req.query.limit as string) || "20");
  const [list, countRes] = await Promise.all([
    db.select().from(giftCards).orderBy(desc(giftCards.createdAt)).limit(limit).offset((page - 1) * limit),
    db.select({ count: sql<number>`count(*)` }).from(giftCards),
  ]);
  const cards = list.map((c) => ({
    id: c.id,
    code: c.code,
    initialBalance: Number(c.initialAmount),
    currentBalance: Number(c.remainingAmount),
    isActive: c.isActive,
    expiresAt: c.expiryDate ? c.expiryDate.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
  }));
  return res.json({ success: true, cards, data: cards, total: Number(countRes[0]?.count || 0) });
}));

router.post("/gift-cards", authenticateAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { initialBalance, expiresAt, quantity = 1 } = req.body;
  const count = Math.min(50, Math.max(1, Number(quantity || 1)));
  const amount = String(Number(initialBalance || 500));
  const values = Array.from({ length: count }, () => ({
    code: "GC-" + Math.random().toString(36).substring(2, 6).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase(),
    initialAmount: amount,
    remainingAmount: amount,
    expiryDate: expiresAt ? new Date(expiresAt) : null,
    isActive: true,
  }));
  await db.insert(giftCards).values(values);
  return res.status(201).json({ success: true, count, data: { count } });
}));

router.patch("/gift-cards/:id/toggle", authenticateAdmin, asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(String(req.params.id));
  const [existing] = await db.select().from(giftCards).where(eq(giftCards.id, id));
  if (!existing) return next(new AppError("Gift card not found", 404));
  const [updated] = await db.update(giftCards).set({ isActive: !existing.isActive }).where(eq(giftCards.id, id)).returning();
  return res.json({ success: true, data: updated });
}));

router.delete("/gift-cards/:id", authenticateAdmin, asyncHandler(async (req: Request, res: Response) => {
  await db.delete(giftCards).where(eq(giftCards.id, parseInt(String(req.params.id))));
  return res.json({ success: true, message: "Gift card deleted" });
}));

// 7. LOYALTY (/api/loyalty)
router.get("/loyalty", authenticateAdmin, asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt((req.query.page as string) || "1");
  const limit = parseInt((req.query.limit as string) || "20");
  const [rows, countRes] = await Promise.all([
    db
      .select({
        id: loyaltyTransactions.id,
        userId: loyaltyTransactions.userId,
        userName: users.name,
        userEmail: users.email,
        type: loyaltyTransactions.type,
        points: loyaltyTransactions.points,
        description: loyaltyTransactions.description,
        createdAt: loyaltyTransactions.createdAt,
      })
      .from(loyaltyTransactions)
      .leftJoin(users, eq(loyaltyTransactions.userId, users.id))
      .orderBy(desc(loyaltyTransactions.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ count: sql<number>`count(*)` }).from(loyaltyTransactions),
  ]);
  return res.json({ success: true, transactions: rows, data: rows, total: Number(countRes[0]?.count || 0) });
}));

router.post("/loyalty/grant", authenticateAdmin, asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { userId, points, description } = req.body;
  const pts = Number(points || 0);
  const [user] = await db.select().from(users).where(eq(users.id, Number(userId)));
  if (!user) return next(new AppError("Customer not found", 404));
  const newBalance = (user.loyaltyPoints || 0) + pts;
  await db.update(users).set({ loyaltyPoints: newBalance, updatedAt: new Date() }).where(eq(users.id, user.id));
  const [tx] = await db
    .insert(loyaltyTransactions)
    .values({ userId: user.id, type: "bonus", points: pts, balance: newBalance, description: description || "Admin bonus points" })
    .returning();
  return res.status(201).json({ success: true, data: tx });
}));

// 8. NOTIFICATIONS & TEMPLATES (/api/notifications)
router.get("/notifications", authenticateAdmin, asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt((req.query.limit as string) || "30");
  const list = await db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(limit);
  return res.json({ success: true, notifications: list, data: list });
}));

router.post("/notifications/broadcast", authenticateAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { type = "system", title, message } = req.body;
  const [created] = await db.insert(notifications).values({ userId: null, type, title, message }).returning();
  return res.status(201).json({ success: true, data: created });
}));

router.get("/notifications/templates", authenticateAdmin, asyncHandler(async (_req: Request, res: Response) => {
  const list = await db.select().from(notificationTemplates).orderBy(desc(notificationTemplates.createdAt));
  const templates = list.map((t) => ({ ...t, channel: t.type }));
  return res.json({ success: true, templates, data: templates });
}));

router.post("/notifications/templates", authenticateAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { name, channel, type, subject, body, isActive } = req.body;
  const [created] = await db
    .insert(notificationTemplates)
    .values({ name, type: channel || type || "email", subject: subject || null, body, isActive: isActive !== false })
    .returning();
  return res.status(201).json({ success: true, data: created });
}));

router.put("/notifications/templates/:id", authenticateAdmin, asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  const { name, channel, type, subject, body, isActive } = req.body;
  const [updated] = await db
    .update(notificationTemplates)
    .set({ name, type: channel || type || "email", subject: subject || null, body, isActive, updatedAt: new Date() })
    .where(eq(notificationTemplates.id, id))
    .returning();
  return res.json({ success: true, data: updated });
}));

router.delete("/notifications/templates/:id", authenticateAdmin, asyncHandler(async (req: Request, res: Response) => {
  await db.delete(notificationTemplates).where(eq(notificationTemplates.id, parseInt(String(req.params.id))));
  return res.json({ success: true, message: "Template deleted" });
}));

// 9. STAFF MANAGEMENT (/api/admin/staff)
router.get("/admin/staff", authenticateAdmin, asyncHandler(async (_req: Request, res: Response) => {
  const list = await db
    .select({ id: admins.id, name: admins.name, email: admins.email, role: admins.role, isActive: admins.isActive, createdAt: admins.createdAt })
    .from(admins)
    .orderBy(desc(admins.createdAt));
  return res.json({ success: true, staff: list, data: list });
}));

router.post("/admin/staff", authenticateAdmin, asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password, role, isActive } = req.body;
  if (!name || !email || !password) return next(new AppError("Name, email, and password are required", 400));
  const hashedPassword = await bcrypt.hash(password, 12);
  const [created] = await db
    .insert(admins)
    .values({ name, email, password: hashedPassword, role: role || "staff", isActive: isActive !== false })
    .returning();
  return res.status(201).json({ success: true, data: { id: created.id, name: created.name, email: created.email, role: created.role } });
}));

router.put("/admin/staff/:id", authenticateAdmin, asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  const { name, email, password, role, isActive } = req.body;
  const updates: Record<string, unknown> = { name, email, role, isActive, updatedAt: new Date() };
  if (password) updates.password = await bcrypt.hash(password, 12);
  const [updated] = await db.update(admins).set(updates).where(eq(admins.id, id)).returning();
  return res.json({ success: true, data: updated });
}));

router.delete("/admin/staff/:id", authenticateAdmin, asyncHandler(async (req: Request, res: Response) => {
  await db.delete(admins).where(eq(admins.id, parseInt(String(req.params.id))));
  return res.json({ success: true, message: "Staff removed" });
}));

// 10. ACCOUNTING (/api/accounting/*)
router.get("/accounting/transactions", authenticateAdmin, asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt((req.query.page as string) || "1");
  const limit = parseInt((req.query.limit as string) || "15");
  const [rows, countRes, allRows] = await Promise.all([
    db.select().from(transactions).orderBy(desc(transactions.createdAt)).limit(limit).offset((page - 1) * limit),
    db.select({ count: sql<number>`count(*)` }).from(transactions),
    db.select().from(transactions),
  ]);
  const summary = allRows.reduce(
    (acc, t) => {
      if (t.type === "income") acc.totalIncome += Number(t.amount || 0);
      else acc.totalExpense += Number(t.amount || 0);
      return acc;
    },
    { totalIncome: 0, totalExpense: 0 }
  );
  const formatted = rows.map((t) => ({ ...t, amount: Number(t.amount) }));
  return res.json({ success: true, transactions: formatted, data: formatted, total: Number(countRes[0]?.count || 0), summary });
}));

router.post("/accounting/transactions", authenticateAdmin, asyncHandler(async (req: AdminAuthRequest, res: Response) => {
  const { type, amount, description, reference, category } = req.body;
  const [created] = await db
    .insert(transactions)
    .values({ type: type || "income", category: category || "general", amount: String(amount || 0), description: description || null, reference: reference || null, adminId: req.adminId })
    .returning();
  return res.status(201).json({ success: true, data: created });
}));

router.delete("/accounting/transactions/:id", authenticateAdmin, asyncHandler(async (req: Request, res: Response) => {
  await db.delete(transactions).where(eq(transactions.id, parseInt(String(req.params.id))));
  return res.json({ success: true, message: "Transaction deleted" });
}));

router.get("/accounting/expenses", authenticateAdmin, asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt((req.query.page as string) || "1");
  const limit = parseInt((req.query.limit as string) || "15");
  const [rows, countRes, sumRes] = await Promise.all([
    db.select().from(expenses).orderBy(desc(expenses.createdAt)).limit(limit).offset((page - 1) * limit),
    db.select({ count: sql<number>`count(*)` }).from(expenses),
    db.select({ total: sql<number>`coalesce(sum(${expenses.amount}), 0)` }).from(expenses),
  ]);
  const formatted = rows.map((e) => ({ ...e, amount: Number(e.amount), date: e.date.toISOString() }));
  return res.json({ success: true, expenses: formatted, data: formatted, total: Number(countRes[0]?.count || 0), totalAmount: Number(sumRes[0]?.total || 0) });
}));

router.post("/accounting/expenses", authenticateAdmin, asyncHandler(async (req: AdminAuthRequest, res: Response) => {
  const { title, amount, category, description, date } = req.body;
  const [created] = await db
    .insert(expenses)
    .values({ title: title || "Expense", category: category || "other", amount: String(amount || 0), description: description || null, date: date ? new Date(date) : new Date(), adminId: req.adminId })
    .returning();
  return res.status(201).json({ success: true, data: created });
}));

router.delete("/accounting/expenses/:id", authenticateAdmin, asyncHandler(async (req: Request, res: Response) => {
  await db.delete(expenses).where(eq(expenses.id, parseInt(String(req.params.id))));
  return res.json({ success: true, message: "Expense deleted" });
}));

// 11. REPORTS (/api/admin/reports/*)
function periodToStartDate(period?: string): Date {
  const days = period === "7d" ? 7 : period === "90d" ? 90 : period === "1y" ? 365 : 30;
  return new Date(Date.now() - days * 86400000);
}

router.get("/admin/reports/sales", authenticateAdmin, asyncHandler(async (req: Request, res: Response) => {
  const startDate = periodToStartDate(req.query.period as string);
  const rows = await db
    .select({
      date: sql<string>`to_char(date_trunc('day', ${orders.createdAt}), 'YYYY-MM-DD')`,
      revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
      orders: sql<number>`count(*)`,
      avgOrderValue: sql<number>`coalesce(avg(${orders.total}), 0)`,
    })
    .from(orders)
    .where(gte(orders.createdAt, startDate))
    .groupBy(sql`1`)
    .orderBy(sql`1`);
  return res.json({
    success: true,
    data: rows.map((r) => ({ date: r.date, revenue: Number(r.revenue || 0), orders: Number(r.orders || 0), avgOrderValue: Number(r.avgOrderValue || 0) })),
  });
}));

router.get("/admin/reports/products", authenticateAdmin, asyncHandler(async (_req: Request, res: Response) => {
  const prods = await db.select().from(products).orderBy(desc(products.totalSold), desc(products.id)).limit(20);
  return res.json({
    success: true,
    data: prods.map((p) => ({ name: p.name, soldCount: Number(p.totalSold || 0), revenue: Number(p.totalSold || 0) * Number(p.salePrice ?? p.price ?? 0), stock: p.stock })),
  });
}));

router.get("/admin/reports/customers", authenticateAdmin, asyncHandler(async (req: Request, res: Response) => {
  const startDate = periodToStartDate(req.query.period as string);
  const rows = await db
    .select({ date: sql<string>`to_char(date_trunc('day', ${users.createdAt}), 'YYYY-MM-DD')`, newCustomers: sql<number>`count(*)` })
    .from(users)
    .where(and(eq(users.role, "customer"), gte(users.createdAt, startDate)))
    .groupBy(sql`1`)
    .orderBy(sql`1`);
  return res.json({
    success: true,
    data: rows.map((r) => ({ date: r.date, newCustomers: Number(r.newCustomers || 0), returningCustomers: 0 })),
  });
}));

// 12. SETTINGS UPSERT (/api/admin/settings)
router.get("/admin/settings", authenticateAdmin, asyncHandler(async (_req: Request, res: Response) => {
  const all = await db.select().from(settings);
  const map: Record<string, unknown> = {};
  for (const s of all) {
    map[s.key] = s.value === "true" ? true : s.value === "false" ? false : s.value;
  }
  return res.json({ success: true, settings: map, data: map });
}));

const saveSettingsHandler = asyncHandler(async (req: Request, res: Response) => {
  const updates = req.body as Record<string, unknown>;
  for (const [key, val] of Object.entries(updates)) {
    const strVal = String(val ?? "");
    const existing = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
    if (existing.length > 0) {
      await db.update(settings).set({ value: strVal, updatedAt: new Date() }).where(eq(settings.key, key));
    } else {
      await db.insert(settings).values({ key, value: strVal, type: typeof val, group: "general" });
    }
  }
  return res.json({ success: true, message: "Settings saved successfully" });
});

router.put("/admin/settings", authenticateAdmin, saveSettingsHandler);
router.post("/admin/settings", authenticateAdmin, saveSettingsHandler);

export default router;