import React, { useEffect, useState, useCallback } from "react";
import {
  Bell, Plus, Edit2, Trash2, RefreshCw, Send,
  Mail, MessageSquare, Smartphone, Globe,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api";

interface NotifItem {
  id: number;
  userId: number | null;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface Template {
  id: number;
  name: string;
  type: string;
  channel: string;
  subject: string | null;
  body: string;
  isActive: boolean;
}

type ActiveTab = "notifications" | "templates";

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  email: <Mail className="w-4 h-4" />,
  sms: <Smartphone className="w-4 h-4" />,
  whatsapp: <MessageSquare className="w-4 h-4" />,
  push: <Bell className="w-4 h-4" />,
};

const TYPE_OPTIONS = [
  { value: "order", label: "অর্ডার" },
  { value: "promo", label: "প্রমোশন" },
  { value: "system", label: "সিস্টেম" },
  { value: "loyalty", label: "লয়্যালটি" },
];

const CHANNEL_OPTIONS = [
  { value: "email", label: "ইমেইল" },
  { value: "sms", label: "SMS" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "push", label: "পুশ নোটিফিকেশন" },
];

const EMPTY_TEMPLATE = { name: "", type: "system", channel: "email", subject: "", body: "", isActive: true };

export default function AdminNotifications() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("notifications");
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const [broadcastModal, setBroadcastModal] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({ type: "system", title: "", message: "" });
  const [broadcastLoading, setBroadcastLoading] = useState(false);

  const [templateModal, setTemplateModal] = useState<"create" | "edit" | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateForm, setTemplateForm] = useState<typeof EMPTY_TEMPLATE>(EMPTY_TEMPLATE);
  const [templateLoading, setTemplateLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.get("/notifications?limit=30");
      setNotifications(res.data.notifications ?? []);
    } catch { toast.error("নোটিফিকেশন লোড হয়নি"); }
    finally { setLoading(false); }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.get("/notifications/templates");
      setTemplates(res.data.templates ?? []);
    } catch { toast.error("টেমপ্লেট লোড হয়নি"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab === "notifications") fetchNotifications();
    else fetchTemplates();
  }, [activeTab, fetchNotifications, fetchTemplates]);

  const handleBroadcast = async () => {
    if (!broadcastForm.title || !broadcastForm.message) {
      toast.warning("শিরোনাম ও বার্তা দিন"); return;
    }
    setBroadcastLoading(true);
    try {
      await adminApi.post("/notifications/broadcast", broadcastForm);
      toast.success("ব্রডকাস্ট সফল হয়েছে");
      setBroadcastModal(false);
      setBroadcastForm({ type: "system", title: "", message: "" });
      fetchNotifications();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "ব্রডকাস্ট ব্যর্থ");
    } finally { setBroadcastLoading(false); }
  };

  const openCreateTemplate = () => {
    setTemplateForm(EMPTY_TEMPLATE); setSelectedTemplate(null); setTemplateModal("create");
  };

  const openEditTemplate = (t: Template) => {
    setSelectedTemplate(t);
    setTemplateForm({ name: t.name, type: t.type, channel: t.channel, subject: t.subject ?? "", body: t.body, isActive: t.isActive });
    setTemplateModal("edit");
  };

  const handleTemplateSubmit = async () => {
    if (!templateForm.name || !templateForm.body) {
      toast.warning("নাম ও বডি দিন"); return;
    }
    setTemplateLoading(true);
    try {
      const payload = { ...templateForm, subject: templateForm.subject || null };
      if (templateModal === "create") {
        await adminApi.post("/notifications/templates", payload);
        toast.success("টেমপ্লেট তৈরি হয়েছে");
      } else {
        await adminApi.put(`/notifications/templates/${selectedTemplate!.id}`, payload);
        toast.success("টেমপ্লেট আপডেট হয়েছে");
      }
      setTemplateModal(null); fetchTemplates();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "অপারেশন ব্যর্থ");
    } finally { setTemplateLoading(false); }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!window.confirm("এই টেমপ্লেট মুছে ফেলতে চান?")) return;
    try {
      await adminApi.delete(`/notifications/templates/${id}`);
      toast.success("টেমপ্লেট মুছে ফেলা হয়েছে");
      fetchTemplates();
    } catch { toast.error("মুছে ফেলা ব্যর্থ"); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">নোটিফিকেশন</h1>
          <p className="text-sm text-gray-500 mt-0.5">ইমেইল, SMS, WhatsApp ম্যানেজমেন্ট</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => activeTab === "notifications" ? fetchNotifications() : fetchTemplates()} loading={loading}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> রিফ্রেশ
          </Button>
          {activeTab === "notifications" && (
            <Button variant="brand" size="sm" onClick={() => setBroadcastModal(true)}>
              <Send className="w-4 h-4 mr-1.5" /> ব্রডকাস্ট
            </Button>
          )}
          {activeTab === "templates" && (
            <Button variant="brand" size="sm" onClick={openCreateTemplate}>
              <Plus className="w-4 h-4 mr-1.5" /> নতুন টেমপ্লেট
            </Button>
          )}
        </div>
      </div>

      {/* Channel pills */}
      <div className="flex flex-wrap gap-3">
        {[
          { icon: <Mail className="w-4 h-4" />, label: "ইমেইল", color: "bg-blue-50 text-blue-700 border-blue-200" },
          { icon: <Smartphone className="w-4 h-4" />, label: "SMS", color: "bg-green-50 text-green-700 border-green-200" },
          { icon: <MessageSquare className="w-4 h-4" />, label: "WhatsApp", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
          { icon: <Bell className="w-4 h-4" />, label: "পুশ", color: "bg-purple-50 text-purple-700 border-purple-200" },
        ].map((ch) => (
          <div key={ch.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${ch.color}`}>
            {ch.icon} {ch.label}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(["notifications", "templates"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab ? "border-green-600 text-green-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}>
            {tab === "notifications" ? "নোটিফিকেশন লগ" : "টেমপ্লেট"}
          </button>
        ))}
      </div>

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="p-4 animate-pulse">
                    <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                ))
              ) : notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div key={notif.id} className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors">
                    <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                      <Bell className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-800">{notif.title}</p>
                        <Badge variant={notif.userId ? "info" : "warning"}>
                          {notif.userId ? `User #${notif.userId}` : "ব্রডকাস্ট"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notif.createdAt).toLocaleString("bn-BD")}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-16 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">কোনো নোটিফিকেশন নেই</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Templates Tab */}
      {activeTab === "templates" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse"><CardContent className="pt-6"><div className="h-24 bg-gray-100 rounded" /></CardContent></Card>
            ))
          ) : templates.length > 0 ? (
            templates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-gray-100 rounded text-gray-600">
                        {CHANNEL_ICONS[template.channel] ?? <Globe className="w-4 h-4" />}
                      </div>
                      <p className="font-semibold text-gray-800 text-sm">{template.name}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEditTemplate(template)} className="p-1.5 rounded text-gray-400 hover:bg-blue-50 hover:text-blue-600">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteTemplate(template.id)} className="p-1.5 rounded text-gray-400 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{template.channel.toUpperCase()}</Badge>
                    <Badge variant="info">{template.type}</Badge>
                    <Badge variant={template.isActive ? "success" : "secondary"}>
                      {template.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
                    </Badge>
                  </div>
                  {template.subject && (
                    <p className="text-xs text-gray-500">বিষয়: {template.subject}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{template.body}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-3">
              <Card>
                <CardContent className="py-16 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-3">কোনো টেমপ্লেট নেই</p>
                  <Button variant="brand" size="sm" onClick={openCreateTemplate}>
                    <Plus className="w-4 h-4 mr-1.5" /> টেমপ্লেট তৈরি করুন
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Broadcast Modal */}
      <Modal isOpen={broadcastModal} onClose={() => setBroadcastModal(false)} title="ব্রডকাস্ট নোটিফিকেশন" size="md">
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
            ⚠️ এই নোটিফিকেশন সকল ব্যবহারকারীর কাছে পাঠানো হবে।
          </div>
          <Select label="ধরন" value={broadcastForm.type}
            onChange={(e) => setBroadcastForm((f) => ({ ...f, type: e.target.value }))}
            options={TYPE_OPTIONS} />
          <Input label="শিরোনাম" value={broadcastForm.title}
            onChange={(e) => setBroadcastForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="নোটিফিকেশনের শিরোনাম" required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">বার্তা</label>
            <textarea className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={4} value={broadcastForm.message}
              onChange={(e) => setBroadcastForm((f) => ({ ...f, message: e.target.value }))}
              placeholder="বিস্তারিত বার্তা..." />
          </div>
          <ModalFooter>
            <Button variant="outline" onClick={() => setBroadcastModal(false)}>বাতিল</Button>
            <Button variant="brand" loading={broadcastLoading} onClick={handleBroadcast}>
              <Send className="w-4 h-4 mr-1.5" /> পাঠান
            </Button>
          </ModalFooter>
        </div>
      </Modal>

      {/* Template Modal */}
      <Modal isOpen={templateModal !== null} onClose={() => setTemplateModal(null)}
        title={templateModal === "create" ? "নতুন টেমপ্লেট" : `সম্পাদনা — ${selectedTemplate?.name}`} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Input label="নাম" value={templateForm.name}
              onChange={(e) => setTemplateForm((f) => ({ ...f, name: e.target.value }))} required />
            <Select label="ধরন" value={templateForm.type}
              onChange={(e) => setTemplateForm((f) => ({ ...f, type: e.target.value }))}
              options={TYPE_OPTIONS} />
            <Select label="চ্যানেল" value={templateForm.channel}
              onChange={(e) => setTemplateForm((f) => ({ ...f, channel: e.target.value }))}
              options={CHANNEL_OPTIONS} />
          </div>
          {(templateForm.channel === "email") && (
            <Input label="বিষয় (Subject)" value={templateForm.subject}
              onChange={(e) => setTemplateForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder="ইমেইলের বিষয়" />
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">বডি / কন্টেন্ট</label>
            <textarea className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={6} value={templateForm.body}
              onChange={(e) => setTemplateForm((f) => ({ ...f, body: e.target.value }))}
              placeholder="টেমপ্লেট কন্টেন্ট। {name}, {orderNumber} ইত্যাদি ভেরিয়েবল ব্যবহার করুন।" />
          </div>
          <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600">
            <p className="font-semibold mb-1">উপলব্ধ ভেরিয়েবল:</p>
            <p className="font-mono">{"{name}"} {"{email}"} {"{orderNumber}"} {"{amount}"} {"{status}"} {"{trackingId}"}</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={templateForm.isActive}
              onChange={(e) => setTemplateForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="rounded border-gray-300 text-green-600" />
            <span className="text-sm text-gray-700">টেমপ্লেট সক্রিয়</span>
          </label>
          <ModalFooter>
            <Button variant="outline" onClick={() => setTemplateModal(null)}>বাতিল</Button>
            <Button variant="brand" loading={templateLoading} onClick={handleTemplateSubmit}>
              {templateModal === "create" ? "তৈরি করুন" : "আপডেট করুন"}
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  );
}