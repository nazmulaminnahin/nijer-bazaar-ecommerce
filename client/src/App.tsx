import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toast";

// Customer Pages
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

// Admin Pages
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminCategories from "@/pages/admin/AdminCategories";
import AdminInventory from "@/pages/admin/AdminInventory";
import AdminCustomers from "@/pages/admin/AdminCustomers";
import AdminLoyalty from "@/pages/admin/AdminLoyalty";
import AdminGiftCards from "@/pages/admin/AdminGiftCards";
import AdminCoupons from "@/pages/admin/AdminCoupons";
import AdminFlashSales from "@/pages/admin/AdminFlashSales";
import AdminReports from "@/pages/admin/AdminReports";
import AdminCouriers from "@/pages/admin/AdminCouriers";
import AdminNotifications from "@/pages/admin/AdminNotifications";
import AdminStaff from "@/pages/admin/AdminStaff";
import AdminAccounting from "@/pages/admin/AdminAccounting";
import AdminSettings from "@/pages/admin/AdminSettings";

// Layouts
import AdminLayout from "@/layouts/AdminLayout";

// Auth Guard
import { useAdminAuthStore } from "@/stores/adminAuthStore";

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { admin, token } = useAdminAuthStore();
  if (!admin || !token) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Customer Routes ── */}
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/product/:slug" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/track-order" element={<OrderTrackingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* ── Admin Routes ── */}
        <Route path="/admin/login" element={<AdminLogin />} />

        <Route
          path="/admin"
          element={
            <AdminGuard>
              <AdminLayout />
            </AdminGuard>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="inventory" element={<AdminInventory />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="loyalty" element={<AdminLoyalty />} />
          <Route path="gift-cards" element={<AdminGiftCards />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="flash-sales" element={<AdminFlashSales />} />
          <Route path="reports/sales" element={<AdminReports />} />
          <Route path="reports/products" element={<AdminReports />} />
          <Route path="reports/customers" element={<AdminReports />} />
          <Route path="couriers" element={<AdminCouriers />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="staff" element={<AdminStaff />} />
          <Route path="accounting/transactions" element={<AdminAccounting />} />
          <Route path="accounting/expenses" element={<AdminAccounting />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster />
    </BrowserRouter>
  );
}