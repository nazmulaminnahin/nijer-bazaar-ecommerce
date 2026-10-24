import React, { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  BarChart2,
  Tag,
  Truck,
  CreditCard,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Warehouse,
  Gift,
  Star,
  FileText,
  UserCog,
  Store,
  Percent,
} from "lucide-react";
import { useAdminAuthStore } from "@/store/adminAuthStore";
import { cn } from "@/lib/utils";

// ─── Nav item types ───────────────────────────────────────────────────────────
interface NavItem {
  label: string;
  icon: React.ReactNode;
  to?: string;
  children?: NavItem[];
  badge?: string;
}

const navItems: NavItem[] = [
  {
    label: "ড্যাশবোর্ড",
    icon: <LayoutDashboard className="w-5 h-5" />,
    to: "/admin/dashboard",
  },
  {
    label: "অর্ডার ম্যানেজমেন্ট",
    icon: <ShoppingBag className="w-5 h-5" />,
    children: [
      { label: "সকল অর্ডার", icon: <FileText className="w-4 h-4" />, to: "/admin/orders" },
      { label: "পেন্ডিং অর্ডার", icon: <FileText className="w-4 h-4" />, to: "/admin/orders?status=pending" },
      { label: "শিপড অর্ডার", icon: <Truck className="w-4 h-4" />, to: "/admin/orders?status=shipped" },
    ],
  },
  {
    label: "প্রোডাক্ট",
    icon: <Package className="w-5 h-5" />,
    children: [
      { label: "সকল প্রোডাক্ট", icon: <Package className="w-4 h-4" />, to: "/admin/products" },
      { label: "ক্যাটাগরি", icon: <Tag className="w-4 h-4" />, to: "/admin/categories" },
      { label: "ইনভেন্টরি", icon: <Warehouse className="w-4 h-4" />, to: "/admin/inventory" },
    ],
  },
  {
    label: "কাস্টমার (CRM)",
    icon: <Users className="w-5 h-5" />,
    children: [
      { label: "সকল কাস্টমার", icon: <Users className="w-4 h-4" />, to: "/admin/customers" },
      { label: "লয়্যালটি পয়েন্ট", icon: <Star className="w-4 h-4" />, to: "/admin/loyalty" },
      { label: "গিফট কার্ড", icon: <Gift className="w-4 h-4" />, to: "/admin/gift-cards" },
    ],
  },
  {
    label: "রিপোর্ট ও অ্যানালিটিক্স",
    icon: <BarChart2 className="w-5 h-5" />,
    children: [
      { label: "বিক্রয় রিপোর্ট", icon: <BarChart2 className="w-4 h-4" />, to: "/admin/reports/sales" },
      { label: "প্রোডাক্ট রিপোর্ট", icon: <Package className="w-4 h-4" />, to: "/admin/reports/products" },
      { label: "কাস্টমার রিপোর্ট", icon: <Users className="w-4 h-4" />, to: "/admin/reports/customers" },
    ],
  },
  {
    label: "প্রমোশন",
    icon: <Percent className="w-5 h-5" />,
    children: [
      { label: "কুপন কোড", icon: <Tag className="w-4 h-4" />, to: "/admin/coupons" },
      { label: "ফ্ল্যাশ সেল", icon: <Percent className="w-4 h-4" />, to: "/admin/flash-sales" },
    ],
  },
  {
    label: "অ্যাকাউন্টিং",
    icon: <CreditCard className="w-5 h-5" />,
    children: [
      { label: "লেনদেন", icon: <CreditCard className="w-4 h-4" />, to: "/admin/accounting/transactions" },
      { label: "খরচ", icon: <FileText className="w-4 h-4" />, to: "/admin/accounting/expenses" },
    ],
  },
  {
    label: "কুরিয়ার",
    icon: <Truck className="w-5 h-5" />,
    to: "/admin/couriers",
  },
  {
    label: "নোটিফিকেশন",
    icon: <Bell className="w-5 h-5" />,
    to: "/admin/notifications",
  },
  {
    label: "স্টাফ ম্যানেজমেন্ট",
    icon: <UserCog className="w-5 h-5" />,
    to: "/admin/staff",
  },
  {
    label: "সেটিংস",
    icon: <Settings className="w-5 h-5" />,
    to: "/admin/settings",
  },
];

// ─── Sidebar nav item ─────────────────────────────────────────────────────────
function SidebarItem({
  item,
  depth = 0,
}: {
  item: NavItem;
  depth?: number;
}) {
  const [open, setOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
            "text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-150",
            depth > 0 && "pl-9 text-gray-400 text-xs"
          )}
        >
          {item.icon}
          <span className="flex-1 text-left">{item.label}</span>
          {open ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {open && (
          <div className="mt-1 ml-3 pl-3 border-l border-white/10">
            {item.children!.map((child, i) => (
              <SidebarItem key={i} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.to!}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
          depth > 0 ? "text-xs pl-2" : "",
          isActive
            ? "bg-green-600 text-white shadow-sm"
            : "text-gray-300 hover:bg-white/10 hover:text-white"
        )
      }
    >
      {item.icon}
      <span>{item.label}</span>
      {item.badge && (
        <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
          {item.badge}
        </span>
      )}
    </NavLink>
  );
}

// ─── AdminLayout ──────────────────────────────────────────────────────────────
export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { admin, logout } = useAdminAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10 flex-shrink-0">
        <div className="w-9 h-9 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Store className="w-5 h-5 text-white" />
        </div>
        {sidebarOpen && (
          <div>
            <p className="font-bold text-white text-sm leading-tight">নিজের বাজার</p>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
        {navItems.map((item, i) => (
          <SidebarItem key={i} item={item} />
        ))}
      </nav>

      {/* Admin profile */}
      <div className="p-3 border-t border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {admin?.name?.charAt(0)?.toUpperCase() ?? "A"}
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {admin?.name ?? "Admin"}
              </p>
              <p className="text-xs text-gray-400 truncate">{admin?.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-md text-gray-400 hover:text-red-400 hover:bg-white/10 transition-colors flex-shrink-0"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col flex-shrink-0 transition-all duration-300",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 flex flex-col z-50">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 flex-shrink-0 h-16 flex items-center px-4 gap-4 shadow-sm">
          {/* Toggle sidebar */}
          <button
            onClick={() => {
              if (window.innerWidth >= 1024) {
                setSidebarOpen(!sidebarOpen);
              } else {
                setMobileSidebarOpen(!mobileSidebarOpen);
              }
            }}
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb area */}
          <div className="flex-1">
            <Link to="/" target="_blank" className="text-sm text-gray-500 hover:text-green-600 transition-colors">
              ← ওয়েবসাইট দেখুন
            </Link>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-bold">
              {admin?.name?.charAt(0)?.toUpperCase() ?? "A"}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}