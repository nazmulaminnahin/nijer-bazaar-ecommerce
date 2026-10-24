import React, { useEffect, useState } from "react";
import {
  Settings, Store, Globe, CreditCard, Truck, Bell,
  Save, RefreshCw, Shield, Palette, Phone,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api";

type SettingTab = "store" | "payment" | "shipping" | "notifications" | "loyalty" | "security";

const TABS: { key: SettingTab; label: string; icon: React.ReactNode }[] = [
  { key: "store", label: "স্টোর তথ্য", icon: <Store className="w-4 h-4" /> },
  { key: "payment", label: "পেমেন্ট", icon: <CreditCard className="w-4 h-4" /> },
  { key: "shipping", label: "শিপিং", icon: <Truck className="w-4 h-4" /> },
  { key: "notifications", label: "নোটিফিকেশন", icon: <Bell className="w-4 h-4" /> },
  { key: "loyalty", label: "লয়্যালটি", icon: <Store className="w-4 h-4" /> },
  { key: "security", label: "নিরাপত্তা", icon: <Shield className="w-4 h-4" /> },
];

const DEFAULT_SETTINGS = {
  // Store
  storeName: "নিজের বাজার",
  storeTagline: "আপনার বিশ্বস্ত অনলাইন শপ",
  storeEmail: "support@nijerbazaar.com",
  storePhone: "01700000000",
  storeAddress: "ঢাকা, বাংলাদেশ",
  storeCurrency: "BDT",
  storeLanguage: "bn",
  // Payment
  codEnabled: true,
  bkashEnabled: true,
  nagadEnabled: true,
  cardEnabled: false,
  bkashNumber: "01700000000",
  nagadNumber: "01700000000",
  // Shipping
  defaultShippingCost: "60",
  freeShippingThreshold: "1000",
  insideDhakaShipping: "60",
  outsideDhakaShipping: "120",
  // Notifications
  orderConfirmationEmail: true,
  orderShippedSms: true,
  orderDeliveredEmail: true,
  lowStockAlert: true,
  lowStockThreshold: "5",
  // Loyalty
  loyaltyEnabled: true,
  pointsPerTaka: "1",
  pointsRedeemRate: "1",
  minRedeemPoints: "100",
  welcomeBonus: "50",
  // Security
  sessionTimeout: "24",
  maxLoginAttempts: "5",
  requireEmailVerification: false,
};

type SettingsState = typeof DEFAULT_SETTINGS;

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<SettingTab>("store");
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await adminApi.get("/admin/settings");
      if (res.data.settings) {
        setSettings((prev) => ({ ...prev, ...res.data.settings }));
      }
    } catch {
      // Use defaults silently
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.post("/admin/settings", { settings });
      toast.success("সেটিংস সংরক্ষিত হয়েছে");
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "সংরক্ষণ ব্যর্থ");
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof SettingsState, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const ToggleSwitch = ({ settingKey, label, description }: { settingKey: keyof SettingsState; label: string; description?: string }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => update(settingKey, !settings[settingKey])}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          settings[settingKey] ? "bg-green-600" : "bg-gray-300"
        }`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${
          settings[settingKey] ? "translate-x-6" : "translate-x-1"
        }`} />
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">সেটিংস লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">সেটিংস</h1>
          <p className="text-sm text-gray-500 mt-0.5">স্টোরের সকল কনফিগারেশন</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchSettings}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> রিলোড
          </Button>
          <Button variant="brand" size="sm" loading={saving} onClick={handleSave}>
            <Save className="w-4 h-4 mr-1.5" /> সংরক্ষণ করুন
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Sidebar Tabs */}
        <div className="lg:w-52 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-2 space-y-1">
            {TABS.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? "bg-green-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          {/* Store Info */}
          {activeTab === "store" && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Store className="w-5 h-5 text-green-600" /> স্টোর তথ্য</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="স্টোরের নাম" value={settings.storeName}
                    onChange={(e) => update("storeName", e.target.value)} />
                  <Input label="ট্যাগলাইন" value={settings.storeTagline}
                    onChange={(e) => update("storeTagline", e.target.value)} />
                  <Input label="ইমেইল" type="email" value={settings.storeEmail}
                    onChange={(e) => update("storeEmail", e.target.value)} />
                  <Input label="ফোন" value={settings.storePhone}
                    onChange={(e) => update("storePhone", e.target.value)} />
                </div>
                <Input label="ঠিকানা" value={settings.storeAddress}
                  onChange={(e) => update("storeAddress", e.target.value)} />
                <div className="grid grid-cols-2 gap-4">
                  <Select label="মুদ্রা" value={settings.storeCurrency}
                    onChange={(e) => update("storeCurrency", e.target.value)}
                    options={[{ value: "BDT", label: "BDT (৳) — বাংলাদেশি টাকা" }, { value: "USD", label: "USD ($)" }]} />
                  <Select label="ভাষা" value={settings.storeLanguage}
                    onChange={(e) => update("storeLanguage", e.target.value)}
                    options={[{ value: "bn", label: "বাংলা" }, { value: "en", label: "English" }]} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment */}
          {activeTab === "payment" && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-blue-600" /> পেমেন্ট পদ্ধতি</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1 mb-6">
                  <ToggleSwitch settingKey="codEnabled" label="Cash on Delivery (COD)" description="ক্যাশ অন ডেলিভারি সক্রিয় রাখুন" />
                  <ToggleSwitch settingKey="bkashEnabled" label="বিকাশ" description="বিকাশ পেমেন্ট গ্রহণ করুন" />
                  <ToggleSwitch settingKey="nagadEnabled" label="নগদ" description="নগদ পেমেন্ট গ্রহণ করুন" />
                  <ToggleSwitch settingKey="cardEnabled" label="কার্ড পেমেন্ট" description="ক্রেডিট/ডেবিট কার্ড" />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <Input label="বিকাশ নম্বর" value={settings.bkashNumber}
                    onChange={(e) => update("bkashNumber", e.target.value)} />
                  <Input label="নগদ নম্বর" value={settings.nagadNumber}
                    onChange={(e) => update("nagadNumber", e.target.value)} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Shipping */}
          {activeTab === "shipping" && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Truck className="w-5 h-5 text-purple-600" /> শিপিং কনফিগারেশন</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="ডিফল্ট শিপিং চার্জ (৳)" type="number" value={settings.defaultShippingCost}
                    onChange={(e) => update("defaultShippingCost", e.target.value)} />
                  <Input label="ফ্রি শিপিং সীমা (৳)" type="number" value={settings.freeShippingThreshold}
                    onChange={(e) => update("freeShippingThreshold", e.target.value)} />
                  <Input label="ঢাকার ভেতরে শিপিং (৳)" type="number" value={settings.insideDhakaShipping}
                    onChange={(e) => update("insideDhakaShipping", e.target.value)} />
                  <Input label="ঢাকার বাইরে শিপিং (৳)" type="number" value={settings.outsideDhakaShipping}
                    onChange={(e) => update("outsideDhakaShipping", e.target.value)} />
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                  💡 {settings.freeShippingThreshold} টাকার উপরে অর্ডারে ফ্রি শিপিং পাবেন।
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notifications */}
          {activeTab === "notifications" && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5 text-orange-600" /> নোটিফিকেশন সেটিংস</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                <ToggleSwitch settingKey="orderConfirmationEmail" label="অর্ডার কনফার্মেশন ইমেইল" description="অর্ডার দেওয়ার পরে ইমেইল পাঠান" />
                <ToggleSwitch settingKey="orderShippedSms" label="শিপড SMS" description="অর্ডার শিপড হলে SMS পাঠান" />
                <ToggleSwitch settingKey="orderDeliveredEmail" label="ডেলিভারি কনফার্মেশন ইমেইল" />
                <ToggleSwitch settingKey="lowStockAlert" label="কম স্টক সতর্কতা" description="স্টক কম হলে অ্যাডমিনকে জানান" />
                <div className="pt-3">
                  <Input label="কম স্টক সীমা" type="number" value={settings.lowStockThreshold}
                    onChange={(e) => update("lowStockThreshold", e.target.value)}
                    hint="এই সংখ্যার নিচে স্টক গেলে সতর্কতা দেখাবে" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loyalty */}
          {activeTab === "loyalty" && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5 text-yellow-500" /> লয়্যালটি প্রোগ্রাম</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1 mb-6">
                  <ToggleSwitch settingKey="loyaltyEnabled" label="লয়্যালটি পয়েন্ট সক্রিয়" description="কাস্টমাররা কেনাকাটায় পয়েন্ট পাবেন" />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <Input label="প্রতি টাকায় পয়েন্ট" type="number" value={settings.pointsPerTaka}
                    onChange={(e) => update("pointsPerTaka", e.target.value)}
                    hint="প্রতি ১ টাকায় কত পয়েন্ট" />
                  <Input label="পয়েন্ট রিডিম রেট (পয়েন্ট/টাকা)" type="number" value={settings.pointsRedeemRate}
                    onChange={(e) => update("pointsRedeemRate", e.target.value)}
                    hint="কত পয়েন্ট = ১ টাকা" />
                  <Input label="ন্যূনতম রিডিম পয়েন্ট" type="number" value={settings.minRedeemPoints}
                    onChange={(e) => update("minRedeemPoints", e.target.value)} />
                  <Input label="স্বাগত বোনাস পয়েন্ট" type="number" value={settings.welcomeBonus}
                    onChange={(e) => update("welcomeBonus", e.target.value)}
                    hint="নতুন রেজিস্ট্রেশনে বোনাস পয়েন্ট" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security */}
          {activeTab === "security" && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-red-600" /> নিরাপত্তা সেটিংস</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="সেশন টাইমআউট (ঘণ্টা)" type="number" value={settings.sessionTimeout}
                      onChange={(e) => update("sessionTimeout", e.target.value)} />
                    <Input label="সর্বোচ্চ লগইন চেষ্টা" type="number" value={settings.maxLoginAttempts}
                      onChange={(e) => update("maxLoginAttempts", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <ToggleSwitch settingKey="requireEmailVerification" label="ইমেইল ভেরিফিকেশন প্রয়োজনীয়" description="নতুন ব্যবহারকারীদের ইমেইল যাচাই করতে হবে" />
                  </div>
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-semibold text-yellow-700 mb-2">⚠️ গুরুত্বপূর্ণ নিরাপত্তা টিপস:</p>
                    <ul className="text-xs text-yellow-600 space-y-1 list-disc list-inside">
                      <li>নিয়মিত পাসওয়ার্ড পরিবর্তন করুন</li>
                      <li>অপরিচিত লগইন অ্যাক্টিভিটি পর্যবেক্ষণ করুন</li>
                      <li>স্টাফ অ্যাকাউন্টে সীমিত অনুমতি দিন</li>
                      <li>নিয়মিত ডেটাবেজ ব্যাকআপ নিন</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}