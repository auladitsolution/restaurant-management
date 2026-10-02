"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PaymentMethod, IPaymentRecord } from "@/types";
import { formatBDT, roundCurrency } from "@/lib/calculations/financial";
import { CreditCard, Banknote, Smartphone, Plus, Trash2, CheckCircle2 } from "lucide-react";

export interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  grandTotal: number;
  onConfirm: (paymentRecords: IPaymentRecord[]) => void;
  loading?: boolean;
}

export function PaymentModal(props: PaymentModalProps) {
  if (!props.open) return null;
  return <PaymentModalInner key={props.grandTotal} {...props} />;
}

function PaymentModalInner({
  open,
  onClose,
  grandTotal,
  onConfirm,
  loading = false,
}: PaymentModalProps) {
  const [payments, setPayments] = useState<IPaymentRecord[]>([
    { method: "CASH", amount: grandTotal, reference: "", note: "", receivedAt: new Date() },
  ]);

  const totalAllocated = roundCurrency(
    payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  );
  const remainingDue = roundCurrency(Math.max(0, grandTotal - totalAllocated));
  const changeAmount = roundCurrency(Math.max(0, totalAllocated - grandTotal));

  const addPaymentLine = () => {
    if (remainingDue > 0) {
      setPayments([
        ...payments,
        { method: "BKASH", amount: remainingDue, reference: "", note: "", receivedAt: new Date() },
      ]);
    } else {
      setPayments([
        ...payments,
        { method: "CASH", amount: 0, reference: "", note: "", receivedAt: new Date() },
      ]);
    }
  };

  const updatePayment = (index: number, field: keyof IPaymentRecord, value: unknown) => {
    const updated = [...payments];
    updated[index] = { ...updated[index], [field]: value };
    setPayments(updated);
  };

  const removePayment = (index: number) => {
    if (payments.length <= 1) return;
    setPayments(payments.filter((_, i) => i !== index));
  };

  const setSinglePayment = (method: PaymentMethod) => {
    setPayments([
      { method, amount: grandTotal, reference: "", note: "", receivedAt: new Date() },
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(payments.filter((p) => p.amount > 0));
  };

  const paymentMethods: Array<{ method: PaymentMethod; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { method: "CASH", label: "ক্যাশ", icon: Banknote },
    { method: "BKASH", label: "বিকাশ", icon: Smartphone },
    { method: "NAGAD", label: "নগদ", icon: Smartphone },
    { method: "ROCKET", label: "রকেট", icon: Smartphone },
    { method: "CARD", label: "কার্ড", icon: CreditCard },
    { method: "DUE", label: "বাকি / ডিউ", icon: CheckCircle2 },
  ];

  return (
    <Dialog open={open} onClose={onClose} title="পেমেন্ট সংগ্রহ করুন" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Total Header Summary */}
        <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">সর্বমোট প্রদেয় বিল</span>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {formatBDT(grandTotal)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400">
              {totalAllocated >= grandTotal ? "ফেরত / চেঞ্জ" : "অবশিষ্ট বাকি"}
            </span>
            <div
              className={`text-xl font-bold font-mono ${
                totalAllocated >= grandTotal ? "text-amber-400" : "text-rose-400"
              }`}
            >
              {totalAllocated >= grandTotal ? formatBDT(changeAmount) : formatBDT(remainingDue)}
            </div>
          </div>
        </div>

        {/* Quick Payment Buttons */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-2">
            এক ক্লিকে সম্পূর্ণ পরিশোধ:
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {paymentMethods.map(({ method, label, icon: Icon }) => (
              <button
                key={method}
                type="button"
                onClick={() => setSinglePayment(method)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-medium transition-all ${
                  payments.length === 1 && payments[0].method === method
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700 shadow-xs"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-4 h-4 mb-1 text-slate-500" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Split Payment Rows */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700">
              বিভক্ত / মিশ্র পেমেন্ট (Split Payment):
            </label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addPaymentLine}
              className="gap-1 text-xs"
            >
              <Plus className="w-3.5 h-3.5" /> মাধ্যম যোগ করুন
            </Button>
          </div>

          <div className="space-y-2">
            {payments.map((p, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <select
                  value={p.method}
                  onChange={(e) => updatePayment(idx, "method", e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500"
                >
                  <option value="CASH">ক্যাশ (Cash)</option>
                  <option value="BKASH">বিকাশ (bKash)</option>
                  <option value="NAGAD">নগদ (Nagad)</option>
                  <option value="ROCKET">রকেট (Rocket)</option>
                  <option value="CARD">কার্ড (Card)</option>
                  <option value="BANK">ব্যাংক (Bank)</option>
                  <option value="DUE">বাকি (Due)</option>
                </select>

                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
                    ৳
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={p.amount || ""}
                    onChange={(e) => updatePayment(idx, "amount", parseFloat(e.target.value) || 0)}
                    placeholder="টাকার পরিমাণ"
                    className="w-full pl-7 pr-2.5 py-1.5 text-sm font-mono font-medium bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <input
                  type="text"
                  value={p.reference || ""}
                  onChange={(e) => updatePayment(idx, "reference", e.target.value)}
                  placeholder="রেফারেন্স / TrxID (ঐচ্ছিক)"
                  className="w-36 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500"
                />

                {payments.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePayment(idx)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            বাতিল
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="px-6 font-semibold"
          >
            পেমেন্ট নিশ্চিত করুন ({formatBDT(totalAllocated)})
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
