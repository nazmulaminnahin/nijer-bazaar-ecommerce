import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// ── Layouts ──────────────────────────────────────────────────────────────────
import CustomerLayout from "@/components/layout/CustomerLayout";
import AdminLayout from "@/components/layout/AdminLayout";

// ── Customer Pages ────────────────────────────────────────────────────────────
import HomePage from "@/pages/customer/HomePage";
import ShopPage from "@/pages/customer/ShopPage";
import ProductDetailPage from "@/pages/customer/ProductDetailPage";
import CartPage from "@/pages/customer/CartPage";
import CheckoutPage from "@/pages/customer/CheckoutPage";
import OrderTrackingPage from "@/pages/customer/OrderTrackingPage";
import LoginPage from "@/pages/customer/LoginPage";
import RegisterPage from "@/pages/customer/RegisterPage";
import ProfilePage from "@/pages/customer/ProfilePage";
import AboutPage from "@/pages/customer/AboutPage";
import ContactPage from "@/pages/customer/ContactPage";

// ── Admin Pages ───────────────────────────────────────────────────────────────
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminCategories from "@/pages/admin/AdminCategories";
import AdminInventory from "@/pages/admin/AdminInventory";
import AdminCustomers from "@/pages/admin/AdminCustomers";
import AdminCoupons from "@/pages/admin/AdminCoupons";
import AdminReports from "@/pages/admin/AdminReports";
import AdminCouriers from "@/pages/admin/AdminCouriers";
import AdminLoyalty from "@/pages/admin/AdminLoyalty";
import AdminGiftCards from "@/pages/admin/AdminGiftCards";
import AdminStaff from "@/pages/admin/AdminStaff";
import AdminNotifications from "@/pages/admin/AdminNotifications";
import AdminAccounting from "@/pages/admin/AdminAccounting";
import AdminFlashSales from "@/pages/admin/AdminFlashSales";
import AdminSettings from "@/pages/admin/AdminSettings";

// ── Stores ────────────────────────────────────────────────────────────────────
import { useAdminAuthStore } from "@/store/adminAuthStore";
import { useAuthStore } from "@/store/authStore";

// ── Route Guards ──────────────────────────────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAdminAuthStore();
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

// ── AppRouter ─────────────────────────────────────────────────────────────────
export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Customer Routes ── */}
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/product/:slug" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/track" element={<OrderTrackingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        </Route>

        {/* ── Auth (no layout) ── */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* ── Admin Login (no layout) ── */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* ── Admin Panel (all protected) ── */}
        <Route path="/admin" element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />

          {/* Core */}
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="orders" element={<AdminOrders />} />

          {/* Products */}
          <Route path="products" element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="inventory" element={<AdminInventory />} />

          {/* CRM */}
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="loyalty" element={<AdminLoyalty />} />
          <Route path="gift-cards" element={<AdminGiftCards />} />

          {/* Promotions */}
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="flash-sales" element={<AdminFlashSales />} />

          {/* Reports (all use same component with tab switching) */}
          <Route path="reports/sales" element={<AdminReports />} />
          <Route path="reports/products" element={<AdminReports />} />
          <Route path="reports/customers" element={<AdminReports />} />

          {/* Operations */}
          <Route path="couriers" element={<AdminCouriers />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="staff" element={<AdminStaff />} />

          {/* Accounting */}
          <Route path="accounting/transactions" element={<AdminAccounting />} />
          <Route path="accounting/expenses" element={<AdminAccounting />} />

          {/* Settings */}
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* ── 404 ── */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🔍</span>
              </div>
              <p className="text-6xl font-black text-green-600 mb-3">404</p>
              <p className="text-xl font-semibold text-gray-700 mb-2">পেজ পাওয়া যায়নি</p>
              <p className="text-gray-500 mb-6">আপনি যে পেজটি খুঁজছেন সেটি বিদ্যমান নেই।</p>
              <a href="/" className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors">
                হোমে ফিরুন
              </a>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}