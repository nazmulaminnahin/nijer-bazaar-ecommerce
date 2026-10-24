import { pgTable, serial, integer, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { products } from './products.schema';

export const wishlist = pgTable('wishlist', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type WishlistItem = typeof wishlist.$inferSelect;