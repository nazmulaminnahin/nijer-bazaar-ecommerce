import React, { useState } from "react";
import {
  Zap, Plus, Clock, Percent, Package, AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

// Note: Flash sales are managed via coupons with time limits.
// This page shows the concept and links to coupon creation.

const SAMPLE_FLASH_SALES = [
  {
    id: 1,
    name: "ঈদ স্পেশাল সেল",
    discount: 30,
    startTime: "2025-01-20T10:00",
    endTime: "2025-01-20T22:00",
    productCount: 15,
    status: "upcoming",
  },
  {
    id: 2,
    name: "শুক্রবার ফ্ল্যাশ ডিল",
    discount: 20,
    startTime: "2025-01-17T18:00",
    endTime: "2025-01-17T21:00",
    productCount: 8,
    status: "ended",
  },
];

export default function AdminFlashSales() {
  const [name, setName] = useState("");
  const [discount, setDiscount] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const handleCreate = () => {
    if (!name || !discount || !startTime || !endTime) {
      toast.warning("সব তথ্য পূরণ করুন");
      return;
    }
    toast.info("ফ্ল্যাশ সেল ফিচার শীঘ্রই সম্পূর্ণ হবে। কুপন দিয়ে ম্যানুয়ালি পরিচালনা করুন।");
  };

  const getStatusVariant = (status: string) => {
    if (status === "active") return "success";
    if (status === "upcoming") return "warning";
    return "secondary";
  };

  const getStatusLabel = (status: string) => {
    if (status === "active") return "সক্রিয়";
    if (status === "upcoming") return "আসছে";
    return "শেষ";
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ফ্ল্যাশ সেল</h1>
          <p className="text-sm text-gray-500 mt-0.5">সীমিত সময়ের বিশেষ অফার</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-700">ফ্ল্যাশ সেল কীভাবে কাজ করে?</p>
          <p className="text-sm text-blue-600 mt-1">
            ফ্ল্যাশ সেলের জন্য <strong>কুপন মডিউল</strong> ব্যবহার করুন — মেয়াদ সহ একটি কুপন তৈরি করুন।
            নির্দিষ্ট প্রোডাক্টের দাম সাময়িকভাবে কমিয়ে রাখুন।
          </p>
        </div>
      </div>

      {/* Create Flash Sale Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            নতুন ফ্ল্যাশ সেল তৈরি
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input label="সেলের নাম" value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="যেমন: ঈদ স্পেশাল, ১১.১১ সেল" />
            </div>
            <Input label="ছাড়ের পরিমাণ (%)" type="number" max="90" value={discount}
              onChange={(e) => setDiscount(e.target.value)} placeholder="যেমন: 30" />
            <div /> {/* spacer */}
            <Input label="শুরুর সময়" type="datetime-local" value={startTime}
              onChange={(e) => setStartTime(e.target.value)} />
            <Input label="শেষের সময়" type="datetime-local" value={endTime}
              onChange={(e) => setEndTime(e.target.value)} />
          </div>

          <Button variant="brand" className="mt-4" onClick={handleCreate}>
            <Zap className="w-4 h-4 mr-1.5" /> ফ্ল্যাশ সেল তৈরি করুন
          </Button>
        </CardContent>
      </Card>

      {/* Flash Sales List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SAMPLE_FLASH_SALES.map((sale) => (
          <Card key={sale.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Zap className="w-4 h-4 text-yellow-500" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{sale.name}</p>
                    <Badge variant={getStatusVariant(sale.status) as any}>
                      {getStatusLabel(sale.status)}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-red-500">{sale.discount}%</p>
                  <p className="text-xs text-gray-400">ছাড়</p>
                </div>
              </div>

              <div className="space-y-1 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>শুরু: {new Date(sale.startTime).toLocaleString("bn-BD")}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>শেষ: {new Date(sale.endTime).toLocaleString("bn-BD")}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  <span>{sale.productCount}টি প্রোডাক্ট</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}