import {
  pgTable, serial, integer,
  text, varchar, timestamp
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const crmNotes = pgTable('crm_notes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  adminId: integer('admin_id'),
  // ✅ No .references() — avoids circular dependency
  note: text('note').notNull(),
  type: varchar('type', { length: 50 }).notNull().default('general'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const customerSegments = pgTable('customer_segments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  segment: varchar('segment', { length: 50 }).notNull().default('new'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type CrmNote = typeof crmNotes.$inferSelect;