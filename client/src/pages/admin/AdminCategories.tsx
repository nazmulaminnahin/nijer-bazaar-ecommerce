import React, { useEffect, useState, useCallback } from "react";
import { Plus, Edit2, Trash2, RefreshCw, Tag, X, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api";
import type { Category } from "@nijer-bazaar/shared";

const EMPTY_FORM = {
  name: "", slug: "", description: "", image: "",
  parentId: "", sortOrder: "0", isActive: true,
};
type CatForm = typeof EMPTY_FORM;

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | "delete" | null>(null);
  const [selected, setSelected] = useState<Category | null>(null);
  const [form, setForm] = useState<CatForm>(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.get("/categories");
      setCategories(res.data.categories ?? res.data ?? []);
    } catch { toast.error("ক্যাটাগরি লোড হয়নি"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "ক্যাটাগরি নাম দিন";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openCreate = () => {
    setForm(EMPTY_FORM); setErrors({}); setSelected(null); setModal("create");
  };

  const openEdit = (cat: Category) => {
    setSelected(cat);
    setForm({
      name: cat.name, slug: cat.slug, description: cat.description ?? "",
      image: cat.image ?? "", parentId: String(cat.parentId ?? ""),
      sortOrder: String(cat.sortOrder), isActive: cat.isActive,
    });
    setErrors({}); setModal("edit");
  };

  const openDelete = (cat: Category) => { setSelected(cat); setModal("delete"); };

  const handleSubmit = async () => {
    if (!validate()) return;
    setFormLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug || toSlug(form.name),
        description: form.description || null,
        image: form.image || null,
        parentId: form.parentId ? Number(form.parentId) : null,
        sortOrder: Number(form.sortOrder),
        isActive: form.isActive,
      };
      if (modal === "create") {
        await adminApi.post("/categories", payload);
        toast.success("ক্যাটাগরি তৈরি হয়েছে");
      } else {
        await adminApi.put(`/categories/${selected!.id}`, payload);
        toast.success("ক্যাটাগরি আপডেট হয়েছে");
      }
      setModal(null); fetchCategories();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "অপারেশন ব্যর্থ");
    } finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setFormLoading(true);
    try {
      await adminApi.delete(`/categories/${selected.id}`);
      toast.success("ক্যাটাগরি মুছে ফেলা হয়েছে");
      setModal(null); fetchCategories();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "মুছে ফেলা ব্যর্থ");
    } finally { setFormLoading(false); }
  };

  // Separate parent and child categories
  const parentCategories = categories.filter((c) => !c.parentId);
  const getChildren = (parentId: number) => categories.filter((c) => c.parentId === parentId);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ক্যাটাগরি ম্যানেজমেন্ট</h1>
          <p className="text-sm text-gray-500 mt-0.5">মোট {categories.length} ক্যাটাগরি</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchCategories} loading={loading}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> রিফ্রেশ
          </Button>
          <Button variant="brand" size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1.5" /> নতুন ক্যাটাগরি
          </Button>
        </div>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6"><div className="h-20 bg-gray-100 rounded" /></CardContent>
            </Card>
          ))}
        </div>
      ) : parentCategories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {parentCategories.map((cat) => {
            const children = getChildren(cat.id);
            return (
              <Card key={cat.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                        {cat.image ? (
                          <img src={cat.image} alt={cat.name} className="w-8 h-8 rounded object-cover" />
                        ) : (
                          <Tag className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{cat.name}</p>
                        <p className="text-xs text-gray-400">/{cat.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(cat)} className="p-1.5 rounded text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => openDelete(cat)} className="p-1.5 rounded text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant={cat.isActive ? "success" : "secondary"}>
                      {cat.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
                    </Badge>
                    <span className="text-xs text-gray-400">ক্রম: {cat.sortOrder}</span>
                  </div>

                  {cat.description && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">{cat.description}</p>
                  )}

                  {children.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-500 mb-1.5">
                        সাব-ক্যাটাগরি ({children.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {children.map((child) => (
                          <span key={child.id} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5">
                            {child.name}
                            <button onClick={() => openEdit(child)} className="hover:text-blue-600">
                              <Edit2 className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-3">কোনো ক্যাটাগরি নেই</p>
            <Button variant="brand" size="sm" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1.5" /> প্রথম ক্যাটাগরি তৈরি করুন
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modal === "create" || modal === "edit"}
        onClose={() => setModal(null)}
        title={modal === "create" ? "নতুন ক্যাটাগরি" : `সম্পাদনা — ${selected?.name}`}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="ক্যাটাগরি নাম"
            value={form.name}
            onChange={(e) => {
              const name = e.target.value;
              setForm((f) => ({ ...f, name, slug: toSlug(name) }));
            }}
            error={errors.name}
            required
          />
          <Input
            label="স্লাগ"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
          />
          <Select
            label="প্যারেন্ট ক্যাটাগরি (ঐচ্ছিক)"
            value={form.parentId}
            onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
            placeholder="কোনো প্যারেন্ট নেই (মূল ক্যাটাগরি)"
            options={categories
              .filter((c) => !c.parentId && c.id !== selected?.id)
              .map((c) => ({ value: String(c.id), label: c.name }))}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">বিবরণ</label>
            <textarea
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <Input
            label="ছবির URL (ঐচ্ছিক)"
            value={form.image}
            onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
            placeholder="https://..."
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="সর্ট অর্ডার"
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
            />
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="rounded border-gray-300 text-green-600"
                />
                <span className="text-sm text-gray-700">সক্রিয়</span>
              </label>
            </div>
          </div>
          <ModalFooter>
            <Button variant="outline" onClick={() => setModal(null)}>বাতিল</Button>
            <Button variant="brand" loading={formLoading} onClick={handleSubmit}>
              {modal === "create" ? "তৈরি করুন" : "আপডেট করুন"}
            </Button>
          </ModalFooter>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={modal === "delete"} onClose={() => setModal(null)} title="ক্যাটাগরি মুছুন" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-red-700 bg-red-50 p-4 rounded-lg border border-red-200">
            <strong>"{selected?.name}"</strong> মুছে ফেলতে চান? এই ক্যাটাগরির সকল প্রোডাক্ট আনক্যাটাগরাইজড হয়ে যাবে।
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