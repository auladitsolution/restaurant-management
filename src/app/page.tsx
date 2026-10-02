"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/calculations/financial";
import {
  TrendingUp,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  Receipt,
  Users,
  PlusCircle,
  ArrowUpRight,
  Boxes,
  PieChart as PieIcon,
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

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports?range=today");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};

  // Pie chart data for Order Types
  const orderTypeData = [
    { name: "ডাইন-ইন", value: charts.orderTypeBreakdown?.DINE_IN || 0, color: "#10b981" },
    { name: "পার্সেল", value: charts.orderTypeBreakdown?.TAKEAWAY || 0, color: "#f59e0b" },
    { name: "ডেলিভারি", value: charts.orderTypeBreakdown?.DELIVERY || 0, color: "#06b6d4" },
  ].filter((d) => d.value > 0);

  // Pie chart for Payment Methods
  const paymentData = [
    { name: "ক্যাশ", value: charts.paymentMethodBreakdown?.CASH || 0, color: "#10b981" },
    { name: "বিকাশ", value: charts.paymentMethodBreakdown?.BKASH || 0, color: "#ec4899" },
    { name: "নগদ", value: charts.paymentMethodBreakdown?.NAGAD || 0, color: "#f97316" },
    { name: "কার্ড", value: charts.paymentMethodBreakdown?.CARD || 0, color: "#3b82f6" },
    { name: "বাকি", value: charts.paymentMethodBreakdown?.DUE || 0, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  // Top Items bar data
  const topItemsData = (charts.topItems || []).slice(0, 6).map((item: any) => ({
    name: item.nameBn,
    বিক্রি: item.quantity,
    টাকা: item.revenue,
  }));

  // Expense breakdown data
  const expenseData = Object.entries(charts.expenseByCategory || {}).map(([key, val]) => ({
    name: key,
    টাকা: val,
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Page Header & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800">
              রেস্টুরেন্ট ড্যাশবোর্ড
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              আজকের রিয়েল-টাইম লাইভ সেলস, অর্ডার ও হিসাবের বিবরণী
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={fetchDashboardData}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              রিফ্রেশ
            </Button>

            <Link href="/pos">
              <Button size="sm" variant="primary" className="gap-1.5">
                <PlusCircle className="w-4 h-4" /> নতুন অর্ডার
              </Button>
            </Link>

            <Link href="/expenses">
              <Button size="sm" variant="outline" className="gap-1.5">
                + খরচ যোগ
              </Button>
            </Link>

            <Link href="/inventory">
              <Button size="sm" variant="outline" className="gap-1.5">
                + স্টক যোগ
              </Button>
            </Link>
          </div>
        </div>

        {/* Missing Cost Notice */}
        {kpis.missingCostWarning && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              সতর্কতা: কিছু মেনু আইটেমের ক্রয়/প্রস্তুত খরচ (Cost Price) নির্ধারণ করা নেই।
              সঠিক লাভ গণনার জন্য মেনু সেকশনে খরচ রেট দিন।
            </span>
          </div>
        )}

        {/* 8 Primary KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Today's Sales */}
          <Card className="hover:border-emerald-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">আজকের বিক্রি</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl md:text-2xl font-bold font-mono text-slate-900 mt-2">
                {formatBDT(kpis.totalSales || 0)}
              </div>
              <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> লাইভ আপডেট
              </span>
            </CardContent>
          </Card>

          {/* 2. Today's Orders */}
          <Card className="hover:border-sky-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">আজকের অর্ডার</span>
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl md:text-2xl font-bold font-mono text-slate-900 mt-2">
                {kpis.totalOrders || 0} টি
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                চলমান কিচেন: {kpis.activeOrdersCount || 0} টি
              </span>
            </CardContent>
          </Card>

          {/* 3. Average Order Value */}
          <Card className="hover:border-purple-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">গড় অর্ডার মূল্য</span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl md:text-2xl font-bold font-mono text-slate-900 mt-2">
                {formatBDT(kpis.avgOrderValue || 0)}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">প্রতি অর্ডারে গড়</span>
            </CardContent>
          </Card>

          {/* 4. Today's Expenses */}
          <Card className="hover:border-rose-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">আজকের খরচ</span>
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl md:text-2xl font-bold font-mono text-rose-600 mt-2">
                {formatBDT(kpis.totalExpense || 0)}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">দৈনিক মোট খরচ</span>
            </CardContent>
          </Card>

          {/* 5. Estimated Gross / Net Profit */}
          <Card className="hover:border-emerald-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">আনুমানিক নিট লাভ</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div
                className={`text-xl md:text-2xl font-bold font-mono mt-2 ${
                  (kpis.estimatedNetProfit || 0) >= 0 ? "text-emerald-700" : "text-rose-600"
                }`}
              >
                {formatBDT(kpis.estimatedNetProfit || 0)}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">বিক্রি - COGS - খরচ</span>
            </CardContent>
          </Card>

          {/* 6. Outstanding Customer Due */}
          <Card className="hover:border-amber-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">কাস্টমার বাকি / ডিউ</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl md:text-2xl font-bold font-mono text-amber-700 mt-2">
                {formatBDT(kpis.totalOutstandingDue || 0)}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">বকেয়া পাওনা</span>
            </CardContent>
          </Card>

          {/* 7. Active Orders */}
          <Card className="hover:border-sky-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">চলমান অর্ডার</span>
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl md:text-2xl font-bold font-mono text-sky-700 mt-2">
                {kpis.activeOrdersCount || 0} টি
              </div>
              <Link href="/kitchen" className="text-[11px] text-sky-600 hover:underline mt-1 block">
                কিচেনে দেখুন →
              </Link>
            </CardContent>
          </Card>

          {/* 8. Low Stock Alert */}
          <Card className="hover:border-rose-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">কম স্টকের পণ্য</span>
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Boxes className="w-4 h-4" />
                </div>
              </div>
              <div
                className={`text-xl md:text-2xl font-bold font-mono mt-2 ${
                  (kpis.lowStockCount || 0) > 0 ? "text-rose-600" : "text-slate-800"
                }`}
              >
                {kpis.lowStockCount || 0} টি
              </div>
              <Link
                href="/inventory?lowStock=true"
                className="text-[11px] text-rose-600 hover:underline mt-1 block"
              >
                রি-স্টক করুন →
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Best Selling Items */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-sm text-slate-800">
                সর্বাধিক বিক্রিত আইটেম (Top Selling Items)
              </h3>
            </CardHeader>
            <CardContent>
              {topItemsData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                  আজকের বিক্রিত কোন আইটেম এখনও নেই
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topItemsData}>
                      <XAxis dataKey="name" fontSize={11} tickLine={false} />
                      <YAxis fontSize={11} tickLine={false} />
                      <Tooltip
                        formatter={(value: any, name: any) => [
                          name === "টাকা" ? `৳ ${value}` : `${value} টি`,
                          name,
                        ]}
                      />
                      <Bar dataKey="বিক্রি" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chart 2: Order Types Breakdown */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-sm text-slate-800">
                অর্ডারের ধরন (Dine-in / Takeaway / Delivery)
              </h3>
            </CardHeader>
            <CardContent>
              {orderTypeData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                  কোন অর্ডার ডেটা নেই
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={orderTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {orderTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`৳ ${value}`, "টাকার পরিমাণ"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chart 3: Payment Methods */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-sm text-slate-800">
                পেমেন্ট মাধ্যম অনুপাত (Payment Breakdown)
              </h3>
            </CardHeader>
            <CardContent>
              {paymentData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                  কোন পেমেন্ট ডেটা নেই
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

          {/* Chart 4: Expense Categories */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-sm text-slate-800">
                দৈনিক খরচ খাত (Expense by Category)
              </h3>
            </CardHeader>
            <CardContent>
              {expenseData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                  আজকের কোন খরচ অন্তর্ভুক্ত নেই
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={expenseData} layout="vertical">
                      <XAxis type="number" fontSize={11} tickLine={false} />
                      <YAxis type="category" dataKey="name" fontSize={11} tickLine={false} width={70} />
                      <Tooltip formatter={(value: any) => [`৳ ${value}`, "টাকা"]} />
                      <Bar dataKey="টাকা" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                    </BarChart>
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
