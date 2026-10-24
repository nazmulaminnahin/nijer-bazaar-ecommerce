import { Router, Request, Response } from "express";
import { db } from "../config/db";
import { loyaltyTransactions, users } from "../db/schema";
import { eq, desc, sum, sql } from "drizzle-orm";
import { authenticateAdmin } from "../middleware/auth.middleware";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// GET /api/loyalty/my — customer's own loyalty history
router.get("/my", authenticate, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  try {
    const history = await db
      .select()
      .from(loyaltyTransactions)
      .where(eq(loyaltyTransactions.userId, userId))
      .orderBy(desc(loyaltyTransactions.createdAt))
      .limit(50);
    res.json({ history });
  } catch {
    res.status(500).json({ error: "লয়্যালটি ইতিহাস লোড হয়নি" });
  }
});

// GET /api/loyalty — admin: all transactions
router.get("/", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const offset = (page - 1) * limit;

    const transactions = await db
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
      .offset(offset);

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(loyaltyTransactions);

    res.json({ transactions, total: Number(total) });
  } catch {
    res.status(500).json({ error: "লয়্যালটি ডেটা লোড হয়নি" });
  }
});

// POST /api/loyalty/grant — admin: grant points to user
router.post("/grant", authenticateAdmin, async (req: Request, res: Response) => {
  const { userId, points, description } = req.body;
  if (!userId || !points) return res.status(400).json({ error: "ইউজার ও পয়েন্ট দিন" });
  try {
    await db.insert(loyaltyTransactions).values({
      userId: Number(userId),
      type: "bonus",
      points: Number(points),
      description: description ?? "অ্যাডমিন কর্তৃক বোনাস পয়েন্ট",
    });
    // Update user loyalty points
    await db
      .update(users)
      .set({ loyaltyPoints: sql`${users.loyaltyPoints} + ${Number(points)}` })
      .where(eq(users.id, Number(userId)));

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "পয়েন্ট দেওয়া ব্যর্থ" });
  }
});

export default router;