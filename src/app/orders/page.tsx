"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ReceiptModal } from "@/components/receipt/ReceiptModal";
import { PaymentModal } from "@/components/pos/PaymentModal";
import { IOrder, OrderStatus, IPaymentRecord } from "@/types";
import { formatBDT } from "@/lib/calculations/financial";
import { toast } from "sonner";
import {
  Search,
  Filter,
  Printer,
  CreditCard,
  Ban,
  Eye,
  RefreshCw,
  Utensils,
  ShoppingBag,
  Truck,
  CheckCircle,
  Clock,
} from "lucide-react";

export default function OrdersPage() {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [settings, setSettings] = useState<any>(null);

  // Selected Order for View Details
  const [viewOrder, setViewOrder] = useState<IOrder | null>(null);

  // Payment collection modal
  const [paymentOrder, setPaymentOrder] = useState<IOrder | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Cancel order modal
  const [cancelOrder, setCancelOrder] = useState<IOrder | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // Receipt modal
  const [receiptOrder, setReceiptOrder] = useState<IOrder | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = `/api/orders?status=${statusFilter}&orderType=${typeFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setOrders(json.orders || []);
      }
    } catch {
      toast.error("অর্ডার লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setSettings(data.settings))
      .catch(() => {});
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleCollectPayment = async (paymentRecords: IPaymentRecord[]) => {
    if (!paymentOrder) return;
    setPaymentLoading(true);
    try {
      const res = await fetch(`/api/orders/${paymentOrder._id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentRecords }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "পেমেন্ট ব্যর্থ হয়েছে");
      toast.success("পেমেন্ট সফলভাবে সংরক্ষণ হয়েছে!");
      setPaymentOrder(null);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleCancelOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelOrder || !cancelReason.trim()) {
      toast.error("বাতিল করার কারণ লিখুন");
      return;
    }
    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${cancelOrder._id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "বাতিল ব্যর্থ হয়েছে");
      toast.success("অর্ডার বাতিল করা হয়েছে এবং ইনভেন্টরি স্টক রিভার্স করা হয়েছে");
      setCancelOrder(null);
      setCancelReason("");
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "CONFIRMED":
        return <Badge variant="info">নিশ্চিত</Badge>;
      case "PREPARING":
        return <Badge variant="warning">প্রস্তুত হচ্ছে</Badge>;
      case "READY":
        return <Badge variant="purple">প্রস্তুত</Badge>;
      case "SERVED":
        return <Badge variant="success">সার্ভ করা হয়েছে</Badge>;
      case "COMPLETED":
        return <Badge variant="success">সম্পন্ন</Badge>;
      case "CANCELLED":
        return <Badge variant="danger">বাতিল</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-7xl mx-auto">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800">অর্ডার ব্যবস্থাপনা</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              রেস্টুরেন্টের সকল ঐতিহাসিক ও চলমান অর্ডারের তালিকা
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={fetchOrders}
            disabled={loading}
            className="gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            রিফ্রেশ
          </Button>
        </div>

        {/* Filter Toolbar */}
        <Card className="p-3">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3"
          >
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="অর্ডার নম্বর, কাস্টমার ফোন বা টেবিল খুঁজুন..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
              >
                <option value="ALL">সব স্ট্যাটাস</option>
                <option value="CONFIRMED">নিশ্চিত</option>
                <option value="PREPARING">প্রস্তুত হচ্ছে</option>
                <option value="READY">প্রস্তুত</option>
                <option value="SERVED">সার্ভড</option>
                <option value="COMPLETED">সম্পন্ন</option>
                <option value="CANCELLED">বাতিলকৃত</option>
              </select>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
              >
                <option value="ALL">সব ধরনের অর্ডার</option>
                <option value="DINE_IN">ডাইন-ইন</option>
                <option value="TAKEAWAY">পার্সেল</option>
                <option value="DELIVERY">ডেলিভারি</option>
              </select>

              <Button type="submit" size="sm" variant="primary">
                খুঁজুন
              </Button>
            </div>
          </form>
        </Card>

        {/* Orders Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="p-3">অর্ডার নম্বর</th>
                  <th className="p-3">তারিখ ও সময়</th>
                  <th className="p-3">ধরন / টেবিল</th>
                  <th className="p-3">কাস্টমার</th>
                  <th className="p-3 text-right">সর্বমোট বিল</th>
                  <th className="p-3 text-right">পরিশোধ</th>
                  <th className="p-3 text-right">বাকি</th>
                  <th className="p-3 text-center">স্ট্যাটাস</th>
                  <th className="p-3 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      লোড হচ্ছে...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      কোন অর্ডার রেকর্ড পাওয়া যায়নি
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-900">
                        {o.orderNumber}
                      </td>
                      <td className="p-3 text-slate-500 whitespace-nowrap">
                        {new Date(o.createdAt).toLocaleDateString("en-GB")}{" "}
                        <span className="text-[10px] text-slate-400 block">
                          {new Date(o.createdAt).toLocaleTimeString("en-GB")}
                        </span>
                      </td>
                      <td className="p-3 font-medium">
                        {o.orderType === "DINE_IN" ? (
                          <span className="flex items-center gap-1 text-emerald-700">
                            <Utensils className="w-3.5 h-3.5" /> টেবিল {o.tableName || "N/A"}
                          </span>
                        ) : o.orderType === "TAKEAWAY" ? (
                          <span className="flex items-center gap-1 text-amber-700">
                            <ShoppingBag className="w-3.5 h-3.5" /> পার্সেল
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-sky-700">
                            <Truck className="w-3.5 h-3.5" /> ডেলিভারি
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">
                          {o.customerName || "গেস্ট কাস্টমার"}
                        </div>
                        {o.customerPhone && (
                          <div className="text-[11px] font-mono text-slate-400">
                            {o.customerPhone}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {formatBDT(o.grandTotal)}
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-700 font-semibold">
                        {formatBDT(o.paidAmount)}
                      </td>
                      <td className="p-3 text-right font-mono">
                        {o.dueAmount > 0 ? (
                          <span className="text-rose-600 font-bold">{formatBDT(o.dueAmount)}</span>
                        ) : (
                          <span className="text-slate-400">৳ ০</span>
                        )}
                      </td>
                      <td className="p-3 text-center">{getStatusBadge(o.orderStatus)}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View details */}
                          <button
                            onClick={() => setViewOrder(o)}
                            title="বিস্তারিত দেখুন"
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Print Receipt */}
                          <button
                            onClick={() => setReceiptOrder(o)}
                            title="রসিদ প্রিন্ট করুন"
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Collect Due Payment */}
                          {o.dueAmount > 0 && o.orderStatus !== "CANCELLED" && (
                            <button
                              onClick={() => setPaymentOrder(o)}
                              title="বাকি পেমেন্ট গ্রহণ করুন"
                              className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                          )}

                          {/* Cancel Order */}
                          {o.orderStatus !== "CANCELLED" && o.orderStatus !== "COMPLETED" && (
                            <button
                              onClick={() => setCancelOrder(o)}
                              title="অর্ডার বাতিল করুন"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* View Order Modal */}
      {viewOrder && (
        <Dialog
          open={!!viewOrder}
          onClose={() => setViewOrder(null)}
          title={`অর্ডার বিবরণী: ${viewOrder.orderNumber}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-50 rounded-xl">
              <div>
                <span className="text-slate-500">ধরন</span>
                <div className="font-semibold">{viewOrder.orderType}</div>
              </div>
              <div>
                <span className="text-slate-500">টেবিল</span>
                <div className="font-semibold">{viewOrder.tableName || "N/A"}</div>
              </div>
              <div>
                <span className="text-slate-500">অর্ডার স্ট্যাটাস</span>
                <div>{getStatusBadge(viewOrder.orderStatus)}</div>
              </div>
              <div>
                <span className="text-slate-500">কিচেন স্ট্যাটাস</span>
                <div className="font-semibold text-purple-700">{viewOrder.kitchenStatus}</div>
              </div>
            </div>

            {/* Items */}
            <div>
              <h4 className="font-bold text-slate-800 mb-2">অর্ডারকৃত আইটেমসমূহ:</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b text-slate-600 font-semibold">
                    <tr>
                      <th className="p-2">আইটেম</th>
                      <th className="p-2 text-center">পরিমাণ</th>
                      <th className="p-2 text-right">দর</th>
                      <th className="p-2 text-right">মোট</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewOrder.items.map((i, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-medium">
                          {i.nameBn} {i.variantNameBn && `(${i.variantNameBn})`}
                        </td>
                        <td className="p-2 text-center font-mono">{i.quantity}</td>
                        <td className="p-2 text-right font-mono">{formatBDT(i.unitPrice)}</td>
                        <td className="p-2 text-right font-mono font-bold">
                          {formatBDT(i.totalPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cancellation info if cancelled */}
            {viewOrder.orderStatus === "CANCELLED" && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Ban className="w-4 h-4 text-rose-600" />
                  বাতিল করার কারণ: {viewOrder.cancellationReason}
                </div>
                <div className="text-[11px] text-rose-600">
                  বাতিলকারী: {viewOrder.cancelledBy?.name || "এডমিন"}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setReceiptOrder(viewOrder);
                  setViewOrder(null);
                }}
                className="gap-1.5"
              >
                <Printer className="w-4 h-4" /> রসিদ প্রিন্ট
              </Button>
              <Button variant="primary" onClick={() => setViewOrder(null)}>
                বন্ধ করুন
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Collect Payment Modal */}
      {paymentOrder && (
        <PaymentModal
          open={!!paymentOrder}
          onClose={() => setPaymentOrder(null)}
          grandTotal={paymentOrder.dueAmount}
          onConfirm={handleCollectPayment}
          loading={paymentLoading}
        />
      )}

      {/* Cancel Order Modal with mandatory reason */}
      {cancelOrder && (
        <Dialog
          open={!!cancelOrder}
          onClose={() => setCancelOrder(null)}
          title={`অর্ডার বাতিল নিশ্চিতকরণ (${cancelOrder.orderNumber})`}
        >
          <form onSubmit={handleCancelOrderSubmit} className="space-y-4 text-xs">
            <p className="text-slate-600 leading-relaxed">
              সতর্কতা: অর্ডারটি বাতিল করলে সংশ্লিষ্ট টেবিল মুক্ত হবে এবং কর্তনকৃত ইনভেন্টরি স্টক
              স্বয়ংক্রিয়ভাবে ফেরত আসবে।
            </p>

            <Input
              label="বাতিল করার সুনির্দিষ্ট কারণ লিখুন *"
              placeholder="উদাঃ কাস্টমার চলে গেছে / অর্ডার পরিবর্তন / ভুল এন্ট্রি"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              required
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCancelOrder(null)}
                disabled={cancelling}
              >
                ফিরে যান
              </Button>
              <Button type="submit" variant="danger" loading={cancelling}>
                অর্ডার নিশ্চিত বাতিল করুন
              </Button>
            </div>
          </form>
        </Dialog>
      )}

      {/* Receipt Modal */}
      <ReceiptModal
        open={!!receiptOrder}
        onClose={() => setReceiptOrder(null)}
        order={receiptOrder}
        settings={settings}
      />
    </DashboardLayout>
  );
}
