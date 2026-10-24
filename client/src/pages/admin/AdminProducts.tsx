import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit, Trash2, ToggleLeft, ToggleRight, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api";
import type { Product, Category } from "@nijer-bazaar/shared";

interface ProductForm {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: string;
  comparePrice: string;
  costPrice: string;
  sku: string;
  stock: string;
  categoryId: string;
  isFeatured: boolean;
  isActive: boolean;
  weight: string;
  tags: string;
}

const defaultForm: ProductForm = {
  name: "",
  slug: "",
  description: "",
  shortDescription: "",
  price: "",
  comparePrice: "",
  costPrice: "",
  sku: "",
  stock: "0",
  categoryId: "",
  isFeatured: false,
  isActive: true,
  weight: "",
  tags: "",
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.get("/products", {
        params: { page, limit: 10, search, categoryId: categoryFilter || undefined },
      });
      const d = res.data;
      setProducts(d.data ?? []);
      setTotalPages(d.pagination?.totalPages ?? 1);
    } catch {
      toast.error("প্রোডাক্ট লোড করা যায়নি");
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await adminApi.get("/categories");
      setCategories(res.data.data ?? []);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  function openCreate() {
    setEditProduct(null);
    setForm(defaultForm);
    setShowModal(true);
  }

  function openEdit(p: Product) {
    setEditProduct(p);
    setForm({
      name: p.name,
      slug: p.slug,
      description: p.description ?? "",
      shortDescription: p.shortDescription ?? "",
      price: String(p.price),
      comparePrice: String(p.comparePrice ?? ""),
      costPrice: String(p.costPrice ?? ""),
      sku: p.sku,
      stock: String(p.stock),
      categoryId: String(p.categoryId ?? ""),
      isFeatured: p.isFeatured,
      isActive: p.isActive,
      weight: String(p.weight ?? ""),
      tags: (p.tags ?? []).join(", "),
    });
    setShowModal(true);
  }

  function handleField(field: keyof ProductForm, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  async function handleSave() {
    if (!form.name.trim()) return toast.error("নাম দিন");
    if (!form.price.trim()) return toast.error("মূল্য দিন");
    if (!form.sku.trim()) return toast.error("SKU দিন");
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug || generateSlug(form.name),
        description: form.description,
        shortDescription: form.shortDescription,
        price: parseFloat(form.price),
        comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : null,
        costPrice: form.costPrice ? parseFloat(form.costPrice) : null,
        sku: form.sku,
        stock: parseInt(form.stock, 10),
        categoryId: form.categoryId ? parseInt(form.categoryId, 10) : null,
        isFeatured: form.isFeatured,
        isActive: form.isActive,
        weight: form.weight ? parseFloat(form.weight) : null,
        tags: form.tags
          ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
      };

      if (editProduct) {
        await adminApi.put(`/products/${editProduct.id}`, payload);
        toast.success("প্রোডাক্ট আপডেট হয়েছে");
      } else {
        await adminApi.post("/products", payload);
        toast.success("প্রোডাক্ট যোগ হয়েছে");
      }
      setShowModal(false);
      fetchProducts();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "সংরক্ষণ ব্যর্থ হয়েছে";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(p: Product) {
    try {
      await adminApi.patch(`/products/${p.id}/toggle`);
      toast.success(p.isActive ? "নিষ্ক্রিয় করা হয়েছে" : "সক্রিয় করা হয়েছে");
      fetchProducts();
    } catch {
      toast.error("আপডেট ব্যর্থ");
    }
  }

  async function handleDelete(id: number) {
    try {
      await adminApi.delete(`/products/${id}`);
      toast.success("প্রোডাক্ট মুছে ফেলা হয়েছে");
      setDeleteId(null);
      fetchProducts();
    } catch {
      toast.error("মুছতে ব্যর্থ");
    }
  }

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">প্রোডাক্ট ম্যানেজমেন্ট</h1>
          <p className="text-sm text-gray-500 mt-1">সকল পণ্য পরিচালনা করুন</p>
        </div>
        <Button variant="brand" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          নতুন প্রোডাক্ট
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="প্রোডাক্ট নাম বা SKU খুঁজুন..."
                leftIcon={<Search className="h-4 w-4" />}
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="w-48">
              <Select
                options={[{ value: "", label: "সব ক্যাটাগরি" }, ...categoryOptions]}
                value={categoryFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Package className="h-12 w-12 mb-3" />
              <p>কোনো প্রোডাক্ট পাওয়া যায়নি</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-600">প্রোডাক্ট</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">SKU</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">মূল্য</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">স্টক</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">ক্যাটাগরি</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">স্ট্যাটাস</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {product.images?.[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            {product.isFeatured && (
                              <Badge variant="info" className="mt-0.5">
                                ফিচার্ড
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                        {product.sku}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-medium text-gray-900">
                            ৳{product.price.toLocaleString()}
                          </span>
                          {product.comparePrice && (
                            <span className="ml-2 text-xs text-gray-400 line-through">
                              ৳{product.comparePrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            product.stock <= 0
                              ? "destructive"
                              : product.stock <= (product.lowStockThreshold ?? 5)
                              ? "warning"
                              : "success"
                          }
                        >
                          {product.stock} টি
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {product.category?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={product.isActive ? "success" : "secondary"}>
                          {product.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleToggle(product)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                            title={product.isActive ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"}
                          >
                            {product.isActive ? (
                              <ToggleRight className="h-4 w-4 text-green-500" />
                            ) : (
                              <ToggleLeft className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => openEdit(product)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(product.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            পূর্বের
          </Button>
          <span className="text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            পরবর্তী
          </Button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editProduct ? "প্রোডাক্ট সম্পাদনা" : "নতুন প্রোডাক্ট"}
        size="xl"
      >
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="প্রোডাক্টের নাম *"
              value={form.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                handleField("name", e.target.value);
                if (!editProduct) handleField("slug", generateSlug(e.target.value));
              }}
              placeholder="প্রোডাক্টের নাম"
            />
            <Input
              label="Slug"
              value={form.slug}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleField("slug", e.target.value)
              }
              placeholder="product-slug"
            />
            <Input
              label="মূল্য (৳) *"
              type="number"
              value={form.price}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleField("price", e.target.value)
              }
              placeholder="0"
            />
            <Input
              label="তুলনামূলক মূল্য (৳)"
              type="number"
              value={form.comparePrice}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleField("comparePrice", e.target.value)
              }
              placeholder="0"
            />
            <Input
              label="ক্রয়মূল্য (৳)"
              type="number"
              value={form.costPrice}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleField("costPrice", e.target.value)
              }
              placeholder="0"
            />
            <Input
              label="SKU *"
              value={form.sku}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleField("sku", e.target.value)
              }
              placeholder="NB-001"
            />
            <Input
              label="স্টক"
              type="number"
              value={form.stock}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleField("stock", e.target.value)
              }
              placeholder="0"
            />
            <Input
              label="ওজন (kg)"
              type="number"
              value={form.weight}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleField("weight", e.target.value)
              }
              placeholder="0.5"
            />
            <Select
              label="ক্যাটাগরি"
              options={[{ value: "", label: "কোনো ক্যাটাগরি নেই" }, ...categoryOptions]}
              value={form.categoryId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                handleField("categoryId", e.target.value)
              }
            />
            <Input
              label="ট্যাগ (কমা দিয়ে আলাদা করুন)"
              value={form.tags}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleField("tags", e.target.value)
              }
              placeholder="শাড়ি, লাল, সিল্ক"
            />
          </div>

          <Input
            label="সংক্ষিপ্ত বিবরণ"
            value={form.shortDescription}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleField("shortDescription", e.target.value)
            }
            placeholder="সংক্ষিপ্ত বিবরণ"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              বিস্তারিত বিবরণ
            </label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                handleField("description", e.target.value)
              }
              placeholder="পণ্যের বিস্তারিত বিবরণ..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleField("isFeatured", e.target.checked)
                }
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">ফিচার্ড প্রোডাক্ট</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleField("isActive", e.target.checked)
                }
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">সক্রিয়</span>
            </label>
          </div>
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={() => setShowModal(false)}>
            বাতিল
          </Button>
          <Button variant="brand" loading={saving} onClick={handleSave}>
            {editProduct ? "আপডেট করুন" : "যোগ করুন"}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="প্রোডাক্ট মুছুন"
        size="sm"
      >
        <div className="p-6">
          <p className="text-gray-600">
            আপনি কি নিশ্চিত এই প্রোডাক্টটি মুছে ফেলতে চান? এই কাজটি আর পূর্বাবস্থায় ফেরানো যাবে না।
          </p>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setDeleteId(null)}>
            বাতিল
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteId !== null && handleDelete(deleteId)}
          >
            মুছুন
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}