import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Users,
  Package,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, getOrderStatusVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/api";
import { toast } from "@/components/ui/toast";
import { Link } from "react-router-dom";
import type { DashboardStats, SalesChartData, TopProduct, LowStockProduct, Order } from "@nijer-bazaar/shared";

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  iconBg: string;
  growth?: number;
  prefix?: string;
}

function StatCard({ title, value, subValue, icon, iconBg, growth, prefix }: StatCardProps) {
  const isPositive = (growth ?? 0) >= 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {prefix}{typeof value === "number" ? value.toLocaleString("bn-BD") : value}
            </p>
            {subValue && (
              <p className="text-xs text-gray-500 mt-0.5">{subValue}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${iconBg}`}>{icon}</div>
        </div>

        {growth !== undefined && (
          <div className="flex items-center gap-1 mt-3">
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span
              className={`text-xs font-medium ${
                isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {isPositive ? "+" : ""}
              {growth?.toFixed(1)}%
            </span>
            <span className="text-xs text-gray-500">গত মাসের তুলনায়</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Pie chart colors ─────────────────────────────────────────────────────────
const PIE_COLORS = ["#16a34a", "#2563eb", "#d97706", "#dc2626", "#7c3aed"];

// ─── Status label map ─────────────────────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
  pending: "পেন্ডিং",
  confirmed: "কনফার্মড",
  processing: "প্রসেসিং",
  shipped: "শিপড",
  delivered: "ডেলিভার্ড",
  cancelled: "বাতিল",
};

// ─── AdminDashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [salesData, setSalesData] = useState<SalesChartData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [lowStock, setLowStock] = useState<LowStockProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<"7d" | "30d" | "90d">("30d");

  // Pie chart data derived from stats
  const orderStatusPie = stats
    ? [
        { name: "পেন্ডিং", value: stats.pendingOrders },
        {
          name: "প্রসেসিং",
          value: Math.max(0, stats.totalOrders - stats.pendingOrders),
        },
      ]
    : [];

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    fetchSalesChart();
  }, [chartPeriod]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [statsRes, topRes, lowRes, ordersRes] = await Promise.all([
        adminApi.get("/admin/dashboard"),
        adminApi.get("/admin/dashboard/top-products"),
        adminApi.get("/admin/dashboard/low-stock"),
        adminApi.get("/orders?limit=8&sort=newest"),
      ]);
      setStats(statsRes.data.stats ?? statsRes.data);
      setTopProducts(topRes.data.products ?? topRes.data ?? []);
      setLowStock(lowRes.data.products ?? lowRes.data ?? []);
      setRecentOrders(ordersRes.data.orders ?? ordersRes.data?.data ?? []);
    } catch {
      toast.error("ড্যাশবোর্ড ডেটা লোড হয়নি");
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesChart = async () => {
    try {
      const res = await adminApi.get(`/admin/reports/sales?period=${chartPeriod}`);
      setSalesData(res.data.data ?? res.data ?? []);
    } catch {
      // Silent fail — chart just shows empty
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">ড্যাশবোর্ড লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ড্যাশবোর্ড</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            আজকের সামগ্রিক পরিসংখ্যান ও বিশ্লেষণ
          </p>
        </div>
        <Button
          variant="brand"
          size="sm"
          onClick={fetchDashboard}
        >
          রিফ্রেশ
        </Button>
      </div>

      {/* ── Today's quick stats ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs text-green-600 font-medium">আজকের রাজস্ব</p>
          <p className="text-xl font-bold text-green-700 mt-1">
            ৳{(stats?.todayRevenue ?? 0).toLocaleString("bn-BD")}
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs text-blue-600 font-medium">আজকের অর্ডার</p>
          <p className="text-xl font-bold text-blue-700 mt-1">
            {(stats?.todayOrders ?? 0).toLocaleString("bn-BD")}
          </p>
        </div>
      </div>

      {/* ── Main stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="মোট রাজস্ব"
          value={(stats?.totalRevenue ?? 0).toLocaleString()}
          prefix="৳"
          icon={<DollarSign className="w-6 h-6 text-green-600" />}
          iconBg="bg-green-100"
          growth={stats?.revenueGrowth}
        />
        <StatCard
          title="মোট অর্ডার"
          value={stats?.totalOrders ?? 0}
          subValue={`${stats?.pendingOrders ?? 0}টি পেন্ডিং`}
          icon={<ShoppingBag className="w-6 h-6 text-blue-600" />}
          iconBg="bg-blue-100"
          growth={stats?.ordersGrowth}
        />
        <StatCard
          title="মোট কাস্টমার"
          value={stats?.totalCustomers ?? 0}
          icon={<Users className="w-6 h-6 text-purple-600" />}
          iconBg="bg-purple-100"
          growth={stats?.customersGrowth}
        />
        <StatCard
          title="মোট প্রোডাক্ট"
          value={stats?.totalProducts ?? 0}
          subValue={`${stats?.lowStockProducts ?? 0}টি কম স্টক`}
          icon={<Package className="w-6 h-6 text-orange-600" />}
          iconBg="bg-orange-100"
        />
      </div>

      {/* ── Sales Line Chart ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>বিক্রয় ট্রেন্ড</CardTitle>
            <div className="flex gap-2">
              {(["7d", "30d", "90d"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setChartPeriod(p)}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                    chartPeriod === p
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {p === "7d" ? "৭ দিন" : p === "30d" ? "৩০ দিন" : "৯০ দিন"}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                  }}
                />
                <YAxis
                  yAxisId="revenue"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  yAxisId="orders"
                  orientation="right"
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value, name) => [
                    name === "revenue"
                      ? `৳${Number(value).toLocaleString()}`
                      : value,
                    name === "revenue" ? "রাজস্ব" : "অর্ডার",
                  ]}
                />
                <Legend
                  formatter={(val) =>
                    val === "revenue" ? "রাজস্ব" : "অর্ডার"
                  }
                />
                <Line
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#16a34a"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
                <Line
                  yAxisId="orders"
                  type="monotone"
                  dataKey="orders"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
              চার্ট ডেটা লোড হচ্ছে...
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Bar Chart + Pie Chart row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar chart — top 5 products */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>শীর্ষ বিক্রিত প্রোডাক্ট (বার চার্ট)</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={topProducts.slice(0, 6).map((p) => ({
                    name:
                      p.name.length > 12
                        ? p.name.slice(0, 12) + "…"
                        : p.name,
                    বিক্রি: p.soldCount,
                    রাজস্ব: p.revenue,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="বিক্রি" fill="#16a34a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-52 flex items-center justify-center text-gray-400 text-sm">
                ডেটা নেই
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pie chart — order status */}
        <Card>
          <CardHeader>
            <CardTitle>অর্ডার স্ট্যাটাস</CardTitle>
          </CardHeader>
          <CardContent>
            {orderStatusPie.some((d) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={orderStatusPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {orderStatusPie.map((_, index) => (
                      <Cell
                        key={index}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-52 flex items-center justify-center text-gray-400 text-sm">
                ডেটা নেই
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Orders + Low Stock row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>সাম্প্রতিক অর্ডার</CardTitle>
              <Link to="/admin/orders">
                <Button variant="ghost" size="sm">
                  সব দেখুন <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">
                      অর্ডার নং
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 px-3 py-3">
                      কাস্টমার
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 px-3 py-3">
                      পরিমাণ
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 px-3 py-3">
                      স্ট্যাটাস
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 px-3 py-3">
                      তারিখ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.length > 0 ? (
                    recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3 text-sm font-mono text-green-600">
                          #{order.orderNumber}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-700">
                          {order.shippingAddress?.name ?? "N/A"}
                        </td>
                        <td className="px-3 py-3 text-sm font-semibold text-gray-900">
                          ৳{order.total?.toLocaleString()}
                        </td>
                        <td className="px-3 py-3">
                          <Badge variant={getOrderStatusVariant(order.status)}>
                            {STATUS_LABELS[order.status] ?? order.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString("bn-BD")}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-sm">
                        কোনো অর্ডার নেই
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              কম স্টক সতর্কতা
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {lowStock.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {lowStock.slice(0, 8).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between px-6 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        SKU: {product.sku ?? "N/A"}
                      </p>
                    </div>
                    <div className="ml-3 text-right flex-shrink-0">
                      <p
                        className={`text-sm font-bold ${
                          product.stock === 0
                            ? "text-red-600"
                            : "text-orange-500"
                        }`}
                      >
                        {product.stock === 0 ? "স্টক শেষ" : `${product.stock}টি`}
                      </p>
                      <p className="text-xs text-gray-400">
                        মিনিমাম: {product.lowStockThreshold}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-8 text-center">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">সব স্টক ঠিক আছে</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Top Products Table ── */}
      <Card>
        <CardHeader>
          <CardTitle>শীর্ষ বিক্রিত প্রোডাক্ট</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">#</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-3 py-3">প্রোডাক্ট</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-3 py-3">বিক্রি</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-3 py-3">রাজস্ব</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">স্টক</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topProducts.length > 0 ? (
                  topProducts.map((p, i) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-500">{i + 1}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-8 h-8 rounded object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                              <Package className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-800">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-right text-gray-700">
                        {p.soldCount.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-sm text-right font-semibold text-gray-900">
                        ৳{p.revenue.toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span
                          className={`text-sm font-medium ${
                            p.stock < 10 ? "text-red-500" : "text-green-600"
                          }`}
                        >
                          {p.stock}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-sm">
                      ডেটা নেই
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}