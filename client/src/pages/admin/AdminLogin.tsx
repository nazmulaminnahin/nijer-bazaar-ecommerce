import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, Store } from "lucide-react";
import { adminApi } from "@/lib/api";
import { useAdminAuthStore } from "@/store/adminAuthStore";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { setAdmin } = useAdminAuthStore();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.email) e.email = "ইমেইল দিন";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "বৈধ ইমেইল দিন";
    if (!form.password) e.password = "পাসওয়ার্ড দিন";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await adminApi.post("/auth/admin/login", form);
      const payload = res.data?.data ?? res.data;
      const token = payload?.token;
      const admin = payload?.admin;
      if (!token || !admin) {
        throw new Error("Invalid login response");
      }
      setAdmin(admin, token);
      toast.success("স্বাগতম! " + admin.name, "লগইন সফল");
      navigate("/admin/dashboard");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        "ইমেইল বা পাসওয়ার্ড ভুল হয়েছে";
      toast.error(msg, "লগইন ব্যর্থ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-green-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-8 py-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">নিজের বাজার</h1>
          <p className="text-green-100 text-sm mt-1">Admin Panel — নিরাপদ প্রবেশ</p>
        </div>

        {/* Form */}
        <div className="px-8 py-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            অ্যাডমিন লগইন
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="ইমেইল অ্যাড্রেস"
              type="email"
              placeholder="admin@nijerbazaar.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={errors.email}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="পাসওয়ার্ড"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              error={errors.password}
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )
              }
              onRightIconClick={() => setShowPassword(!showPassword)}
              required
            />

            <Button
              type="submit"
              variant="brand"
              size="lg"
              loading={loading}
              className="w-full !bg-green-600 hover:!bg-green-700"
            >
              {loading ? "লগইন হচ্ছে..." : "লগইন করুন"}
            </Button>
          </form>

          {/* Default seeded credentials */}
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-xs font-semibold text-green-700 mb-2">
              🔑 ডিফল্ট অ্যাডমিন ক্রেডেনশিয়াল (`npm run db:seed`):
            </p>
            <p className="text-xs text-green-700">
              Email: <strong>admin@nijerbazaar.com</strong>
            </p>
            <p className="text-xs text-green-700">
              Password: <strong>admin123456</strong>
            </p>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            <Link to="/" className="text-green-600 hover:underline font-medium">
              ← মূল ওয়েবসাইটে ফিরুন
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}