"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { IPurchase, ISupplier, IInventoryItem, PaymentMethod } from "@/types";
import { formatBDT, roundCurrency } from "@/lib/calculations/financial";
import { toast } from "sonner";
import { Truck, Plus, RefreshCw, Eye, Trash2 } from "lucide-react";

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<IPurchase[]>([]);
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [inventoryItems, setInventoryItems] = useState<IInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New Purchase Modal
  const [newPurchaseModal, setNewPurchaseModal] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [purchaseItems, setPurchaseItems] = useState<
    Array<{ inventoryItemId: string; quantity: number; unitCost: number }>
  >([]);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Supplier Create Modal
  const [newSupplierModal, setNewSupplierModal] = useState(false);
  const [supplierName, setSupplierName] = useState("");
  const [supplierCompany, setSupplierCompany] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [purRes, supRes, invRes] = await Promise.all([
        fetch("/api/purchases"),
        fetch("/api/suppliers"),
        fetch("/api/inventory"),
      ]);

      if (purRes.ok) setPurchases((await purRes.json()).purchases || []);
      if (supRes.ok) setSuppliers((await supRes.json()).suppliers || []);
      if (invRes.ok) setInventoryItems((await invRes.json()).items || []);
    } catch {
      toast.error("ডাটা লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addPurchaseItemLine = () => {
    if (inventoryItems.length === 0) return;
    setPurchaseItems([
      ...purchaseItems,
      {
        inventoryItemId: inventoryItems[0]._id,
        quantity: 1,
        unitCost: inventoryItems[0].averageCost || 0,
      },
    ]);
  };

  const updatePurchaseItem = (index: number, field: string, val: any) => {
    const copy = [...purchaseItems];
    (copy[index] as any)[field] = val;
    setPurchaseItems(copy);
  };

  const removePurchaseItem = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  };

  const rawSubtotal = purchaseItems.reduce((sum, item) => {
    return sum + (item.quantity || 0) * (item.unitCost || 0);
  }, 0);
  const totalAmount = Math.max(0, roundCurrency(rawSubtotal - discount));
  const dueAmount = Math.max(0, roundCurrency(totalAmount - paidAmount));

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName || !supplierCompany || !supplierPhone) return;

    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: supplierName.trim(),
          company: supplierCompany.trim(),
          phone: supplierPhone.trim(),
        }),
      });

      if (!res.ok) throw new Error("সাপ্লায়ার তৈরি ব্যর্থ");
      toast.success("সাপ্লায়ার সফলভাবে তৈরি হয়েছে");
      setNewSupplierModal(false);
      setSupplierName("");
      setSupplierCompany("");
      setSupplierPhone("");
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || purchaseItems.length === 0) {
      toast.error("সাপ্লায়ার এবং কমপক্ষে একটি আইটেম নির্বাচন করুন");
      return;
    }

    const supplier = suppliers.find((s) => s._id === selectedSupplierId);
    if (!supplier) return;

    const formattedItems = purchaseItems.map((item) => {
      const dbItem = inventoryItems.find((i) => i._id === item.inventoryItemId);
      return {
        inventoryItemId: item.inventoryItemId,
        itemName: dbItem?.nameBn || "আইটেম",
        unit: dbItem?.unit || "kg",
        quantity: item.quantity,
        unitCost: item.unitCost,
      };
    });

    setSubmitting(true);
    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: selectedSupplierId,
          supplierName: supplier.name,
          items: formattedItems,
          discount,
          paidAmount,
          paymentMethod,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "ক্রয় এন্ট্রি ব্যর্থ");

      toast.success("ক্রয় সম্পন্ন হয়েছে এবং ইনভেন্টরি স্টক বৃদ্ধি পেয়েছে!");
      setNewPurchaseModal(false);
      setPurchaseItems([]);
      setDiscount(0);
      setPaidAmount(0);
      setNotes("");
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800">
              সাপ্লায়ার ক্রয় ব্যবস্থাপনা
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              কাঁচামাল ও দ্রব্যাদি ক্রয়, সরবরাহকারী দেনা ও স্টক ইন রেকর্ড
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setNewSupplierModal(true)}
              className="gap-1.5"
            >
              + নতুন সাপ্লায়ার
            </Button>

            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                setPurchaseItems([]);
                setNewPurchaseModal(true);
              }}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" /> নতুন ক্রয় এন্ট্রি
            </Button>
          </div>
        </div>

        {/* Purchases Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="p-3">ক্রয় নম্বর</th>
                  <th className="p-3">তারিখ</th>
                  <th className="p-3">সাপ্লায়ার নাম</th>
                  <th className="p-3 text-center">আইটেম সংখ্যা</th>
                  <th className="p-3 text-right">মোট বিল</th>
                  <th className="p-3 text-right">পরিশোধ</th>
                  <th className="p-3 text-right">বাকি (Due)</th>
                  <th className="p-3 text-center">পেমেন্ট মাধ্যম</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      লোড হচ্ছে...
                    </td>
                  </tr>
                ) : purchases.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      কোন ক্রয়ের তথ্য পাওয়া যায়নি
                    </td>
                  </tr>
                ) : (
                  purchases.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-mono font-bold text-slate-900">
                        {p.purchaseNumber}
                      </td>
                      <td className="p-3 text-slate-500 whitespace-nowrap">
                        {new Date(p.purchaseDate).toLocaleDateString("en-GB")}
                      </td>
                      <td className="p-3 font-semibold text-slate-800">{p.supplierName}</td>
                      <td className="p-3 text-center font-mono">{p.items?.length || 0} টি</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {formatBDT(p.totalAmount)}
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-700 font-semibold">
                        {formatBDT(p.paidAmount)}
                      </td>
                      <td className="p-3 text-right font-mono">
                        {p.dueAmount > 0 ? (
                          <span className="text-rose-600 font-bold">{formatBDT(p.dueAmount)}</span>
                        ) : (
                          <span className="text-slate-400">৳ ০</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {p.paymentMethod}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* New Supplier Modal */}
        <Dialog
          open={newSupplierModal}
          onClose={() => setNewSupplierModal(false)}
          title="নতুন সাপ্লায়ার যোগ করুন"
        >
          <form onSubmit={handleCreateSupplier} className="space-y-4 text-xs">
            <Input
              label="সাপ্লায়ার / প্রতিনিধির নাম *"
              placeholder="উদাঃ মোঃ রফিকুল ইসলাম"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              required
            />
            <Input
              label="কোম্পানি / দোকানের নাম *"
              placeholder="উদাঃ সিটি পোলট্রি ফার্ম"
              value={supplierCompany}
              onChange={(e) => setSupplierCompany(e.target.value)}
              required
            />
            <Input
              label="ফোন নম্বর *"
              placeholder="01700000000"
              value={supplierPhone}
              onChange={(e) => setSupplierPhone(e.target.value)}
              required
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setNewSupplierModal(false)}>
                বাতিল
              </Button>
              <Button type="submit" variant="primary">
                সংরক্ষণ করুন
              </Button>
            </div>
          </form>
        </Dialog>

        {/* New Purchase Modal */}
        <Dialog
          open={newPurchaseModal}
          onClose={() => setNewPurchaseModal(false)}
          title="নতুন ক্রয় এন্ট্রি (স্টক বৃদ্ধি)"
          maxWidth="xl"
        >
          <form onSubmit={handleCreatePurchase} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                সাপ্লায়ার নির্বাচন করুন *
              </label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                required
              >
                <option value="">-- পছন্দ করুন --</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.company} ({s.name} - {s.phone})
                  </option>
                ))}
              </select>
            </div>

            {/* Item Rows */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700">ক্রয়কৃত আইটেমসমূহ:</label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addPurchaseItemLine}
                  className="text-xs"
                >
                  + আইটেম যোগ
                </Button>
              </div>

              {purchaseItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <select
                    value={item.inventoryItemId}
                    onChange={(e) => updatePurchaseItem(idx, "inventoryItemId", e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    {inventoryItems.map((i) => (
                      <option key={i._id} value={i._id}>
                        {i.nameBn} ({i.unit})
                      </option>
                    ))}
                  </select>

                  <div className="w-24">
                    <input
                      type="number"
                      step="any"
                      min="0.001"
                      placeholder="পরিমাণ"
                      value={item.quantity}
                      onChange={(e) =>
                        updatePurchaseItem(idx, "quantity", parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>

                  <div className="w-28">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="একক দর"
                      value={item.unitCost}
                      onChange={(e) =>
                        updatePurchaseItem(idx, "unitCost", parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>

                  <span className="w-24 text-right font-mono font-bold">
                    {formatBDT((item.quantity || 0) * (item.unitCost || 0))}
                  </span>

                  <button
                    type="button"
                    onClick={() => removePurchaseItem(idx)}
                    className="p-1 text-rose-500 hover:text-rose-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Financial summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl">
              <div>
                <span className="text-slate-500">সাবটোটাল</span>
                <div className="font-mono font-bold text-sm">{formatBDT(rawSubtotal)}</div>
              </div>
              <Input
                type="number"
                min="0"
                label="ডিসকাউন্ট (৳)"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              />
              <Input
                type="number"
                min="0"
                label="পরিশোধিত টাকা (৳)"
                value={paidAmount}
                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
              />
              <div>
                <span className="text-slate-500">বাকি (Due)</span>
                <div className="font-mono font-bold text-sm text-rose-600">
                  {formatBDT(dueAmount)}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setNewPurchaseModal(false)}
                disabled={submitting}
              >
                বাতিল
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                ক্রয় নিশ্চিত ও স্টক বৃদ্ধি করুন
              </Button>
            </div>
          </form>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
