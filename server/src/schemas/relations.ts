import { relations } from 'drizzle-orm';
import { users, addresses } from './users.schema';
import { admins, staffLogs } from './admins.schema';
import { categories } from './categories.schema';
import { products, productImages, productVariants, reviews } from './products.schema';
import { warehouses, inventory, inventoryLogs } from './inventory.schema';
import { cart, wishlist } from './cart.schema';
import { couriers } from './couriers.schema';
import { orders, orderItems, shipments } from './orders.schema';
import { coupons, couponUsages, loyaltyTransactions } from './coupons.schema';
import { transactions, expenseCategories, invoices } from './accounting.schema';
import { notifications } from './notifications.schema';
import { crmNotes } from './crm.schema';

export const usersRelations = relations(users, ({ many }) => ({
  addresses: many(addresses),
  orders: many(orders),
  reviews: many(reviews),
  cartItems: many(cart),
  wishlistItems: many(wishlist),
  crmNotes: many(crmNotes),
  loyaltyTransactions: many(loyaltyTransactions),
  notifications: many(notifications),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, { fields: [addresses.userId], references: [users.id] }),
}));

export const adminsRelations = relations(admins, ({ many }) => ({
  logs: many(staffLogs),
}));

export const staffLogsRelations = relations(staffLogs, ({ one }) => ({
  admin: one(admins, { fields: [staffLogs.adminId], references: [admins.id] }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, { fields: [categories.parentId], references: [categories.id], relationName: 'subcategories' }),
  subcategories: many(categories, { relationName: 'subcategories' }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  images: many(productImages),
  variants: many(productVariants),
  reviews: many(reviews),
  inventory: many(inventory),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, { fields: [reviews.productId], references: [products.id] }),
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
}));

export const warehousesRelations = relations(warehouses, ({ many }) => ({
  inventory: many(inventory),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  product: one(products, { fields: [inventory.productId], references: [products.id] }),
  variant: one(productVariants, { fields: [inventory.variantId], references: [productVariants.id] }),
  warehouse: one(warehouses, { fields: [inventory.warehouseId], references: [warehouses.id] }),
}));

export const inventoryLogsRelations = relations(inventoryLogs, ({ one }) => ({
  product: one(products, { fields: [inventoryLogs.productId], references: [products.id] }),
  admin: one(admins, { fields: [inventoryLogs.adminId], references: [admins.id] }),
}));

export const cartRelations = relations(cart, ({ one }) => ({
  user: one(users, { fields: [cart.userId], references: [users.id] }),
  product: one(products, { fields: [cart.productId], references: [products.id] }),
  variant: one(productVariants, { fields: [cart.variantId], references: [productVariants.id] }),
}));

export const wishlistRelations = relations(wishlist, ({ one }) => ({
  user: one(users, { fields: [wishlist.userId], references: [users.id] }),
  product: one(products, { fields: [wishlist.productId], references: [products.id] }),
}));

export const couriersRelations = relations(couriers, ({ many }) => ({
  orders: many(orders),
  shipments: many(shipments),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  courier: one(couriers, { fields: [orders.courierId], references: [couriers.id] }),
  warehouse: one(warehouses, { fields: [orders.warehouseId], references: [warehouses.id] }),
  assignedStaff: one(admins, { fields: [orders.assignedStaffId], references: [admins.id] }),
  items: many(orderItems),
  shipments: many(shipments),
  invoices: many(invoices),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export const shipmentsRelations = relations(shipments, ({ one }) => ({
  order: one(orders, { fields: [shipments.orderId], references: [orders.id] }),
  courier: one(couriers, { fields: [shipments.courierId], references: [couriers.id] }),
}));

export const couponsRelations = relations(coupons, ({ many }) => ({
  usages: many(couponUsages),
}));

export const couponUsagesRelations = relations(couponUsages, ({ one }) => ({
  coupon: one(coupons, { fields: [couponUsages.couponId], references: [coupons.id] }),
  user: one(users, { fields: [couponUsages.userId], references: [users.id] }),
}));

export const loyaltyTransactionsRelations = relations(loyaltyTransactions, ({ one }) => ({
  user: one(users, { fields: [loyaltyTransactions.userId], references: [users.id] }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  category: one(expenseCategories, { fields: [transactions.categoryId], references: [expenseCategories.id] }),
  order: one(orders, { fields: [transactions.orderId], references: [orders.id] }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  order: one(orders, { fields: [invoices.orderId], references: [orders.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const crmNotesRelations = relations(crmNotes, ({ one }) => ({
  user: one(users, { fields: [crmNotes.userId], references: [users.id] }),
  admin: one(admins, { fields: [crmNotes.adminId], references: [admins.id] }),
}));