import {
  pgTable, serial, varchar,
  text, numeric, integer, timestamp
} from 'drizzle-orm/pg-core';
import { orders } from './orders.schema';

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  type: varchar('type', { length: 20 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  description: text('description'),
  orderId: integer('order_id')
    .references(() => orders.id, { onDelete: 'set null' }),
  adminId: integer('admin_id'),
  // ✅ No .references() — avoids circular dependency
  transactionDate: timestamp('transaction_date').notNull().defaultNow(),
  reference: varchar('reference', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  description: text('description'),
  date: timestamp('date').notNull(),
  adminId: integer('admin_id'),
  // ✅ No .references() — avoids circular dependency
  receipt: text('receipt'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type Transaction = typeof transactions.$inferSelect;
export type Expense = typeof expenses.$inferSelect;