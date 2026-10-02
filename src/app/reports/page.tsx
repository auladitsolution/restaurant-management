"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatBDT } from "@/lib/calculations/financial";
import { toast } from "sonner";
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function ReportsPage() {
  const [range, setRange] = useState("today"); // today, yesterday, 7days, month, custom
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      let url = `/api/reports?range=${range}`;
      if (range === "custom" && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      toast.error("রিপোর্ট লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (range !== "custom" || (startDate && endDate)) {
      fetchReports();
    }
  }, [range, startDate, endDate]);

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};

  const handleExportCSV = (type: string) => {
    window.open(`/api/export?type=${type}`, "_blank");
  };

  const handlePrintReport = () => {
    window.print();
  };

  // Pie chart for Payment Methods
  const paymentData = [
    { name: "ক্যাশ", value: charts.paymentMethodBreakdown?.CASH || 0, color: "#10b981" },
    { name: "বিকাশ", value: charts.paymentMethodBreakdown?.BKASH || 0, color: "#ec4899" },
    { name: "নগদ", value: charts.paymentMethodBreakdown?.NAGAD || 0, color: "#f97316" },
    { name: "কার্ড", value: charts.paymentMethodBreakdown?.CARD || 0, color: "#3b82f6" },
    { name: "বাকি", value: charts.paymentMethodBreakdown?.DUE || 0, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800">
              ব্যবসায়িক রিপোর্ট ও লাভ-ক্ষতির বিশ্লেষণ
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              বিক্রয়, খরচ, প্রস্তুত ব্যয় (COGS), নিট লাভ ও ডেটা এক্সপোর্ট
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={handlePrintReport} className="gap-1.5 text-xs">
              <Printer className="w-3.5 h-3.5" /> প্রিন্ট
            </Button>

            <div className="relative inline-block">
              <select
                onChange={(e) => handleExportCSV(e.target.value)}
                defaultValue=""
                className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="" disabled>
                  ↓ এক্সপোর্ট করুন (Excel CSV)
                </option>
                <option value="orders">অর্ডার তালিকা (CSV)</option>
                <option value="customers">কাস্টমার তালিকা (CSV)</option>
                <option value="inventory">ইনভেন্টরি স্টক (CSV)</option>
                <option value="expenses">দৈনিক খরচ (CSV)</option>
                <option value="purchases">সাপ্লায়ার ক্রয় (CSV)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Date Filter Bar */}
        <Card className="p-3 no-print">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setRange("today")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  range === "today"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                আজকে (Today)
              </button>
              <button
                onClick={() => setRange("yesterday")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  range === "yesterday"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                গতকাল (Yesterday)
              </button>
              <button
                onClick={() => setRange("7days")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  range === "7days"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                বিগত ৭ দিন
              </button>
              <button
                onClick={() => setRange("month")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  range === "month"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                এই মাস
              </button>
              <button
                onClick={() => setRange("custom")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  range === "custom"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                কাস্টম তারিখ
              </button>
            </div>

            {range === "custom" && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                />
                <span className="text-xs text-slate-400">থেকে</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
            )}
          </div>
        </Card>

        {/* Profit & Loss Master Statement Card */}
        <Card className="p-6 bg-gradient-to-br from-white to-slate-50 border-slate-300 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                লাভ-ক্ষতির বিস্তারিত বিবরণী (Profit & Loss Statement)
              </h2>
              <p className="text-xs text-slate-500">
                নির্বাচিত সময়সীমার আর্থিক প্রবাহ ও লাভজনকতার নিখুঁত হিসাব
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">সময়কাল</span>
              <div className="font-bold text-xs text-slate-800 capitalize">{range}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 pt-6 text-center sm:text-left">
            {/* 1. Revenue */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">১. মোট বিক্রয় (Revenue)</span>
              <div className="text-xl font-mono font-bold text-emerald-700 mt-1">
                {formatBDT(kpis.totalSales || 0)}
              </div>
              <span className="text-[10px] text-slate-400">মোট বিক্রিত বিল</span>
            </div>

            {/* 2. COGS */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">২. খাদ্য প্রস্তুত খরচ (COGS)</span>
              <div className="text-xl font-mono font-bold text-rose-600 mt-1">
                -{formatBDT(kpis.totalCOGS || 0)}
              </div>
              <span className="text-[10px] text-slate-400">কাঁচামাল ও আইটেম খরচ</span>
            </div>

            {/* 3. Gross Profit */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">৩. মোট লাভ (Gross Profit)</span>
              <div className="text-xl font-mono font-bold text-slate-900 mt-1">
                {formatBDT(kpis.estimatedGrossProfit || 0)}
              </div>
              <span className="text-[10px] text-slate-400">বিক্রয় - প্রস্তুত খরচ</span>
            </div>

            {/* 4. Operating Expenses */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">৪. দৈনিক খরচ (Expenses)</span>
              <div className="text-xl font-mono font-bold text-rose-600 mt-1">
                -{formatBDT(kpis.totalExpense || 0)}
              </div>
              <span className="text-[10px] text-slate-400">ভাড়া, বেতন ও বিল</span>
            </div>

            {/* 5. Net Profit */}
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-xl shadow-md">
              <span className="text-xs font-semibold text-emerald-100">৫. প্রকৃত নিট লাভ (Net Profit)</span>
              <div className="text-xl font-mono font-bold text-white mt-1">
                {formatBDT(kpis.estimatedNetProfit || 0)}
              </div>
              <span className="text-[10px] text-emerald-200">চূড়ান্ত নিট উদ্বৃত্ত</span>
            </div>
          </div>
        </Card>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Items Table */}
          <Card>
            <CardHeader>
              <h3 className="font-bold text-sm text-slate-800">
                শীর্ষ বিক্রিত মেনু আইটেম রিপোর্ট (Item Sales)
              </h3>
            </CardHeader>
            <CardContent>
              {charts.topItems?.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">কোন আইটেম ডেটা নেই</div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b text-slate-600 font-semibold sticky top-0">
                      <tr>
                        <th className="p-2.5">মেনু আইটেম</th>
                        <th className="p-2.5 text-center">বিক্রিত সংখ্যা</th>
                        <th className="p-2.5 text-right">মোট বিক্রয় (৳)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {charts.topItems?.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-900">{item.nameBn}</td>
                          <td className="p-2.5 text-center font-mono font-bold">{item.quantity} টি</td>
                          <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                            {formatBDT(item.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Method Breakdown */}
          <Card>
            <CardHeader>
              <h3 className="font-bold text-sm text-slate-800">
                পেমেন্ট মাধ্যম অনুপাত (Payment Methods)
              </h3>
            </CardHeader>
            <CardContent>
              {paymentData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                  কোন পেমেন্ট তথ্য নেই
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentData}
                        cx="50%"
                        cy="50%"
                        outerRadius={85}
                        dataKey="value"
                        label={({ name, percent }: any) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {paymentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`৳ ${value}`, "টাকা"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
