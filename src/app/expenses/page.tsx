"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { IExpense, ExpenseCategory, PaymentMethod } from "@/types";
import { formatBDT } from "@/lib/calculations/financial";
import { toast } from "sonner";
import { Wallet, Plus, RefreshCw, Upload, Trash2 } from "lucide-react";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<IExpense[]>([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // New Expense Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>("বাজার");
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [attachment, setAttachment] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const categories: ExpenseCategory[] = [
    "বাজার",
    "বেতন",
    "ভাড়া",
    "বিদ্যুৎ",
    "গ্যাস",
    "পানি",
    "পরিবহন",
    "মেরামত",
    "মার্কেটিং",
    "অন্যান্য",
  ];

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      let url = "/api/expenses";
      if (selectedCategory !== "ALL") url += `?category=${encodeURIComponent(selectedCategory)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses || []);
        setTotalExpense(data.totalExpense || 0);
      }
    } catch {
      toast.error("খরচের তালিকা লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [selectedCategory]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "expenses");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "রসিদ আপলোড ব্যর্থ");
      setAttachment(data.url);
      toast.success("খরচের রসিদ আপলোড হয়েছে!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0 || !description.trim()) {
      toast.error("সঠিক টাকার পরিমাণ ও বিবরণ দিন");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          amount,
          description: description.trim(),
          paymentMethod,
          attachment,
          date: new Date(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "খরচ সংরক্ষণ ব্যর্থ");

      toast.success("খরচ সফলভাবে যোগ করা হয়েছে");
      setCreateModalOpen(false);
      setAmount(0);
      setDescription("");
      setAttachment("");
      fetchExpenses();
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
            <h1 className="text-xl md:text-2xl font-bold text-slate-800">দৈনিক খরচ হিসাব</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              রেস্টুরেন্টের বাজার, পরিচালন ব্যয়, ইউটিলিটি বিল ও বিবিধ খরচের হিসাব
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={fetchExpenses}
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
              <Plus className="w-4 h-4" /> নতুন খরচ যোগ
            </Button>
          </div>
        </div>

        {/* Total Expense Summary & Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="sm:col-span-1 p-4 bg-gradient-to-br from-rose-50 to-white border-rose-200">
            <span className="text-xs font-semibold text-rose-800">মোট খরচ</span>
            <div className="text-2xl font-mono font-bold text-rose-600 mt-1">
              {formatBDT(totalExpense)}
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              {expenses.length} টি ভাউচার এন্ট্রি
            </span>
          </Card>

          <Card className="sm:col-span-2 p-4 flex flex-col justify-center">
            <span className="text-xs font-semibold text-slate-700 mb-2">খাত অনুযায়ী ফিল্টার:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCategory("ALL")}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === "ALL"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                সব খাত
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === c
                      ? "bg-rose-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Expenses Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="p-3">তারিখ</th>
                  <th className="p-3">খাত (ক্যাটাগরি)</th>
                  <th className="p-3">বিবরণ</th>
                  <th className="p-3 text-right">টাকার পরিমাণ</th>
                  <th className="p-3 text-center">মাধ্যম</th>
                  <th className="p-3">এন্ট্রি প্রদানকারী</th>
                  <th className="p-3 text-center">রসিদ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      লোড হচ্ছে...
                    </td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      কোন খরচের তথ্য নেই
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp._id} className="hover:bg-slate-50/60">
                      <td className="p-3 text-slate-500 whitespace-nowrap">
                        {new Date(exp.date).toLocaleDateString("en-GB")}
                      </td>
                      <td className="p-3 font-semibold text-slate-800">
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px]">
                          {exp.category}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700 max-w-xs">{exp.description}</td>
                      <td className="p-3 text-right font-mono font-bold text-rose-600 text-sm">
                        {formatBDT(exp.amount)}
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-[10px] font-bold text-slate-600">
                          {exp.paymentMethod}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 font-medium">
                        {exp.createdBy?.name || "এডমিন"}
                      </td>
                      <td className="p-3 text-center">
                        {exp.attachment ? (
                          <a
                            href={exp.attachment}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:underline font-bold text-[11px]"
                          >
                            দেখুন
                          </a>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* New Expense Modal */}
        <Dialog
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="নতুন খরচের ভাউচার এন্ট্রি"
        >
          <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">খরচের খাত *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <Input
              type="number"
              min="1"
              step="any"
              label="টাকার পরিমাণ (৳) *"
              value={amount || ""}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              required
            />

            <Input
              label="খরচের বিবরণ *"
              placeholder="উদাঃ দৈনিক বাজার চাল-ডাল বা বিদ্যুৎ বিল মে ২০২৬"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                পেমেন্ট মাধ্যম
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
              >
                <option value="CASH">ক্যাশ (Cash)</option>
                <option value="BKASH">বিকাশ (bKash)</option>
                <option value="NAGAD">নগদ (Nagad)</option>
                <option value="ROCKET">রকেট (Rocket)</option>
                <option value="CARD">কার্ড (Card)</option>
                <option value="BANK">ব্যাংক (Bank)</option>
              </select>
            </div>

            {/* Cloudinary receipt attachment */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ভাউচার / মেমো ছবি
              </label>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer px-3 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 flex items-center gap-1.5 text-xs font-medium">
                  <Upload className="w-4 h-4 text-slate-500" />
                  {uploading ? "আপলোড হচ্ছে..." : "মেমো আপলোড করুন"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
                {attachment && (
                  <span className="text-emerald-600 font-bold text-xs">✓ আপলোড হয়েছে</span>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
                disabled={submitting}
              >
                বাতিল
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                সংরক্ষণ করুন
              </Button>
            </div>
          </form>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
