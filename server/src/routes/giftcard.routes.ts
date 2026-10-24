import { Router, Request, Response } from "express";
import { db } from "../config/db";
import { giftCards } from "../db/schema";
import { eq, desc, sql, ilike } from "drizzle-orm";
import { authenticateAdmin } from "../middleware/auth.middleware";

const router = Router();

function generateGiftCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const segments = Array.from({ length: 4 }, () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  );
  return segments.join("-");
}

// GET /api/gift-cards — admin list
router.get("/", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const offset = (page - 1) * limit;

    const cards = await db
      .select()
      .from(giftCards)
      .orderBy(desc(giftCards.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(giftCards);

    res.json({ cards, total: Number(total) });
  } catch {
    res.status(500).json({ error: "গিফট কার্ড লোড হয়নি" });
  }
});

// POST /api/gift-cards — admin create
router.post("/", authenticateAdmin, async (req: Request, res: Response) => {
  const { initialBalance, expiresAt, quantity = 1 } = req.body;
  if (!initialBalance || Number(initialBalance) <= 0) {
    return res.status(400).json({ error: "বৈধ ব্যালেন্স দিন" });
  }
  try {
    const created = [];
    for (let i = 0; i < Math.min(Number(quantity), 50); i++) {
      const code = generateGiftCode();
      const [card] = await db.insert(giftCards).values({
        code,
        initialBalance: Number(initialBalance),
        currentBalance: Number(initialBalance),
        isActive: true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      }).returning();
      created.push(card);
    }
    res.status(201).json({ cards: created, count: created.length });
  } catch {
    res.status(500).json({ error: "গিফট কার্ড তৈরি ব্যর্থ" });
  }
});

// PATCH /api/gift-cards/:id/toggle — admin toggle active
router.patch("/:id/toggle", authenticateAdmin, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const [card] = await db.select().from(giftCards).where(eq(giftCards.id, id));
    if (!card) return res.status(404).json({ error: "গিফট কার্ড পাওয়া যায়নি" });
    const [updated] = await db
      .update(giftCards)
      .set({ isActive: !card.isActive })
      .where(eq(giftCards.id, id))
      .returning();
    res.json({ card: updated });
  } catch {
    res.status(500).json({ error: "আপডেট ব্যর্থ" });
  }
});

// DELETE /api/gift-cards/:id — admin delete
router.delete("/:id", authenticateAdmin, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await db.delete(giftCards).where(eq(giftCards.id, id));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "মুছে ফেলা ব্যর্থ" });
  }
});

// POST /api/gift-cards/validate — public: check gift card
router.post("/validate", async (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "কোড দিন" });
  try {
    const [card] = await db.select().from(giftCards).where(eq(giftCards.code, code.toUpperCase()));
    if (!card) return res.status(404).json({ error: "গিফট কার্ড পাওয়া যায়নি" });
    if (!card.isActive) return res.status(400).json({ error: "গিফট কার্ড নিষ্ক্রিয়" });
    if (card.expiresAt && new Date(card.expiresAt) < new Date()) {
      return res.status(400).json({ error: "গিফট কার্ডের মেয়াদ শেষ" });
    }
    if (card.currentBalance <= 0) {
      return res.status(400).json({ error: "গিফট কার্ডের ব্যালেন্স শেষ" });
    }
    res.json({ valid: true, balance: card.currentBalance });
  } catch {
    res.status(500).json({ error: "ভ্যালিডেশন ব্যর্থ" });
  }
});

export default router;