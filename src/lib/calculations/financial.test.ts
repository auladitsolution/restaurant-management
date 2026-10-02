import { describe, it, expect } from "vitest";
import {
  roundCurrency,
  calculateOrderTotals,
  determinePaymentStatus,
  calculateDue,
  calculateShiftExpectedCash,
  convertUnitQuantity,
  toBanglaNumber,
  formatBDT,
} from "./financial";

describe("Financial Calculations Engine", () => {
  it("rounds currency safely", () => {
    expect(roundCurrency(10.555)).toBe(10.56);
    expect(roundCurrency(0.1 + 0.2)).toBe(0.3);
  });

  it("calculates basic order total correctly without taxes or discounts", () => {
    const result = calculateOrderTotals({
      items: [
        { unitPrice: 350, quantity: 2 }, // 700
        { unitPrice: 150, quantity: 1 }, // 150
      ],
    });

    expect(result.subtotal).toBe(850);
    expect(result.discountAmount).toBe(0);
    expect(result.vatAmount).toBe(0);
    expect(result.serviceChargeAmount).toBe(0);
    expect(result.grandTotal).toBe(850);
  });

  it("calculates order totals with percentage discount, VAT, service charge, and delivery", () => {
    // 2 x 500 = 1000
    // Discount 10% = 100 => Net = 900
    // VAT 5% of 900 = 45
    // Service charge 5% of 900 = 45
    // Delivery charge = 60
    // Grand total = 900 + 45 + 45 + 60 = 1050
    const result = calculateOrderTotals({
      items: [{ unitPrice: 500, quantity: 2 }],
      discountType: "PERCENT",
      discountRate: 10,
      vatEnabled: true,
      vatRate: 5,
      serviceChargeEnabled: true,
      serviceChargeRate: 5,
      deliveryCharge: 60,
    });

    expect(result.subtotal).toBe(1000);
    expect(result.discountAmount).toBe(100);
    expect(result.netAfterDiscount).toBe(900);
    expect(result.vatAmount).toBe(45);
    expect(result.serviceChargeAmount).toBe(45);
    expect(result.deliveryCharge).toBe(60);
    expect(result.grandTotal).toBe(1050);
  });

  it("calculates fixed discount without exceeding subtotal", () => {
    const result = calculateOrderTotals({
      items: [{ unitPrice: 200, quantity: 1 }],
      discountType: "FIXED",
      discountRate: 500, // higher than subtotal
    });

    expect(result.subtotal).toBe(200);
    expect(result.discountAmount).toBe(200); // capped at subtotal
    expect(result.netAfterDiscount).toBe(0);
    expect(result.grandTotal).toBe(0);
  });

  it("calculates add-ons correctly", () => {
    const result = calculateOrderTotals({
      items: [
        {
          unitPrice: 300,
          quantity: 2,
          addOns: [{ price: 50 }, { price: 20 }], // 70 * 2 = 140
        },
      ],
    });

    // (300 * 2) + (70 * 2) = 600 + 140 = 740
    expect(result.subtotal).toBe(740);
    expect(result.grandTotal).toBe(740);
  });

  it("determines payment status accurately", () => {
    expect(determinePaymentStatus(1500, 0)).toBe("UNPAID");
    expect(determinePaymentStatus(1500, 500)).toBe("PARTIAL");
    expect(determinePaymentStatus(1500, 1500)).toBe("PAID");
    expect(determinePaymentStatus(1500, 1600)).toBe("PAID");
  });

  it("calculates due amount", () => {
    expect(calculateDue(1500, 500)).toBe(1000);
    expect(calculateDue(1500, 1500)).toBe(0);
    expect(calculateDue(1500, 2000)).toBe(0);
  });

  it("calculates expected cash in shift correctly", () => {
    // Opening: 2000, CashSales: 15000, CashIn: 1000, CashOut: 2000, Refunds: 500
    // Expected = 2000 + 15000 + 1000 - 2000 - 500 = 15500
    const expected = calculateShiftExpectedCash({
      openingCash: 2000,
      cashSales: 15000,
      cashIn: 1000,
      cashOut: 2000,
      refunds: 500,
    });
    expect(expected).toBe(15500);
  });

  it("converts units accurately", () => {
    expect(convertUnitQuantity(1.5, "kg", "gram")).toBe(1500);
    expect(convertUnitQuantity(500, "gram", "kg")).toBe(0.5);
    expect(convertUnitQuantity(2, "liter", "ml")).toBe(2000);
    expect(convertUnitQuantity(250, "ml", "liter")).toBe(0.25);
    expect(convertUnitQuantity(5, "pcs", "pcs")).toBe(5);
  });

  it("converts English digits to Bangla digits", () => {
    expect(toBanglaNumber(1250)).toBe("১২৫০");
    expect(toBanglaNumber("500.50")).toBe("৫০০.৫০");
  });

  it("formats BDT currency correctly", () => {
    expect(formatBDT(1500)).toBe("৳ 1,500");
    expect(formatBDT(1500, true)).toBe("৳ ১,৫০০");
  });
});
