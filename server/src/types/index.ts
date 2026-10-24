export type AdminRole = 'super_admin' | 'manager' | 'sales_staff' | 'warehouse_staff' | 'support';

export type OrderStatus =
  | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';

export type PaymentMethod = 'bkash' | 'nagad' | 'cod' | 'card';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface AuthUser { id: number; email: string; name: string }
export interface AuthAdmin { id: number; email: string; name: string; role: AdminRole }