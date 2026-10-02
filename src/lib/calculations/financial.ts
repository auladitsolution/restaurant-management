// ==========================================
// FINANCIAL & BUSINESS CALCULATION ENGINE
// Precision-safe numeric calculations for Bangladesh BDT
// ==========================================

import { PaymentStatus } from "@/types";

/**
 * Rounds a number safely to 2 decimal places to avoid IEEE 754 floating point drift
 */
export function roundCurrency(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates order subtotal, discount, VAT, service charge, delivery charge, and grand total.
 * Re-calculated strictly on server to guarantee integrity.
 */
export interface OrderCalculationInput {
  items: Array<{
    unitPrice: number;
    quantity: number;
    addOns?: Array<{ price: number }>;
  }>;
  discountType?: "PERCENT" | "FIXED";
  discountRate?: number;
  vatEnabled?: boolean;
  vatRate?: number;
  serviceChargeEnabled?: boolean;
  serviceChargeRate?: number;
  deliveryCharge?: number;
}

export interface OrderCalculationResult {
  subtotal: number;
  discountAmount: number;
  netAfterDiscount: number;
  vatAmount: number;
  serviceChargeAmount: number;
  deliveryCharge: number;
  grandTotal: number;
}

export function calculateOrderTotals(input: OrderCalculationInput): OrderCalculationResult {
  const {
    items = [],
    discountType = "FIXED",
    discountRate = 0,
    vatEnabled = false,
    vatRate = 0,
    serviceChargeEnabled = false,
    serviceChargeRate = 0,
    deliveryCharge = 0,
  } = input;

  // 1. Calculate Subtotal
  let subtotal = 0;
  for (const item of items) {
    const itemBase = roundCurrency(Math.max(0, item.unitPrice) * Math.max(0, item.quantity));
    const addOnsTotal = (item.addOns || []).reduce(
      (sum, a) => sum + roundCurrency(Math.max(0, a.price) * Math.max(0, item.quantity)),
      0
    );
    subtotal = roundCurrency(subtotal + itemBase + addOnsTotal);
  }

  // 2. Calculate Discount
  let discountAmount = 0;
  const safeDiscountRate = Math.max(0, discountRate);
  if (discountType === "PERCENT") {
    discountAmount = roundCurrency((subtotal * Math.min(100, safeDiscountRate)) / 100);
  } else {
    discountAmount = roundCurrency(Math.min(subtotal, safeDiscountRate));
  }

  const netAfterDiscount = roundCurrency(Math.max(0, subtotal - discountAmount));

  // 3. VAT / Tax (applied to net after discount)
  let vatAmount = 0;
  if (vatEnabled && vatRate > 0) {
    vatAmount = roundCurrency((netAfterDiscount * vatRate) / 100);
  }

  // 4. Service Charge (applied to net after discount)
  let serviceChargeAmount = 0;
  if (serviceChargeEnabled && serviceChargeRate > 0) {
    serviceChargeAmount = roundCurrency((netAfterDiscount * serviceChargeRate) / 100);
  }

  // 5. Delivery Charge
  const safeDeliveryCharge = roundCurrency(Math.max(0, deliveryCharge));

  // 6. Grand Total (Round to nearest integer for BDT cash clarity if desired, or keep 2 decimals)
  const rawGrandTotal = roundCurrency(
    netAfterDiscount + vatAmount + serviceChargeAmount + safeDeliveryCharge
  );
  // In Bangladesh restaurants, final billing is standard rounded to whole Taka
  const grandTotal = Math.round(rawGrandTotal);

  return {
    subtotal,
    discountAmount,
    netAfterDiscount,
    vatAmount,
    serviceChargeAmount,
    deliveryCharge: safeDeliveryCharge,
    grandTotal,
  };
}

/**
 * Determines payment status from grand total and total paid amount
 */
export function determinePaymentStatus(grandTotal: number, paidAmount: number): PaymentStatus {
  const safePaid = roundCurrency(Math.max(0, paidAmount));
  const safeTotal = roundCurrency(Math.max(0, grandTotal));

  if (safePaid <= 0) return "UNPAID";
  if (safePaid >= safeTotal) return "PAID";
  return "PARTIAL";
}

/**
 * Calculates due amount
 */
export function calculateDue(grandTotal: number, paidAmount: number): number {
  const safePaid = roundCurrency(Math.max(0, paidAmount));
  const safeTotal = roundCurrency(Math.max(0, grandTotal));
  return roundCurrency(Math.max(0, safeTotal - safePaid));
}

/**
 * Calculates Cash Shift balance:
 * Expected = Opening + CashSales + CashIn - CashOut - Refunds
 * Difference = Actual - Expected
 */
export function calculateShiftExpectedCash(params: {
  openingCash: number;
  cashSales: number;
  cashIn: number;
  cashOut: number;
  refunds: number;
}): number {
  const { openingCash, cashSales, cashIn, cashOut, refunds } = params;
  return roundCurrency(
    Math.max(0, openingCash) +
      Math.max(0, cashSales) +
      Math.max(0, cashIn) -
      Math.max(0, cashOut) -
      Math.max(0, refunds)
  );
}

/**
 * Formats a number into Bangla digits (e.g. 1500 -> ১৫০০)
 */
export function toBanglaNumber(value: number | string): string {
  const banglaDigits: Record<string, string> = {
    "0": "০",
    "1": "১",
    "2": "২",
    "3": "৩",
    "4": "৪",
    "5": "৫",
    "6": "৬",
    "7": "৭",
    "8": "৮",
    "9": "৯",
    ".": ".",
  };

  const str = String(value);
  return str
    .split("")
    .map((char) => banglaDigits[char] || char)
    .join("");
}

/**
 * Formats BDT currency (e.g. 1500 -> ৳ 1,500)
 */
export function formatBDT(amount: number, useBanglaDigits = false): string {
  const rounded = roundCurrency(amount);
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rounded);

  if (useBanglaDigits) {
    return `৳ ${toBanglaNumber(formatted)}`;
  }
  return `৳ ${formatted}`;
}

/**
 * Converts quantity between units:
 * kg <-> gram, liter <-> ml, etc.
 */
export function convertUnitQuantity(
  quantity: number,
  fromUnit: string,
  toUnit: string
): number {
  if (fromUnit === toUnit) return quantity;

  // Mass
  if (fromUnit === "kg" && toUnit === "gram") return quantity * 1000;
  if (fromUnit === "gram" && toUnit === "kg") return quantity / 1000;

  // Volume
  if (fromUnit === "liter" && toUnit === "ml") return quantity * 1000;
  if (fromUnit === "ml" && toUnit === "liter") return quantity / 1000;

  return quantity;
}
