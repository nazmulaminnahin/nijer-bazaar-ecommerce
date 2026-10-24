import { Router, Request, Response } from "express";
import { db } from "../config/db";
import { transactions, expenses } from "../db/schema";
import { eq, desc, sql, and, gte, lte } from "drizzle-orm";
import { authenticateAdmin } from "../middleware/auth.middleware";

const router = Router();

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

// GET /api/accounting/transactions
router.get("/transactions", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const offset = (page - 1) * limit;
    const { type, startDate, endDate } = req.query;

    const conditions: any[] = [];
    if (type) conditions.push(eq(transactions.type, String(type)));
    if (startDate) conditions.push(gte(transactions.createdAt, new Date(String(startDate))));
    if (endDate) conditions.push(lte(transactions.createdAt, new Date(String(endDate))));

    const query = db.select().from(transactions);
    const rows = await (conditions.length > 0
      ? query.where(and(...conditions))
      : query
    ).orderBy(desc(transactions.createdAt)).limit(limit).offset(offset);

    const [{ total }] = await db.select({ total: sql<number>`count(*)` }).from(transactions);

    // Summary
    const [summary] = await db.select({
      totalIncome: sql<number>`coalesce(sum(case when type = 'income' then amount else 0 end), 0)`,
      totalExpense: sql<number>`coalesce(sum(case when type = 'expense' then amount else 0 end), 0)`,
    }).from(transactions);

    res.json({ transactions: rows, total: Number(total), summary });
  } catch {
    res.status(500).json({ error: "লেনদেন লোড হয়নি" });
  }
});

// POST /api/accounting/transactions
router.post("/transactions", authenticateAdmin, async (req: Request, res: Response) => {
  const { type, amount, description, reference, category } = req.body;
  if (!type || !amount) return res.status(400).json({ error: "ধরন ও পরিমাণ দিন" });
  try {
    const [tx] = await db.insert(transactions).values({
      type,
      amount: Number(amount),
      description: description ?? null,
      reference: reference ?? null,
      category: category ?? null,
    }).returning();
    res.status(201).json({ transaction: tx });
  } catch {
    res.status(500).json({ error: "লেনদেন তৈরি ব্যর্থ" });
  }
});

// DELETE /api/accounting/transactions/:id
router.delete("/transactions/:id", authenticateAdmin, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await db.delete(transactions).where(eq(transactions.id, id));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "মুছে ফেলা ব্যর্থ" });
  }
});

// ─── EXPENSES ─────────────────────────────────────────────────────────────────

// GET /api/accounting/expenses
router.get("/expenses", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const offset = (page - 1) * limit;

    const rows = await db
      .select()
      .from(expenses)
      .orderBy(desc(expenses.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db.select({ total: sql<number>`count(*)` }).from(expenses);
    const [{ totalAmount }] = await db.select({
      totalAmount: sql<number>`coalesce(sum(amount), 0)`,
    }).from(expenses);

    res.json({ expenses: rows, total: Number(total), totalAmount: Number(totalAmount) });
  } catch {
    res.status(500).json({ error: "খরচ লোড হয়নি" });
  }
});

// POST /api/accounting/expenses
router.post("/expenses", authenticateAdmin, async (req: Request, res: Response) => {
  const { title, amount, category, description, date } = req.body;
  if (!title || !amount) return res.status(400).json({ error: "শিরোনাম ও পরিমাণ দিন" });
  try {
    const [expense] = await db.insert(expenses).values({
      title,
      amount: Number(amount),
      category: category ?? null,
      description: description ?? null,
      date: date ? new Date(date) : new Date(),
    }).returning();
    res.status(201).json({ expense });
  } catch {
    res.status(500).json({ error: "খরচ তৈরি ব্যর্থ" });
  }
});

// DELETE /api/accounting/expenses/:id
router.delete("/expenses/:id", authenticateAdmin, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await db.delete(expenses).where(eq(expenses.id, id));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "মুছে ফেলা ব্যর্থ" });
  }
});

export default router;