import React, { useEffect, useState, useCallback } from "react";
import {
  Plus, Edit2, Trash2, RefreshCw, Truck, ExternalLink, X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api";
import type { Courier } from "@nijer-bazaar/shared";

const COURIER_LOGOS: Record<string, string> = {
  pathao: "🚴",
  steadfast: "🚚",
  redx: "🔴",
  sundarban: "🌿",
  "sa-paribahan": "🚌",
};

const EMPTY_FORM = {
  name: "", slug: "", logo: "", trackingUrl: "", isActive: true,
};
type CourierForm = typeof EMPTY_FORM;

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

export default function AdminCouriers() {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | "delete" | null>(null);
  const [selected, setSelected] = useState<Courier | null>(null);
  const [form, setForm] = useState<CourierForm>(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchCouriers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.get("/couriers");
      setCouriers(res.data.couriers ?? res.data ?? []);
    } catch { toast.error("কুরিয়ার লোড হয়নি"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCouriers(); }, [fetchCouriers]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "নাম দিন";
    if (!form.slug.trim()) e.slug = "স্লাগ দিন";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openCreate = () => { setForm(EMPTY_FORM); setErrors({}); setSelected(null); setModal("create"); };
  const openEdit = (c: Courier) => {
    setSelected(c);
    setForm({ name: c.name, slug: c.slug, logo: c.logo ?? "", trackingUrl: c.trackingUrl ?? "", isActive: c.isActive });
    setErrors({}); setModal("edit");
  };
  const openDelete = (c: Courier) => { setSelected(c); setModal("delete"); };

  const handleSubmit = async () => {
    if (!validate()) return;
    setFormLoading(true);
    try {
      const payload = { ...form, logo: form.logo || null, trackingUrl: form.trackingUrl || null };
      if (modal === "create") {
        await adminApi.post("/couriers", payload);
        toast.success("কুরিয়ার তৈরি হয়েছে");
      } else {
        await adminApi.put(`/couriers/${selected!.id}`, payload);
        toast.success("কুরিয়ার আপডেট হয়েছে");
      }
      setModal(null); fetchCouriers();
    } catch (err: any) { toast.error(err?.response?.data?.error ?? "অপারেশন ব্যর্থ"); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setFormLoading(true);
    try {
      await adminApi.delete(`/couriers/${selected.id}`);
      toast.success("কুরিয়ার মুছে ফেলা হয়েছে");
      setModal(null); fetchCouriers();
    } catch (err: any) { toast.error(err?.response?.data?.error ?? "মুছে ফেলা ব্যর্থ"); }
    finally { setFormLoading(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">কুরিয়ার ম্যানেজমেন্ট</h1>
          <p className="text-sm text-gray-500 mt-0.5">মোট {couriers.length} কুরিয়ার</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchCouriers} loading={loading}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> রিফ্রেশ
          </Button>
          <Button variant="brand" size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1.5" /> নতুন কুরিয়ার
          </Button>
        </div>
      </div>

      {/* Pre-configured couriers info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-blue-700 mb-2">🚚 জনপ্রিয় কুরিয়ার সার্ভিস</p>
        <div className="flex flex-wrap gap-2">
          {["Pathao", "Steadfast", "RedX", "Sundarban", "SA Paribahan"].map((name) => (
            <span key={name} className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
              {name}
            </span>
          ))}
        </div>
      </div>

      {/* Couriers Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse"><CardContent className="pt-6"><div className="h-24 bg-gray-100 rounded" /></CardContent></Card>
          ))}
        </div>
      ) : couriers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {couriers.map((courier) => (
            <Card key={courier.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">
                      {courier.logo && courier.logo.startsWith("http") ? (
                        <img src={courier.logo} alt={courier.name} className="w-10 h-10 object-contain" />
                      ) : (
                        COURIER_LOGOS[courier.slug] ?? "🚚"
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{courier.name}</p>
                      <p className="text-xs text-gray-400">/{courier.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(courier)} className="p-1.5 rounded text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => openDelete(courier)} className="p-1.5 rounded text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <Badge variant={courier.isActive ? "success" : "secondary"}>
                    {courier.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
                  </Badge>
                  {courier.trackingUrl && (
                    <a href={courier.trackingUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                      ট্র্যাকিং URL <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-3">কোনো কুরিয়ার নেই</p>
            <Button variant="brand" size="sm" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1.5" /> কুরিয়ার যোগ করুন
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modal === "create" || modal === "edit"} onClose={() => setModal(null)}
        title={modal === "create" ? "নতুন কুরিয়ার" : `সম্পাদনা — ${selected?.name}`} size="md">
        <div className="space-y-4">
          <Input label="কুরিয়ারের নাম" value={form.name}
            onChange={(e) => { const name = e.target.value; setForm((f) => ({ ...f, name, slug: toSlug(name) })); }}
            error={errors.name} required />
          <Input label="স্লাগ" value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} error={errors.slug} required />
          <Input label="লোগো URL (ঐচ্ছিক)" value={form.logo}
            onChange={(e) => setForm((f) => ({ ...f, logo: e.target.value }))} placeholder="https://..." />
          <Input label="ট্র্যাকিং URL (ঐচ্ছিক)" value={form.trackingUrl}
            onChange={(e) => setForm((f) => ({ ...f, trackingUrl: e.target.value }))}
            placeholder="https://courier.com/track?id={trackingId}" />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="rounded border-gray-300 text-green-600" />
            <span className="text-sm text-gray-700">সক্রিয়</span>
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
      <Modal isOpen={modal === "delete"} onClose={() => setModal(null)} title="কুরিয়ার মুছুন" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-red-700 bg-red-50 p-4 rounded-lg border border-red-200">
            <strong>"{selected?.name}"</strong> কুরিয়ারটি মুছে ফেলতে চান?
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