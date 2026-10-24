import { Router, Request, Response } from "express";
import { db } from "../config/db";
import { couriers } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import { authenticateAdmin } from "../middleware/auth";

const router = Router();

// GET /api/couriers — public (used in checkout + order tracking)
router.get("/", async (_req: Request, res: Response) => {
  try {
    const all = await db.select().from(couriers).orderBy(couriers.name);
    res.json({ couriers: all });
  } catch {
    res.status(500).json({ error: "কুরিয়ার লোড হয়নি" });
  }
});

// POST /api/couriers — admin create
router.post("/", authenticateAdmin, async (req: Request, res: Response) => {
  const { name, slug, logo, trackingUrl, isActive } = req.body;
  if (!name || !slug) return res.status(400).json({ error: "নাম ও স্লাগ দিন" });
  try {
    const [created] = await db.insert(couriers).values({
      name, slug, logo: logo ?? null,
      trackingUrl: trackingUrl ?? null,
      isActive: isActive ?? true,
    }).returning();
    res.status(201).json({ courier: created });
  } catch (err: any) {
    if (err?.code === "23505") return res.status(409).json({ error: "এই স্লাগ ইতোমধ্যে আছে" });
    res.status(500).json({ error: "কুরিয়ার তৈরি ব্যর্থ" });
  }
});

// PUT /api/couriers/:id — admin update
router.put("/:id", authenticateAdmin, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name, slug, logo, trackingUrl, isActive } = req.body;
  try {
    const [updated] = await db.update(couriers).set({
      name, slug, logo: logo ?? null,
      trackingUrl: trackingUrl ?? null,
      isActive,
    }).where(eq(couriers.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "কুরিয়ার পাওয়া যায়নি" });
    res.json({ courier: updated });
  } catch {
    res.status(500).json({ error: "আপডেট ব্যর্থ" });
  }
});

// DELETE /api/couriers/:id — admin delete
router.delete("/:id", authenticateAdmin, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await db.delete(couriers).where(eq(couriers.id, id));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "মুছে ফেলা ব্যর্থ" });
  }
});

export default router;