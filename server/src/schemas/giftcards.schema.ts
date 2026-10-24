import { pgTable, serial, varchar, numeric, boolean, integer, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const giftCards = pgTable('gift_cards', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  initialAmount: numeric('initial_amount', { precision: 10, scale: 2 }).notNull(),
  remainingAmount: numeric('remaining_amount', { precision: 10, scale: 2 }).notNull(),
  purchasedBy: integer('purchased_by').references(() => users.id, { onDelete: 'set null' }),
  usedBy: integer('used_by').references(() => users.id, { onDelete: 'set null' }),
  expiryDate: timestamp('expiry_date'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type GiftCard = typeof giftCards.$inferSelect;