import React, { useEffect, useState, useCallback } from "react";
import {
  Search, RefreshCw, Package, TrendingUp, TrendingDown,
  RotateCcw, AlertTriangle, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api";

interface InventoryItem {
  id: number;
  name: string;
  sku: string | null;
  stock: number;
  lowStockThreshold: number;
  price: number;
  isActive: boolean;
}

const TYPE_OPTIONS = [
  { value: "in", label: "স্টক ইন (যোগ করুন)" },
  { value: "out", label: "স্টক আউট (বাদ দিন)" },
  { value: "adjustment", label: "অ্যাডজাস্টমেন্ট" },
  { value: "return", label: "রিটার্ন" },
];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  in: <TrendingUp className="w-4 h-4 text-green-500" />,
  out: <TrendingDown className="w-4 h-4 text-red-500" />,
  adjustment: <RotateCcw className="w-4 h-4 text-blue-500" />,
  return: <Package className="w-4 h-4 text-orange-500" />,
};

export default function AdminInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  const [adjustModal, setAdjustModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustForm, setAdjustForm] = useState({ type: "in", quantity: "", note: "" });
  const [adjustLoading, setAdjustLoading] = useState(false);

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.get("/admin/inventory");
      setInventory(res.data.inventory ?? res.data ?? []);
    } catch { toast.error("ইনভেন্টরি লোড হয়নি"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const filtered = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.sku ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const lowStockCount = inventory.filter((i) => i.stock <= i.lowStockThreshold).length;
  const outOfStockCount = inventory.filter((i) => i.stock === 0).length;
  const totalStock = inventory.reduce((sum, i) => sum + i.stock, 0);

  const openAdjust = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustForm({ type: "in", quantity: "", note: "" });
    setAdjustModal(true);
  };

  const handleAdjust = async () => {
    if (!selectedItem || !adjustForm.quantity) {
      toast.warning("পরিমাণ দিন");
      return;
    }
    setAdjustLoading(true);
    try {
      await adminApi.post("/admin/inventory/adjust", {
        productId: selectedItem.id,
        type: adjustForm.type,
        quantity: Number(adjustForm.quantity),
        note: adjustForm.note || null,
      });
      toast.success(`${selectedItem.name} — স্টক আপডেট হয়েছে`);
      setAdjustModal(false);
      fetchInventory();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "স্টক আপডেট ব্যর্থ");
    } finally { setAdjustLoading(false); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ইনভেন্টরি ম্যানেজমেন্ট</h1>
          <p className="text-sm text-gray-500 mt-0.5">স্টক পর্যবেক্ষণ ও নিয়ন্ত্রণ</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchInventory} loading={loading}>
          <RefreshCw className="w-4 h-4 mr-1.5" /> রিফ্রেশ
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-gray-500">মোট প্রোডাক্ট</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{inventory.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-gray-500">মোট স্টক</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{totalStock.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-orange-500" /> কম স্টক
            </p>
            <p className="text-2xl font-bold text-orange-500 mt-1">{lowStockCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Package className="w-3 h-3 text-red-500" /> স্টক শেষ
            </p>
            <p className="text-2xl font-bold text-red-600 mt-1">{outOfStockCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-5">
          <Input
            placeholder="প্রোডাক্ট নাম বা SKU দিয়ে খুঁজুন..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-4">প্রোডাক্ট</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-3 py-4">SKU</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase px-3 py-4">বর্তমান স্টক</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase px-3 py-4">কম স্টক সীমা</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-3 py-4">স্ট্যাটাস</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-4">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded" /></td>
                      ))}
                    </tr>
                  ))
                ) : paginated.length > 0 ? (
                  paginated.map((item) => {
                    const isLow = item.stock > 0 && item.stock <= item.lowStockThreshold;
                    const isOut = item.stock === 0;
                    return (
                      <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${isOut ? "bg-red-50" : isLow ? "bg-orange-50" : ""}`}>
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                          <p className="text-xs text-gray-400">৳{item.price.toLocaleString()}</p>
                        </td>
                        <td className="px-3 py-4 text-sm font-mono text-gray-500">{item.sku ?? "—"}</td>
                        <td className="px-3 py-4 text-right">
                          <span className={`text-lg font-bold ${isOut ? "text-red-600" : isLow ? "text-orange-500" : "text-green-600"}`}>
                            {item.stock}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-right text-sm text-gray-500">{item.lowStockThreshold}</td>
                        <td className="px-3 py-4">
                          {isOut ? (
                            <Badge variant="destructive">স্টক শেষ</Badge>
                          ) : isLow ? (
                            <Badge variant="warning">কম স্টক</Badge>
                          ) : (
                            <Badge variant="success">পর্যাপ্ত</Badge>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <Button variant="outline" size="sm" onClick={() => openAdjust(item)}>
                            স্টক আপডেট
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                      কোনো প্রোডাক্ট পাওয়া যায়নি
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
                {filtered.length} প্রোডাক্টের মধ্যে {(page - 1) * itemsPerPage + 1}–{Math.min(page * itemsPerPage, filtered.length)} দেখাচ্ছে
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600">{page} / {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Adjust Stock Modal */}
      <Modal isOpen={adjustModal} onClose={() => setAdjustModal(false)} title={`স্টক আপডেট — ${selectedItem?.name}`} size="sm">
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-500">বর্তমান স্টক</p>
            <p className="text-2xl font-bold text-gray-900">{selectedItem?.stock}</p>
          </div>

          <Select
            label="অপারেশন টাইপ"
            value={adjustForm.type}
            onChange={(e) => setAdjustForm((f) => ({ ...f, type: e.target.value }))}
            options={TYPE_OPTIONS}
          />

          <Input
            label="পরিমাণ"
            type="number"
            min="1"
            value={adjustForm.quantity}
            onChange={(e) => setAdjustForm((f) => ({ ...f, quantity: e.target.value }))}
            placeholder="কতটি?"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">নোট (ঐচ্ছিক)</label>
            <textarea
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={2}
              value={adjustForm.note}
              onChange={(e) => setAdjustForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="স্টক পরিবর্তনের কারণ..."
            />
          </div>

          {adjustForm.quantity && (
            <div className={`p-3 rounded-lg text-sm font-medium ${adjustForm.type === "out" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
              {adjustForm.type === "out" ? "স্টক আউট" : "স্টক ইন"}: {adjustForm.quantity} টি →
              নতুন স্টক:{" "}
              {adjustForm.type === "out" || adjustForm.type === "adjustment"
                ? Math.max(0, (selectedItem?.stock ?? 0) - Number(adjustForm.quantity))
                : (selectedItem?.stock ?? 0) + Number(adjustForm.quantity)}
            </div>
          )}

          <ModalFooter>
            <Button variant="outline" onClick={() => setAdjustModal(false)}>বাতিল</Button>
            <Button variant="brand" loading={adjustLoading} onClick={handleAdjust}>
              আপডেট করুন
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  );
}