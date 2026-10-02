"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { IInventoryItem, InventoryUnit, StockMovementType } from "@/types";
import { formatBDT } from "@/lib/calculations/financial";
import { toast } from "sonner";
import {
  Boxes,
  Plus,
  AlertTriangle,
  RefreshCw,
  Search,
  SlidersHorizontal,
  History,
  TrendingDown,
} from "lucide-react";

export default function InventoryPage() {
  const [items, setItems] = useState<IInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [search, setSearch] = useState("");

  // Create Item Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [nameBn, setNameBn] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [category, setCategory] = useState("কাঁচামাল");
  const [unit, setUnit] = useState<InventoryUnit>("kg");
  const [currentStock, setCurrentStock] = useState(0);
  const [minimumStock, setMinimumStock] = useState(5);
  const [averageCost, setAverageCost] = useState(0);

  // Manual Stock Adjustment Modal
  const [adjustItem, setAdjustItem] = useState<IInventoryItem | null>(null);
  const [adjustType, setAdjustType] = useState<StockMovementType>("ADJUSTMENT");
  const [adjustQuantity, setAdjustQuantity] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  // Movement History Modal
  const [historyItem, setHistoryItem] = useState<IInventoryItem | null>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      let url = `/api/inventory?lowStock=${lowStockFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch {
      toast.error("ইনভেন্টরি লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [lowStockFilter]);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameBn || !nameEn) return;

    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameBn: nameBn.trim(),
          nameEn: nameEn.trim(),
          category,
          unit,
          currentStock,
          minimumStock,
          averageCost,
        }),
      });

      if (!res.ok) throw new Error("আইটেম তৈরি ব্যর্থ");
      toast.success("ইনভেন্টরি আইটেম সফলভাবে তৈরি হয়েছে");
      setCreateModalOpen(false);
      setNameBn("");
      setNameEn("");
      setCurrentStock(0);
      fetchInventory();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleManualAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItem || adjustQuantity === 0 || !adjustReason.trim()) {
      toast.error("সমন্বয়ের পরিমাণ ও কারণ লিখুন");
      return;
    }

    setAdjusting(true);
    try {
      const res = await fetch("/api/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventoryItemId: adjustItem._id,
          type: adjustType,
          quantityDelta: adjustQuantity,
          reason: adjustReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "সমন্বয় ব্যর্থ");

      toast.success("স্টক সফলভাবে সমন্বয় করা হয়েছে");
      setAdjustItem(null);
      setAdjustQuantity(0);
      setAdjustReason("");
      fetchInventory();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAdjusting(false);
    }
  };

  const openHistoryModal = async (item: IInventoryItem) => {
    setHistoryItem(item);
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/inventory/${item._id}`);
      if (res.ok) {
        const data = await res.json();
        setMovements(data.movements || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800">
              ইনভেন্টরি ও স্টক ব্যবস্থাপনা
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              কাঁচামাল, উপাদান ও খাদ্য উপকরণের মজুদ ও ব্যবহার ট্র্যাকিং
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={fetchInventory}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> রিফ্রেশ
            </Button>

            <Button
              size="sm"
              variant="primary"
              onClick={() => setCreateModalOpen(true)}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" /> নতুন আইটেম
            </Button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <Card className="p-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchInventory()}
                placeholder="ইনভেন্টরি আইটেম খুঁজুন..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <Button
              size="sm"
              variant={lowStockFilter ? "danger" : "outline"}
              onClick={() => setLowStockFilter(!lowStockFilter)}
              className="gap-1.5 whitespace-nowrap text-xs"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {lowStockFilter ? "সব আইটেম দেখুন" : "শুধুমাত্র কম স্টক (Low Stock)"}
            </Button>
          </div>
        </Card>

        {/* Inventory Items Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="p-3">আইটেম নাম (বাংলা ও ইংরেজি)</th>
                  <th className="p-3">ক্যাটাগরি</th>
                  <th className="p-3 text-center">একক (Unit)</th>
                  <th className="p-3 text-right">বর্তমান স্টক</th>
                  <th className="p-3 text-right">সর্বনিম্ন সীমা</th>
                  <th className="p-3 text-right">গড় খরচ রেট</th>
                  <th className="p-3 text-center">অবস্থা</th>
                  <th className="p-3 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      ইনভেন্টরি লোড হচ্ছে...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      কোন ইনভেন্টরি আইটেম পাওয়া যায়নি
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const isLow = item.currentStock <= item.minimumStock;

                    return (
                      <tr key={item._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{item.nameBn}</div>
                          <div className="text-[11px] text-slate-400">{item.nameEn}</div>
                        </td>
                        <td className="p-3 text-slate-600 font-medium">{item.category}</td>
                        <td className="p-3 text-center font-mono font-semibold text-slate-700">
                          {item.unit}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-sm text-slate-900">
                          {item.currentStock} {item.unit}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-500">
                          {item.minimumStock} {item.unit}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-700 font-medium">
                          {formatBDT(item.averageCost)}
                        </td>
                        <td className="p-3 text-center">
                          {isLow ? (
                            <Badge variant="danger" className="animate-pulse">
                              স্টক কম
                            </Badge>
                          ) : (
                            <Badge variant="success">পর্যাপ্ত</Badge>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setAdjustItem(item);
                                setAdjustQuantity(0);
                                setAdjustReason("");
                              }}
                              title="স্টক সমন্বয় করুন"
                              className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <SlidersHorizontal className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => openHistoryModal(item)}
                              title="স্টক ট্র্যাকিং হিস্ট্রি"
                              className="p-1.5 text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                            >
                              <History className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Create Inventory Item Modal */}
        <Dialog
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="নতুন ইনভেন্টরি আইটেম যোগ করুন"
        >
          <form onSubmit={handleCreateItem} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="বাংলা নাম *"
                placeholder="উদাঃ চিকেন / বাসমতী চাল"
                value={nameBn}
                onChange={(e) => setNameBn(e.target.value)}
                required
              />
              <Input
                label="ইংরেজি নাম *"
                placeholder="Chicken / Basmati Rice"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="ক্যাটাগরি"
                placeholder="উদাঃ মাংস, চাল, মসলা"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  পরিমাপের একক (Unit) *
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as InventoryUnit)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="kg">কেজি (kg)</option>
                  <option value="gram">গ্রাম (gram)</option>
                  <option value="liter">লিটার (liter)</option>
                  <option value="ml">মি.লি. (ml)</option>
                  <option value="pcs">পিস (pcs)</option>
                  <option value="packet">প্যাকেট (packet)</option>
                  <option value="box">বক্স (box)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Input
                type="number"
                min="0"
                step="any"
                label="প্রাথমিক স্টক"
                value={currentStock}
                onChange={(e) => setCurrentStock(parseFloat(e.target.value) || 0)}
              />
              <Input
                type="number"
                min="0"
                step="any"
                label="সর্বনিম্ন সতর্কতা সীমা *"
                value={minimumStock}
                onChange={(e) => setMinimumStock(parseFloat(e.target.value) || 0)}
                required
              />
              <Input
                type="number"
                min="0"
                step="any"
                label="গড় খরচ রেট (৳)"
                value={averageCost}
                onChange={(e) => setAverageCost(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                বাতিল
              </Button>
              <Button type="submit" variant="primary">
                সংরক্ষণ করুন
              </Button>
            </div>
          </form>
        </Dialog>

        {/* Manual Stock Adjustment Modal */}
        {adjustItem && (
          <Dialog
            open={!!adjustItem}
            onClose={() => setAdjustItem(null)}
            title={`স্টক সমন্বয়: ${adjustItem.nameBn}`}
          >
            <form onSubmit={handleManualAdjust} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">বর্তমান স্টক:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {adjustItem.currentStock} {adjustItem.unit}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  সমন্বয়ের ধরন *
                </label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as StockMovementType)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value="ADJUSTMENT">সাধারণ সমন্বয় (Adjustment)</option>
                  <option value="WASTE">নষ্ট / অপচয় (Waste / Damage)</option>
                  <option value="RETURN">ফেরত (Return)</option>
                </select>
              </div>

              <Input
                type="number"
                step="any"
                label={`পরিবর্তন পরিমাণ (+ বা - ${adjustItem.unit}) *`}
                placeholder="উদাঃ -2 অথবা 5"
                value={adjustQuantity}
                onChange={(e) => setAdjustQuantity(parseFloat(e.target.value) || 0)}
                helperText="কমাতে চাইলে ঋণাত্মক (যেমন: -২) এবং বাড়াতে চাইলে ধনাত্মক লিখুন"
                required
              />

              <Input
                label="সমন্বয়ের কারণ লিখুন *"
                placeholder="উদাঃ স্টক গুনে কম পাওয়া গেছে / মেয়াদোত্তীর্ণ"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                required
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAdjustItem(null)}
                  disabled={adjusting}
                >
                  বাতিল
                </Button>
                <Button type="submit" variant="primary" loading={adjusting}>
                  স্টক নিশ্চিত আপডেট করুন
                </Button>
              </div>
            </form>
          </Dialog>
        )}

        {/* Movement History Modal */}
        {historyItem && (
          <Dialog
            open={!!historyItem}
            onClose={() => setHistoryItem(null)}
            title={`স্টক মুভমেন্ট হিস্ট্রি: ${historyItem.nameBn}`}
            maxWidth="lg"
          >
            <div className="space-y-3 text-xs">
              {loadingHistory ? (
                <div className="p-8 text-center text-slate-400">হিস্ট্রি লোড হচ্ছে...</div>
              ) : movements.length === 0 ? (
                <div className="p-8 text-center text-slate-400">কোন মুভমেন্ট ইতিহাস নেই</div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b text-slate-600 font-semibold sticky top-0">
                      <tr>
                        <th className="p-2">তারিখ</th>
                        <th className="p-2">ধরন</th>
                        <th className="p-2 text-right">পরিবর্তন</th>
                        <th className="p-2 text-right">নতুন স্টক</th>
                        <th className="p-2">কারণ / রেফারেন্স</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {movements.map((m) => (
                        <tr key={m._id}>
                          <td className="p-2 text-slate-500 whitespace-nowrap">
                            {new Date(m.createdAt).toLocaleDateString("en-GB")}
                          </td>
                          <td className="p-2">
                            <span className="font-semibold text-slate-800">{m.type}</span>
                          </td>
                          <td
                            className={`p-2 text-right font-mono font-bold ${
                              m.quantityDelta > 0 ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta} {m.unit}
                          </td>
                          <td className="p-2 text-right font-mono font-semibold">
                            {m.newStock} {m.unit}
                          </td>
                          <td className="p-2 text-slate-600 truncate max-w-xs">{m.reason || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}
