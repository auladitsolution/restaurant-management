"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { ICustomer, IOrder } from "@/types";
import { formatBDT } from "@/lib/calculations/financial";
import { toast } from "sonner";
import { Users, Plus, Search, Eye, Phone, RefreshCw } from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dueOnly, setDueOnly] = useState(false);

  // New Customer Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // View Customer & History Modal
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<IOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      let url = `/api/customers?dueOnly=${dueOnly}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
      }
    } catch {
      toast.error("কাস্টমার লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [dueOnly]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "কাস্টমার তৈরি ব্যর্থ");

      toast.success("কাস্টমার সফলভাবে নিবন্ধিত হয়েছে");
      setCreateModalOpen(false);
      setName("");
      setPhone("");
      setAddress("");
      fetchCustomers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openCustomerDetails = async (customer: ICustomer) => {
    setSelectedCustomer(customer);
    setLoadingOrders(true);
    try {
      const res = await fetch(`/api/customers/${customer._id}`);
      if (res.ok) {
        const data = await res.json();
        setCustomerOrders(data.orders || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingOrders(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800">কাস্টমার ডিরেক্টরি</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              কাস্টমার তথ্য, ক্রয় ইতিহাস ও বকেয়া পাওনার হিসাব
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={fetchCustomers}
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
              <Plus className="w-4 h-4" /> নতুন কাস্টমার
            </Button>
          </div>
        </div>

        {/* Search & Due Filter Toolbar */}
        <Card className="p-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchCustomers()}
                placeholder="মোবাইল নম্বর বা নাম দিয়ে কাস্টমার খুঁজুন..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <Button
              size="sm"
              variant={dueOnly ? "danger" : "outline"}
              onClick={() => setDueOnly(!dueOnly)}
              className="text-xs whitespace-nowrap"
            >
              {dueOnly ? "সব কাস্টমার দেখুন" : "শুধুমাত্র বাকি (Due Only)"}
            </Button>
          </div>
        </Card>

        {/* Customer Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="p-3">কাস্টমার নাম</th>
                  <th className="p-3">মোবাইল নম্বর</th>
                  <th className="p-3">ঠিকানা</th>
                  <th className="p-3 text-center">মোট অর্ডার</th>
                  <th className="p-3 text-right">সর্বমোট কেনাকাটা</th>
                  <th className="p-3 text-right">বাকি (Due)</th>
                  <th className="p-3 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      লোড হচ্ছে...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      কোন কাস্টমার রেকর্ড নেই
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-semibold text-slate-900">{c.name}</td>
                      <td className="p-3 font-mono font-bold text-slate-700">{c.phone}</td>
                      <td className="p-3 text-slate-500 max-w-xs truncate">{c.address || "—"}</td>
                      <td className="p-3 text-center font-mono font-bold">{c.totalOrders} টি</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {formatBDT(c.totalSpent)}
                      </td>
                      <td className="p-3 text-right font-mono">
                        {c.totalDue > 0 ? (
                          <span className="text-rose-600 font-bold">{formatBDT(c.totalDue)}</span>
                        ) : (
                          <span className="text-slate-400">৳ ০</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => openCustomerDetails(c)}
                          title="অর্ডার হিস্ট্রি দেখুন"
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Create Customer Modal */}
        <Dialog
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="নতুন কাস্টমার নিবন্ধন"
        >
          <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
            <Input
              label="কাস্টমার নাম *"
              placeholder="উদাঃ মোঃ নাজমুল ইসলাম"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="মোবাইল নম্বর *"
              placeholder="01700000000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <Input
              label="ঠিকানা (ঐচ্ছিক)"
              placeholder="বাসা নং, রোড নং, এলাকা"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                বাতিল
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                নিবন্ধন সম্পন্ন করুন
              </Button>
            </div>
          </form>
        </Dialog>

        {/* View Customer History Modal */}
        {selectedCustomer && (
          <Dialog
            open={!!selectedCustomer}
            onClose={() => setSelectedCustomer(null)}
            title={`কাস্টমার বিবরণ: ${selectedCustomer.name}`}
            maxWidth="lg"
          >
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-slate-500">ফোন নম্বর</span>
                  <div className="font-mono font-bold">{selectedCustomer.phone}</div>
                </div>
                <div>
                  <span className="text-slate-500">মোট অর্ডার</span>
                  <div className="font-bold">{selectedCustomer.totalOrders} টি</div>
                </div>
                <div>
                  <span className="text-slate-500">মোট খরচ</span>
                  <div className="font-mono font-bold text-emerald-700">
                    {formatBDT(selectedCustomer.totalSpent)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">বাকি (Due)</span>
                  <div className="font-mono font-bold text-rose-600">
                    {formatBDT(selectedCustomer.totalDue)}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">সাম্প্রতিক অর্ডারসমূহ:</h4>
                {loadingOrders ? (
                  <div className="p-8 text-center text-slate-400">অর্ডার লোড হচ্ছে...</div>
                ) : customerOrders.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">কোন অর্ডার নেই</div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b text-slate-600 font-semibold sticky top-0">
                        <tr>
                          <th className="p-2">অর্ডার নং</th>
                          <th className="p-2">তারিখ</th>
                          <th className="p-2 text-right">মোট বিল</th>
                          <th className="p-2 text-right">বাকি</th>
                          <th className="p-2 text-center">স্ট্যাটাস</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {customerOrders.map((o) => (
                          <tr key={o._id}>
                            <td className="p-2 font-mono font-bold">{o.orderNumber}</td>
                            <td className="p-2 text-slate-500">
                              {new Date(o.createdAt).toLocaleDateString("en-GB")}
                            </td>
                            <td className="p-2 text-right font-mono font-semibold">
                              {formatBDT(o.grandTotal)}
                            </td>
                            <td className="p-2 text-right font-mono">
                              {o.dueAmount > 0 ? (
                                <span className="text-rose-600 font-bold">
                                  {formatBDT(o.dueAmount)}
                                </span>
                              ) : (
                                "৳ ০"
                              )}
                            </td>
                            <td className="p-2 text-center">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 font-bold text-[10px]">
                                {o.orderStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}
