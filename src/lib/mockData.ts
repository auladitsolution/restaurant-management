/**
 * Comprehensive Mock Data Registry for Demo Mode
 * Used when process.env.NEXT_PUBLIC_DEMO_MODE="true"
 * Provides realistic Bengali restaurant POS, inventory, orders, and financial data.
 */

import {
  IRestaurantSettings,
  ICategory,
  IMenuItem,
  ITable,
  IFloor,
  IOrder,
  IUser,
  ICashShift,
  IInventoryItem,
  ISupplier,
  IPurchase,
  IExpense,
  ICustomer,
  INotification,
} from "../types";

export const mockRestaurantSettings: IRestaurantSettings = {
  _id: "set-001",
  name: "Swad Restaurant & Cafe",
  nameBn: "স্বাদ রেস্টুরেন্ট অ্যান্ড ক্যাফে",
  tagline: "সুস্বাদু খাবারের বিশ্বস্ত ঠিকানা",
  logo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&auto=format&fit=crop&q=80",
  phone: "01711223344",
  email: "info@swadrestaurant.com",
  address: "বাড়ি নং ১৫, রোড নং ৪, বনানী, ঢাকা-১২১৩",
  vatEnabled: true,
  vatRate: 5,
  vatRegistrationNumber: "BIN-123456789",
  serviceChargeEnabled: true,
  serviceChargeRate: 5,
  receiptFooterMessage: "Thank you for dining with us! Please come again.",
  receiptFooterMessageBn: "আমাদের রেস্টুরেন্টে আসার জন্য ধন্যবাদ! আবার দেখা হবে।",
  currency: "BDT",
  currencySymbol: "৳",
  timezone: "Asia/Dhaka",
  invoicePrefix: "INV-",
  orderPrefix: "ORD-",
  features: {
    inventory: true,
    kitchenDisplay: true,
    purchaseManagement: true,
    expenseManagement: true,
    advancedReports: true,
    customerManagement: true,
    shiftManagement: true,
    autoIngredientDeduction: true,
  },
  tableCount: 16,
};

export const mockCategories: ICategory[] = [
  {
    _id: "cat-001",
    nameEn: "Biryani & Rice",
    nameBn: "বিরিয়ানি ও রাইস",
    sortOrder: 1,
    active: true,
  },
  {
    _id: "cat-002",
    nameEn: "Curry & Meat",
    nameBn: "কারী ও মাংস",
    sortOrder: 2,
    active: true,
  },
  {
    _id: "cat-003",
    nameEn: "Fast Food & Burgers",
    nameBn: "ফাস্টফুড ও বার্গার",
    sortOrder: 3,
    active: true,
  },
  {
    _id: "cat-004",
    nameEn: "Appetizers & Soups",
    nameBn: "অ্যাপেটাইজার ও স্যুপ",
    sortOrder: 4,
    active: true,
  },
  {
    _id: "cat-005",
    nameEn: "Beverages & Drinks",
    nameBn: "পানীয় ও বেভারেজ",
    sortOrder: 5,
    active: true,
  },
  {
    _id: "cat-006",
    nameEn: "Desserts",
    nameBn: "মিষ্টি ও ডেজার্ট",
    sortOrder: 6,
    active: true,
  },
];

export const mockMenuItems: IMenuItem[] = [
  {
    _id: "item-001",
    categoryId: "cat-001",
    categoryName: "বিরিয়ানি ও রাইস",
    nameBn: "কাচ্চি বিরিয়ানি (স্পেশাল বাসমতী)",
    nameEn: "Kacchi Biryani (Special Basmati)",
    description: "ঘিয়ে ভাজা খাঁটি খাসির মাংস ও জাফরানি বাসমতী চালের তৈরি মুখরোচক কাচ্চি",
    basePrice: 450,
    costPrice: 260,
    hasVariants: false,
    variants: [],
    addOns: [],
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80",
    availability: true,
    active: true,
  },
  {
    _id: "item-002",
    categoryId: "cat-001",
    categoryName: "বিরিয়ানি ও রাইস",
    nameBn: "চিকেন দম বিরিয়ানি",
    nameEn: "Chicken Dum Biryani",
    description: "চিকেনের বড় পিস ও সুগন্ধি পোলাওর চালের দম বিরিয়ানি সাথে স্পেশাল সালাদ",
    basePrice: 320,
    costPrice: 180,
    hasVariants: false,
    variants: [],
    addOns: [],
    image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80",
    availability: true,
    active: true,
  },
  {
    _id: "item-003",
    categoryId: "cat-002",
    categoryName: "কারী ও মাংস",
    nameBn: "বিফ কালা ভুনা (চট্টগ্রাম স্পেশাল)",
    nameEn: "Beef Kala Bhuna (Chittagong Style)",
    description: "প্রথাগত মসলায় কড়া করে ভাজা চট্টগ্রামের ঐতিহ্যবাহী বিফ কালা ভুনা",
    basePrice: 380,
    costPrice: 220,
    hasVariants: false,
    variants: [],
    addOns: [],
    image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=500&auto=format&fit=crop&q=80",
    availability: true,
    active: true,
  },
  {
    _id: "item-004",
    categoryId: "cat-002",
    categoryName: "কারী ও মাংস",
    nameBn: "চিকেন বাটার মাসালা",
    nameEn: "Chicken Butter Masala",
    description: "ক্রিমি টমেটো গ্রেভি ও মাখনে সেদ্ধ নরম বোনলেস চিকেন",
    basePrice: 340,
    costPrice: 190,
    hasVariants: false,
    variants: [],
    addOns: [],
    image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=80",
    availability: true,
    active: true,
  },
  {
    _id: "item-005",
    categoryId: "cat-003",
    categoryName: "ফাস্টফুড ও বার্গার",
    nameBn: "স্মোকি বিফ চিজ বার্গার",
    nameEn: "Smoky Beef Cheese Burger",
    description: "জুসি বিফ প্যাটি, গলিত শেডার চিজ ও কারামেলাইজড ওনিয়ন",
    basePrice: 290,
    costPrice: 150,
    hasVariants: false,
    variants: [],
    addOns: [],
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80",
    availability: true,
    active: true,
  },
  {
    _id: "item-006",
    categoryId: "cat-004",
    categoryName: "অ্যাপেটাইজার ও স্যুপ",
    nameBn: "থাই স্যুপ থিক (চিকেন ও প্রন)",
    nameEn: "Thai Soup Thick (Chicken & Prawn)",
    description: "লেমনগ্রাস, গাল্যাঙ্গাল, চিকেন ও মাঝারি প্রন সহ গাঢ় থাই স্যুপ",
    basePrice: 260,
    costPrice: 130,
    hasVariants: false,
    variants: [],
    addOns: [],
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500&auto=format&fit=crop&q=80",
    availability: true,
    active: true,
  },
  {
    _id: "item-007",
    categoryId: "cat-005",
    categoryName: "পানীয় ও বেভারেজ",
    nameBn: "স্পেশাল বোরহানি",
    nameEn: "Special Borhani",
    description: "টকদই, পুদিনা ও খাঁটি মসলার ঐতিহ্যবাহী উৎসবের পানীয়",
    basePrice: 80,
    costPrice: 35,
    hasVariants: false,
    variants: [],
    addOns: [],
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80",
    availability: true,
    active: true,
  },
  {
    _id: "item-008",
    categoryId: "cat-006",
    categoryName: "মিষ্টি ও ডেজার্ট",
    nameBn: "জাফরানি ফিরনি",
    nameEn: "Zafrani Firni",
    description: "পোলাওর চাল, খাঁটি ঘন দুধ ও জাফরানের মিষ্টি ফিরনি মাটির পাত্রে পরিবেশিত",
    basePrice: 110,
    costPrice: 50,
    hasVariants: false,
    variants: [],
    addOns: [],
    image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=80",
    availability: true,
    active: true,
  },
];

export const mockFloors: IFloor[] = [
  { _id: "floor-001", name: "Ground Floor", nameBn: "গ্রাউন্ড ফ্লোর (মূল ডাইনিং)", sortOrder: 1, active: true },
  { _id: "floor-002", name: "First Floor", nameBn: "ফার্স্ট ফ্লোর (ফ্যামিলি জোন)", sortOrder: 2, active: true },
  { _id: "floor-003", name: "Rooftop", nameBn: "রুফটপ গার্ডেন (খোলা ছাদ)", sortOrder: 3, active: true },
];

export const mockTables: ITable[] = [
  { _id: "tbl-001", floor: "Ground Floor", tableNumber: "T-01", nameBn: "টেবিল ১", capacity: 4, status: "OCCUPIED", activeOrderId: "ord-101", active: true },
  { _id: "tbl-002", floor: "Ground Floor", tableNumber: "T-02", nameBn: "টেবিল ২", capacity: 2, status: "AVAILABLE", active: true },
  { _id: "tbl-003", floor: "Ground Floor", tableNumber: "T-03", nameBn: "টেবিল ৩", capacity: 6, status: "OCCUPIED", activeOrderId: "ord-102", active: true },
  { _id: "tbl-004", floor: "Ground Floor", tableNumber: "T-04", nameBn: "টেবিল ৪", capacity: 4, status: "AVAILABLE", active: true },
  { _id: "tbl-005", floor: "First Floor", tableNumber: "F-01", nameBn: "ফ্যামিলি ১", capacity: 8, status: "RESERVED", active: true },
  { _id: "tbl-006", floor: "First Floor", tableNumber: "F-02", nameBn: "ফ্যামিলি ২", capacity: 6, status: "OCCUPIED", activeOrderId: "ord-103", active: true },
  { _id: "tbl-007", floor: "Rooftop", tableNumber: "R-01", nameBn: "রুফটপ ১", capacity: 4, status: "AVAILABLE", active: true },
  { _id: "tbl-008", floor: "Rooftop", tableNumber: "R-02", nameBn: "রুফটপ ২", capacity: 4, status: "AVAILABLE", active: true },
];

export const mockOrders: IOrder[] = [
  {
    _id: "ord-101",
    orderNumber: "ORD-2026-001",
    orderType: "DINE_IN",
    orderStatus: "PREPARING",
    kitchenStatus: "PREPARING",
    tableId: "tbl-001",
    tableName: "T-01",
    floorName: "Ground Floor",
    waiterName: "কামাল উদ্দিন",
    customerName: "তানভীর আহমেদ",
    customerPhone: "01819000111",
    items: [
      { menuItemId: "item-001", nameBn: "কাচ্চি বিরিয়ানি (স্পেশাল বাসমতী)", nameEn: "Kacchi Biryani", unitPrice: 450, costPrice: 260, quantity: 2, totalPrice: 900 },
      { menuItemId: "item-007", nameBn: "স্পেশাল বোরহানি", nameEn: "Special Borhani", unitPrice: 80, costPrice: 35, quantity: 2, totalPrice: 160 },
    ],
    subtotal: 1060,
    vatRate: 5,
    vatAmount: 53,
    serviceChargeRate: 5,
    serviceChargeAmount: 53,
    discountType: "FIXED",
    discountRate: 0,
    discountAmount: 0,
    deliveryCharge: 0,
    grandTotal: 1166,
    paidAmount: 0,
    dueAmount: 1166,
    paymentStatus: "UNPAID",
    paymentRecords: [],
    inventoryDeducted: true,
    createdBy: { userId: "user-cashier-1", name: "রাকিব হাসান", role: "CASHIER" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "ord-102",
    orderNumber: "ORD-2026-002",
    orderType: "DINE_IN",
    orderStatus: "READY",
    kitchenStatus: "READY",
    tableId: "tbl-003",
    tableName: "T-03",
    floorName: "Ground Floor",
    waiterName: "মাহমুদুল হাসান",
    customerName: "শফিক চৌধুরী",
    customerPhone: "01720112233",
    items: [
      { menuItemId: "item-003", nameBn: "বিফ কালা ভুনা", nameEn: "Beef Kala Bhuna", unitPrice: 380, costPrice: 220, quantity: 2, totalPrice: 760 },
      { menuItemId: "item-002", nameBn: "চিকেন দম বিরিয়ানি", nameEn: "Chicken Dum Biryani", unitPrice: 320, costPrice: 180, quantity: 2, totalPrice: 640 },
      { menuItemId: "item-007", nameBn: "স্পেশাল বোরহানি", nameEn: "Special Borhani", unitPrice: 80, costPrice: 35, quantity: 4, totalPrice: 320 },
    ],
    subtotal: 1720,
    vatRate: 5,
    vatAmount: 86,
    serviceChargeRate: 5,
    serviceChargeAmount: 86,
    discountType: "FIXED",
    discountRate: 0,
    discountAmount: 0,
    deliveryCharge: 0,
    grandTotal: 1892,
    paidAmount: 0,
    dueAmount: 1892,
    paymentStatus: "UNPAID",
    paymentRecords: [],
    inventoryDeducted: true,
    createdBy: { userId: "user-cashier-1", name: "রাকিব হাসান", role: "CASHIER" },
    createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockDashboardReports = {
  kpis: {
    totalSales: 48650,
    orderCount: 42,
    avgOrderValue: 1158,
    netProfit: 19460,
    cashSales: 28400,
    cardSales: 12250,
    mobileBankingSales: 8000,
    totalExpenses: 7800,
    totalDiscounts: 1350,
    activeTables: 4,
    occupancyRate: 50,
  },
  charts: {
    hourlySales: [
      { hour: "11:00", sales: 2400, orders: 3 },
      { hour: "12:00", sales: 5800, orders: 6 },
      { hour: "13:00", sales: 9500, orders: 9 },
      { hour: "14:00", sales: 8200, orders: 7 },
      { hour: "15:00", sales: 3400, orders: 3 },
      { hour: "16:00", sales: 2100, orders: 2 },
      { hour: "17:00", sales: 3800, orders: 4 },
      { hour: "18:00", sales: 6200, orders: 5 },
      { hour: "19:00", sales: 7250, orders: 3 },
    ],
    topSellingItems: [
      { name: "কাচ্চি বিরিয়ানি (স্পেশাল)", count: 28, revenue: 12600 },
      { name: "চিকেন দম বিরিয়ানি", count: 22, revenue: 7040 },
      { name: "বিফ কালা ভুনা", count: 18, revenue: 6840 },
      { name: "স্মোকি বিফ চিজ বার্গার", count: 16, revenue: 4640 },
      { name: "স্পেশাল বোরহানি", count: 45, revenue: 3600 },
    ],
    paymentBreakdown: [
      { method: "ক্যাশ (নগদ)", amount: 28400, color: "#10B981" },
      { method: "কার্ড (POS)", amount: 12250, color: "#3B82F6" },
      { method: "বিকাশ / নগদ", amount: 8000, color: "#EC4899" },
    ],
    salesByCategory: [
      { name: "বিরিয়ানি ও রাইস", value: 19640 },
      { name: "কারী ও মাংস", value: 11450 },
      { name: "ফাস্টফুড ও বার্গার", value: 6800 },
      { name: "পানীয় ও বেভারেজ", value: 5200 },
      { name: "মিষ্টি ও ডেজার্ট", value: 3360 },
      { name: "অ্যাপেটাইজার ও স্যুপ", value: 2200 },
    ],
  },
};

export const mockInventory: IInventoryItem[] = [
  {
    _id: "inv-001",
    nameBn: "বাসমতী চাল (প্রিমিয়াম)",
    nameEn: "Basmati Rice Premium",
    category: "শস্য ও চাল",
    currentStock: 48,
    minimumStock: 20,
    unit: "kg",
    averageCost: 140,
    active: true,
  },
  {
    _id: "inv-002",
    nameBn: "খাসির মাংস (টাটকা)",
    nameEn: "Fresh Mutton",
    category: "মাংস ও পোল্ট্রি",
    currentStock: 6.5,
    minimumStock: 10,
    unit: "kg",
    averageCost: 1150,
    active: true,
  },
  {
    _id: "inv-003",
    nameBn: "সয়াবিন তেল (ফরচুন)",
    nameEn: "Soybean Oil",
    category: "তেল ও ঘি",
    currentStock: 35,
    minimumStock: 15,
    unit: "liter",
    averageCost: 185,
    active: true,
  },
  {
    _id: "inv-004",
    nameBn: "খাঁটি গাওয়া ঘি",
    nameEn: "Pure Ghee",
    category: "তেল ও ঘি",
    currentStock: 3.2,
    minimumStock: 5,
    unit: "kg",
    averageCost: 1200,
    active: true,
  },
  {
    _id: "inv-005",
    nameBn: "দেশি পেঁয়াজ",
    nameEn: "Local Onion",
    category: "শাকসবজি ও মসলা",
    currentStock: 80,
    minimumStock: 25,
    unit: "kg",
    averageCost: 65,
    active: true,
  },
];

export const mockSuppliers: ISupplier[] = [
  {
    _id: "sup-001",
    name: "মক্কা মিট সাপ্লায়ার্স",
    company: "মক্কা মিট কর্পোরেশন",
    phone: "01712000333",
    address: "কাপ্তান বাজার, ঢাকা",
    currentDue: 14500,
    active: true,
  },
  {
    _id: "sup-002",
    name: "মেসার্স রহিম চাল আড়ত",
    company: "রহিম এন্টারপ্রাইজ",
    phone: "01819333444",
    address: "বাদামতলী, ঢাকা",
    currentDue: 22000,
    active: true,
  },
];

export const mockPurchases: IPurchase[] = [
  {
    _id: "pur-001",
    purchaseNumber: "PUR-2026-001",
    supplierId: "sup-001",
    supplierName: "মক্কা মিট সাপ্লায়ার্স",
    items: [
      {
        inventoryItemId: "inv-002",
        itemName: "খাসির মাংস (টাটকা)",
        unit: "kg",
        quantity: 16,
        unitCost: 1150,
        totalCost: 18400,
      },
    ],
    subtotal: 18400,
    discount: 0,
    totalAmount: 18400,
    paidAmount: 10000,
    dueAmount: 8400,
    paymentMethod: "CASH",
    status: "RECEIVED",
    purchaseDate: new Date().toISOString(),
    createdBy: { userId: "user-owner-1", name: "আউলাদ হোসেন" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockExpenses: IExpense[] = [
  {
    _id: "exp-001",
    category: "গ্যাস",
    amount: 3200,
    description: "গ্যাস সিলিন্ডার ক্রয় (২ টি)",
    paymentMethod: "CASH",
    date: new Date().toISOString(),
    createdBy: { userId: "user-mgr-1", name: "মাহমুদুল হাসান" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "exp-002",
    category: "মেরামত",
    amount: 1500,
    description: "ডাইনিং লাইটিং ও বৈদ্যুতিক কাজ",
    paymentMethod: "CASH",
    date: new Date().toISOString(),
    createdBy: { userId: "user-mgr-1", name: "মাহমুদুল হাসান" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockCustomers: ICustomer[] = [
  {
    _id: "cust-001",
    name: "তানভীর আহমেদ",
    phone: "01819000111",
    email: "tanvir@example.com",
    totalSpent: 14200,
    totalOrders: 12,
    totalDue: 0,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "cust-002",
    name: "নুসরাত জাহান",
    phone: "01711888999",
    email: "nusrat@example.com",
    totalSpent: 8600,
    totalOrders: 7,
    totalDue: 0,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockCashShift: ICashShift = {
  _id: "shift-001",
  shiftNumber: "SFT-2026-001",
  cashierId: "user-cashier-1",
  cashierName: "রাকিব হাসান",
  startTime: new Date(new Date().setHours(8, 0, 0, 0)).toISOString(),
  openingCash: 5000,
  cashSales: 28400,
  cashIn: 0,
  cashOut: 0,
  refunds: 0,
  expectedCash: 33400,
  status: "OPEN",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockCurrentUser: IUser = {
  _id: "user-owner-1",
  firebaseUid: "demo-owner-uid",
  name: "আউলাদ হোসেন (ডেমো এডমিন)",
  email: "auladinfo@gmail.com",
  phone: "01700000000",
  role: "OWNER",
  permissions: [
    "dashboard:view",
    "pos:access",
    "orders:create",
    "orders:read",
    "orders:update",
    "orders:cancel",
    "tables:manage",
    "kitchen:access",
    "menu:manage",
    "inventory:manage",
    "purchases:manage",
    "expenses:manage",
    "customers:manage",
    "shifts:manage",
    "reports:view",
    "reports:profit",
    "users:manage",
    "settings:manage",
    "audit:view",
    "backup:export",
  ],
  active: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockUsers: IUser[] = [
  mockCurrentUser,
  {
    _id: "user-mgr-1",
    firebaseUid: "demo-mgr-uid",
    name: "মাহমুদুল হাসান",
    email: "manager@swadrestaurant.com",
    phone: "01711000222",
    role: "MANAGER",
    permissions: [
      "dashboard:view",
      "pos:access",
      "orders:create",
      "orders:read",
      "orders:update",
      "tables:manage",
      "kitchen:access",
      "menu:manage",
      "inventory:manage",
      "purchases:manage",
      "expenses:manage",
      "customers:manage",
      "shifts:manage",
      "reports:view",
    ],
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "user-cashier-1",
    firebaseUid: "demo-cashier-uid",
    name: "রাকিব হাসান",
    email: "cashier@swadrestaurant.com",
    phone: "01811000333",
    role: "CASHIER",
    permissions: ["pos:access", "orders:create", "orders:read", "shifts:manage"],
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockNotifications: INotification[] = [
  {
    _id: "notif-001",
    title: "লো-স্টক সতর্কতা",
    message: "খাসির মাংস (টাটকা)-এর স্টক ১০ কেজির নিচে (বর্তমান: ৬.৫ কেজি)",
    type: "LOW_STOCK",
    read: false,
    createdAt: new Date().toISOString(),
  },
  {
    _id: "notif-002",
    title: "নতুন অর্ডার গৃহীত হয়েছে",
    message: "টেবিল ১ থেকে অর্ডার #ORD-2026-001 কিচেনে পাঠানো হয়েছে",
    type: "ORDER",
    read: false,
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
];

export const mockAuditLogs = [
  {
    _id: "log-001",
    action: "ORDER_CREATED",
    performedBy: "আউলাদ হোসেন",
    role: "OWNER",
    details: "নতুন ডাইন-ইন অর্ডার তৈরি করা হয়েছে (#ORD-2026-001)",
    ipAddress: "127.0.0.1",
    timestamp: new Date().toISOString(),
  },
  {
    _id: "log-002",
    action: "STOCK_ADJUSTED",
    performedBy: "মাহমুদুল হাসান",
    role: "MANAGER",
    details: "বাসমতী চাল (প্রিমিয়াম) স্টকে যোগ করা হয়েছে",
    ipAddress: "127.0.0.1",
    timestamp: new Date(Date.now() - 3600 * 1000).toISOString(),
  },
];

/**
 * Intelligent endpoint resolver that matches incoming API paths and methods
 * and returns the appropriate structured mock data response.
 */
export function getMockDataForEndpoint(url: string, method: string = "GET"): any {
  // Normalize URL path to ignore query strings and host
  const pathname = url.split("?")[0].replace(/^\/api\//, "").replace(/\/$/, "");

  // Settings
  if (pathname === "settings") {
    if (method === "POST" || method === "PUT") {
      return { success: true, message: "সেটিংস সফলভাবে আপডেট হয়েছে", data: mockRestaurantSettings };
    }
    return { success: true, data: mockRestaurantSettings };
  }

  // Reports / Dashboard Analytics
  if (pathname === "reports") {
    return mockDashboardReports;
  }

  // Categories
  if (pathname === "categories" || pathname.startsWith("categories/")) {
    if (method === "POST") {
      return { success: true, message: "ক্যাটাগরি যুক্ত করা হয়েছে", data: mockCategories[0] };
    }
    return { success: true, data: mockCategories };
  }

  // Menu Items
  if (pathname === "menu" || pathname.startsWith("menu/")) {
    if (method === "POST") {
      return { success: true, message: "মেনু আইটেম যুক্ত করা হয়েছে", data: mockMenuItems[0] };
    }
    return { success: true, data: mockMenuItems };
  }

  // Tables
  if (pathname === "tables" || pathname.startsWith("tables/")) {
    if (method === "POST") {
      return { success: true, message: "টেবিল যুক্ত করা হয়েছে", data: mockTables[0] };
    }
    return { success: true, data: mockTables };
  }

  // Floors
  if (pathname === "floors" || pathname.startsWith("floors/")) {
    return { success: true, data: mockFloors };
  }

  // Orders
  if (pathname === "orders" || pathname.startsWith("orders/")) {
    if (method === "POST") {
      return {
        success: true,
        message: "অর্ডার সফলভাবে তৈরি হয়েছে",
        data: {
          _id: "ord-" + Date.now(),
          orderNumber: "ORD-DEMO-" + Math.floor(Math.random() * 9000 + 1000),
          orderStatus: "CONFIRMED",
          grandTotal: 1000,
        },
      };
    }
    return { success: true, data: mockOrders };
  }

  // Kitchen KDS
  if (pathname === "kitchen") {
    if (method === "POST" || method === "PUT" || method === "PATCH") {
      return { success: true, message: "কিচেন স্ট্যাটাস আপডেট হয়েছে" };
    }
    return {
      success: true,
      orders: mockOrders.filter((o) => o.kitchenStatus === "PREPARING" || o.kitchenStatus === "NEW"),
    };
  }

  // Inventory
  if (pathname === "inventory" || pathname === "inventory/adjust" || pathname.startsWith("inventory/")) {
    if (method === "POST") {
      return { success: true, message: "ইনভেন্টরি সফলভাবে আপডেট করা হয়েছে" };
    }
    return { success: true, data: mockInventory };
  }

  // Purchases
  if (pathname === "purchases" || pathname.startsWith("purchases/")) {
    if (method === "POST") {
      return { success: true, message: "ক্রয় চালান সংরক্ষিত হয়েছে", data: mockPurchases[0] };
    }
    return { success: true, data: mockPurchases };
  }

  // Suppliers
  if (pathname === "suppliers" || pathname.startsWith("suppliers/")) {
    if (method === "POST") {
      return { success: true, message: "সাপ্লায়ার যুক্ত হয়েছে", data: mockSuppliers[0] };
    }
    return { success: true, data: mockSuppliers };
  }

  // Expenses
  if (pathname === "expenses" || pathname.startsWith("expenses/")) {
    if (method === "POST") {
      return { success: true, message: "খরচ সফলভাবে যুক্ত হয়েছে", data: mockExpenses[0] };
    }
    return { success: true, data: mockExpenses };
  }

  // Customers
  if (pathname === "customers" || pathname.startsWith("customers/")) {
    if (method === "POST") {
      return { success: true, message: "কাস্টমার যুক্ত হয়েছে", data: mockCustomers[0] };
    }
    return { success: true, data: mockCustomers };
  }

  // Shifts
  if (pathname === "shifts" || pathname.startsWith("shifts/")) {
    if (url.includes("current=true")) {
      return { success: true, data: mockCashShift };
    }
    if (method === "POST") {
      return { success: true, message: "শিফট সফলভাবে আপডেট হয়েছে", data: mockCashShift };
    }
    return { success: true, data: [mockCashShift] };
  }

  // Auth & Session
  if (pathname === "auth/session") {
    return { success: true, user: mockCurrentUser };
  }
  if (pathname === "auth/users" || pathname.startsWith("auth/users/")) {
    if (method === "POST") {
      return { success: true, message: "ব্যবহারকারী তৈরি হয়েছে", data: mockUsers[0] };
    }
    return { success: true, data: mockUsers };
  }

  // Notifications
  if (pathname === "notifications") {
    if (method === "POST" || method === "PATCH") {
      return { success: true, message: "বিজ্ঞপ্তি পড়া হয়েছে" };
    }
    return { success: true, data: mockNotifications };
  }

  // Audit Logs
  if (pathname === "audit-logs") {
    return { success: true, data: mockAuditLogs };
  }

  // Upload simulation
  if (pathname === "upload") {
    return {
      success: true,
      url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80",
    };
  }

  // Generic fallback
  return { success: true, message: "ডেমো মোড সক্রিয় রয়েছে", data: [] };
}
