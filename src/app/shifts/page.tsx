"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { ICashShift } from "@/types";
import { formatBDT } from "@/lib/calculations/financial";
import { toast } from "sonner";
import { Clock, Play, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

export default function ShiftsPage() {
  const [currentShift, setCurrentShift] = useState<ICashShift | null>(null);
  const [shiftsHistory, setShiftsHistory] = useState<ICashShift[]>([]);
  const [loading, setLoading] = useState(true);

  // Open Shift modal
  const [openModal, setOpenModal] = useState(false);
  const [openingCash, setOpeningCash] = useState<number>(1000);
  const [openNotes, setOpenNotes] = useState("");

  // Close Shift modal
  const [closeModal, setCloseModal] = useState(false);
  const [actualCash, setActualCash] = useState<number>(0);
  const [closeNotes, setCloseNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchShiftData = async () => {
    setLoading(true);
    try {
      const [curRes, histRes] = await Promise.all([
        fetch("/api/shifts?current=true"),
        fetch("/api/shifts"),
      ]);

      if (curRes.ok) setCurrentShift((await curRes.json()).shift);
      if (histRes.ok) setShiftsHistory((await histRes.json()).shifts || []);
    } catch {
      toast.error("শিফট ডাটা লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShiftData();
  }, []);

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "OPEN",
          openingCash,
          notes: openNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "শিফট চালু ব্যর্থ");

      toast.success("ক্যাশ শিফট সফলভাবে চালু হয়েছে!");
      setOpenModal(false);
      setOpenNotes("");
      fetchShiftData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CLOSE",
          actualCash,
          notes: closeNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "শিফট বন্ধ ব্যর্থ");

      toast.success("ক্যাশ শিফট সফলভাবে সমাপ্ত হয়েছে!");
      setCloseModal(false);
      setActualCash(0);
      setCloseNotes("");
      fetchShiftData();
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
            <h1 className="text-xl md:text-2xl font-bold text-slate-800">ক্যাশ শিফট ও রেজিস্টার</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              ক্যাশিয়ারের ওপেনিং ব্যালেন্স, চলমান নগদ বিক্রি ও শিফট সমাপ্তি হিসাব
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={fetchShiftData}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> রিফ্রেশ
            </Button>

            {!currentShift ? (
              <Button
                size="sm"
                variant="primary"
                onClick={() => setOpenModal(true)}
                className="gap-1.5"
              >
                <Play className="w-4 h-4" /> নতুন শিফট চালু (Open Shift)
              </Button>
            ) : (
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  setActualCash(currentShift.expectedCash || 0);
                  setCloseModal(true);
                }}
                className="gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> শিফট সমাপ্ত করুন (Close Shift)
              </Button>
            )}
          </div>
        </div>

        {/* Current Shift Live Status Card */}
        {currentShift ? (
          <Card className="p-6 bg-gradient-to-br from-emerald-50 via-white to-white border-emerald-300">
            <div className="flex items-center justify-between pb-4 border-b border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-base text-slate-900">
                      চলমান শিফট: {currentShift.shiftNumber}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold animate-pulse">
                      চালু আছে (LIVE)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    শুরু হয়েছে: {new Date(currentShift.startTime).toLocaleTimeString("en-GB")} (
                    {new Date(currentShift.startTime).toLocaleDateString("en-GB")}) • ক্যাশিয়ার:{" "}
                    {currentShift.cashierName}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
              <div>
                <span className="text-xs text-slate-500">ওপেনিং ক্যাশ</span>
                <div className="text-lg font-mono font-bold text-slate-900">
                  {formatBDT(currentShift.openingCash)}
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-500">চলমান ক্যাশ বিক্রি</span>
                <div className="text-lg font-mono font-bold text-emerald-700">
                  {formatBDT(currentShift.cashSales)}
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-500">অন্যান্য ইন/আউট</span>
                <div className="text-lg font-mono font-bold text-slate-700">
                  ৳ {(currentShift.cashIn || 0) - (currentShift.cashOut || 0)}
                </div>
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-800">
                  প্রত্যাশিত বর্তমান ক্যাশ
                </span>
                <div className="text-xl font-mono font-bold text-emerald-800">
                  {formatBDT(currentShift.expectedCash)}
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-8 text-center text-slate-500 space-y-2">
            <Clock className="w-10 h-10 mx-auto text-slate-300" />
            <h3 className="font-bold text-slate-700 text-sm">বর্তমানে কোন ক্যাশ শিফট চালু নেই</h3>
            <p className="text-xs text-slate-400">
              কাউন্টার সেলস শুরু করার পূর্বে ওপেনিং ব্যালেন্স দিয়ে শিফট ওপেন করুন
            </p>
          </Card>
        )}

        {/* Shift History Table */}
        <Card className="overflow-hidden">
          <CardHeader>
            <h3 className="text-sm font-bold text-slate-800">অতীত শিফট রেকর্ড ও ভ্যারিয়েন্স</h3>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="p-3">শিফট নং</th>
                  <th className="p-3">ক্যাশিয়ার</th>
                  <th className="p-3">সময়কাল</th>
                  <th className="p-3 text-right">ওপেনিং ক্যাশ</th>
                  <th className="p-3 text-right">ক্যাশ বিক্রি</th>
                  <th className="p-3 text-right">প্রত্যাশিত ক্যাশ</th>
                  <th className="p-3 text-right">প্রকৃত ক্যাশ</th>
                  <th className="p-3 text-right">পার্থক্য (Variance)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shiftsHistory.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/60">
                    <td className="p-3 font-mono font-bold text-slate-900">{s.shiftNumber}</td>
                    <td className="p-3 font-semibold text-slate-800">{s.cashierName}</td>
                    <td className="p-3 text-slate-500 whitespace-nowrap">
                      {new Date(s.startTime).toLocaleTimeString("en-GB")}{" "}
                      {s.endTime && `— ${new Date(s.endTime).toLocaleTimeString("en-GB")}`}
                    </td>
                    <td className="p-3 text-right font-mono">{formatBDT(s.openingCash)}</td>
                    <td className="p-3 text-right font-mono text-emerald-700 font-semibold">
                      {formatBDT(s.cashSales)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold">{formatBDT(s.expectedCash)}</td>
                    <td className="p-3 text-right font-mono font-bold">
                      {s.actualCash !== undefined ? formatBDT(s.actualCash) : "—"}
                    </td>
                    <td className="p-3 text-right font-mono font-bold">
                      {s.difference !== undefined ? (
                        s.difference === 0 ? (
                          <span className="text-emerald-600">৳ ০ (সঠিক)</span>
                        ) : s.difference > 0 ? (
                          <span className="text-emerald-700">+{formatBDT(s.difference)}</span>
                        ) : (
                          <span className="text-rose-600">{formatBDT(s.difference)}</span>
                        )
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Open Shift Modal */}
        <Dialog open={openModal} onClose={() => setOpenModal(false)} title="নতুন ক্যাশ শিফট চালু করুন">
          <form onSubmit={handleOpenShift} className="space-y-4 text-xs">
            <Input
              type="number"
              min="0"
              step="any"
              label="ওপেনিং ক্যাশ (ড্রয়ারে থাকা প্রাথমিক টাকা) *"
              value={openingCash}
              onChange={(e) => setOpeningCash(parseFloat(e.target.value) || 0)}
              required
            />
            <Input
              label="নোট (ঐচ্ছিক)"
              placeholder="উদাঃ মর্নিং শিফট"
              value={openNotes}
              onChange={(e) => setOpenNotes(e.target.value)}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenModal(false)}>
                বাতিল
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                শিফট শুরু করুন
              </Button>
            </div>
          </form>
        </Dialog>

        {/* Close Shift Modal */}
        <Dialog
          open={closeModal}
          onClose={() => setCloseModal(false)}
          title="ক্যাশ শিফট সমাপ্তি (ক্লোজিং)"
        >
          <form onSubmit={handleCloseShift} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">প্রত্যাশিত মোট ক্যাশ:</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatBDT(currentShift?.expectedCash || 0)}
                </span>
              </div>
            </div>

            <Input
              type="number"
              min="0"
              step="any"
              label="ড্রয়ার গুনে পাওয়া প্রকৃত ক্যাশ (Actual Cash) *"
              value={actualCash}
              onChange={(e) => setActualCash(parseFloat(e.target.value) || 0)}
              required
            />

            <div className="flex justify-between p-2 rounded-lg bg-slate-100 font-bold">
              <span>পার্থক্য (Variance):</span>
              <span
                className={`font-mono ${
                  actualCash - (currentShift?.expectedCash || 0) >= 0
                    ? "text-emerald-700"
                    : "text-rose-600"
                }`}
              >
                {formatBDT(actualCash - (currentShift?.expectedCash || 0))}
              </span>
            </div>

            <Input
              label="ক্লোজিং নোট (ঐচ্ছিক)"
              placeholder="পার্থক্য বা বিশেষ মন্তব্য"
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setCloseModal(false)}>
                বাতিল
              </Button>
              <Button type="submit" variant="danger" loading={submitting}>
                শিফট বন্ধ ও হিসাব ফাইনাল করুন
              </Button>
            </div>
          </form>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
