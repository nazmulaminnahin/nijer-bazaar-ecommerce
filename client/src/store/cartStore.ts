import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types";

interface CartItem {
  productId: number;
  product: Product;
  quantity: number;
  price: number;
}

interface CartState {
  items: CartItem[];
  coupon: { code: string; discount: number } | null;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;
  getTotal: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      addItem: (product, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.productId === product.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === product.id
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          return {
            items: [
              ...state.items,
              { productId: product.id, product, quantity, price: product.price },
            ],
          };
        });
      },
      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.productId !== productId)
              : state.items.map((i) =>
                  i.productId === productId ? { ...i, quantity } : i
                ),
        })),
      clearCart: () => set({ items: [], coupon: null }),
      applyCoupon: (code, discount) => set({ coupon: { code, discount } }),
      removeCoupon: () => set({ coupon: null }),
      getSubtotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().coupon?.discount ?? 0;
        return Math.max(0, subtotal - discount);
      },
    }),
    { name: "nijer_bazaar_cart" }
  )
);