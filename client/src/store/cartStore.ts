import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartProductImage {
  id?: number;
  imageUrl: string;
  isMain?: boolean;
}

export interface CartProduct {
  id: number;
  name: string;
  price: number | string;
  salePrice?: number | string | null;
  stock: number;
  slug?: string;
  sku?: string;
  mainImage?: string | null;
  images?: CartProductImage[];
  [key: string]: unknown;
}

export interface CartItem {
  id: number;
  productId: number;
  product: CartProduct;
  quantity: number;
  price: number;
  selectedVariant?: string;
}

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  appliedCoupon: string | null;
  discount: number;
  coupon: { code: string; discount: number } | null;
  addItem: (product: CartProduct, quantity?: number, selectedVariant?: string) => void;
  removeItem: (idOrProductId: number) => void;
  updateQuantity: (idOrProductId: number, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string, discountAmount: number) => void;
  removeCoupon: () => void;
  getTotal: () => number;
  getSubtotal: () => number;
}

function calcTotals(items: CartItem[]) {
  return {
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    totalPrice: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  };
}

function normalizeImages(product: CartProduct): CartProductImage[] {
  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images.map((img, idx) =>
      typeof img === "string"
        ? { id: idx, imageUrl: img, isMain: idx === 0 }
        : img
    );
  }
  if (product.mainImage) {
    return [{ id: 0, imageUrl: product.mainImage, isMain: true }];
  }
  return [];
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      totalPrice: 0,
      appliedCoupon: null,
      discount: 0,
      coupon: null,

      addItem: (product, quantity = 1, selectedVariant) => {
        set((state) => {
          const unitPrice = Number(product.salePrice ?? product.price ?? 0);
          const normalizedProduct: CartProduct = {
            ...product,
            images: normalizeImages(product),
          };

          const existing = state.items.find(
            (i) =>
              i.productId === product.id &&
              (i.selectedVariant ?? "") === (selectedVariant ?? "")
          );

          let nextItems: CartItem[];
          if (existing) {
            nextItems = state.items.map((i) =>
              i.id === existing.id
                ? { ...i, quantity: Math.min(product.stock || 999, i.quantity + quantity) }
                : i
            );
          } else {
            const newId = Date.now() + Math.floor(Math.random() * 1000);
            nextItems = [
              ...state.items,
              {
                id: newId,
                productId: product.id,
                product: normalizedProduct,
                quantity,
                price: unitPrice,
                selectedVariant,
              },
            ];
          }

          return {
            items: nextItems,
            ...calcTotals(nextItems),
          };
        });
      },

      removeItem: (idOrProductId) => {
        set((state) => {
          const nextItems = state.items.filter(
            (i) => i.id !== idOrProductId && i.productId !== idOrProductId
          );
          return {
            items: nextItems,
            ...calcTotals(nextItems),
          };
        });
      },

      updateQuantity: (idOrProductId, quantity) => {
        set((state) => {
          const nextItems =
            quantity <= 0
              ? state.items.filter(
                  (i) => i.id !== idOrProductId && i.productId !== idOrProductId
                )
              : state.items.map((i) =>
                  i.id === idOrProductId || i.productId === idOrProductId
                    ? { ...i, quantity }
                    : i
                );
          return {
            items: nextItems,
            ...calcTotals(nextItems),
          };
        });
      },

      clearCart: () =>
        set({
          items: [],
          totalItems: 0,
          totalPrice: 0,
          appliedCoupon: null,
          discount: 0,
          coupon: null,
        }),

      applyCoupon: (code, discountAmount) =>
        set({
          appliedCoupon: code,
          discount: discountAmount,
          coupon: { code, discount: discountAmount },
        }),

      removeCoupon: () =>
        set({
          appliedCoupon: null,
          discount: 0,
          coupon: null,
        }),

      getSubtotal: () => get().totalPrice,

      getTotal: () => Math.max(0, get().totalPrice - get().discount),
    }),
    {
      name: "nijer_bazaar_cart",
      onRehydrateStorage: () => (state) => {
        if (state) {
          const totals = calcTotals(state.items || []);
          state.totalItems = totals.totalItems;
          state.totalPrice = totals.totalPrice;
        }
      },
    }
  )
);