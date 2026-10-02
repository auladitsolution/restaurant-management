import { describe, it, expect } from "vitest";
import {
  OrderCreateSchema,
  MenuItemSchema,
  TableSchema,
  ExpenseSchema,
  PurchaseSchema,
} from "./schemas";

describe("Zod Validation Schemas", () => {
  it("validates valid order creation payload", () => {
    const validOrder = {
      orderType: "DINE_IN",
      tableId: "table_123",
      guestCount: 2,
      items: [
        {
          menuItemId: "item_1",
          nameBn: "চিকেন বার্গার",
          nameEn: "Chicken Burger",
          unitPrice: 180,
          quantity: 2,
          totalPrice: 360,
        },
      ],
      discountType: "FIXED",
      discountRate: 0,
      deliveryCharge: 0,
      paymentRecords: [],
    };

    const result = OrderCreateSchema.safeParse(validOrder);
    expect(result.success).toBe(true);
  });

  it("rejects order with zero items", () => {
    const emptyOrder = {
      orderType: "TAKEAWAY",
      items: [],
    };
    const result = OrderCreateSchema.safeParse(emptyOrder);
    expect(result.success).toBe(false);
  });

  it("validates valid menu item", () => {
    const validMenuItem = {
      nameBn: "কাচ্চি বিরিয়ানি",
      nameEn: "Kacchi Biryani",
      categoryId: "cat_1",
      basePrice: 350,
      costPrice: 200,
      hasVariants: false,
      variants: [],
      addOns: [],
      ingredients: [],
      availability: true,
      active: true,
    };
    const result = MenuItemSchema.safeParse(validMenuItem);
    expect(result.success).toBe(true);
  });

  it("rejects negative menu item base price", () => {
    const invalidMenuItem = {
      nameBn: "কাচ্চি",
      nameEn: "Kacchi",
      categoryId: "cat_1",
      basePrice: -50,
    };
    const result = MenuItemSchema.safeParse(invalidMenuItem);
    expect(result.success).toBe(false);
  });

  it("validates valid table", () => {
    const validTable = {
      tableNumber: "T-01",
      floor: "Ground Floor",
      capacity: 4,
      status: "AVAILABLE",
    };
    const result = TableSchema.safeParse(validTable);
    expect(result.success).toBe(true);
  });

  it("rejects table with capacity zero", () => {
    const invalidTable = {
      tableNumber: "T-01",
      floor: "Ground Floor",
      capacity: 0,
    };
    const result = TableSchema.safeParse(invalidTable);
    expect(result.success).toBe(false);
  });

  it("validates valid Bangla expense", () => {
    const validExpense = {
      category: "বাজার",
      amount: 1500,
      description: "সবজি ক্রয়",
      paymentMethod: "CASH",
    };
    const result = ExpenseSchema.safeParse(validExpense);
    expect(result.success).toBe(true);
  });

  it("validates valid purchase schema", () => {
    const validPurchase = {
      supplierId: "sup_1",
      supplierName: "সিটি পোলট্রি",
      items: [
        {
          inventoryItemId: "inv_1",
          itemName: "ব্রয়লার চিকেন",
          unit: "kg",
          quantity: 20,
          unitCost: 180,
        },
      ],
      discount: 0,
      paidAmount: 3600,
      paymentMethod: "CASH",
    };
    const result = PurchaseSchema.safeParse(validPurchase);
    expect(result.success).toBe(true);
  });
});
