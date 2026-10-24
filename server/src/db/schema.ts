import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

// ─── USERS ───────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  role: varchar("role", { length: 50 }).default("customer"),
  isActive: boolean("is_active").default(true),
  loyaltyPoints: integer("loyalty_points").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── ADMINS ──────────────────────────────────────────────
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).default("admin"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── ADMIN PERMISSIONS ───────────────────────────────────
export const adminPermissions = pgTable("admin_permissions", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id"),
  permission: varchar("permission", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── CATEGORIES ──────────────────────────────────────────
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  image: varchar("image", { length: 500 }),
  parentId: integer("parent_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── PRODUCTS ────────────────────────────────────────────
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  shortDescription: varchar("short_description", { length: 500 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  comparePrice: decimal("compare_price", { precision: 10, scale: 2 }),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
  sku: varchar("sku", { length: 100 }).notNull().unique(),
  stock: integer("stock").default(0),
  lowStockThreshold: integer("low_stock_threshold").default(5),
  categoryId: integer("category_id"),
  images: jsonb("images").$type<string[]>().default([]),
  isFeatured: boolean("is_featured").default(false),
  isActive: boolean("is_active").default(true),
  weight: decimal("weight", { precision: 8, scale: 2 }),
  tags: jsonb("tags").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── PRODUCT IMAGES ──────────────────────────────────────
export const productImages = pgTable("product_images", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── PRODUCT VARIANTS ────────────────────────────────────
export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  value: varchar("value", { length: 255 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }),
  stock: integer("stock").default(0),
  sku: varchar("sku", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── INVENTORY ───────────────────────────────────────────
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  warehouseId: integer("warehouse_id"),
  quantity: integer("quantity").default(0),
  reservedQuantity: integer("reserved_quantity").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── INVENTORY LOG ───────────────────────────────────────
export const inventoryLog = pgTable("inventory_log", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  quantity: integer("quantity").notNull(),
  previousStock: integer("previous_stock"),
  newStock: integer("new_stock"),
  note: text("note"),
  adminId: integer("admin_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── WAREHOUSES ──────────────────────────────────────────
export const warehouses = pgTable("warehouses", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── WAREHOUSE LOCATIONS ─────────────────────────────────
export const warehouseLocations = pgTable("warehouse_locations", {
  id: serial("id").primaryKey(),
  warehouseId: integer("warehouse_id").notNull(),
  aisle: varchar("aisle", { length: 50 }),
  shelf: varchar("shelf", { length: 50 }),
  bin: varchar("bin", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── FULFILLMENT TASKS ───────────────────────────────────
export const fulfillmentTasks = pgTable("fulfillment_tasks", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  warehouseId: integer("warehouse_id"),
  status: varchar("status", { length: 50 }).default("pending"),
  assignedTo: integer("assigned_to"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── ADDRESSES ───────────────────────────────────────────
export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  label: varchar("label", { length: 100 }),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  district: varchar("district", { length: 100 }).notNull(),
  postalCode: varchar("postal_code", { length: 20 }),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── CART ────────────────────────────────────────────────
export const cart = pgTable("cart", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── WISHLIST ────────────────────────────────────────────
export const wishlist = pgTable("wishlist", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  productId: integer("product_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── COURIERS ────────────────────────────────────────────
export const couriers = pgTable("couriers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  logo: varchar("logo", { length: 500 }),
  trackingUrl: varchar("tracking_url", { length: 500 }),
  baseCharge: decimal("base_charge", { precision: 10, scale: 2 }).default("0"),
  perKgCharge: decimal("per_kg_charge", { precision: 10, scale: 2 }).default("0"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── COUPONS ─────────────────────────────────────────────
export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 100 }).notNull().unique(),
  type: varchar("type", { length: 50 }).notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }),
  maxDiscount: decimal("max_discount", { precision: 10, scale: 2 }),
  usageLimit: integer("usage_limit"),
  usedCount: integer("used_count").default(0),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── ORDERS ──────────────────────────────────────────────
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 100 }).notNull().unique(),
  userId: integer("user_id"),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerEmail: varchar("customer_email", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending"),
  paymentStatus: varchar("payment_status", { length: 50 }).default("unpaid"),
  paymentMethod: varchar("payment_method", { length: 100 }).default("cod"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  couponId: integer("coupon_id"),
  courierId: integer("courier_id"),
  trackingNumber: varchar("tracking_number", { length: 255 }),
  shippingAddress: jsonb("shipping_address").$type<{
    address: string;
    city: string;
    district: string;
    postalCode?: string;
  }>(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── ORDER ITEMS ─────────────────────────────────────────
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  productSku: varchar("product_sku", { length: 100 }).notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── ORDER STATUS HISTORY ────────────────────────────────
export const orderStatusHistory = pgTable("order_status_history", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  note: text("note"),
  adminId: integer("admin_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── REVIEWS ─────────────────────────────────────────────
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  userId: integer("user_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  isApproved: boolean("is_approved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── TRANSACTIONS ─────────────────────────────────────────
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 50 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  reference: varchar("reference", { length: 255 }),
  date: timestamp("date").defaultNow(),
  adminId: integer("admin_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── EXPENSES ─────────────────────────────────────────────
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  category: varchar("category", { length: 100 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  date: timestamp("date").defaultNow(),
  adminId: integer("admin_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── NOTIFICATIONS ───────────────────────────────────────
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).default("info"),
  channel: varchar("channel", { length: 50 }).default("in_app"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── NOTIFICATION TEMPLATES ──────────────────────────────
export const notificationTemplates = pgTable("notification_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  channel: varchar("channel", { length: 50 }).notNull(),
  subject: varchar("subject", { length: 255 }),
  body: text("body").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── STAFF LOGS ──────────────────────────────────────────
export const staffLogs = pgTable("staff_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id"),
  action: varchar("action", { length: 255 }).notNull(),
  details: text("details"),
  ipAddress: varchar("ip_address", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── CRM NOTES ───────────────────────────────────────────
export const crmNotes = pgTable("crm_notes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  adminId: integer("admin_id"),
  note: text("note").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── CUSTOMER SEGMENTS ───────────────────────────────────
export const customerSegments = pgTable("customer_segments", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  rules: jsonb("rules"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── LOYALTY TRANSACTIONS ────────────────────────────────
export const loyaltyTransactions = pgTable("loyalty_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  points: integer("points").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  description: text("description"),
  orderId: integer("order_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── GIFT CARDS ──────────────────────────────────────────
export const giftCards = pgTable("gift_cards", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 100 }).notNull().unique(),
  initialBalance: decimal("initial_balance", { precision: 10, scale: 2 }).notNull(),
  currentBalance: decimal("current_balance", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"),
  usedByUserId: integer("used_by_user_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── SETTINGS ────────────────────────────────────────────
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow(),
});