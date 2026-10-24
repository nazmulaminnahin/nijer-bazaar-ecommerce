import {
  pgTable, serial, varchar,
  text, boolean, integer, timestamp
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  data: text('data'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const notificationTemplates = pgTable('notification_templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  type: varchar('type', { length: 20 }).notNull(),
  subject: varchar('subject', { length: 255 }),
  body: text('body').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Notification = typeof notifications.$inferSelect;
export type NotificationTemplate = typeof notificationTemplates.$inferSelect;