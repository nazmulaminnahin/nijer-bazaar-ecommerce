import { pgTable, serial, integer, varchar, text, numeric, timestamp, json } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { products } from './products.schema';
import { couriers } from './couriers.schema';
import { coupons } from './coupons.schema';

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: varchar('order_number', { length: 50 }).notNull().unique(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  // Shipping address stored as JSON snapshot
  shippingAddress: json('shipping_address').$type<{
    name: string;
    phone: string;
    address: string;
    city: string;
    district: string;
    postalCode?: string;
  }>().notNull(),
  status: varchar('status', { length: 30 }).notNull().default('pending'),
  // pending|confirmed|processing|shipped|delivered|cancelled|returned
  paymentMethod: varchar('payment_method', { length: 20 }).notNull(),
  // bkash|nagad|cod|card
  paymentStatus: varchar('payment_status', { length: 20 }).notNull().default('pending'),
  // pending|paid|failed|refunded
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  shippingCost: numeric('shipping_cost', { precision: 10, scale: 2 }).notNull().default('0'),
  discount: numeric('discount', { precision: 10, scale: 2 }).notNull().default('0'),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  couponId: integer('coupon_id').references(() => coupons.id, { onDelete: 'set null' }),
  courierId: integer('courier_id').references(() => couriers.id, { onDelete: 'set null' }),
  trackingNumber: varchar('tracking_number', { length: 255 }),
  estimatedDelivery: timestamp('estimated_delivery'),
  deliveredAt: timestamp('delivered_at'),
  notes: text('notes'),
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: integer('product_id').references(() => products.id, { onDelete: 'set null' }),
  productName: varchar('product_name', { length: 500 }).notNull(),
  // Snapshot of product name at time of order
  productImage: text('product_image'),
  quantity: integer('quantity').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  variant: varchar('variant', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const orderStatusHistory = pgTable('order_status_history', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 30 }).notNull(),
  note: text('note'),
  changedBy: integer('changed_by'),
  // admin id who changed status
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;