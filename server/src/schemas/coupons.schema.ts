import { pgTable, serial, varchar, boolean, integer, numeric, timestamp } from 'drizzle-orm/pg-core';

export const coupons = pgTable('coupons', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  type: varchar('type', { length: 20 }).notNull(),
  // flat | percentage | free_shipping
  value: numeric('value', { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: numeric('min_order_amount', { precision: 10, scale: 2 }),
  maxDiscountAmount: numeric('max_discount_amount', { precision: 10, scale: 2 }),
  maxUses: integer('max_uses'),
  usedCount: integer('used_count').notNull().default(0),
  expiryDate: timestamp('expiry_date').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  description: varchar('description', { length: 500 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Coupon = typeof coupons.$inferSelect;
export type NewCoupon = typeof coupons.$inferInsert;