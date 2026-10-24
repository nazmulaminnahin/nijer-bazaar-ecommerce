import { Router, Request, Response } from "express";
import { db } from "../config/db";
import { products, inventoryLog } from "../db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { authenticateAdmin } from "../middleware/auth.middleware";

const router = Router();

// GET /api/admin/inventory — list all products with stock
router.get("/", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        stock: products.stock,
        lowStockThreshold: products.lowStockThreshold,
        price: products.price,
        isActive: products.isActive,
      })
      .from(products)
      .orderBy(products.stock);

    res.json({ inventory: rows, total: rows.length });
  } catch (err) {
    res.status(500).json({ error: "ইনভেন্টরি লোড হয়নি" });
  }
});

// POST /api/admin/inventory/adjust — adjust stock
router.post("/adjust", authenticateAdmin, async (req: Request, res: Response) => {
  const { productId, type, quantity, note } = req.body;

  if (!productId || !type || !quantity) {
    return res.status(400).json({ error: "সব তথ্য দিন" });
  }

  try {
    const qty = Number(quantity);
    const delta = type === "in" || type === "adjustment" ? qty : -qty;

    // Update product stock
    await db
      .update(products)
      .set({ stock: sql`${products.stock} + ${delta}` })
      .where(eq(products.id, productId));

    // Log the change
    await db.insert(inventoryLog).values({
      productId,
      type,
      quantity: qty,
      note: note ?? null,
    });

    const [updated] = await db
      .select({ stock: products.stock })
      .from(products)
      .where(eq(products.id, productId));

    res.json({ success: true, newStock: updated?.stock ?? 0 });
  } catch (err) {
    res.status(500).json({ error: "স্টক আপডেট ব্যর্থ" });
  }
});

// GET /api/admin/inventory/log — inventory log
router.get("/log", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const log = await db
      .select()
      .from(inventoryLog)
      .orderBy(desc(inventoryLog.createdAt))
      .limit(100);

    res.json({ log });
  } catch (err) {
    res.status(500).json({ error: "লগ লোড হয়নি" });
  }
});

export default router;