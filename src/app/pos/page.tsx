"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { PaymentModal } from "@/components/pos/PaymentModal";
import { ReceiptModal } from "@/components/receipt/ReceiptModal";
import {
  ICategory,
  IMenuItem,
  ITable,
  OrderType,
  IOrderItem,
  IOrder,
  IPaymentRecord,
} from "@/types";
import {
  calculateOrderTotals,
  formatBDT,
  roundCurrency,
} from "@/lib/calculations/financial";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Utensils,
  ShoppingBag,
  Truck,
  CheckCircle2,
  X,
  CreditCard,
  Users,
  Flame,
} from "lucide-react";

export default function POSPage() {
  // Master data
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);
  const [tables, setTables] = useState<ITable[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Order state
  const [orderType, setOrderType] = useState<OrderType>("DINE_IN");
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [guestCount, setGuestCount] = useState<number>(1);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCharge, setDeliveryCharge] = useState<number>(50);
  const [discountType, setDiscountType] = useState<"FIXED" | "PERCENT">("FIXED");
  const [discountRate, setDiscountRate] = useState<number>(0);
  const [orderNotes, setOrderNotes] = useState("");

  // Cart
  const [cartItems, setCartItems] = useState<IOrderItem[]>([]);

  // Modals
  const [selectedItemForVariant, setSelectedItemForVariant] = useState<IMenuItem | null>(null);
  const [variantSelection, setVariantSelection] = useState<string>("");
  const [addOnSelections, setAddOnSelections] = useState<string[]>([]);
  const [itemNote, setItemNote] = useState("");

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<IOrder | null>(null);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Fetch initial POS data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, menuRes, tableRes, setRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/menu"),
          fetch("/api/tables"),
          fetch("/api/settings"),
        ]);

        if (catRes.ok) setCategories((await catRes.json()).categories || []);
        if (menuRes.ok) setMenuItems((await menuRes.json()).items || []);
        if (tableRes.ok) setTables((await tableRes.json()).tables || []);
        if (setRes.ok) setSettings((await setRes.json()).settings);
      } catch {
        toast.error("ডাটা লোড করতে সমস্যা হয়েছে");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtered menu items
  const filteredItems = menuItems.filter((item) => {
    const matchesCategory =
      selectedCategory === "all" || item.categoryId === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      item.nameBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nameEn.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Handle item click
  const handleItemClick = (item: IMenuItem) => {
    if (!item.availability) {
      toast.error(`${item.nameBn} বর্তমানে স্টক শেষ/অনুপলব্ধ`);
      return;
    }

    if (item.hasVariants && item.variants && item.variants.length > 0) {
      setSelectedItemForVariant(item);
      setVariantSelection(item.variants[0].nameBn);
      setAddOnSelections([]);
      setItemNote("");
      return;
    }

    addItemToCart(item, null, [], "");
  };

  const addItemToCart = (
    item: IMenuItem,
    variant: { nameBn: string; nameEn: string; price: number; costPrice?: number } | null,
    addOns: Array<{ nameBn: string; price: number }>,
    notes: string
  ) => {
    const unitPrice = variant ? variant.price : item.basePrice;
    const costPrice = variant?.costPrice || item.costPrice || 0;
    const addOnsTotal = addOns.reduce((sum, a) => sum + a.price, 0);

    // Look for duplicate in cart with same variant and add-ons
    const existingIndex = cartItems.findIndex(
      (c) =>
        c.menuItemId === item._id &&
        c.variantNameBn === (variant?.nameBn || "") &&
        JSON.stringify(c.addOns || []) === JSON.stringify(addOns)
    );

    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].totalPrice = roundCurrency(
        (unitPrice + addOnsTotal) * updated[existingIndex].quantity
      );
      setCartItems(updated);
    } else {
      setCartItems([
        ...cartItems,
        {
          menuItemId: item._id,
          nameBn: item.nameBn,
          nameEn: item.nameEn,
          variantNameBn: variant?.nameBn || "",
          variantNameEn: variant?.nameEn || "",
          unitPrice,
          costPrice,
          quantity: 1,
          totalPrice: roundCurrency(unitPrice + addOnsTotal),
          notes,
          addOns,
        },
      ]);
    }
  };

  const updateQuantity = (index: number, delta: number) => {
    const updated = [...cartItems];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }
    updated[index].quantity = newQty;
    const addOnsTotal = (updated[index].addOns || []).reduce((sum, a) => sum + a.price, 0);
    updated[index].totalPrice = roundCurrency(
      (updated[index].unitPrice + addOnsTotal) * newQty
    );
    setCartItems(updated);
  };

  const removeFromCart = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  const confirmVariantModal = () => {
    if (!selectedItemForVariant) return;

    const variant = selectedItemForVariant.variants.find(
      (v) => v.nameBn === variantSelection
    );
    const chosenAddOns = (selectedItemForVariant.addOns || []).filter((a) =>
      addOnSelections.includes(a.nameBn)
    );

    addItemToCart(
      selectedItemForVariant,
      variant || null,
      chosenAddOns,
      itemNote
    );
    setSelectedItemForVariant(null);
  };

  // Calculations
  const vatEnabled = settings?.vatEnabled ?? false;
  const vatRate = vatEnabled ? (settings?.vatRate ?? 0) : 0;
  const serviceChargeEnabled = settings?.serviceChargeEnabled ?? false;
  const serviceChargeRate = serviceChargeEnabled ? (settings?.serviceChargeRate ?? 0) : 0;

  const totals = calculateOrderTotals({
    items: cartItems,
    discountType,
    discountRate,
    vatEnabled,
    vatRate,
    serviceChargeEnabled,
    serviceChargeRate,
    deliveryCharge: orderType === "DELIVERY" ? deliveryCharge : 0,
  });

  const handleOpenPayment = () => {
    if (cartItems.length === 0) {
      toast.error("অর্ডারে কোন আইটেম নেই");
      return;
    }

    if (orderType === "DINE_IN" && !selectedTable) {
      toast.error("ডাইন-ইন অর্ডারের জন্য টেবিল নির্বাচন করুন");
      return;
    }

    if (orderType === "DELIVERY" && !customerPhone) {
      toast.error("ডেলিভারি অর্ডারের জন্য কাস্টমার ফোন নম্বর আবশ্যক");
      return;
    }

    setPaymentModalOpen(true);
  };

  const handleFinalOrderSubmit = async (paymentRecords: IPaymentRecord[]) => {
    setSubmittingOrder(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType,
          tableId: orderType === "DINE_IN" ? selectedTable : undefined,
          guestCount: orderType === "DINE_IN" ? guestCount : 1,
          customerName,
          customerPhone,
          deliveryAddress,
          deliveryCharge: orderType === "DELIVERY" ? deliveryCharge : 0,
          items: cartItems,
          discountType,
          discountRate,
          paymentRecords,
          notes: orderNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "অর্ডার তৈরি ব্যর্থ হয়েছে");
      }

      toast.success(`অর্ডার সম্পন্ন! নম্বর: ${data.order.orderNumber}`);
      setCompletedOrder(data.order);
      setPaymentModalOpen(false);
      setReceiptModalOpen(true);

      // Reset cart and inputs
      setCartItems([]);
      setSelectedTable("");
      setCustomerName("");
      setCustomerPhone("");
      setDeliveryAddress("");
      setOrderNotes("");
      setDiscountRate(0);

      // Refresh tables
      const tableRes = await fetch("/api/tables");
      if (tableRes.ok) setTables((await tableRes.json()).tables || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingOrder(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-5.5rem)] overflow-hidden">
        {/* =========================================
            LEFT SECTION: Categories & Menu Grid
        ========================================= */}
        <div className="flex-1 flex flex-col min-w-0 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Search & Header */}
          <div className="p-3 border-b border-slate-100 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="মেনু আইটেম দ্রুত খুঁজুন..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === "all"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              সব মেনু
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setSelectedCategory(cat._id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat._id
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {cat.nameBn}
              </button>
            ))}
          </div>

          {/* Menu Items Grid */}
          <div className="flex-1 p-3 overflow-y-auto">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                মেনু লোড হচ্ছে...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                <Utensils className="w-10 h-10 text-slate-300" />
                <p className="text-xs">কোন মেনু আইটেম পাওয়া যায়নি</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredItems.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => handleItemClick(item)}
                    className={`group relative p-3 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                      item.availability
                        ? "bg-white border-slate-200 hover:border-emerald-500 hover:shadow-md active:scale-95"
                        : "bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <div>
                      {item.image ? (
                        <div className="w-full h-24 mb-2 rounded-xl overflow-hidden bg-slate-100">
                          <img
                            src={item.image}
                            alt={item.nameBn}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      ) : null}

                      <h3 className="font-bold text-xs text-slate-900 line-clamp-1">
                        {item.nameBn}
                      </h3>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{item.nameEn}</p>
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="font-bold font-mono text-sm text-emerald-700">
                        {formatBDT(item.basePrice)}
                      </span>
                      {item.hasVariants ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[9px] font-bold">
                          ভ্যারিয়েন্ট
                        </span>
                      ) : (
                        <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* =========================================
            RIGHT SECTION: Order Cart & Checkout Panel
        ========================================= */}
        <div className="w-full lg:w-96 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Order Type Tabs */}
          <div className="p-2.5 border-b border-slate-100 grid grid-cols-3 gap-1.5 bg-slate-50/50">
            <button
              onClick={() => setOrderType("DINE_IN")}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                orderType === "DINE_IN"
                  ? "bg-white text-emerald-700 shadow-xs border border-emerald-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Utensils className="w-3.5 h-3.5" /> ডাইন-ইন
            </button>
            <button
              onClick={() => setOrderType("TAKEAWAY")}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                orderType === "TAKEAWAY"
                  ? "bg-white text-amber-700 shadow-xs border border-amber-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" /> পার্সেল
            </button>
            <button
              onClick={() => setOrderType("DELIVERY")}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                orderType === "DELIVERY"
                  ? "bg-white text-sky-700 shadow-xs border border-sky-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Truck className="w-3.5 h-3.5" /> ডেলিভারি
            </button>
          </div>

          {/* Dynamic Order Details Bar */}
          <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/30 text-xs space-y-2">
            {orderType === "DINE_IN" ? (
              <div className="flex items-center gap-2">
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-medium text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- টেবিল নির্বাচন করুন --</option>
                  {tables.map((t) => (
                    <option key={t._id} value={t._id} disabled={t.status === "OCCUPIED"}>
                      টেবিল {t.tableNumber} ({t.floor}) {t.status === "OCCUPIED" ? "— ব্যস্ত" : ""}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2 py-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="number"
                    min="1"
                    value={guestCount}
                    onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                    className="w-8 text-center text-xs font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>
            ) : orderType === "DELIVERY" ? (
              <div className="space-y-1.5">
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    placeholder="কাস্টমার নাম"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="মোবাইল নম্বর *"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <input
                  type="text"
                  placeholder="ডেলিভারি ঠিকানা"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="text"
                  placeholder="কাস্টমার নাম (ঐচ্ছিক)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                />
                <input
                  type="text"
                  placeholder="মোবাইল নম্বর (ঐচ্ছিক)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs text-center space-y-2">
                <ShoppingBag className="w-8 h-8 text-slate-300" />
                <p>কার্ট খালি। বাম পাশ থেকে আইটেম যোগ করুন।</p>
              </div>
            ) : (
              cartItems.map((item, index) => (
                <div
                  key={index}
                  className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">{item.nameBn}</h4>
                      {item.variantNameBn && (
                        <span className="text-[10px] text-slate-500 font-medium block">
                          সাইজ: {item.variantNameBn}
                        </span>
                      )}
                      {item.addOns && item.addOns.length > 0 && (
                        <span className="text-[9px] text-slate-400 block">
                          + {item.addOns.map((a) => a.nameBn).join(", ")}
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-bold text-xs text-slate-900">
                      {formatBDT(item.totalPrice)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => removeFromCart(index)}
                      className="p-1 text-rose-500 hover:text-rose-700 rounded-md"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-2 py-0.5 shadow-2xs">
                      <button
                        onClick={() => updateQuantity(index, -1)}
                        className="text-slate-600 hover:text-black font-bold"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono text-xs font-bold w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(index, 1)}
                        className="text-emerald-700 hover:text-emerald-900 font-bold"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pricing Breakdown & Checkout Button */}
          <div className="p-3 border-t border-slate-200 bg-slate-50/50 space-y-2">
            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>সাবটোটাল</span>
                <span className="font-mono font-semibold">{formatBDT(totals.subtotal)}</span>
              </div>

              {/* Discount Selector */}
              <div className="flex items-center justify-between gap-2 py-1">
                <span className="text-slate-600">ডিসকাউন্ট</span>
                <div className="flex items-center gap-1">
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="text-[10px] bg-white border border-slate-300 rounded-md px-1 py-0.5"
                  >
                    <option value="FIXED">৳ টাকা</option>
                    <option value="PERCENT">% শতাংশ</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    value={discountRate || ""}
                    onChange={(e) => setDiscountRate(parseFloat(e.target.value) || 0)}
                    placeholder="০"
                    className="w-14 px-1.5 py-0.5 bg-white border border-slate-300 rounded-md text-right text-xs font-mono"
                  />
                </div>
              </div>

              {totals.discountAmount > 0 && (
                <div className="flex justify-between text-rose-600 font-medium">
                  <span>ডিসকাউন্ট কর্তন</span>
                  <span className="font-mono">-{formatBDT(totals.discountAmount)}</span>
                </div>
              )}

              {vatEnabled && (
                <div className="flex justify-between">
                  <span>ভ্যাট ({vatRate}%)</span>
                  <span className="font-mono">{formatBDT(totals.vatAmount)}</span>
                </div>
              )}

              {serviceChargeEnabled && (
                <div className="flex justify-between">
                  <span>সার্ভিস চার্জ ({serviceChargeRate}%)</span>
                  <span className="font-mono">{formatBDT(totals.serviceChargeAmount)}</span>
                </div>
              )}

              {orderType === "DELIVERY" && (
                <div className="flex justify-between">
                  <span>ডেলিভারি চার্জ</span>
                  <input
                    type="number"
                    min="0"
                    value={deliveryCharge}
                    onChange={(e) => setDeliveryCharge(parseFloat(e.target.value) || 0)}
                    className="w-16 px-1 py-0.5 bg-white border border-slate-300 rounded-md text-right text-xs font-mono"
                  />
                </div>
              )}

              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>সর্বমোট বিল:</span>
                <span className="font-mono text-emerald-700">{formatBDT(totals.grandTotal)}</span>
              </div>
            </div>

            {/* Confirm Order CTA */}
            <Button
              variant="primary"
              size="lg"
              disabled={cartItems.length === 0}
              onClick={handleOpenPayment}
              className="w-full py-3 text-sm font-bold shadow-md gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              অর্ডার কনফার্ম ও বিলিং ({formatBDT(totals.grandTotal)})
            </Button>
          </div>
        </div>
      </div>

      {/* =========================================
          Variant & Add-On Selector Modal
      ========================================= */}
      {selectedItemForVariant && (
        <Dialog
          open={!!selectedItemForVariant}
          onClose={() => setSelectedItemForVariant(null)}
          title={selectedItemForVariant.nameBn}
          description="ভ্যারিয়েন্ট ও অতিরিক্ত অ্যাড-অন নির্বাচন করুন"
        >
          <div className="space-y-4">
            {/* Variants */}
            {selectedItemForVariant.variants?.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  সাইজ / ভ্যারিয়েন্ট:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {selectedItemForVariant.variants.map((v) => (
                    <button
                      key={v.nameBn}
                      type="button"
                      onClick={() => setVariantSelection(v.nameBn)}
                      className={`p-2.5 rounded-xl border text-left flex justify-between items-center transition-all ${
                        variantSelection === v.nameBn
                          ? "border-emerald-600 bg-emerald-50 text-emerald-800 font-bold"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-xs">{v.nameBn}</span>
                      <span className="font-mono text-xs">{formatBDT(v.price)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* AddOns */}
            {selectedItemForVariant.addOns && selectedItemForVariant.addOns.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  অতিরিক্ত অ্যাড-অন:
                </label>
                <div className="space-y-1.5">
                  {selectedItemForVariant.addOns.map((a) => {
                    const checked = addOnSelections.includes(a.nameBn);
                    return (
                      <label
                        key={a.nameBn}
                        className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer text-xs ${
                          checked
                            ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              if (checked) {
                                setAddOnSelections(
                                  addOnSelections.filter((name) => name !== a.nameBn)
                                );
                              } else {
                                setAddOnSelections([...addOnSelections, a.nameBn]);
                              }
                            }}
                            className="rounded-sm text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>{a.nameBn}</span>
                        </div>
                        <span className="font-mono text-slate-600">+{formatBDT(a.price)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <Input
              label="বিশেষ নির্দেশনা / নোট"
              placeholder="উদাঃ ঝাল কম, সস বেশি"
              value={itemNote}
              onChange={(e) => setItemNote(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setSelectedItemForVariant(null)}
              >
                বাতিল
              </Button>
              <Button variant="primary" onClick={confirmVariantModal}>
                কার্টে যোগ করুন
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Payment Modal */}
      <PaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        grandTotal={totals.grandTotal}
        onConfirm={handleFinalOrderSubmit}
        loading={submittingOrder}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        open={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        order={completedOrder}
        settings={settings}
      />
    </DashboardLayout>
  );
}
