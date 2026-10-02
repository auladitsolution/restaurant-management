import { z } from "zod";

// --- AUTH & USER SCHEMAS ---
export const BootstrapOwnerSchema = z.object({
  setupToken: z.string().min(1, "সেটআপ টোকেন আবশ্যক"),
  name: z.string().min(2, "নাম কমপক্ষে ২ অক্ষরের হতে হবে"),
  email: z.string().email("সঠিক ইমেইল ঠিকানা দিন"),
  phone: z.string().optional(),
  firebaseUid: z.string().min(1, "Firebase UID আবশ্যক"),
});

export const UserCreateSchema = z.object({
  firebaseUid: z.string().min(1, "Firebase UID আবশ্যক"),
  name: z.string().min(2, "নাম লিখুন"),
  email: z.string().email("সঠিক ইমেইল লিখুন"),
  phone: z.string().optional(),
  role: z.enum([
    "OWNER",
    "MANAGER",
    "CASHIER",
    "WAITER",
    "KITCHEN",
    "INVENTORY_MANAGER",
  ]),
  permissions: z.array(z.string()).default([]),
  active: z.boolean().default(true),
});

export const UserUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  role: z
    .enum([
      "OWNER",
      "MANAGER",
      "CASHIER",
      "WAITER",
      "KITCHEN",
      "INVENTORY_MANAGER",
    ])
    .optional(),
  permissions: z.array(z.string()).optional(),
  active: z.boolean().optional(),
});

// --- CATEGORY & MENU SCHEMAS ---
export const CategorySchema = z.object({
  nameBn: z.string().min(1, "বাংলা নাম আবশ্যক"),
  nameEn: z.string().min(1, "ইংরেজি নাম আবশ্যক"),
  icon: z.string().optional(),
  image: z.string().optional(),
  sortOrder: z.number().int().default(0),
  active: z.boolean().default(true),
});

export const MenuItemVariantSchema = z.object({
  nameBn: z.string().min(1, "ভ্যারিয়েন্ট নাম লিখুন"),
  nameEn: z.string().min(1),
  price: z.number().min(0, "মূল্য ঋণাত্মক হতে পারে না"),
  costPrice: z.number().min(0).optional().default(0),
});

export const MenuItemAddOnSchema = z.object({
  nameBn: z.string().min(1, "অ্যাড-অন নাম লিখুন"),
  nameEn: z.string().min(1),
  price: z.number().min(0, "মূল্য ঋণাত্মক হতে পারে না"),
});

export const MenuItemIngredientRefSchema = z.object({
  inventoryItemId: z.string().min(1),
  quantity: z.number().positive("পরিমাণ শূন্যের বেশি হতে হবে"),
  unit: z.string().min(1),
});

export const MenuItemSchema = z.object({
  nameBn: z.string().min(1, "বাংলা নাম আবশ্যক"),
  nameEn: z.string().min(1, "ইংরেজি নাম আবশ্যক"),
  categoryId: z.string().min(1, "ক্যাটাগরি নির্বাচন করুন"),
  categoryName: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  basePrice: z.number().min(0, "বেস প্রাইস ঋণাত্মক হতে পারে না"),
  costPrice: z.number().min(0, "খরচ ঋণাত্মক হতে পারে না").default(0),
  hasVariants: z.boolean().default(false),
  variants: z.array(MenuItemVariantSchema).default([]),
  addOns: z.array(MenuItemAddOnSchema).default([]),
  ingredients: z.array(MenuItemIngredientRefSchema).default([]),
  availability: z.boolean().default(true),
  active: z.boolean().default(true),
});

// --- TABLE & FLOOR SCHEMAS ---
export const FloorSchema = z.object({
  name: z.string().min(1, "ইংরেজি ফ্লোর নাম লিখুন"),
  nameBn: z.string().min(1, "বাংলা ফ্লোর নাম লিখুন"),
  sortOrder: z.number().int().default(0),
  active: z.boolean().default(true),
});

export const TableSchema = z.object({
  tableNumber: z.string().min(1, "টেবিল নম্বর আবশ্যক"),
  nameBn: z.string().optional(),
  floor: z.string().min(1, "ফ্লোর আবশ্যক"),
  capacity: z.number().int().min(1, "ধারণক্ষমতা কমপক্ষে ১ হতে হবে"),
  status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED", "CLEANING"]).default("AVAILABLE"),
  active: z.boolean().default(true),
});

export const TableStatusUpdateSchema = z.object({
  status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED", "CLEANING"]),
  activeOrderId: z.string().optional().nullable(),
});

// --- CUSTOMER SCHEMA ---
export const CustomerSchema = z.object({
  name: z.string().min(1, "কাস্টমারের নাম লিখুন"),
  phone: z.string().min(8, "সঠিক ফোন নম্বর লিখুন"),
  email: z.string().email("সঠিক ইমেইল লিখুন").optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
});

// --- ORDER SCHEMAS ---
export const OrderItemSchema = z.object({
  menuItemId: z.string().min(1),
  nameBn: z.string().min(1),
  nameEn: z.string().min(1),
  variantNameBn: z.string().optional(),
  variantNameEn: z.string().optional(),
  unitPrice: z.number().min(0),
  costPrice: z.number().min(0).default(0),
  quantity: z.number().int().positive("পরিমাণ কমপক্ষে ১ হতে হবে"),
  totalPrice: z.number().min(0),
  notes: z.string().optional(),
  addOns: z
    .array(
      z.object({
        nameBn: z.string(),
        price: z.number().min(0),
      })
    )
    .optional(),
});

export const PaymentRecordSchema = z.object({
  method: z.enum(["CASH", "BKASH", "NAGAD", "ROCKET", "CARD", "BANK", "DUE"]),
  amount: z.number().min(0, "টাকার পরিমাণ ঋণাত্মক হতে পারে না"),
  reference: z.string().optional(),
  note: z.string().optional(),
  receivedAt: z.union([z.string(), z.date()]).optional(),
});

export const OrderCreateSchema = z.object({
  orderType: z.enum(["DINE_IN", "TAKEAWAY", "DELIVERY"]),
  tableId: z.string().optional(),
  tableName: z.string().optional(),
  floorName: z.string().optional(),
  guestCount: z.number().int().min(1).optional(),
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  deliveryAddress: z.string().optional(),
  waiterId: z.string().optional(),
  waiterName: z.string().optional(),
  items: z.array(OrderItemSchema).min(1, "কমপক্ষে একটি আইটেম যোগ করুন"),
  discountType: z.enum(["PERCENT", "FIXED"]).default("FIXED"),
  discountRate: z.number().min(0).default(0),
  deliveryCharge: z.number().min(0).default(0),
  paymentRecords: z.array(PaymentRecordSchema).default([]),
  notes: z.string().optional(),
});

export const OrderStatusUpdateSchema = z.object({
  orderStatus: z
    .enum([
      "DRAFT",
      "CONFIRMED",
      "PREPARING",
      "READY",
      "SERVED",
      "COMPLETED",
      "CANCELLED",
    ])
    .optional(),
  kitchenStatus: z.enum(["NEW", "PREPARING", "READY", "SERVED"]).optional(),
  tableId: z.string().optional(),
});

export const OrderPaymentSchema = z.object({
  paymentRecords: z.array(PaymentRecordSchema).min(1, "পেমেন্ট রেকর্ড আবশ্যক"),
});

export const OrderCancelSchema = z.object({
  reason: z.string().min(2, "বাতিল করার কারণ লিখুন"),
});

// --- INVENTORY SCHEMAS ---
export const InventoryItemSchema = z.object({
  nameBn: z.string().min(1, "বাংলা নাম আবশ্যক"),
  nameEn: z.string().min(1, "ইংরেজি নাম আবশ্যক"),
  category: z.string().min(1, "ক্যাটাগরি লিখুন"),
  unit: z.enum(["kg", "gram", "liter", "ml", "pcs", "packet", "box"]),
  currentStock: z.number().min(0, "স্টক ঋণাত্মক হতে পারে না").default(0),
  minimumStock: z.number().min(0, "সর্বনিম্ন স্টক ঋণাত্মক হতে পারে না").default(0),
  averageCost: z.number().min(0, "গড় খরচ ঋণাত্মক হতে পারে না").default(0),
  supplierId: z.string().optional(),
  supplierName: z.string().optional(),
  active: z.boolean().default(true),
});

export const StockAdjustmentSchema = z.object({
  inventoryItemId: z.string().min(1, "আইটেম নির্বাচন করুন"),
  type: z.enum(["PURCHASE", "SALE_CONSUMPTION", "ADJUSTMENT", "WASTE", "RETURN"]),
  quantityDelta: z.number().refine((val) => val !== 0, "পরিমাণ ০ হতে পারে না"),
  reason: z.string().min(2, "সমন্বয়ের কারণ লিখুন"),
});

// --- RECIPE SCHEMA ---
export const RecipeSchema = z.object({
  menuItemId: z.string().min(1, "মেনু আইটেম নির্বাচন করুন"),
  menuItemNameBn: z.string().min(1),
  variantName: z.string().optional(),
  ingredients: z
    .array(
      z.object({
        inventoryItemId: z.string().min(1, "উপাদান আবশ্যক"),
        quantity: z.number().positive("উপাদানের পরিমাণ ধনাত্মক হতে হবে"),
        unit: z.enum(["kg", "gram", "liter", "ml", "pcs", "packet", "box"]),
      })
    )
    .min(1, "কমপক্ষে একটি উপাদান আবশ্যক"),
  active: z.boolean().default(true),
});

// --- SUPPLIER & PURCHASE SCHEMAS ---
export const SupplierSchema = z.object({
  name: z.string().min(1, "সাপ্লায়ারের নাম লিখুন"),
  company: z.string().min(1, "কোম্পানির নাম লিখুন"),
  phone: z.string().min(8, "সঠিক ফোন নম্বর লিখুন"),
  email: z.string().email("সঠিক ইমেইল").optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export const PurchaseItemSchema = z.object({
  inventoryItemId: z.string().min(1),
  itemName: z.string().min(1),
  unit: z.enum(["kg", "gram", "liter", "ml", "pcs", "packet", "box"]),
  quantity: z.number().positive("পরিমাণ ধনাত্মক হতে হবে"),
  unitCost: z.number().min(0, "দর ঋণাত্মক হতে পারে না"),
});

export const PurchaseSchema = z.object({
  supplierId: z.string().min(1, "সাপ্লায়ার নির্বাচন করুন"),
  supplierName: z.string().min(1),
  items: z.array(PurchaseItemSchema).min(1, "কমপক্ষে একটি আইটেম যোগ করুন"),
  discount: z.number().min(0).default(0),
  paidAmount: z.number().min(0).default(0),
  paymentMethod: z.enum(["CASH", "BKASH", "NAGAD", "ROCKET", "CARD", "BANK", "DUE"]),
  paymentReference: z.string().optional(),
  purchaseDate: z.union([z.string(), z.date()]).optional(),
  notes: z.string().optional(),
  attachment: z.string().optional(),
});

// --- EXPENSE SCHEMA ---
export const ExpenseSchema = z.object({
  category: z.enum([
    "বাজার",
    "বেতন",
    "ভাড়া",
    "বিদ্যুৎ",
    "গ্যাস",
    "পানি",
    "পরিবহন",
    "মেরামত",
    "মার্কেটিং",
    "অন্যান্য",
  ]),
  amount: z.number().positive("খরচের পরিমাণ শূন্যের বেশি হতে হবে"),
  description: z.string().min(2, "খরচের বিবরণ লিখুন"),
  date: z.union([z.string(), z.date()]).default(() => new Date()),
  paymentMethod: z.enum(["CASH", "BKASH", "NAGAD", "ROCKET", "CARD", "BANK", "DUE"]),
  attachment: z.string().optional(),
});

// --- SHIFT SCHEMAS ---
export const CashShiftOpenSchema = z.object({
  openingCash: z.number().min(0, "ওপেনিং ক্যাশ ০ বা তার বেশি হতে হবে"),
  notes: z.string().optional(),
});

export const CashShiftCloseSchema = z.object({
  actualCash: z.number().min(0, "ক্লোজিং ক্যাশ প্রদান করুন"),
  notes: z.string().optional(),
});

// --- SETTINGS SCHEMA ---
export const SettingsSchema = z.object({
  name: z.string().min(1, "রেস্টুরেন্টের ইংরেজি নাম লিখুন"),
  nameBn: z.string().min(1, "রেস্টুরেন্টের বাংলা নাম লিখুন"),
  tagline: z.string().optional(),
  logo: z.string().optional(),
  phone: z.string().min(8, "ফোন নম্বর দিন"),
  email: z.string().email("সঠিক ইমেইল দিন").optional().or(z.literal("")),
  address: z.string().min(2, "ঠিকানা লিখুন"),
  vatEnabled: z.boolean().default(false),
  vatRate: z.number().min(0).max(100).default(5),
  vatRegistrationNumber: z.string().optional(),
  serviceChargeEnabled: z.boolean().default(false),
  serviceChargeRate: z.number().min(0).max(100).default(5),
  receiptFooterMessage: z.string().default("Thank you for dining with us!"),
  receiptFooterMessageBn: z.string().default("আমাদের সাথে আহারের জন্য আপনাকে ধন্যবাদ!"),
  currency: z.string().default("BDT"),
  currencySymbol: z.string().default("৳"),
  timezone: z.string().default("Asia/Dhaka"),
  invoicePrefix: z.string().default("INV-"),
  orderPrefix: z.string().default("ORD-"),
  features: z
    .object({
      inventory: z.boolean().default(true),
      kitchenDisplay: z.boolean().default(true),
      purchaseManagement: z.boolean().default(true),
      expenseManagement: z.boolean().default(true),
      advancedReports: z.boolean().default(true),
      customerManagement: z.boolean().default(true),
      shiftManagement: z.boolean().default(true),
      autoIngredientDeduction: z.boolean().default(true),
    })
    .default({
      inventory: true,
      kitchenDisplay: true,
      purchaseManagement: true,
      expenseManagement: true,
      advancedReports: true,
      customerManagement: true,
      shiftManagement: true,
      autoIngredientDeduction: true,
    }),
});
