import React, { useEffect, useState, useCallback } from "react";
import {
  Plus, RefreshCw, Gift, Copy, Trash2, ToggleLeft, ToggleRight,
  ChevronLeft, ChevronRight, Calendar, DollarSign,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api";
import type { GiftCard } from "@nijer-bazaar/shared";

export default function AdminGiftCards() {
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState({ initialBalance: "", expiresAt: "", quantity: "1" });
  const [formLoading, setFormLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchCards = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.get(`/gift-cards?page=${page}&limit=${limit}`);
      setCards(res.data.cards ?? []);
      setTotal(res.data.total ?? 0);
    } catch { toast.error("গিফট কার্ড লোড হয়নি"); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  const totalValue = cards.reduce((s, c) => s + c.currentBalance, 0);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.initialBalance || Number(form.initialBalance) <= 0) e.initialBalance = "বৈধ ব্যালেন্স দিন";
    if (Number(form.quantity) < 1 || Number(form.quantity) > 50) e.quantity = "১-৫০ এর মধ্যে দিন";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setFormLoading(true);
    try {
      const res = await adminApi.post("/gift-cards", {
        initialBalance: Number(form.initialBalance),
        expiresAt: form.expiresAt || null,
        quantity: Number(form.quantity),
      });
      toast.success(`${res.data.count} টি গিফট কার্ড তৈরি হয়েছে`);
      setCreateModal(false);
      setForm({ initialBalance: "", expiresAt: "", quantity: "1" });
      fetchCards();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "গিফট কার্ড তৈরি ব্যর্থ");
    } finally { setFormLoading(false); }
  };

  const handleToggle = async (card: GiftCard) => {
    try {
      await adminApi.patch(`/gift-cards/${card.id}/toggle`);
      toast.success(card.isActive ? "নিষ্ক্রিয় করা হয়েছে" : "সক্রিয় করা হয়েছে");
      fetchCards();
    } catch { toast.error("আপডেট ব্যর্থ"); }
  };

  const handleDelete = async (card: GiftCard) => {
    if (!window.confirm(`"${card.code}" মুছে ফেলতে চান?`)) return;
    try {
      await adminApi.delete(`/gift-cards/${card.id}`);
      toast.success("গিফট কার্ড মুছে ফেলা হয়েছে");
      fetchCards();
    } catch { toast.error("মুছে ফেলা ব্যর্থ"); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`"${code}" কপি হয়েছে`);
  };

  const isExpired = (card: GiftCard) =>
    card.expiresAt ? new Date(card.expiresAt) < new Date() : false;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">গিফট কার্ড</h1>
          <p className="text-sm text-gray-500 mt-0.5">মোট {total} গিফট কার্ড</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchCards} loading={loading}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> রিফ্রেশ
          </Button>
          <Button variant="brand" size="sm" onClick={() => setCreateModal(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> গিফট কার্ড তৈরি
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-5">
          <p className="text-xs text-gray-500">মোট কার্ড</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{total}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <p className="text-xs text-gray-500">সক্রিয় ব্যালেন্স</p>
          <p className="text-2xl font-bold text-green-600 mt-1">৳{totalValue.toLocaleString()}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <p className="text-xs text-gray-500">সক্রিয় কার্ড</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{cards.filter((c) => c.isActive && !isExpired(c)).length}</p>
        </CardContent></Card>
      </div>

      {/* Cards Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">কোড</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase px-3 py-3">মূল ব্যালেন্স</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase px-3 py-3">বর্তমান ব্যালেন্স</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-3 py-3">মেয়াদ</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-3 py-3">স্ট্যাটাস</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">অ্যাকশন</th>
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
                ) : cards.length > 0 ? (
                  cards.map((card) => {
                    const expired = isExpired(card);
                    const usedPercent = 100 - Math.round((card.currentBalance / card.initialBalance) * 100);
                    return (
                      <tr key={card.id} className={`hover:bg-gray-50 transition-colors ${expired ? "opacity-60" : ""}`}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <Gift className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span className="font-mono font-bold text-gray-800 tracking-wider">{card.code}</span>
                            <button onClick={() => copyCode(card.code)} className="text-gray-400 hover:text-green-600 transition-colors">
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right text-sm text-gray-600">৳{card.initialBalance.toLocaleString()}</td>
                        <td className="px-3 py-3 text-right">
                          <span className={`text-sm font-bold ${card.currentBalance <= 0 ? "text-red-500" : "text-green-600"}`}>
                            ৳{card.currentBalance.toLocaleString()}
                          </span>
                          {usedPercent > 0 && (
                            <p className="text-xs text-gray-400">{usedPercent}% ব্যবহৃত</p>
                          )}
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-500">
                          {card.expiresAt ? (
                            <span className={expired ? "text-red-500" : ""}>
                              {new Date(card.expiresAt).toLocaleDateString("bn-BD")}
                              {expired && " ✗"}
                            </span>
                          ) : "সীমাহীন"}
                        </td>
                        <td className="px-3 py-3">
                          <Badge variant={expired ? "destructive" : card.isActive ? "success" : "secondary"}>
                            {expired ? "মেয়াদ শেষ" : card.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
                          </Badge>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleToggle(card)} title={card.isActive ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"}
                              className="p-1.5 rounded text-gray-500 hover:bg-yellow-50 hover:text-yellow-600 transition-colors">
                              {card.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                            </button>
                            <button onClick={() => handleDelete(card)}
                              className="p-1.5 rounded text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                      <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p>কোনো গিফট কার্ড নেই</p>
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

      {/* Create Modal */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="গিফট কার্ড তৈরি করুন" size="sm">
        <div className="space-y-4">
          <Input label="ব্যালেন্স (৳)" type="number" value={form.initialBalance}
            onChange={(e) => setForm((f) => ({ ...f, initialBalance: e.target.value }))}
            error={errors.initialBalance} placeholder="যেমন: 500" required />
          <Input label="কতটি কার্ড তৈরি করবেন?" type="number" min="1" max="50"
            value={form.quantity}
            onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
            error={errors.quantity} hint="একসাথে সর্বোচ্চ ৫০টি" />
          <Input label="মেয়াদ শেষের তারিখ (ঐচ্ছিক)" type="date"
            value={form.expiresAt}
            onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))} />
          <div className="bg-green-50 p-3 rounded-lg text-xs text-green-700">
            💡 কোড স্বয়ংক্রিয়ভাবে তৈরি হবে (যেমন: ABCD-1234-EFGH-5678)
          </div>
          <ModalFooter>
            <Button variant="outline" onClick={() => setCreateModal(false)}>বাতিল</Button>
            <Button variant="brand" loading={formLoading} onClick={handleCreate}>
              <Gift className="w-4 h-4 mr-1.5" /> তৈরি করুন
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  );
}