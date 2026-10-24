import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/api";
import { toast } from "@/components/ui/toast";
import { Download, TrendingUp, ShoppingBag, Users, Package } from "lucide-react";

const PERIOD_OPTIONS = [
  { value: "7d", label: "শেষ ৭ দিন" },
  { value: "30d", label: "শেষ ৩০ দিন" },
  { value: "90d", label: "শেষ ৩ মাস" },
  { value: "1y", label: "শেষ ১ বছর" },
];

const PIE_COLORS = ["#16a34a", "#2563eb", "#d97706", "#dc2626", "#7c3aed", "#0891b2"];

interface SalesData { date: string; revenue: number; orders: number; avgOrderValue: number; }
interface ProductData { name: string; soldCount: number; revenue: number; stock: number; }
interface CustomerData { date: string; newCustomers: number; returningCustomers: number; }

type ReportTab = "sales" | "products" | "customers";

export default function AdminReports() {
  const [activeTab, setActiveTab] = useState<ReportTab>("sales");
  const [period, setPeriod] = useState("30d");
  const [loading, setLoading] = useState(false);

  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [productData, setProductData] = useState<ProductData[]>([]);
  const [customerData, setCustomerData] = useState<CustomerData[]>([]);

  // Summary stats
  const totalRevenue = salesData.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = salesData.reduce((s, d) => s + d.orders, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  useEffect(() => { fetchData(); }, [activeTab, period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "sales") {
        const res = await adminApi.get(`/admin/reports/sales?period=${period}`);
        setSalesData(res.data.data ?? res.data ?? []);
      } else if (activeTab === "products") {
        const res = await adminApi.get(`/admin/reports/products?period=${period}`);
        setProductData(res.data.data ?? res.data ?? []);
      } else {
        const res = await adminApi.get(`/admin/reports/customers?period=${period}`);
        setCustomerData(res.data.data ?? res.data ?? []);
      }
    } catch { toast.error("রিপোর্ট লোড হয়নি"); }
    finally { setLoading(false); }
  };

  const exportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (activeTab === "sales") {
      headers = ["তারিখ", "রাজস্ব", "অর্ডার", "গড় অর্ডার মূল্য"];
      rows = salesData.map((d) => [d.date, d.revenue, d.orders, d.avgOrderValue?.toFixed(2)]);
    } else if (activeTab === "products") {
      headers = ["প্রোডাক্ট", "বিক্রি", "রাজস্ব", "স্টক"];
      rows = productData.map((d) => [d.name, d.soldCount, d.revenue, d.stock]);
    } else {
      headers = ["তারিখ", "নতুন কাস্টমার", "পুরোনো কাস্টমার"];
      rows = customerData.map((d) => [d.date, d.newCustomers, d.returningCustomers]);
    }

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report_${activeTab}_${period}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("রিপোর্ট ডাউনলোড হচ্ছে");
  };

  const tabs: { key: ReportTab; label: string; icon: React.ReactNode }[] = [
    { key: "sales", label: "বিক্রয় রিপোর্ট", icon: <TrendingUp className="w-4 h-4" /> },
    { key: "products", label: "প্রোডাক্ট রিপোর্ট", icon: <Package className="w-4 h-4" /> },
    { key: "customers", label: "কাস্টমার রিপোর্ট", icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">রিপোর্ট ও অ্যানালিটিক্স</h1>
          <p className="text-sm text-gray-500 mt-0.5">ব্যবসায়ের বিস্তারিত পরিসংখ্যান</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-40">
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              options={PERIOD_OPTIONS}
            />
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-1.5" /> CSV
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-green-600 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── SALES TAB ── */}
      {activeTab === "sales" && (
        <div className="space-y-4">
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card><CardContent className="pt-5">
              <p className="text-xs text-gray-500">মোট রাজস্ব</p>
              <p className="text-2xl font-bold text-green-600 mt-1">৳{totalRevenue.toLocaleString()}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-5">
              <p className="text-xs text-gray-500">মোট অর্ডার</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{totalOrders.toLocaleString()}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-5">
              <p className="text-xs text-gray-500">গড় অর্ডার মূল্য</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">৳{avgOrderValue.toFixed(0)}</p>
            </CardContent></Card>
          </div>

          {/* Revenue Line Chart */}
          <Card>
            <CardHeader><CardTitle>রাজস্ব ও অর্ডার ট্রেন্ড</CardTitle></CardHeader>
            <CardContent>
              {salesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }}
                      tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth() + 1}`; }} />
                    <YAxis yAxisId="rev" tick={{ fontSize: 11 }} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} />
                    <YAxis yAxisId="ord" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(val, name) => [name === "revenue" ? `৳${Number(val).toLocaleString()}` : val, name === "revenue" ? "রাজস্ব" : "অর্ডার"]} />
                    <Legend formatter={(v) => v === "revenue" ? "রাজস্ব" : "অর্ডার"} />
                    <Line yAxisId="rev" type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2.5} dot={false} />
                    <Line yAxisId="ord" type="monotone" dataKey="orders" stroke="#2563eb" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-400">
                  {loading ? "লোড হচ্ছে..." : "ডেটা নেই"}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Avg Order Value Bar Chart */}
          <Card>
            <CardHeader><CardTitle>গড় অর্ডার মূল্য</CardTitle></CardHeader>
            <CardContent>
              {salesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={salesData.slice(-14)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth() + 1}`; }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => [`৳${Number(v).toLocaleString()}`, "গড় মূল্য"]} />
                    <Bar dataKey="avgOrderValue" fill="#7c3aed" radius={[4, 4, 0, 0]} name="গড় মূল্য" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-52 flex items-center justify-center text-gray-400">ডেটা নেই</div>}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── PRODUCTS TAB ── */}
      {activeTab === "products" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Bar chart */}
            <Card>
              <CardHeader><CardTitle>শীর্ষ বিক্রিত প্রোডাক্ট</CardTitle></CardHeader>
              <CardContent>
                {productData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={productData.slice(0, 8).map((p) => ({ ...p, name: p.name.length > 10 ? p.name.slice(0, 10) + "…" : p.name }))} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                      <Tooltip />
                      <Bar dataKey="soldCount" fill="#16a34a" radius={[0, 4, 4, 0]} name="বিক্রি" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="h-64 flex items-center justify-center text-gray-400">{loading ? "লোড হচ্ছে..." : "ডেটা নেই"}</div>}
              </CardContent>
            </Card>

            {/* Pie chart */}
            <Card>
              <CardHeader><CardTitle>রাজস্ব বিতরণ</CardTitle></CardHeader>
              <CardContent>
                {productData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={productData.slice(0, 6)} cx="50%" cy="50%" outerRadius={100} dataKey="revenue" nameKey="name">
                        {productData.slice(0, 6).map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v, n) => [`৳${Number(v).toLocaleString()}`, n]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="h-64 flex items-center justify-center text-gray-400">ডেটা নেই</div>}
              </CardContent>
            </Card>
          </div>

          {/* Products Table */}
          <Card>
            <CardHeader><CardTitle>প্রোডাক্ট পারফর্মেন্স টেবিল</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">#</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase px-3 py-3">প্রোডাক্ট</th>
                      <th className="text-right text-xs font-semibold text-gray-500 uppercase px-3 py-3">বিক্রি</th>
                      <th className="text-right text-xs font-semibold text-gray-500 uppercase px-3 py-3">রাজস্ব</th>
                      <th className="text-right text-xs font-semibold text-gray-500 uppercase px-5 py-3">স্টক</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {productData.length > 0 ? productData.map((p, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-5 py-3 text-sm text-gray-400">{i + 1}</td>
                        <td className="px-3 py-3 text-sm font-medium text-gray-800">{p.name}</td>
                        <td className="px-3 py-3 text-sm text-right text-gray-700">{p.soldCount.toLocaleString()}</td>
                        <td className="px-3 py-3 text-sm text-right font-semibold text-green-700">৳{p.revenue.toLocaleString()}</td>
                        <td className="px-5 py-3 text-right">
                          <span className={`text-sm font-medium ${p.stock < 10 ? "text-red-500" : "text-green-600"}`}>{p.stock}</span>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">{loading ? "লোড হচ্ছে..." : "ডেটা নেই"}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── CUSTOMERS TAB ── */}
      {activeTab === "customers" && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>কাস্টমার গ্রোথ ট্রেন্ড</CardTitle></CardHeader>
            <CardContent>
              {customerData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={customerData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth() + 1}`; }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="newCustomers" name="নতুন কাস্টমার" fill="#16a34a" stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="returningCustomers" name="পুরোনো কাস্টমার" fill="#2563eb" stackId="a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-400">
                  {loading ? "লোড হচ্ছে..." : "ডেটা নেই"}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}