"use client";

import React, { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IOrder, KitchenStatus } from "@/types";
import { toast } from "sonner";
import {
  ChefHat,
  Clock,
  CheckCircle,
  Play,
  BellRing,
  RefreshCw,
  Utensils,
  Volume2,
  VolumeX,
} from "lucide-react";

export default function KitchenPage() {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const previousOrderCountRef = useRef(0);

  useEffect(() => {
    setCurrentTime(Date.now());
    const timer = setInterval(() => setCurrentTime(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const playChime = () => {
    if (!soundEnabled) return;
    try {
      // Web Audio API beep sound for kitchen notification
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch {
      // Browser audio policy
    }
  };

  const fetchKitchenOrders = async () => {
    try {
      const res = await fetch("/api/kitchen");
      if (res.ok) {
        const data = await res.json();
        const incomingOrders: IOrder[] = data.orders || [];

        // Check if new orders arrived
        const newCount = incomingOrders.filter((o) => o.kitchenStatus === "NEW").length;
        if (newCount > previousOrderCountRef.current && previousOrderCountRef.current !== 0) {
          playChime();
          toast.info("কিচেনে নতুন অর্ডার এসেছে!");
        }
        previousOrderCountRef.current = newCount;
        setOrders(incomingOrders);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKitchenOrders();
    const interval = setInterval(fetchKitchenOrders, 10000); // 10s auto-sync
    return () => clearInterval(interval);
  }, [soundEnabled]);

  const updateStatus = async (orderId: string, kitchenStatus: KitchenStatus) => {
    try {
      const res = await fetch("/api/kitchen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, kitchenStatus }),
      });

      if (!res.ok) throw new Error("স্ট্যাটাস আপডেট ব্যর্থ");
      toast.success("কিচেন স্ট্যাটাস আপডেট হয়েছে");
      fetchKitchenOrders();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const calculateElapsedMinutes = (dateStr: string | Date) => {
    if (!currentTime) return 0;
    const elapsedMs = currentTime - new Date(dateStr).getTime();
    return Math.max(0, Math.floor(elapsedMs / (1000 * 60)));
  };

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800">
                কিচেন ডিসপ্লে সিস্টেম (KDS)
              </h1>
              <p className="text-xs text-slate-500">
                লাইভ কিচেন প্রিপারেশন, রান্নার অগ্রগতি ও সার্ভ ট্র্যাকার
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={soundEnabled ? "primary" : "outline"}
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="gap-1.5 text-xs"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              {soundEnabled ? "অ্যালার্ট সাউন্ড অন" : "মিউট"}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={fetchKitchenOrders}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> রিফ্রেশ
            </Button>
          </div>
        </div>

        {/* KDS Feed Grid */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">কিচেন ডাটা লোড হচ্ছে...</div>
        ) : orders.length === 0 ? (
          <Card className="p-16 text-center text-slate-400 space-y-3">
            <ChefHat className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">বর্তমানে কিচেনে কোন পেন্ডিং অর্ডার নেই</p>
            <p className="text-xs text-slate-400">নতুন নিশ্চিত অর্ডার স্বয়ংক্রিয়ভাবে এখানে চলে আসবে</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {orders.map((order) => {
              const elapsed = calculateElapsedMinutes(order.createdAt);
              const isUrgent = elapsed > 20;

              return (
                <div
                  key={order._id}
                  className={`rounded-2xl border bg-white shadow-sm flex flex-col justify-between overflow-hidden transition-all ${
                    order.kitchenStatus === "NEW"
                      ? "border-emerald-400 ring-2 ring-emerald-400/20"
                      : order.kitchenStatus === "PREPARING"
                      ? "border-amber-400 ring-2 ring-amber-400/20"
                      : order.kitchenStatus === "READY"
                      ? "border-purple-400 ring-2 ring-purple-400/20"
                      : "border-slate-200 opacity-75"
                  }`}
                >
                  {/* Card Header */}
                  <div
                    className={`p-3.5 border-b flex items-center justify-between ${
                      order.kitchenStatus === "NEW"
                        ? "bg-emerald-50/70 text-emerald-900 border-emerald-100"
                        : order.kitchenStatus === "PREPARING"
                        ? "bg-amber-50/70 text-amber-900 border-amber-100"
                        : order.kitchenStatus === "READY"
                        ? "bg-purple-50/70 text-purple-900 border-purple-100"
                        : "bg-slate-50 text-slate-800 border-slate-100"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm">{order.orderNumber}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 border border-current">
                          {order.kitchenStatus === "NEW"
                            ? "নতুন"
                            : order.kitchenStatus === "PREPARING"
                            ? "প্রস্তুত হচ্ছে"
                            : order.kitchenStatus === "READY"
                            ? "প্রস্তুত"
                            : "সার্ভড"}
                        </span>
                      </div>
                      <div className="text-[11px] font-medium opacity-80 mt-0.5">
                        {order.orderType === "DINE_IN"
                          ? `টেবিল: ${order.tableName || "N/A"}`
                          : order.orderType === "TAKEAWAY"
                          ? "পার্সেল"
                          : "ডেলিভারি"}
                        {order.waiterName && ` • ওয়েটার: ${order.waiterName}`}
                      </div>
                    </div>

                    <div
                      className={`flex items-center gap-1 font-mono text-xs font-bold px-2.5 py-1 rounded-xl ${
                        isUrgent
                          ? "bg-rose-100 text-rose-700 animate-pulse"
                          : "bg-white text-slate-700"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{elapsed} মিনিট</span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="p-4 flex-1 divide-y divide-slate-100 space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="pt-2 first:pt-0 flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold shrink-0">
                              {item.quantity}
                            </span>
                            <span>{item.nameBn}</span>
                          </div>

                          {item.variantNameBn && (
                            <span className="text-xs text-purple-700 font-semibold block ml-8">
                              সাইজ: {item.variantNameBn}
                            </span>
                          )}

                          {item.addOns && item.addOns.length > 0 && (
                            <span className="text-[11px] text-slate-500 block ml-8">
                              + {item.addOns.map((a) => a.nameBn).join(", ")}
                            </span>
                          )}

                          {item.notes && (
                            <span className="text-xs text-amber-700 font-medium block ml-8 bg-amber-50 px-2 py-0.5 rounded-md mt-1 border border-amber-200">
                              নোট: {item.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    {order.notes && (
                      <div className="pt-2 text-xs text-rose-700 font-bold bg-rose-50 p-2 rounded-xl border border-rose-200">
                        বিশেষ নির্দেশনা: {order.notes}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
                    {order.kitchenStatus === "NEW" ? (
                      <Button
                        size="sm"
                        variant="amber"
                        onClick={() => updateStatus(order._id, "PREPARING")}
                        className="w-full gap-1.5 text-xs py-2 font-bold"
                      >
                        <Play className="w-3.5 h-3.5" /> রান্না শুরু করুন (PREPARE)
                      </Button>
                    ) : order.kitchenStatus === "PREPARING" ? (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => updateStatus(order._id, "READY")}
                        className="w-full gap-1.5 text-xs py-2 font-bold bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> রান্না শেষ ও প্রস্তুত (READY)
                      </Button>
                    ) : order.kitchenStatus === "READY" ? (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => updateStatus(order._id, "SERVED")}
                        className="w-full gap-1.5 text-xs py-2 font-bold"
                      >
                        <Utensils className="w-3.5 h-3.5" /> সার্ভ করা সম্পন্ন (SERVED)
                      </Button>
                    ) : (
                      <span className="text-xs text-emerald-700 font-bold mx-auto">
                        ✓ সার্ভ সম্পন্ন হয়েছে
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
