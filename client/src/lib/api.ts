import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/authStore";
import { useAdminAuthStore } from "@/store/adminAuthStore";

const API_BASE_URL = "/api";

function normalizeOrder(o: Record<string, any>) {
  if (!o || typeof o !== "object") return o;
  const items = Array.isArray(o.items)
    ? o.items.map((it: Record<string, any>) => {
        const price = Number(it.price ?? 0);
        const quantity = Number(it.quantity ?? 1);
        return {
          ...it,
          name: it.name ?? it.productName ?? "Product",
          price,
          quantity,
          subtotal: Number(it.subtotal ?? price * quantity),
        };
      })
    : o.items;

  return {
    ...o,
    subtotal: Number(o.subtotal ?? 0),
    discount: Number(o.discount ?? 0),
    shippingCost: Number(o.shippingCost ?? 0),
    total: Number(o.total ?? 0),
    courierTrackingId: o.courierTrackingId ?? o.trackingNumber ?? "",
    items,
  };
}

function normalizeProduct(p: Record<string, any>) {
  if (!p || typeof p !== "object") return p;
  const priceNum = Number(p.price ?? 0);
  const saleNum = p.salePrice != null ? Number(p.salePrice) : null;
  let images: string[] = [];
  if (Array.isArray(p.images)) {
    images = p.images
      .map((img: any) => (typeof img === "string" ? img : img?.imageUrl))
      .filter(Boolean);
  } else if (p.mainImage) {
    images = [p.mainImage];
  }
  return {
    ...p,
    price: saleNum ?? priceNum,
    comparePrice: p.comparePrice ?? (saleNum != null ? priceNum : null),
    images,
  };
}

// ── Customer API instance ────────────────────────────────────────────────────
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => {
    const token =
      useAuthStore.getState().token || localStorage.getItem("nijer_bazaar_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

// ── Admin API instance ───────────────────────────────────────────────────────
export const adminApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

adminApi.interceptors.request.use(
  (config) => {
    const adminToken =
      useAdminAuthStore.getState().token ||
      localStorage.getItem("nijer_bazaar_admin_token");
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }

    // Rewrite admin shorthand endpoints so existing server routes also match
    const url = config.url || "";
    const method = (config.method || "get").toLowerCase();

    if (/^\/orders(\?.*)?$/.test(url) && method === "get") {
      config.url = url.replace(/^\/orders/, "/orders/admin/all");
    } else if (/^\/orders\/\d+$/.test(url) && method === "get") {
      config.url = url.replace(/^\/orders\/(\d+)$/, "/orders/admin/$1");
    } else if (/^\/orders\/\d+\/status$/.test(url) && method === "patch") {
      config.method = "put";
      config.url = url.replace(/^\/orders\/(\d+)\/status$/, "/orders/admin/$1/status");
    } else if (/^\/categories(\?.*)?$/.test(url) && method === "get") {
      config.url = url.replace(/^\/categories/, "/categories/admin/all");
    } else if (url === "/categories" && method === "post") {
      config.url = "/categories/admin";
    } else if (/^\/categories\/\d+$/.test(url) && (method === "put" || method === "delete")) {
      config.url = url.replace(/^\/categories\/(\d+)$/, "/categories/admin/$1");
    } else if (/^\/products(\?.*)?$/.test(url) && method === "get") {
      config.url = url.replace(/^\/products/, "/products/admin/all");
    } else if (url === "/products" && method === "post") {
      config.url = "/products/admin/create";
      if (config.data && typeof config.data === "object") {
        const d = { ...config.data };
        const p = Number(d.price ?? 0);
        const cmp = d.comparePrice ? Number(d.comparePrice) : null;
        if (cmp && cmp > p) {
          d.price = String(cmp);
          d.salePrice = String(p);
        } else {
          d.price = String(p);
          d.salePrice = d.salePrice != null ? String(d.salePrice) : null;
        }
        if (d.weight != null) d.weight = String(d.weight);
        config.data = d;
      }
    } else if (/^\/products\/\d+$/.test(url) && (method === "put" || method === "delete")) {
      config.url = url.replace(/^\/products\/(\d+)$/, "/products/admin/$1");
      if (method === "put" && config.data && typeof config.data === "object") {
        const d = { ...config.data };
        const p = Number(d.price ?? 0);
        const cmp = d.comparePrice ? Number(d.comparePrice) : null;
        if (cmp && cmp > p) {
          d.price = String(cmp);
          d.salePrice = String(p);
        } else {
          d.price = String(p);
          d.salePrice = null;
        }
        if (d.weight != null) d.weight = String(d.weight);
        config.data = d;
      }
    } else if (url === "/admin/settings" && method === "post") {
      config.method = "put";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

adminApi.interceptors.response.use(
  (response) => {
    const body = response.data;
    const url = response.config.url || "";

    if (body && typeof body === "object" && "data" in body) {
      const payload = body.data;

      if (Array.isArray(payload)) {
        if (url.includes("/categories")) body.categories = body.categories ?? payload;
        if (url.includes("/coupons")) {
          const normalizedCoupons = payload.map((c: any) => ({
            ...c,
            value: Number(c.value ?? 0),
            minOrderAmount: c.minOrderAmount != null ? Number(c.minOrderAmount) : null,
            maxDiscount: c.maxDiscount != null ? Number(c.maxDiscount) : (c.maxDiscountAmount != null ? Number(c.maxDiscountAmount) : null),
            usageLimit: c.usageLimit ?? c.maxUses ?? null,
            usedCount: Number(c.usedCount ?? 0),
            usageCount: Number(c.usageCount ?? c.usedCount ?? 0),
            expiresAt: c.expiresAt ?? c.expiryDate ?? null,
          }));
          body.data = normalizedCoupons;
          body.coupons = body.coupons ?? normalizedCoupons;
        }
        if (url.includes("/couriers")) body.couriers = body.couriers ?? payload;
        if (url.includes("/inventory")) body.inventory = body.inventory ?? payload;
        if (url.includes("/customers")) body.customers = body.customers ?? payload;
        if (url.includes("/gift-cards")) body.cards = body.cards ?? payload;
        if (url.includes("/loyalty")) body.transactions = body.transactions ?? payload;
        if (url.includes("/notifications/templates")) body.templates = body.templates ?? payload;
        else if (url.includes("/notifications")) body.notifications = body.notifications ?? payload;
        if (url.includes("/staff")) body.staff = body.staff ?? payload;
        if (url.includes("/accounting/transactions")) body.transactions = body.transactions ?? payload;
        if (url.includes("/accounting/expenses")) body.expenses = body.expenses ?? payload;
        if (url.includes("/dashboard/")) body.products = body.products ?? payload;

        if (url.includes("/orders")) {
          const normalized = payload.map(normalizeOrder);
          body.data = normalized;
          body.orders = body.orders ?? normalized;
        }
        if (url.includes("/products")) {
          const normalized = payload.map(normalizeProduct);
          body.data = normalized;
          body.products = body.products ?? normalized;
        }
        if (url.includes("/reports/products")) {
          body.data = payload.map((p: any) => ({
            name: p.name ?? p.productName ?? "Product",
            soldCount: Number(p.soldCount ?? p.totalQuantity ?? 0),
            revenue: Number(p.revenue ?? p.totalRevenue ?? 0),
            stock: Number(p.stock ?? 0),
          }));
        }

        if (body.totalPages !== undefined && !body.pagination) {
          body.pagination = {
            page: body.page ?? 1,
            limit: body.limit ?? 10,
            total: body.total ?? payload.length,
            totalPages: body.totalPages,
          };
        }
      } else if (payload && typeof payload === "object") {
        // Unwrap nested report payloads if returned as objects
        if (url.includes("/reports/sales") && Array.isArray(payload.salesData)) {
          body.data = payload.salesData.map((s: any) => ({
            date: s.date,
            revenue: Number(s.revenue ?? 0),
            orders: Number(s.orders ?? 0),
            avgOrderValue: Number(s.avgOrderValue ?? 0),
          }));
        } else if (url.includes("/reports/customers") && Array.isArray(payload.newCustomers)) {
          body.data = payload.newCustomers.map((c: any) => ({
            date: c.date,
            newCustomers: Number(c.newCustomers ?? c.count ?? 0),
            returningCustomers: Number(c.returningCustomers ?? 0),
          }));
        } else {
          Object.assign(body, payload);
        }

        if (url.includes("/admin/dashboard") && body.stats) {
          const s = body.stats;
          body.stats = {
            ...s,
            todayRevenue: Number(s.todayRevenue ?? s.totalSalesToday ?? 0),
            todayOrders: Number(s.todayOrders ?? s.totalOrdersToday ?? 0),
            totalRevenue: Number(s.totalRevenue ?? 0),
            totalOrders: Number(s.totalOrders ?? 0),
            pendingOrders: Number(s.pendingOrders ?? 0),
            totalCustomers: Number(s.totalCustomers ?? 0),
            totalProducts: Number(s.totalProducts ?? 0),
            lowStockProducts: Number(
              s.lowStockProducts ?? body.lowStockProducts?.length ?? 0
            ),
          };
        }
        if (url.includes("/admin/settings")) {
          body.settings = body.settings ?? payload;
        }
        if (/\/orders\/admin\/\d+$/.test(url)) {
          body.order = normalizeOrder(payload);
        }
        if (/\/admin\/customers\/\d+$/.test(url)) {
          body.customer = {
            ...payload,
            crmNotes: payload.crmNotes ?? payload.notes ?? [],
          };
        }
      }
    }

    return response;
  },
  (error: AxiosError) => {
    const reqUrl = error.config?.url || "";
    if (error.response?.status === 401 && !reqUrl.includes("/auth/admin/login")) {
      useAdminAuthStore.getState().logout();
      if (!window.location.pathname.startsWith("/admin/login")) {
        window.location.href = "/admin/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export async function apiCall<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await api(config);
  return response.data;
}