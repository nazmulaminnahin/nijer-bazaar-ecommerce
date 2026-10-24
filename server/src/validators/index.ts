import { z } from 'zod';

// ---------- Shared ----------
export const bdPhone = z
  .string()
  .trim()
  .regex(/^(\+?880|0)1[3-9]\d{8}$/, 'Invalid Bangladeshi phone number (e.g. 01712345678)');

const emailField = z.string().trim().toLowerCase().email('Invalid email address');
const positiveInt = z.coerce.number().int().positive();

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'] as const;
export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'] as const;
export const PAYMENT_METHODS = ['cod', 'bkash', 'nagad', 'card'] as const;

// ---------- Auth ----------
export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    email: emailField,
    phone: bdPhone,
    password: z.string().min(6, 'Password must be at least 6 characters').max(100),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

export const loginSchema = z.object({
  email: z.string().trim().min(3, 'Enter email or phone'),
  password: z.string().min(1, 'Password is required'),
});

export const verifyOtpSchema = z.object({ phone: bdPhone, otp: z.string().trim().length(6, 'OTP must be 6 digits') });
export const resendOtpSchema = z.object({ phone: bdPhone });
export const forgotPasswordSchema = z.object({ email: emailField });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10),
    password: z.string().min(6).max(100),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

export const adminLoginSchema = z.object({ email: emailField, password: z.string().min(1) });

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: bdPhone.optional(),
  avatar: z.string().max(255).optional().nullable(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(6).max(100),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

export const addressSchema = z.object({
  label: z.string().trim().max(50).optional(),
  name: z.string().trim().min(2).max(100),
  phone: bdPhone,
  address: z.string().trim().min(5, 'Address is too short'),
  city: z.string().trim().min(2).max(100),
  district: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().max(10).optional().nullable(),
  isDefault: z.boolean().optional(),
});

// ---------- Categories ----------
export const categorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  nameBn: z.string().trim().max(100).optional().nullable(),
  description: z.string().optional().nullable(),
  image: z.string().max(255).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  parentId: z.coerce.number().int().positive().optional().nullable(),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});
export const updateCategorySchema = categorySchema.partial();

// ---------- Products ----------
export const productQuerySchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  category: z.string().trim().optional(), // slug or id
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  brand: z.string().trim().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  featured: z.enum(['true', 'false']).optional(),
  newArrival: z.enum(['true', 'false']).optional(),
  flashSale: z.enum(['true', 'false']).optional(),
  inStock: z.enum(['true', 'false']).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'best_selling', 'rating', 'name']).default('newest'),
});

export const adminProductQuerySchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  categoryId: z.coerce.number().int().optional(),
  status: z.enum(['all', 'active', 'inactive']).default('all'),
  stock: z.enum(['all', 'low', 'out']).default('all'),
  sort: z.enum(['newest', 'oldest', 'price_asc', 'price_desc', 'stock_asc', 'stock_desc', 'best_selling']).default('newest'),
});

export const variantSchema = z.object({
  name: z.string().trim().min(1).max(50),
  value: z.string().trim().min(1).max(50),
  sku: z.string().trim().max(60).optional().nullable(),
  priceAdjustment: z.coerce.number().int().default(0),
  stock: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

const productBaseSchema = z.object({
  name: z.string().trim().min(2).max(200),
  nameBn: z.string().trim().max(200).optional().nullable(),
  sku: z.string().trim().max(50).optional(),
  description: z.string().optional().nullable(),
  shortDescription: z.string().max(500).optional().nullable(),
  categoryId: z.coerce.number().int().positive().optional().nullable(),
  brand: z.string().trim().max(100).optional().nullable(),
  price: z.coerce.number().int().min(0),
  salePrice: z.coerce.number().int().min(0).optional().nullable(),
  costPrice: z.coerce.number().int().min(0).default(0),
  stock: z.coerce.number().int().min(0).default(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
  weight: z.coerce.number().min(0).optional().nullable(),
  tags: z.array(z.string().trim()).default([]),
  specifications: z.record(z.string(), z.string()).default({}),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isFlashSale: z.boolean().default(false),
  flashSaleEndsAt: z.coerce.date().optional().nullable(),
  metaTitle: z.string().max(200).optional().nullable(),
  metaDescription: z.string().max(300).optional().nullable(),
  images: z.array(z.string().min(1)).default([]),
  variants: z.array(variantSchema).default([]),
});

export const createProductSchema = productBaseSchema.refine(
  (d) => d.salePrice == null || d.salePrice < d.price,
  { message: 'Sale price must be less than regular price', path: ['salePrice'] }
);
export const updateProductSchema = productBaseSchema.partial();

// ---------- Cart / Wishlist / Reviews ----------
export const addToCartSchema = z.object({
  productId: positiveInt,
  variantId: positiveInt.optional().nullable(),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
});
export const updateCartSchema = z.object({ quantity: z.coerce.number().int().min(1).max(99) });
export const wishlistSchema = z.object({ productId: positiveInt });

export const reviewSchema = z.object({
  productId: positiveInt,
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(150).optional().nullable(),
  comment: z.string().trim().max(2000).optional().nullable(),
});

// ---------- Orders ----------
export const shippingAddressSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: bdPhone,
  address: z.string().trim().min(5),
  city: z.string().trim().min(2).max(100),
  district: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().max(10).optional().nullable(),
});

export const createOrderSchema = z.object({
  items: z
    .array(z.object({ productId: positiveInt, variantId: positiveInt.optional().nullable(), quantity: z.coerce.number().int().min(1).max(99) }))
    .min(1, 'Cart is empty'),
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.enum(PAYMENT_METHODS).default('cod'),
  transactionId: z.string().trim().max(100).optional().nullable(),
  couponCode: z.string().trim().toUpperCase().optional().nullable(),
  customerEmail: emailField.optional().nullable(),
  customerNote: z.string().trim().max(1000).optional().nullable(),
  saveAddress: z.boolean().optional(),
});

export const trackOrderSchema = z.object({
  orderNumber: z.string().trim().min(5, 'Order number is required'),
  phone: z.string().trim().min(11, 'Phone number is required'),
});

export const cancelOrderSchema = z.object({ reason: z.string().trim().max(500).optional() });

export const adminOrderQuerySchema = paginationSchema.extend({
  status: z.enum(ORDER_STATUSES).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  courierId: z.coerce.number().int().optional(),
  source: z.string().trim().optional(),
  search: z.string().trim().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(500).optional(),
});

export const bulkOrderStatusSchema = z.object({
  ids: z.array(positiveInt).min(1),
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(500).optional(),
});

export const assignCourierSchema = z.object({
  courierId: positiveInt,
  trackingNumber: z.string().trim().max(100).optional().nullable(),
  consignmentId: z.string().trim().max(100).optional().nullable(),
  weight: z.coerce.number().int().min(0).optional().nullable(),
  markAsShipped: z.boolean().default(false),
});

export const updatePaymentSchema = z.object({
  paymentStatus: z.enum(PAYMENT_STATUSES),
  transactionId: z.string().trim().max(100).optional().nullable(),
});

export const adminNoteSchema = z.object({ adminNote: z.string().trim().max(1000) });

// ---------- Misc ----------
export const validateCouponSchema = z.object({ code: z.string().trim().min(1), subtotal: z.coerce.number().int().min(0) });

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: emailField,
  phone: z.string().trim().max(20).optional().nullable(),
  subject: z.string().trim().min(2).max(200),
  message: z.string().trim().min(5).max(3000),
});

export const newsletterSchema = z.object({ email: emailField });

// ---------- Inferred types ----------
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type AssignCourierInput = z.infer<typeof assignCourierSchema>;