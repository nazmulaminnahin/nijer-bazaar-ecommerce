import React, { useEffect, useState, useCallback } from "react";
import {
  Plus, Edit2, Trash2, RefreshCw, Tag, Copy, X,
  Calendar, Percent, DollarSign,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api";
import type { Coupon } from "@nijer-bazaar/shared";

const EMPTY_FORM = {
  code: "", type: "percentage", value: "",
  minOrderAmount: "", maxDiscount: "",
  usageLimit: "", isActive: true, expiresAt: "",
};
type CouponForm = typeof EMPTY_FORM;

function generateCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | "delete" | null>(null);
  const [selected, setSelected] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CouponForm>(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.get("/coupons");
      setCoupons(res.data.coupons ?? res.data ?? []);
    } catch { toast.error("কুপন লোড হয়নি"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.code.trim()) e.code = "কুপন কোড দিন";
    if (!form.value || Number(form.value) <= 0) e.value = "বৈধ মান দিন";
    if (form.type === "percentage" && Number(form.value) > 100) e.value = "সর্বোচ্চ ১০০%";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, code: generateCode() });
    setErrors({}); setSelected(null); setModal("create");
  };

  const openEdit = (coupon: Coupon) => {
    setSelected(coupon);
    setForm({
      code: coupon.code, type: coupon.type, value: String(coupon.value),
      minOrderAmount: String(coupon.minOrderAmount ?? ""),
      maxDiscount: String(coupon.maxDiscount ?? ""),
      usageLimit: String(coupon.usageLimit ?? ""),
      isActive: coupon.isActive,
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : "",
    });
    setErrors({}); setModal("edit");
  };

  const openDelete = (coupon: Coupon) => { setSelected(coupon); setModal("delete"); };

  const handleSubmit = async () => {
    if (!validate()) return;
    setFormLoading(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: Number(form.value),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        isActive: form.isActive,
        expiresAt: form.expiresAt || null,
      };
      if (modal === "create") {
        await adminApi.post("/coupons", payload);
        toast.success("কুপন তৈরি হয়েছে");
      } else {
        await adminApi.put(`/coupons/${selected!.id}`, payload);
        toast.success("কুপন আপডেট হয়েছে");
      }
      setModal(null); fetchCoupons();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "অপারেশন ব্যর্থ");
    } finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setFormLoading(true);
    try {
      await adminApi.delete(`/coupons/${selected.id}`);
      toast.success("কুপন মুছে ফেলা হয়েছে");
      setModal(null); fetchCoupons();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "মুছে ফেলা ব্যর্থ");
    } finally { setFormLoading(false); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`"${code}" কপি হয়েছে`);
  };

  const isExpired = (coupon: Coupon) =>
    coupon.expiresAt ? new Date(coupon.expiresAt) < new Date() : false;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">কুপন ম্যানেজমেন্ট</h1>
          <p className="text-sm text-gray-500 mt-0.5">মোট {coupons.length} কুপন</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchCoupons} loading={loading}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> রিফ্রেশ
          </Button>
          <Button variant="brand" size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1.5" /> নতুন কুপন
          </Button>
        </div>
      </div>

      {/* Coupons Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse"><CardContent className="pt-6"><div className="h-24 bg-gray-100 rounded" /></CardContent></Card>
          ))}
        </div>
      ) : coupons.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((coupon) => {
            const expired = isExpired(coupon);
            const usagePercent = coupon.usageLimit
              ? Math.round((coupon.usageCount / coupon.usageLimit) * 100)
              : null;

            return (
              <Card key={coupon.id} className={`hover:shadow-md transition-shadow ${expired ? "opacity-60" : ""}`}>
                <CardContent className="pt-5">
                  {/* Code row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-green-100 rounded">
                        <Tag className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="font-mono font-bold text-gray-800 text-lg tracking-wider">
                        {coupon.code}
                      </span>
                    </div>
                    <button onClick={() => copyCode(coupon.code)} className="p-1.5 text-gray-400 hover:text-green-600 transition-colors">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Value */}
                  <div className="flex items-center gap-2 mb-3">
                    {coupon.type === "percentage" ? (
                      <Percent className="w-5 h-5 text-blue-500" />
                    ) : (
                      <DollarSign className="w-5 h-5 text-green-500" />
                    )}
                    <span className="text-2xl font-bold text-gray-900">
                      {coupon.type === "percentage" ? `${coupon.value}%` : `৳${coupon.value}`}
                    </span>
                    <span className="text-sm text-gray-500">ছাড়</span>
                  </div>

                  {/* Details */}
                  <div className="space-y-1 text-xs text-gray-500">
                    {coupon.minOrderAmount && (
                      <p>সর্বনিম্ন অর্ডার: ৳{coupon.minOrderAmount.toLocaleString()}</p>
                    )}
                    {coupon.maxDiscount && (
                      <p>সর্বোচ্চ ছাড়: ৳{coupon.maxDiscount.toLocaleString()}</p>
                    )}
                    {coupon.expiresAt && (
                      <p className={`flex items-center gap-1 ${expired ? "text-red-500" : ""}`}>
                        <Calendar className="w-3 h-3" />
                        মেয়াদ: {new Date(coupon.expiresAt).toLocaleDateString("bn-BD")}
                        {expired && " (মেয়াদ শেষ)"}
                      </p>
                    )}
                    <p>ব্যবহার: {coupon.usageCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}</p>
                  </div>

                  {/* Usage progress */}
                  {usagePercent !== null && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, usagePercent)}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Status + actions */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <Badge variant={expired ? "destructive" : coupon.isActive ? "success" : "secondary"}>
                        {expired ? "মেয়াদ শেষ" : coupon.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(coupon)} className="p-1.5 rounded text-gray-400 hover:bg-blue-50 hover:text-blue-600">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => openDelete(coupon)} className="p-1.5 rounded text-gray-400 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-3">কোনো কুপন নেই</p>
            <Button variant="brand" size="sm" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1.5" /> প্রথম কুপন তৈরি করুন
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modal === "create" || modal === "edit"}
        onClose={() => setModal(null)}
        title={modal === "create" ? "নতুন কুপন তৈরি" : `কুপন সম্পাদনা — ${selected?.code}`}
        size="md"
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                label="কুপন কোড"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                error={errors.code}
                placeholder="SAVE20"
                required
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" size="default" onClick={() => setForm((f) => ({ ...f, code: generateCode() }))}>
                র‍্যান্ডম
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="ছাড়ের ধরন"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              options={[
                { value: "percentage", label: "শতাংশ (%)" },
                { value: "fixed", label: "নির্দিষ্ট পরিমাণ (৳)" },
              ]}
            />
            <Input
              label={`ছাড়ের মান ${form.type === "percentage" ? "(%)" : "(৳)"}`}
              type="number"
              value={form.value}
              onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
              error={errors.value}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="সর্বনিম্ন অর্ডার (৳)"
              type="number"
              value={form.minOrderAmount}
              onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))}
            />
            <Input
              label="সর্বোচ্চ ছাড় (৳)"
              type="number"
              value={form.maxDiscount}
              onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="ব্যবহারের সীমা"
              type="number"
              value={form.usageLimit}
              onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))}
              placeholder="খালি = সীমাহীন"
            />
            <Input
              label="মেয়াদ শেষের তারিখ"
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="rounded border-gray-300 text-green-600"
            />
            <span className="text-sm text-gray-700">কুপন সক্রিয়</span>
          </label>

          <ModalFooter>
            <Button variant="outline" onClick={() => setModal(null)}>বাতিল</Button>
            <Button variant="brand" loading={formLoading} onClick={handleSubmit}>
              {modal === "create" ? "তৈরি করুন" : "আপডেট করুন"}
            </Button>
          </ModalFooter>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={modal === "delete"} onClose={() => setModal(null)} title="কুপন মুছুন" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-red-700 bg-red-50 p-4 rounded-lg border border-red-200">
            <strong>"{selected?.code}"</strong> কুপনটি মুছে ফেলতে চান?
          </p>
          <ModalFooter>
            <Button variant="outline" onClick={() => setModal(null)}>বাতিল</Button>
            <Button variant="destructive" loading={formLoading} onClick={handleDelete}>মুছে ফেলুন</Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  );
}