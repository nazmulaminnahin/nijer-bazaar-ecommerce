import React, { useEffect, useState, useCallback } from "react";
import {
  Plus, RefreshCw, TrendingUp, TrendingDown, DollarSign,
  Trash2, Download, ChevronLeft, ChevronRight, Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

type ActiveTab = "transactions" | "expenses";

interface Transaction {
  id: number;
  type: "income" | "expense";
  amount: number;
  description: string | null;
  reference: string | null;
  category: string | null;
  createdAt: string;
}

interface Expense {
  id: number;
  title: string;
  amount: number;
  category: string | null;
  description: string | null;
  date: string;
  createdAt: string;
}

interface Summary { totalIncome: number; totalExpense: number; }

const TX_TYPE_OPTIONS = [
  { value: "income", label: "আয়" },
  { value: "expense", label: "ব্যয়" },
];

const EXPENSE_CATEGORIES = [
  { value: "rent", label: "ভাড়া" },
  { value: "salary", label: "বেতন" },
  { value: "utilities", label: "ইউটিলিটি" },
  { value: "marketing", label: "মার্কেটিং" },
  { value: "logistics", label: "লজিস্টিক্স" },
  { value: "equipment", label: "যন্ত্রপাতি" },
  { value: "other", label: "অন্যান্য" },
];

const TX_CATEGORIES = [
  { value: "sales", label: "বিক্রয়" },
  { value: "refund", label: "রিফান্ড" },
  { value: "investment", label: "বিনিয়োগ" },
  { value: "other_income", label: "অন্য আয়" },
  { value: "rent", label: "ভাড়া" },
  { value: "salary", label: "বেতন" },
  { value: "marketing", label: "মার্কেটিং" },
  { value: "other_expense", label: "অন্য ব্যয়" },
];

const EMPTY_TX = { type: "income", amount: "", description: "", reference: "", category: "" };
const EMPTY_EX = { title: "", amount: "", category: "", description: "", date: new Date().toISOString().slice(0, 10) };

export default function AdminAccounting() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("transactions");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalIncome: 0, totalExpense: 0 });
  const [totalExpenseAmount, setTotalExpenseAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 15;
  const totalPages = Math.ceil(total / limit);

  const [addModal, setAddModal] = useState(false);
  const [txForm, setTxForm] = useState<typeof EMPTY_TX>({ ...EMPTY_TX });
  const [exForm, setExForm] = useState<typeof EMPTY_EX>({ ...EMPTY_EX });
  const [formLoading, setFormLoading] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.get(`/accounting/transactions?page=${page}&limit=${limit}`);
      setTransactions(res.data.transactions ?? []);
      setTotal(res.data.total ?? 0);
      setSummary(res.data.summary ?? { totalIncome: 0, totalExpense: 0 });
    } catch { toast.error("লেনদেন লোড হয়নি"); }
    finally { setLoading(false); }
  }, [page]);

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.get(`/accounting/expenses?page=${page}&limit=${limit}`);
      setExpenses(res.data.expenses ?? []);
      setTotal(res.data.total ?? 0);
      setTotalExpenseAmount(res.data.totalAmount ?? 0);
    } catch { toast.error("খরচ লোড হয়নি"); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => {
    if (activeTab === "transactions") fetchTransactions();
    else fetchExpenses();
  }, [activeTab, fetchTransactions, fetchExpenses]);

  useEffect(() => { setPage(1); }, [activeTab]);

  const handleAddTx = async () => {
    if (!txForm.amount || Number(txForm.amount) <= 0) { toast.warning("পরিমাণ দিন"); return; }
    setFormLoading(true);
    try {
      await adminApi.post("/accounting/transactions", {
        type: txForm.type,
        amount: Number(txForm.amount),
        description: txForm.description || null,
        reference: txForm.reference || null,
        category: txForm.category || null,
      });
      toast.success("লেনদেন যোগ হয়েছে");
      setAddModal(false); setTxForm({ ...EMPTY_TX });
      fetchTransactions();
    } catch (err: any) { toast.error(err?.response?.data?.error ?? "লেনদেন যোগ ব্যর্থ"); }
    finally { setFormLoading(false); }
  };

  const handleAddEx = async () => {
    if (!exForm.title || !exForm.amount || Number(exForm.amount) <= 0) {
      toast.warning("শিরোনাম ও পরিমাণ দিন"); return;
    }
    setFormLoading(true);
    try {
      await adminApi.post("/accounting/expenses", {
        title: exForm.title,
        amount: Number(exForm.amount),
        category: exForm.category || null,
        description: exForm.description || null,
        date: exForm.date,
      });
      toast.success("খরচ যোগ হয়েছে");
      setAddModal(false); setExForm({ ...EMPTY_EX });
      fetchExpenses();
    } catch (err: any) { toast.error(err?.response?.data?.error ?? "খরচ যোগ ব্যর্থ"); }
    finally { setFormLoading(false); }
  };

  const handleDeleteTx = async (id: number) => {
    if (!window.confirm("এই লেনদেন মুছে ফেলতে চান?")) return;
    try {
      await adminApi.delete(`/accounting/transactions/${id}`);
      toast.success("মুছে ফেলা হয়েছে");
      fetchTransactions();
    } catch { toast.error("মুছে ফেলা ব্যর্থ"); }
  };

  const handleDeleteEx = async (id: number) => {
    if (!window.confirm("এই খরচ মুছে ফেলতে চান?")) return;
    try {
      await adminApi.delete(`/accounting/expenses/${id}`);
      toast.success("মুছে ফেলা হয়েছে");
      fetchExpenses();
    } catch { toast.error("মুছে ফেলা ব্যর্থ"); }
  };

  const exportCSV = () => {
    const rows = activeTab === "transactions"
      ? [["ধরন", "পরিমাণ", "ক্যাটাগরি", "বিবরণ", "রেফারেন্স", "তারিখ"],
         ...transactions.map((t) => [t.type === "income" ? "আয়" : "ব্যয়", t.amount, t.category ?? "", t.description ?? "", t.reference ?? "", new Date(t.createdAt).toLocaleDateString()])]
      : [["শিরোনাম", "পরিমাণ", "ক্যাটাগরি", "বিবরণ", "তারিখ"],
         ...expenses.map((e) => [e.title, e.amount, e.category ?? "", e.description ?? "", new Date(e.date).toLocaleDateString()])];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV ডাউনলোড হচ্ছে");
  };

  const netProfit = Number(summary.totalIncome) - Number(summary.totalExpense) - totalExpenseAmount;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">অ্যাকাউন্টিং</h1>
          <p className="text-sm text-gray-500 mt-0.5">আর্থিক লেনদেন ও খরচ ব্যবস্থাপনা</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-1.5" /> CSV
          </Button>
          <Button variant="brand" size="sm" onClick={() => setAddModal(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            {activeTab === "transactions" ? "লেনদেন যোগ" : "খরচ যোগ"}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <p className="text-xs text-green-600 font-medium">মোট আয়</p>
            </div>
            <p className="text-2xl font-bold text-green-700">৳{Number(summary.totalIncome).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <p className="text-xs text-red-600 font-medium">লেনদেন ব্যয়</p>
            </div>
            <p className="text-2xl font-bold text-red-700">৳{Number(summary.totalExpense).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-orange-600" />
              <p className="text-xs text-orange-600 font-medium">মোট খরচ</p>
            </div>
            <p className="text-2xl font-bold text-orange-700">৳{totalExpenseAmount.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className={`border-blue-200 ${netProfit >= 0 ? "bg-blue-50" : "bg-red-50"}`}>
          <CardContent className="pt-5">
            <p className="text-xs font-medium mb-1" style={{ color: netProfit >= 0 ? "#1d4ed8" : "#dc2626" }}>নিট মুনাফা</p>
            <p className="text-2xl font-bold" style={{ color: netProfit >= 0 ? "#1d4ed8" : "#dc2626" }}>
              ৳{netProfit.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(["transactions", "expenses"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab ? "border-green-600 text-green-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}>
            {tab === "transactions" ? "লেনদেন" : "খরচ"}
          </button>
        ))}
      </div>

      {/* Transactions Table */}
      {activeTab === "transactions" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">ধরন</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase px-3 py-3">পরিমাণ</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-3 py-3">ক্যাটাগরি</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-3 py-3">বিবরণ</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-3 py-3">রেফারেন্স</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-3 py-3">তারিখ</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">{Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded" /></td>
                    ))}</tr>
                  )) : transactions.length > 0 ? transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                          tx.type === "income" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {tx.type === "income" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {tx.type === "income" ? "আয়" : "ব্যয়"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className={`text-sm font-bold ${tx.type === "income" ? "text-green-600" : "text-red-500"}`}>
                          {tx.type === "income" ? "+" : "-"}৳{tx.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-500">{tx.category ?? "—"}</td>
                      <td className="px-3 py-3 text-sm text-gray-600 max-w-[200px] truncate">{tx.description ?? "—"}</td>
                      <td className="px-3 py-3 text-xs font-mono text-gray-400">{tx.reference ?? "—"}</td>
                      <td className="px-3 py-3 text-xs text-gray-500">{new Date(tx.createdAt).toLocaleDateString("bn-BD")}</td>
                      <td className="px-5 py-3">
                        <button onClick={() => handleDeleteTx(tx.id)} className="p-1.5 rounded text-gray-400 hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={7} className="py-12 text-center text-gray-400">কোনো লেনদেন নেই</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">পেজ {page} / {totalPages}</p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="w-4 h-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="w-4 h-4" /></Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Expenses Table */}
      {activeTab === "expenses" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">শিরোনাম</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase px-3 py-3">পরিমাণ</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-3 py-3">ক্যাটাগরি</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-3 py-3">বিবরণ</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-3 py-3">তারিখ</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">{Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded" /></td>
                    ))}</tr>
                  )) : expenses.length > 0 ? expenses.map((ex) => (
                    <tr key={ex.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-sm font-medium text-gray-800">{ex.title}</td>
                      <td className="px-3 py-3 text-right text-sm font-bold text-red-500">
                        -৳{ex.amount.toLocaleString()}
                      </td>
                      <td className="px-3 py-3">
                        {ex.category && (
                          <Badge variant="secondary">{ex.category}</Badge>
                        )}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-500 max-w-[200px] truncate">{ex.description ?? "—"}</td>
                      <td className="px-3 py-3 text-xs text-gray-500">{new Date(ex.date).toLocaleDateString("bn-BD")}</td>
                      <td className="px-5 py-3">
                        <button onClick={() => handleDeleteEx(ex.id)} className="p-1.5 rounded text-gray-400 hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="py-12 text-center text-gray-400">কোনো খরচ নেই</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">পেজ {page} / {totalPages}</p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="w-4 h-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="w-4 h-4" /></Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Modal */}
      <Modal isOpen={addModal} onClose={() => setAddModal(false)}
        title={activeTab === "transactions" ? "নতুন লেনদেন যোগ করুন" : "নতুন খরচ যোগ করুন"} size="md">
        {activeTab === "transactions" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Select label="ধরন" value={txForm.type}
                onChange={(e) => setTxForm((f) => ({ ...f, type: e.target.value }))}
                options={TX_TYPE_OPTIONS} />
              <Input label="পরিমাণ (৳)" type="number" value={txForm.amount}
                onChange={(e) => setTxForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0.00" required />
            </div>
            <Select label="ক্যাটাগরি" value={txForm.category}
              onChange={(e) => setTxForm((f) => ({ ...f, category: e.target.value }))}
              options={TX_CATEGORIES} placeholder="ক্যাটাগরি বেছে নিন" />
            <Input label="বিবরণ" value={txForm.description}
              onChange={(e) => setTxForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="লেনদেনের বিবরণ" />
            <Input label="রেফারেন্স (ঐচ্ছিক)" value={txForm.reference}
              onChange={(e) => setTxForm((f) => ({ ...f, reference: e.target.value }))}
              placeholder="অর্ডার নম্বর বা ইনভয়েস" />
            <ModalFooter>
              <Button variant="outline" onClick={() => setAddModal(false)}>বাতিল</Button>
              <Button variant="brand" loading={formLoading} onClick={handleAddTx}>যোগ করুন</Button>
            </ModalFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <Input label="শিরোনাম" value={exForm.title}
              onChange={(e) => setExForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="খরচের শিরোনাম" required />
            <div className="grid grid-cols-2 gap-3">
              <Input label="পরিমাণ (৳)" type="number" value={exForm.amount}
                onChange={(e) => setExForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0.00" required />
              <Input label="তারিখ" type="date" value={exForm.date}
                onChange={(e) => setExForm((f) => ({ ...f, date: e.target.value }))} />
            </div>
            <Select label="ক্যাটাগরি" value={exForm.category}
              onChange={(e) => setExForm((f) => ({ ...f, category: e.target.value }))}
              options={EXPENSE_CATEGORIES} placeholder="ক্যাটাগরি বেছে নিন" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">বিবরণ (ঐচ্ছিক)</label>
              <textarea className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={2} value={exForm.description}
                onChange={(e) => setExForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <ModalFooter>
              <Button variant="outline" onClick={() => setAddModal(false)}>বাতিল</Button>
              <Button variant="brand" loading={formLoading} onClick={handleAddEx}>যোগ করুন</Button>
            </ModalFooter>
          </div>
        )}
      </Modal>
    </div>
  );
}