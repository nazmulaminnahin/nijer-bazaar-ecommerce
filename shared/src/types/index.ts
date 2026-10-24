export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface Admin {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  parentId?: number | null;
  isActive: boolean;
  createdAt: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  price: number;
  comparePrice?: number | null;
  costPrice?: number | null;
  sku: string;
  stock: number;
  lowStockThreshold?: number | null;
  categoryId?: number | null;
  images?: string[];
  isFeatured: boolean;
  isActive: boolean;
  weight?: number | null;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  category?: Category;
}

export interface CartItem {
  id: number;
  productId: number;
  product: Product;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId?: number | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  notes?: string | null;
  courierId?: number | null;
  trackingNumber?: string | null;
  shippingAddress: {
    address: string;
    city: string;
    district: string;
    postalCode?: string;
  };
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  productSku: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Coupon {
  id: number;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minOrderAmount?: number | null;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt?: string | null;
  createdAt: string;
}

export interface Courier {
  id: number;
  name: string;
  slug: string;
  logo?: string | null;
  trackingUrl?: string | null;
  baseCharge: number;
  perKgCharge: number;
  isActive: boolean;
  createdAt: string;
}

export interface Notification {
  id: number;
  userId?: number | null;
  title: string;
  message: string;
  type: string;
  channel: string;
  isRead: boolean;
  createdAt: string;
}

export interface LoyaltyTransaction {
  id: number;
  userId: number;
  points: number;
  type: string;
  description?: string | null;
  orderId?: number | null;
  createdAt: string;
  user?: { name: string; email: string };
}

export interface GiftCard {
  id: number;
  code: string;
  initialBalance: number;
  currentBalance: number;
  isActive: boolean;
  expiresAt?: string | null;
  createdAt: string;
}

export interface StaffMember {
  id: number;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
}

export interface Transaction {
  id: number;
  type: string;
  amount: number;
  description?: string | null;
  reference?: string | null;
  date: string;
  createdAt: string;
}

export interface Expense {
  id: number;
  category: string;
  amount: number;
  description?: string | null;
  date: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}