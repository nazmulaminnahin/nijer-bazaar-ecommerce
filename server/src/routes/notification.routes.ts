import { Router, Request, Response } from "express";
import { db } from "../config/db";
import { notifications, notificationTemplates } from "../db/schema";
import { eq, desc, sql, isNull } from "drizzle-orm";
import { authenticateAdmin } from "../middleware/auth.middleware";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// GET /api/notifications/my — customer's notifications
router.get("/my", authenticate, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  try {
    const notifs = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(30);
    res.json({ notifications: notifs });
  } catch {
    res.status(500).json({ error: "নোটিফিকেশন লোড হয়নি" });
  }
});

// GET /api/notifications — admin: all notifications
router.get("/", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const offset = (page - 1) * limit;

    const notifs = await db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(notifications);

    res.json({ notifications: notifs, total: Number(total) });
  } catch {
    res.status(500).json({ error: "নোটিফিকেশন লোড হয়নি" });
  }
});

// POST /api/notifications/broadcast — admin: broadcast to all users
router.post("/broadcast", authenticateAdmin, async (req: Request, res: Response) => {
  const { type, title, message } = req.body;
  if (!title || !message) return res.status(400).json({ error: "শিরোনাম ও বার্তা দিন" });
  try {
    // Insert a global notification (no userId = broadcast)
    const [notif] = await db.insert(notifications).values({
      userId: null,
      type: type ?? "system",
      title,
      message,
      isRead: false,
    }).returning();
    res.status(201).json({ notification: notif });
  } catch {
    res.status(500).json({ error: "ব্রডকাস্ট ব্যর্থ" });
  }
});

// GET /api/notifications/templates — admin: list templates
router.get("/templates", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const templates = await db.select().from(notificationTemplates).orderBy(notificationTemplates.name);
    res.json({ templates });
  } catch {
    res.status(500).json({ error: "টেমপ্লেট লোড হয়নি" });
  }
});

// POST /api/notifications/templates — admin: create template
router.post("/templates", authenticateAdmin, async (req: Request, res: Response) => {
  const { name, type, channel, subject, body } = req.body;
  if (!name || !body) return res.status(400).json({ error: "নাম ও বডি দিন" });
  try {
    const [template] = await db.insert(notificationTemplates).values({
      name, type: type ?? "system", channel: channel ?? "email",
      subject: subject ?? null, body, isActive: true,
    }).returning();
    res.status(201).json({ template });
  } catch {
    res.status(500).json({ error: "টেমপ্লেট তৈরি ব্যর্থ" });
  }
});

// PUT /api/notifications/templates/:id — admin: update template
router.put("/templates/:id", authenticateAdmin, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name, type, channel, subject, body, isActive } = req.body;
  try {
    const [updated] = await db.update(notificationTemplates)
      .set({ name, type, channel, subject, body, isActive })
      .where(eq(notificationTemplates.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: "টেমপ্লেট পাওয়া যায়নি" });
    res.json({ template: updated });
  } catch {
    res.status(500).json({ error: "আপডেট ব্যর্থ" });
  }
});

// DELETE /api/notifications/templates/:id
router.delete("/templates/:id", authenticateAdmin, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await db.delete(notificationTemplates).where(eq(notificationTemplates.id, id));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "মুছে ফেলা ব্যর্থ" });
  }
});

export default router;