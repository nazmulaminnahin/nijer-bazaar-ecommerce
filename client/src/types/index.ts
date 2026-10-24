export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
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
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}