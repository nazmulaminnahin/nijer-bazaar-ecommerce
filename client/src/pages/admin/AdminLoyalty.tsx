import React, { useEffect, useState, useCallback } from "react";
import {
  Star, RefreshCw, Gift, TrendingUp, TrendingDown,
  ChevronLeft, ChevronRight, Plus, Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api";

interface LoyaltyTx {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  type: "earn" | "redeem" | "expire" | "bonus";
  points: number;
  description: string | null;
  createdAt: string;
}

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  earn: { label: "অর্জন", color: "bg-green-100 text-green-700", icon: <TrendingUp className="w-3 h-3" /> },
  redeem: { label: "ব্যয়", color: "bg-red-100 text-red-700", icon: <TrendingDown className="w-3 h-3" /> },
  expire: { label: "মেয়াদ শেষ", color: "bg-gray-100 text-gray-600", icon: <Star className="w-3 h-3" /> },
  bonus: { label: "বোনাস", color: "bg-yellow-100 text-yellow-700", icon: <Gift className="w-3 h-3" /> },
};

export default function AdminLoyalty() {
  const [transactions, setTransactions] = useState<LoyaltyTx[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  const [grantModal, setGrantModal] = useState(false);
  const [grantForm, setGrantForm] = useState({ userId: "", points: "", description: "" });
  const [grantLoading, setGrantLoading] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.get(`/loyalty?page=${page}&limit=${limit}`);
      setTransactions(res.data.transactions ?? []);
      setTotal(res.data.total ?? 0);
    } catch { toast.error("লয়্যালটি ডেটা লোড হয়নি"); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const totalPoints = transactions.reduce((s, t) =>
    t.type === "earn" || t.type === "bonus" ? s + t.points : s - t.points, 0
  );

  const handleGrant = async () => {
    if (!grantForm.userId || !grantForm.points) {
      toast.warning("ইউজার আইডি ও পয়েন্ট দিন");
      return;
    }
    setGrantLoading(true);
    try {
      await adminApi.post("/loyalty/grant", {
        userId: Number(grantForm.userId),
        points: Number(grantForm.points),
        description: grantForm.description || null,
      });
      toast.success(`${grantForm.points} পয়েন্ট দেওয়া হয়েছে`);
      setGrantModal(false);
      setGrantForm({ userId: "", points: "", description: "" });
      fetchTransactions();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "পয়েন্ট দেওয়া ব্যর্থ");
    } finally { setGrantLoading(false); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">লয়্যালটি পয়েন্ট</h1>
          <p className="text-sm text-gray-500 mt-0.5">কাস্টমার পুরস্কার প্রোগ্রাম</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchTransactions} loading={loading}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> রিফ্রেশ
          </Button>
          <Button variant="brand" size="sm" onClick={() => setGrantModal(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> পয়েন্ট দিন
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "মোট লেনদেন", value: total, color: "text-gray-900" },
          { label: "এই পেজে পয়েন্ট", value: totalPoints, color: "text-green-600" },
          { label: "বোনাস লেনদেন", value: transactions.filter((t) => t.type === "bonus").length, color: "text-yellow-600" },
          { label: "রিডিম লেনদেন", value: transactions.filter((t) => t.type === "redeem").length, color: "text-red-600" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-5">
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader><CardTitle>লয়্যালটি লেনদেন ইতিহাস</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">কাস্টমার</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-3 py-3">ধরন</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase px-3 py-3">পয়েন্ট</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-3 py-3">বিবরণ</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">তারিখ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 5 }).map((__, j) => (
                        <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded" /></td>
                      ))}
                    </tr>
                  ))
                ) : transactions.length > 0 ? (
                  transactions.map((tx) => {
                    const config = TYPE_CONFIG[tx.type];
                    const isPositive = tx.type === "earn" || tx.type === "bonus";
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          <p className="text-sm font-medium text-gray-800">{tx.userName}</p>
                          <p className="text-xs text-gray-400">{tx.userEmail}</p>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${config.color}`}>
                            {config.icon} {config.label}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <span className={`text-sm font-bold ${isPositive ? "text-green-600" : "text-red-500"}`}>
                            {isPositive ? "+" : "-"}{tx.points}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-500 max-w-[200px] truncate">
                          {tx.description ?? "—"}
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-500">
                          {new Date(tx.createdAt).toLocaleDateString("bn-BD")}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-gray-400">
                      কোনো লেনদেন নেই
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">পেজ {page} / {totalPages}</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grant Points Modal */}
      <Modal isOpen={grantModal} onClose={() => setGrantModal(false)} title="কাস্টমারকে পয়েন্ট দিন" size="sm">
        <div className="space-y-4">
          <Input label="কাস্টমার আইডি" type="number" value={grantForm.userId}
            onChange={(e) => setGrantForm((f) => ({ ...f, userId: e.target.value }))}
            placeholder="কাস্টমার ID নম্বর" required />
          <Input label="পয়েন্টের পরিমাণ" type="number" value={grantForm.points}
            onChange={(e) => setGrantForm((f) => ({ ...f, points: e.target.value }))}
            placeholder="যেমন: 100" required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">বিবরণ (ঐচ্ছিক)</label>
            <textarea className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={2} value={grantForm.description}
              onChange={(e) => setGrantForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="পয়েন্ট দেওয়ার কারণ..." />
          </div>
          <ModalFooter>
            <Button variant="outline" onClick={() => setGrantModal(false)}>বাতিল</Button>
            <Button variant="brand" loading={grantLoading} onClick={handleGrant}>
              <Gift className="w-4 h-4 mr-1.5" /> পয়েন্ট দিন
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  );
}