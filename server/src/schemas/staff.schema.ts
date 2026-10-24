import {
  pgTable, serial, integer,
  varchar, text, timestamp
} from 'drizzle-orm/pg-core';

export const staffLogs = pgTable('staff_logs', {
  id: serial('id').primaryKey(),
  adminId: integer('admin_id').notNull(),
  // ✅ No .references() — avoids circular dependency
  action: varchar('action', { length: 255 }).notNull(),
  module: varchar('module', { length: 100 }).notNull(),
  targetId: integer('target_id'),
  details: text('details'),
  ipAddress: varchar('ip_address', { length: 50 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type StaffLog = typeof staffLogs.$inferSelect;