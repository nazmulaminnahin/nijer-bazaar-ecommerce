import React, { useEffect, useState, useCallback } from "react";
import {
  Search,
  Filter,
  Eye,
  Printer,
  Truck,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  CheckCircle,
  Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, getOrderStatusVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { adminApi } from "@/lib/api";
import { toast } from "@/components/ui/toast";
import type { Order, OrderStatus, Courier } from "@nijer-bazaar/shared";

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: "", label: "সব স্ট্যাটাস" },
  { value: "pending", label: "পেন্ডিং" },
  { value: "confirmed", label: "কনফার্মড" },
  { value: "processing", label: "প্রসেসিং" },
  { value: "shipped", label: "শিপড" },
  { value: "delivered", label: "ডেলিভার্ড" },
  { value: "cancelled", label: "বাতিল" },
  { value: "returned", label: "রিটার্ন" },
];

const STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: [],
  cancelled: [],
  returned: [],
};

const STATUS_LABELS: Record<string, string> = {
  pending: "পেন্ডিং",
  confirmed: "কনফার্মড",
  processing: "প্রসেসিং",
  shipped: "শিপড",
  delivered: "ডেলিভার্ড",
  cancelled: "বাতিল",
  returned: "রিটার্ন",
};

const PAYMENT_LABELS: Record<string, string> = {
  cod: "ক্যাশ অন ডেলিভারি",
  bkash: "বিকাশ",
  nagad: "নগদ",
  card: "কার্ড",
  bank: "ব্যাংক ট্রান্সফার",
};

// ─── AdminOrders ──────────────────────────────────────────────────────────────
export default function AdminOrders() {
  // Data
  const [orders, setOrders] = useState<Order[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 15;

  // Selected order
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Modals
  const [detailModal, setDetailModal] = useState(false);
  const [statusModal, setStatusModal] = useState(false);
  const [courierModal, setCourierModal] = useState(false);

  // Status update form
  const [newStatus, setNewStatus] = useState<OrderStatus>("confirmed");
  const [statusNote, setStatusNote] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);

  // Courier assign form
  const [selectedCourierId, setSelectedCourierId] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [courierLoading, setCourierLoading] = useState(false);

  const totalPages = Math.ceil(total / limit);

  // ── Fetch orders ─────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });
      const res = await adminApi.get(`/orders?${params}`);
      const d = res.data;
      setOrders(d.orders ?? d.data ?? []);
      setTotal(d.total ?? d.orders?.length ?? 0);
    } catch {
      toast.error("অর্ডার লোড হয়নি");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  const fetchCouriers = async () => {
    try {
      const res = await adminApi.get("/couriers");
      setCouriers(res.data.couriers ?? res.data ?? []);
    } catch {
      // Silent
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchCouriers();
  }, []);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  // ── Open modals ───────────────────────────────────────────────────────────
  const openDetail = async (order: Order) => {
    try {
      const res = await adminApi.get(`/orders/${order.id}`);
      setSelectedOrder(res.data.order ?? res.data);
    } catch {
      setSelectedOrder(order);
    }
    setDetailModal(true);
  };

  const openStatusModal = (order: Order) => {
    setSelectedOrder(order);
    const next = STATUS_FLOW[order.status]?.[0] ?? order.status;
    setNewStatus(next);
    setStatusNote("");
    setStatusModal(true);
  };

  const openCourierModal = (order: Order) => {
    setSelectedOrder(order);
    setSelectedCourierId(String(order.courierId ?? ""));
    setTrackingId(order.courierTrackingId ?? "");
    setCourierModal(true);
  };

  // ── Update status ─────────────────────────────────────────────────────────
  const handleStatusUpdate = async () => {
    if (!selectedOrder) return;
    setStatusLoading(true);
    try {
      await adminApi.patch(`/orders/${selectedOrder.id}/status`, {
        status: newStatus,
        note: statusNote,
      });
      toast.success(`অর্ডার #${selectedOrder.orderNumber} → ${STATUS_LABELS[newStatus]}`);
      setStatusModal(false);
      fetchOrders();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "স্ট্যাটাস আপডেট ব্যর্থ");
    } finally {
      setStatusLoading(false);
    }
  };

  // ── Assign courier ────────────────────────────────────────────────────────
  const handleCourierAssign = async () => {
    if (!selectedOrder || !selectedCourierId) {
      toast.warning("কুরিয়ার সিলেক্ট করুন");
      return;
    }
    setCourierLoading(true);
    try {
      await adminApi.patch(`/orders/${selectedOrder.id}/courier`, {
        courierId: Number(selectedCourierId),
        courierTrackingId: trackingId,
      });
      toast.success("কুরিয়ার অ্যাসাইন করা হয়েছে");
      setCourierModal(false);
      fetchOrders();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "কুরিয়ার অ্যাসাইন ব্যর্থ");
    } finally {
      setCourierLoading(false);
    }
  };

  // ── Print invoice ─────────────────────────────────────────────────────────
  const printInvoice = (order: Order) => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html lang="bn">
      <head>
        <meta charset="UTF-8" />
        <title>Invoice - ${order.orderNumber}</title>
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family: Arial, sans-serif; padding: 30px; color: #1a1a1a; }
          .header { display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #16a34a; padding-bottom:16px; margin-bottom:20px; }
          .logo { font-size:22px; font-weight:bold; color:#16a34a; }
          .invoice-info { text-align:right; font-size:13px; color:#555; }
          .section { margin-bottom:20px; }
          .section-title { font-size:13px; font-weight:bold; color:#555; text-transform:uppercase; border-bottom:1px solid #eee; padding-bottom:6px; margin-bottom:10px; }
          table { width:100%; border-collapse:collapse; font-size:13px; }
          th { background:#f8faf8; text-align:left; padding:8px 12px; border:1px solid #e0e0e0; color:#555; font-weight:600; }
          td { padding:8px 12px; border:1px solid #e0e0e0; }
          .total-row td { font-weight:bold; background:#f0fdf4; }
          .footer { margin-top:30px; text-align:center; font-size:12px; color:#888; border-top:1px solid #eee; padding-top:16px; }
          @media print { body { padding:20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">নিজের বাজার</div>
            <div style="font-size:12px;color:#888;margin-top:2px;">nijerbazaar.com</div>
          </div>
          <div class="invoice-info">
            <div><strong>ইনভয়েস #${order.orderNumber}</strong></div>
            <div>তারিখ: ${new Date(order.createdAt).toLocaleDateString("bn-BD")}</div>
            <div>স্ট্যাটাস: ${STATUS_LABELS[order.status] ?? order.status}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">ডেলিভারি ঠিকানা</div>
          <p>${order.shippingAddress?.name ?? ""}</p>
          <p>${order.shippingAddress?.phone ?? ""}</p>
          <p>${order.shippingAddress?.address ?? ""}, ${order.shippingAddress?.district ?? ""}</p>
        </div>

        <div class="section">
          <div class="section-title">অর্ডার আইটেম</div>
          <table>
            <thead>
              <tr>
                <th>প্রোডাক্ট</th>
                <th>ভেরিয়েন্ট</th>
                <th>পরিমাণ</th>
                <th>দাম</th>
                <th>মোট</th>
              </tr>
            </thead>
            <tbody>
              ${(order.items ?? [])
                .map(
                  (item) => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.variant ?? "-"}</td>
                  <td>${item.quantity}</td>
                  <td>৳${item.price.toLocaleString()}</td>
                  <td>৳${item.subtotal.toLocaleString()}</td>
                </tr>`
                )
                .join("")}
            </tbody>
            <tfoot>
              <tr><td colspan="4" style="text-align:right;">সাবটোটাল</td><td>৳${order.subtotal?.toLocaleString()}</td></tr>
              <tr><td colspan="4" style="text-align:right;">ডেলিভারি চার্জ</td><td>৳${order.shippingCost?.toLocaleString()}</td></tr>
              ${order.discount ? `<tr><td colspan="4" style="text-align:right;">ছাড়</td><td>-৳${order.discount?.toLocaleString()}</td></tr>` : ""}
              <tr class="total-row"><td colspan="4" style="text-align:right;">মোট পরিমাণ</td><td>৳${order.total?.toLocaleString()}</td></tr>
            </tfoot>
          </table>
        </div>

        <div class="section">
          <p><strong>পেমেন্ট পদ্ধতি:</strong> ${PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}</p>
          ${order.notes ? `<p><strong>নোট:</strong> ${order.notes}</p>` : ""}
        </div>

        <div class="footer">
          ধন্যবাদ আপনার কেনাকাটার জন্য! | নিজের বাজার — আপনার বিশ্বস্ত অনলাইন শপ
        </div>
        <script>window.onload = () => { window.print(); }</script>
      </body>
      </html>
    `);
    win.document.close();
  };

  // ── Bulk export CSV ───────────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = ["অর্ডার নং", "কাস্টমার", "ফোন", "মোট", "স্ট্যাটাস", "পেমেন্ট", "তারিখ"];
    const rows = orders.map((o) => [
      o.orderNumber,
      o.shippingAddress?.name ?? "",
      o.shippingAddress?.phone ?? "",
      o.total,
      STATUS_LABELS[o.status] ?? o.status,
      PAYMENT_LABELS[o.paymentMethod] ?? o.paymentMethod,
      new Date(o.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV ডাউনলোড শুরু হয়েছে");
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">অর্ডার ম্যানেজমেন্ট</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            মোট {total.toLocaleString()} অর্ডার
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-1.5" /> CSV
          </Button>
          <Button
            variant="brand"
            size="sm"
            onClick={fetchOrders}
            loading={loading}
          >
            <RefreshCw className="w-4 h-4 mr-1.5" /> রিফ্রেশ
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="অর্ডার নং বা কাস্টমার নাম দিয়ে খুঁজুন..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="w-44">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={STATUS_OPTIONS}
              />
            </div>
            {(search || statusFilter) && (
              <Button
                variant="ghost"
                size="default"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("");
                }}
              >
                <X className="w-4 h-4 mr-1" /> ক্লিয়ার
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-4">অর্ডার</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-3 py-4">কাস্টমার</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-3 py-4">আইটেম</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-3 py-4">মোট</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-3 py-4">পেমেন্ট</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-3 py-4">স্ট্যাটাস</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-3 py-4">তারিখ</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-4">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 bg-gray-100 rounded w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : orders.length > 0 ? (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-sm font-mono font-semibold text-green-600">
                          #{order.orderNumber}
                        </p>
                      </td>
                      <td className="px-3 py-4">
                        <p className="text-sm font-medium text-gray-800">
                          {order.shippingAddress?.name ?? "—"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {order.shippingAddress?.phone ?? ""}
                        </p>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-600">
                        {(order.items?.length ?? 0)} টি
                      </td>
                      <td className="px-3 py-4 text-sm font-bold text-gray-900">
                        ৳{order.total?.toLocaleString()}
                      </td>
                      <td className="px-3 py-4">
                        <p className="text-xs text-gray-600">
                          {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
                        </p>
                        <Badge
                          variant={
                            order.paymentStatus === "paid" ? "success" : "warning"
                          }
                        >
                          {order.paymentStatus === "paid" ? "পেইড" : "পেন্ডিং"}
                        </Badge>
                      </td>
                      <td className="px-3 py-4">
                        <Badge variant={getOrderStatusVariant(order.status)}>
                          {STATUS_LABELS[order.status] ?? order.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-4 text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString("bn-BD")}
                        <br />
                        <span className="text-gray-400">
                          {new Date(order.createdAt).toLocaleTimeString("bn-BD", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openDetail(order)}
                            className="p-1.5 rounded text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            title="বিস্তারিত দেখুন"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openStatusModal(order)}
                            className="p-1.5 rounded text-gray-500 hover:bg-green-50 hover:text-green-600 transition-colors"
                            title="স্ট্যাটাস আপডেট"
                            disabled={STATUS_FLOW[order.status]?.length === 0}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openCourierModal(order)}
                            className="p-1.5 rounded text-gray-500 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                            title="কুরিয়ার অ্যাসাইন"
                          >
                            <Truck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => printInvoice(order)}
                            className="p-1.5 rounded text-gray-500 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                            title="ইনভয়েস প্রিন্ট"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">কোনো অর্ডার পাওয়া যায়নি</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                পেজ {page} / {totalPages} (মোট {total} অর্ডার)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum =
                    totalPages <= 5
                      ? i + 1
                      : page <= 3
                      ? i + 1
                      : page >= totalPages - 2
                      ? totalPages - 4 + i
                      : page - 2 + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                        page === pageNum
                          ? "bg-green-600 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Detail Modal ── */}
      <Modal
        isOpen={detailModal}
        onClose={() => setDetailModal(false)}
        title={`অর্ডার বিস্তারিত — #${selectedOrder?.orderNumber}`}
        size="full"
      >
        {selectedOrder && (
          <div className="space-y-5">
            {/* Status + basic info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">স্ট্যাটাস</p>
                <Badge variant={getOrderStatusVariant(selectedOrder.status)} className="mt-1">
                  {STATUS_LABELS[selectedOrder.status] ?? selectedOrder.status}
                </Badge>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">মোট পরিমাণ</p>
                <p className="text-sm font-bold text-gray-900 mt-1">
                  ৳{selectedOrder.total?.toLocaleString()}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">পেমেন্ট</p>
                <p className="text-sm font-medium text-gray-800 mt-1">
                  {PAYMENT_LABELS[selectedOrder.paymentMethod] ?? selectedOrder.paymentMethod}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">তারিখ</p>
                <p className="text-sm text-gray-800 mt-1">
                  {new Date(selectedOrder.createdAt).toLocaleDateString("bn-BD")}
                </p>
              </div>
            </div>

            {/* Shipping address */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                ডেলিভারি ঠিকানা
              </h3>
              <div className="bg-blue-50 p-4 rounded-lg text-sm">
                <p className="font-semibold">{selectedOrder.shippingAddress?.name}</p>
                <p className="text-gray-600">{selectedOrder.shippingAddress?.phone}</p>
                <p className="text-gray-600">
                  {selectedOrder.shippingAddress?.address},{" "}
                  {selectedOrder.shippingAddress?.district}
                </p>
              </div>
            </div>

            {/* Items */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                অর্ডার আইটেম
              </h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-semibold">প্রোডাক্ট</th>
                      <th className="text-left px-3 py-2.5 text-xs text-gray-500 font-semibold">ভেরিয়েন্ট</th>
                      <th className="text-right px-3 py-2.5 text-xs text-gray-500 font-semibold">দাম</th>
                      <th className="text-right px-3 py-2.5 text-xs text-gray-500 font-semibold">পরিমাণ</th>
                      <th className="text-right px-4 py-2.5 text-xs text-gray-500 font-semibold">সাবটোটাল</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(selectedOrder.items ?? []).map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3">{item.name}</td>
                        <td className="px-3 py-3 text-gray-500">{item.variant ?? "—"}</td>
                        <td className="px-3 py-3 text-right">৳{item.price.toLocaleString()}</td>
                        <td className="px-3 py-3 text-right">{item.quantity}</td>
                        <td className="px-4 py-3 text-right font-semibold">
                          ৳{item.subtotal.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={4} className="px-4 py-2 text-right text-sm text-gray-500">সাবটোটাল</td>
                      <td className="px-4 py-2 text-right text-sm">৳{selectedOrder.subtotal?.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="px-4 py-2 text-right text-sm text-gray-500">ডেলিভারি চার্জ</td>
                      <td className="px-4 py-2 text-right text-sm">৳{selectedOrder.shippingCost?.toLocaleString()}</td>
                    </tr>
                    {selectedOrder.discount ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-2 text-right text-sm text-red-500">ছাড়</td>
                        <td className="px-4 py-2 text-right text-sm text-red-500">
                          -৳{selectedOrder.discount?.toLocaleString()}
                        </td>
                      </tr>
                    ) : null}
                    <tr className="bg-green-50">
                      <td colSpan={4} className="px-4 py-3 text-right font-bold text-gray-800">মোট</td>
                      <td className="px-4 py-3 text-right font-bold text-green-700">
                        ৳{selectedOrder.total?.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Status history */}
            {(selectedOrder.statusHistory ?? []).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">স্ট্যাটাস ইতিহাস</h3>
                <div className="space-y-2">
                  {selectedOrder.statusHistory!.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                      <div>
                        <Badge variant={getOrderStatusVariant(h.status)}>
                          {STATUS_LABELS[h.status] ?? h.status}
                        </Badge>
                        {h.note && (
                          <p className="text-xs text-gray-500 mt-1">{h.note}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(h.createdAt).toLocaleString("bn-BD")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedOrder.notes && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                <p className="text-xs font-semibold text-yellow-700">কাস্টমার নোট:</p>
                <p className="text-sm text-yellow-800 mt-1">{selectedOrder.notes}</p>
              </div>
            )}

            <ModalFooter>
              <Button
                variant="outline"
                onClick={() => printInvoice(selectedOrder)}
              >
                <Printer className="w-4 h-4 mr-1.5" /> ইনভয়েস প্রিন্ট
              </Button>
              <Button
                variant="brand"
                onClick={() => {
                  setDetailModal(false);
                  openStatusModal(selectedOrder);
                }}
                disabled={STATUS_FLOW[selectedOrder.status]?.length === 0}
              >
                স্ট্যাটাস আপডেট করুন
              </Button>
            </ModalFooter>
          </div>
        )}
      </Modal>

      {/* ── Status Update Modal ── */}
      <Modal
        isOpen={statusModal}
        onClose={() => setStatusModal(false)}
        title={`স্ট্যাটাস আপডেট — #${selectedOrder?.orderNumber}`}
        size="sm"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant={getOrderStatusVariant(selectedOrder.status)}>
                {STATUS_LABELS[selectedOrder.status]}
              </Badge>
              <span className="text-gray-400">→</span>
              <Badge variant={getOrderStatusVariant(newStatus)}>
                {STATUS_LABELS[newStatus]}
              </Badge>
            </div>

            <Select
              label="নতুন স্ট্যাটাস"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
              options={
                (STATUS_FLOW[selectedOrder.status] ?? []).map((s) => ({
                  value: s,
                  label: STATUS_LABELS[s] ?? s,
                }))
              }
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                নোট (ঐচ্ছিক)
              </label>
              <textarea
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
                placeholder="স্ট্যাটাস পরিবর্তনের কারণ লিখুন..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
              />
            </div>

            <ModalFooter>
              <Button variant="outline" onClick={() => setStatusModal(false)}>
                বাতিল
              </Button>
              <Button
                variant="brand"
                loading={statusLoading}
                onClick={handleStatusUpdate}
              >
                আপডেট করুন
              </Button>
            </ModalFooter>
          </div>
        )}
      </Modal>

      {/* ── Courier Modal ── */}
      <Modal
        isOpen={courierModal}
        onClose={() => setCourierModal(false)}
        title={`কুরিয়ার অ্যাসাইন — #${selectedOrder?.orderNumber}`}
        size="sm"
      >
        <div className="space-y-4">
          <Select
            label="কুরিয়ার সার্ভিস"
            value={selectedCourierId}
            onChange={(e) => setSelectedCourierId(e.target.value)}
            placeholder="কুরিয়ার সিলেক্ট করুন"
            options={couriers.map((c) => ({
              value: String(c.id),
              label: c.name,
            }))}
            required
          />

          <Input
            label="ট্র্যাকিং আইডি"
            placeholder="কুরিয়ার ট্র্যাকিং নম্বর"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
          />

          <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700">
            💡 কুরিয়ার অ্যাসাইন করলে অর্ডার স্বয়ংক্রিয়ভাবে "শিপড" স্ট্যাটাসে
            যাবে না। আলাদাভাবে স্ট্যাটাস আপডেট করুন।
          </div>

          <ModalFooter>
            <Button variant="outline" onClick={() => setCourierModal(false)}>
              বাতিল
            </Button>
            <Button
              variant="brand"
              loading={courierLoading}
              onClick={handleCourierAssign}
            >
              <Truck className="w-4 h-4 mr-1.5" /> অ্যাসাইন করুন
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  );
}