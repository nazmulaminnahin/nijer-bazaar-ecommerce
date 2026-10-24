import React, { useEffect, useState, useCallback } from "react";
import {
  Plus, Edit2, Trash2, RefreshCw, UserCog, Shield, Key,
  ChevronLeft, ChevronRight, Eye, EyeOff,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api";

interface StaffMember {
  id: number;
  name: string;
  email: string;
  role: "super_admin" | "admin" | "manager" | "staff";
  isActive: boolean;
  createdAt: string;
}

const ROLE_OPTIONS = [
  { value: "admin", label: "অ্যাডমিন" },
  { value: "manager", label: "ম্যানেজার" },
  { value: "staff", label: "স্টাফ" },
];

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  super_admin: { label: "সুপার অ্যাডমিন", color: "bg-red-100 text-red-700" },
  admin: { label: "অ্যাডমিন", color: "bg-purple-100 text-purple-700" },
  manager: { label: "ম্যানেজার", color: "bg-blue-100 text-blue-700" },
  staff: { label: "স্টাফ", color: "bg-gray-100 text-gray-700" },
};

const ALL_PERMISSIONS = [
  { key: "orders.view", label: "অর্ডার দেখা" },
  { key: "orders.manage", label: "অর্ডার ম্যানেজ" },
  { key: "products.view", label: "প্রোডাক্ট দেখা" },
  { key: "products.manage", label: "প্রোডাক্ট ম্যানেজ" },
  { key: "customers.view", label: "কাস্টমার দেখা" },
  { key: "customers.manage", label: "কাস্টমার ম্যানেজ" },
  { key: "inventory.manage", label: "ইনভেন্টরি ম্যানেজ" },
  { key: "reports.view", label: "রিপোর্ট দেখা" },
  { key: "coupons.manage", label: "কুপন ম্যানেজ" },
  { key: "accounting.view", label: "অ্যাকাউন্টিং দেখা" },
  { key: "settings.manage", label: "সেটিংস পরিবর্তন" },
];

const EMPTY_FORM = {
  name: "", email: "", password: "", role: "staff",
  isActive: true, permissions: [] as string[],
};
type StaffForm = typeof EMPTY_FORM;

export default function AdminStaff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | "delete" | null>(null);
  const [selected, setSelected] = useState<StaffMember | null>(null);
  const [form, setForm] = useState<StaffForm>(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.get("/admin/staff");
      setStaff(res.data.staff ?? []);
    } catch { toast.error("স্টাফ লোড হয়নি"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "নাম দিন";
    if (!form.email.trim()) e.email = "ইমেইল দিন";
    if (modal === "create" && !form.password) e.password = "পাসওয়ার্ড দিন";
    if (form.password && form.password.length < 6) e.password = "পাসওয়ার্ড কমপক্ষে ৬ অক্ষর";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openCreate = () => {
    setForm(EMPTY_FORM); setErrors({}); setSelected(null);
    setShowPassword(false); setModal("create");
  };

  const openEdit = (s: StaffMember) => {
    setSelected(s);
    setForm({ name: s.name, email: s.email, password: "", role: s.role, isActive: s.isActive, permissions: [] });
    setErrors({}); setShowPassword(false); setModal("edit");
  };

  const openDelete = (s: StaffMember) => { setSelected(s); setModal("delete"); };

  const togglePermission = (key: string) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter((p) => p !== key)
        : [...f.permissions, key],
    }));
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setFormLoading(true);
    try {
      if (modal === "create") {
        await adminApi.post("/admin/staff", form);
        toast.success("স্টাফ তৈরি হয়েছে");
      } else {
        await adminApi.put(`/admin/staff/${selected!.id}`, form);
        toast.success("স্টাফ আপডেট হয়েছে");
      }
      setModal(null); fetchStaff();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "অপারেশন ব্যর্থ");
    } finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setFormLoading(true);
    try {
      await adminApi.delete(`/admin/staff/${selected.id}`);
      toast.success("স্টাফ মুছে ফেলা হয়েছে");
      setModal(null); fetchStaff();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "মুছে ফেলা ব্যর্থ");
    } finally { setFormLoading(false); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">স্টাফ ম্যানেজমেন্ট</h1>
          <p className="text-sm text-gray-500 mt-0.5">মোট {staff.length} জন স্টাফ</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchStaff} loading={loading}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> রিফ্রেশ
          </Button>
          <Button variant="brand" size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1.5" /> নতুন স্টাফ
          </Button>
        </div>
      </div>

      {/* Staff Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse"><CardContent className="pt-6"><div className="h-24 bg-gray-100 rounded" /></CardContent></Card>
          ))}
        </div>
      ) : staff.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((member) => {
            const roleConfig = ROLE_CONFIG[member.role];
            return (
              <Card key={member.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{member.name}</p>
                        <p className="text-xs text-gray-400">{member.email}</p>
                      </div>
                    </div>
                    {member.role !== "super_admin" && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => openEdit(member)} className="p-1.5 rounded text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => openDelete(member)} className="p-1.5 rounded text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${roleConfig.color}`}>
                      <Shield className="w-3 h-3" />
                      {roleConfig.label}
                    </span>
                    <Badge variant={member.isActive ? "success" : "secondary"}>
                      {member.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
                    </Badge>
                  </div>

                  <p className="text-xs text-gray-400 mt-2">
                    যোগ দিয়েছে: {new Date(member.createdAt).toLocaleDateString("bn-BD")}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <UserCog className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-3">কোনো স্টাফ নেই</p>
            <Button variant="brand" size="sm" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1.5" /> স্টাফ যোগ করুন
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modal === "create" || modal === "edit"} onClose={() => setModal(null)}
        title={modal === "create" ? "নতুন স্টাফ তৈরি" : `সম্পাদনা — ${selected?.name}`} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="পুরো নাম" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              error={errors.name} required />
            <Input label="ইমেইল" type="email" value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              error={errors.email} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                পাসওয়ার্ড {modal === "edit" && <span className="text-gray-400 font-normal">(খালি রাখলে পরিবর্তন হবে না)</span>}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={modal === "edit" ? "নতুন পাসওয়ার্ড" : "পাসওয়ার্ড"}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600">⚠ {errors.password}</p>}
            </div>
            <Select label="ভূমিকা (Role)" value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as any }))}
              options={ROLE_OPTIONS} />
          </div>

          {/* Permissions */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-gray-500" /> অনুমতি (Permissions)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              {ALL_PERMISSIONS.map((perm) => (
                <label key={perm.key} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.permissions.includes(perm.key)}
                    onChange={() => togglePermission(perm.key)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                  <span className="text-xs text-gray-600">{perm.label}</span>
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="rounded border-gray-300 text-green-600" />
            <span className="text-sm text-gray-700">অ্যাকাউন্ট সক্রিয়</span>
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
      <Modal isOpen={modal === "delete"} onClose={() => setModal(null)} title="স্টাফ মুছুন" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-red-700 bg-red-50 p-4 rounded-lg border border-red-200">
            <strong>"{selected?.name}"</strong> এর অ্যাকাউন্ট মুছে ফেলতে চান?
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