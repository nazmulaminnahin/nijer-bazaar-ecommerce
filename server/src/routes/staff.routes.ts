import { Router, Request, Response } from "express";
import { db } from "../config/db";
import { admins, adminPermissions, staffLogs } from "../db/schema";
import { eq, desc, sql, ne } from "drizzle-orm";
import { authenticateAdmin } from "../middleware/auth.middleware";
import bcrypt from "bcryptjs";

const router = Router();

// GET /api/admin/staff — list all staff (exclude current user)
router.get("/", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const currentAdminId = (req as any).admin?.id;
    const staff = await db
      .select({
        id: admins.id,
        name: admins.name,
        email: admins.email,
        role: admins.role,
        isActive: admins.isActive,
        createdAt: admins.createdAt,
      })
      .from(admins)
      .orderBy(desc(admins.createdAt));

    res.json({ staff, total: staff.length });
  } catch {
    res.status(500).json({ error: "স্টাফ লোড হয়নি" });
  }
});

// POST /api/admin/staff — create staff
router.post("/", authenticateAdmin, async (req: Request, res: Response) => {
  const { name, email, password, role, permissions } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "সব তথ্য দিন" });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [staff] = await db.insert(admins).values({
      name, email, password: hashedPassword, role,
      isActive: true,
    }).returning({ id: admins.id, name: admins.name, email: admins.email, role: admins.role });

    // Insert permissions if provided
    if (permissions && Array.isArray(permissions) && permissions.length > 0) {
      const permRows = permissions.map((perm: string) => ({
        adminId: staff.id,
        permission: perm,
      }));
      await db.insert(adminPermissions).values(permRows);
    }

    res.status(201).json({ staff });
  } catch (err: any) {
    if (err?.code === "23505") return res.status(409).json({ error: "এই ইমেইল ইতোমধ্যে আছে" });
    res.status(500).json({ error: "স্টাফ তৈরি ব্যর্থ" });
  }
});

// PUT /api/admin/staff/:id — update staff
router.put("/:id", authenticateAdmin, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name, email, role, isActive, permissions, password } = req.body;
  try {
    const updateData: Record<string, any> = { name, email, role, isActive };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    const [updated] = await db.update(admins).set(updateData).where(eq(admins.id, id)).returning({
      id: admins.id, name: admins.name, email: admins.email, role: admins.role,
    });
    if (!updated) return res.status(404).json({ error: "স্টাফ পাওয়া যায়নি" });

    // Update permissions
    if (permissions && Array.isArray(permissions)) {
      await db.delete(adminPermissions).where(eq(adminPermissions.adminId, id));
      if (permissions.length > 0) {
        await db.insert(adminPermissions).values(permissions.map((p: string) => ({ adminId: id, permission: p })));
      }
    }

    res.json({ staff: updated });
  } catch {
    res.status(500).json({ error: "আপডেট ব্যর্থ" });
  }
});

// DELETE /api/admin/staff/:id — delete staff
router.delete("/:id", authenticateAdmin, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await db.delete(adminPermissions).where(eq(adminPermissions.adminId, id));
    await db.delete(admins).where(eq(admins.id, id));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "মুছে ফেলা ব্যর্থ" });
  }
});

// GET /api/admin/staff/logs — activity log
router.get("/logs", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const logs = await db
      .select()
      .from(staffLogs)
      .orderBy(desc(staffLogs.createdAt))
      .limit(100);
    res.json({ logs });
  } catch {
    res.status(500).json({ error: "লগ লোড হয়নি" });
  }
});

export default router;