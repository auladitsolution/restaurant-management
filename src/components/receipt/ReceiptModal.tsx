"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IOrder, IRestaurantSettings } from "@/types";
import { formatBDT } from "@/lib/calculations/financial";
import { Printer } from "lucide-react";

export interface ReceiptModalProps {
  open: boolean;
  onClose: () => void;
  order: IOrder | null;
  settings?: IRestaurantSettings | null;
}

export function ReceiptModal({ open, onClose, order, settings }: ReceiptModalProps) {
  const [printFormat, setPrintFormat] = useState<"80mm" | "58mm" | "A4">("80mm");

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const restaurantName = settings?.nameBn || "স্বাদ রেস্টুরেন্ট";
  const restaurantAddress = settings?.address || "মিরপুর-১০, ঢাকা, বাংলাদেশ";
  const restaurantPhone = settings?.phone || "01700000000";
  const footerMessage =
    settings?.receiptFooterMessageBn || "আমাদের সাথে আহারের জন্য আপনাকে ধন্যবাদ! আবার আসবেন।";

  return (
    <Dialog open={open} onClose={onClose} title="রসিদ / ইনভয়েস প্রিন্ট" maxWidth="lg">
      <div className="space-y-4">
        {/* Format Selector Controls */}
        <div className="flex items-center justify-between p-2 bg-slate-100 rounded-xl no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 ml-2">লেআউট:</span>
            <Button
              size="sm"
              variant={printFormat === "80mm" ? "primary" : "outline"}
              onClick={() => setPrintFormat("80mm")}
            >
              ৮০ মি.মি. থার্মাল
            </Button>
            <Button
              size="sm"
              variant={printFormat === "58mm" ? "primary" : "outline"}
              onClick={() => setPrintFormat("58mm")}
            >
              ৫৮ মি.মি. থার্মাল
            </Button>
            <Button
              size="sm"
              variant={printFormat === "A4" ? "primary" : "outline"}
              onClick={() => setPrintFormat("A4")}
            >
              A4 ইনভয়েস
            </Button>
          </div>

          <Button size="sm" variant="amber" onClick={handlePrint} className="gap-1.5 shadow-sm">
            <Printer className="w-4 h-4" /> প্রিন্ট করুন
          </Button>
        </div>

        {/* Printable Area */}
        <div className="bg-slate-200 p-4 rounded-xl flex justify-center overflow-x-auto">
          <div
            id="printable-receipt"
            className={`bg-white text-black p-4 shadow-md transition-all ${
              printFormat === "58mm"
                ? "w-[240px] text-[11px]"
                : printFormat === "80mm"
                ? "w-[320px] text-xs"
                : "w-full max-w-[650px] p-8 text-sm border"
            }`}
          >
            {/* Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h2 className="text-base font-bold text-slate-900">{restaurantName}</h2>
              <p className="text-slate-600 text-[10px] mt-0.5">{restaurantAddress}</p>
              <p className="text-slate-600 text-[10px]">ফোন: {restaurantPhone}</p>
              {settings?.vatRegistrationNumber && (
                <p className="text-[10px] text-slate-500">
                  BIN/VAT: {settings.vatRegistrationNumber}
                </p>
              )}
            </div>

            {/* Order Info */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="font-semibold">অর্ডার নং:</span>
                <span className="font-mono font-bold">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>তারিখ ও সময়:</span>
                <span>{new Date(order.createdAt).toLocaleString("en-GB")}</span>
              </div>
              <div className="flex justify-between">
                <span>অর্ডারের ধরন:</span>
                <span className="font-medium">
                  {order.orderType === "DINE_IN"
                    ? `ডাইন-ইন (টেবিল: ${order.tableName || "N/A"})`
                    : order.orderType === "TAKEAWAY"
                    ? "পার্সেল / টেকঅ্যাওয়ে"
                    : "হোম ডেলিভারি"}
                </span>
              </div>
              {order.customerName && (
                <div className="flex justify-between">
                  <span>কাস্টমার:</span>
                  <span>
                    {order.customerName} {order.customerPhone ? `(${order.customerPhone})` : ""}
                  </span>
                </div>
              )}
              {order.waiterName && (
                <div className="flex justify-between">
                  <span>ওয়েটার:</span>
                  <span>{order.waiterName}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="py-2.5 border-b border-dashed border-slate-300">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="py-1">আইটেম</th>
                    <th className="py-1 text-center">পরিমাণ</th>
                    <th className="py-1 text-right">মূল্য</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="py-1">
                      <td className="py-1 pr-1 font-medium">
                        {item.nameBn}
                        {item.variantNameBn && (
                          <span className="block text-[10px] text-slate-500 font-normal">
                            ({item.variantNameBn})
                          </span>
                        )}
                        {item.addOns && item.addOns.length > 0 && (
                          <span className="block text-[9px] text-slate-400 font-normal">
                            + {item.addOns.map((a) => a.nameBn).join(", ")}
                          </span>
                        )}
                      </td>
                      <td className="py-1 text-center font-mono">{item.quantity}</td>
                      <td className="py-1 text-right font-mono font-medium">
                        {formatBDT(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 font-medium">
              <div className="flex justify-between text-slate-700">
                <span>সাবটোটাল:</span>
                <span className="font-mono">{formatBDT(order.subtotal)}</span>
              </div>

              {order.discountAmount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>ডিসকাউন্ট:</span>
                  <span className="font-mono">-{formatBDT(order.discountAmount)}</span>
                </div>
              )}

              {order.vatAmount > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>ভ্যাট ({order.vatRate}%):</span>
                  <span className="font-mono">+{formatBDT(order.vatAmount)}</span>
                </div>
              )}

              {order.serviceChargeAmount > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>সার্ভিস চার্জ ({order.serviceChargeRate}%):</span>
                  <span className="font-mono">+{formatBDT(order.serviceChargeAmount)}</span>
                </div>
              )}

              {order.deliveryCharge > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>ডেলিভারি চার্জ:</span>
                  <span className="font-mono">+{formatBDT(order.deliveryCharge)}</span>
                </div>
              )}

              <div className="flex justify-between text-base font-bold pt-1.5 border-t border-slate-300 text-slate-900">
                <span>সর্বমোট বিল:</span>
                <span className="font-mono">{formatBDT(order.grandTotal)}</span>
              </div>

              <div className="flex justify-between text-emerald-700 text-xs font-semibold pt-1">
                <span>পরিশোধিত:</span>
                <span className="font-mono">{formatBDT(order.paidAmount)}</span>
              </div>

              {order.dueAmount > 0 && (
                <div className="flex justify-between text-rose-600 font-bold text-xs">
                  <span>বাকি / ডিউ:</span>
                  <span className="font-mono">{formatBDT(order.dueAmount)}</span>
                </div>
              )}

              {order.paymentRecords && order.paymentRecords.length > 0 && (
                <div className="text-[10px] text-slate-500 pt-1">
                  পেমেন্ট মাধ্যম:{" "}
                  {order.paymentRecords.map((p) => `${p.method} (${formatBDT(p.amount)})`).join(", ")}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="text-center pt-3 text-[10px] text-slate-500 space-y-1">
              <p>{footerMessage}</p>
              <p className="font-mono text-[9px] text-slate-400">
                Software by Aulad IT Solution
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 no-print">
          <Button variant="outline" onClick={onClose}>
            বন্ধ করুন
          </Button>
          <Button variant="primary" onClick={handlePrint} className="gap-1.5">
            <Printer className="w-4 h-4" /> রসিদ প্রিন্ট করুন
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
