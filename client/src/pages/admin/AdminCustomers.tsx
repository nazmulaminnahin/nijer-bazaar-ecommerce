import React, { useEffect, useState, useCallback } from "react";
import {
  Search, RefreshCw, Eye, MessageSquare, Users,
  ChevronLeft, ChevronRight, Star, ShoppingBag, X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api";
import type { User } from "@nijer-bazaar/shared";

interface CustomerDetail extends User {
  totalOrders: number;
  totalSpent: number;
  lastOrderAt?: string;
  crmNotes?: { id: number; note: string; createdAt: string }[];
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<CustomerDetail[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 15;

  const [selected, setSelected] = useState<CustomerDetail | null>(null);
  const [detailModal, setDetailModal] = useState(false);
  const [noteModal, setNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteLoading, setNoteLoading] = useState(false);

  const totalPages = Math.ceil(total / limit);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page), limit: String(limit),
        ...(search && { search }),
      });
      const res = await adminApi.get(`/admin/customers?${params}`);
      setCustomers(res.data.customers ?? res.data.data ?? []);
      setTotal(res.data.total ?? 0);
    } catch { toast.error("কাস্টমার লোড হয়নি"); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);
  useEffect(() => { setPage(1); }, [search]);

  const openDetail = async (customer: CustomerDetail) => {
    try {
      const res = await adminApi.get(`/admin/customers/${customer.id}`);
      setSelected(res.data.customer ?? customer);
    } catch { setSelected(customer); }
    setDetailModal(true);
  };

  const openNote = (customer: CustomerDetail) => {
    setSelected(customer); setNoteText(""); setNoteModal(true);
  };

  const handleAddNote = async () => {
    if (!selected || !noteText.trim()) { toast.warning("নোট লিখুন"); return; }
    setNoteLoading(true);
    try {
      await adminApi.post(`/admin/customers/${selected.id}/notes`, { note: noteText.trim() });
      toast.success("নোট যোগ করা হয়েছে");
      setNoteModal(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "নোট যোগ ব্যর্থ");
    } finally { setNoteLoading(false); }
  };

  const getLoyaltyTier = (points: number) => {
    if (points >= 5000) return { label: "গোল্ড", color: "bg-yellow-100 text-yellow-700" };
    if (points >= 1000) return { label: "সিলভার", color: "bg-gray-100 text-gray-600" };
    return { label: "ব্রোঞ্জ", color: "bg-orange-100 text-orange-600" };
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">কাস্টমার ম্যানেজমেন্ট (CRM)</h1>
          <p className="text-sm text-gray-500 mt-0.5">মোট {total} কাস্টমার</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchCustomers} loading={loading}>
          <RefreshCw className="w-4 h-4 mr-1.5" /> রিফ্রেশ
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-5">
          <Input
            placeholder="নাম, ইমেইল বা ফোন নম্বর..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-4">কাস্টমার</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-3 py-4">ফোন</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase px-3 py-4">মোট অর্ডার</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase px-3 py-4">মোট ব্যয়</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-3 py-4">লয়্যালটি</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-3 py-4">যোগ দিয়েছে</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-4">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded" /></td>
                      ))}
                    </tr>
                  ))
                ) : customers.length > 0 ? (
                  customers.map((customer) => {
                    const tier = getLoyaltyTier(customer.loyaltyPoints);
                    return (
                      <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm flex-shrink-0">
                              {customer.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{customer.name}</p>
                              <p className="text-xs text-gray-400">{customer.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-600">{customer.phone ?? "—"}</td>
                        <td className="px-3 py-4 text-right text-sm font-semibold text-gray-900">
                          {(customer.totalOrders ?? 0).toLocaleString()}
                        </td>
                        <td className="px-3 py-4 text-right text-sm font-bold text-green-700">
                          ৳{(customer.totalSpent ?? 0).toLocaleString()}
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tier.color}`}>
                              {tier.label}
                            </span>
                            <span className="text-xs text-gray-500">{customer.loyaltyPoints} পয়েন্ট</span>
                          </div>
                        </td>
                        <td className="px-3 py-4 text-xs text-gray-500">
                          {new Date(customer.createdAt).toLocaleDateString("bn-BD")}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openDetail(customer)} className="p-1.5 rounded text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors" title="বিস্তারিত">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => openNote(customer)} className="p-1.5 rounded text-gray-500 hover:bg-green-50 hover:text-green-600 transition-colors" title="নোট যোগ করুন">
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">কোনো কাস্টমার পাওয়া যায়নি</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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

      {/* Detail Modal */}
      <Modal isOpen={detailModal} onClose={() => setDetailModal(false)} title={`কাস্টমার বিস্তারিত — ${selected?.name}`} size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-2xl">
                {selected.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selected.name}</h3>
                <p className="text-gray-500">{selected.email}</p>
                <p className="text-gray-500">{selected.phone ?? "ফোন নেই"}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <ShoppingBag className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-green-700">{selected.totalOrders ?? 0}</p>
                <p className="text-xs text-green-600">মোট অর্ডার</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <p className="text-lg font-bold text-blue-700">৳{(selected.totalSpent ?? 0).toLocaleString()}</p>
                <p className="text-xs text-blue-600">মোট ব্যয়</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg text-center">
                <Star className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-yellow-700">{selected.loyaltyPoints}</p>
                <p className="text-xs text-yellow-600">পয়েন্ট</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500">নিবন্ধন তারিখ: {new Date(selected.createdAt).toLocaleDateString("bn-BD")}</p>
              {selected.lastOrderAt && (
                <p className="text-xs text-gray-500">শেষ অর্ডার: {new Date(selected.lastOrderAt).toLocaleDateString("bn-BD")}</p>
              )}
            </div>

            {(selected.crmNotes ?? []).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">CRM নোট</h4>
                <div className="space-y-2">
                  {selected.crmNotes!.map((n) => (
                    <div key={n.id} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{n.note}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString("bn-BD")}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <ModalFooter>
              <Button variant="outline" onClick={() => { setDetailModal(false); openNote(selected); }}>
                <MessageSquare className="w-4 h-4 mr-1.5" /> নোট যোগ করুন
              </Button>
              <Button variant="brand" onClick={() => setDetailModal(false)}>বন্ধ করুন</Button>
            </ModalFooter>
          </div>
        )}
      </Modal>

      {/* Note Modal */}
      <Modal isOpen={noteModal} onClose={() => setNoteModal(false)} title={`CRM নোট — ${selected?.name}`} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">নোট লিখুন</label>
            <textarea
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={4}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="কাস্টমার সম্পর্কে গুরুত্বপূর্ণ তথ্য..."
            />
          </div>
          <ModalFooter>
            <Button variant="outline" onClick={() => setNoteModal(false)}>বাতিল</Button>
            <Button variant="brand" loading={noteLoading} onClick={handleAddNote}>
              নোট সংরক্ষণ করুন
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  );
}