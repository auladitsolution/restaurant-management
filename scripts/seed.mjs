// ==========================================
// SWAD RESTAURANT DEMO / SEED SCRIPT
// For local development and demonstration only
// ==========================================

import mongoose from "mongoose";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env.local");

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.substring(0, eqIdx).trim();
      let val = trimmed.substring(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      process.env[key] = val;
    }
  });
}

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/restaurant_pos";
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "restaurant_pos";

async function runSeed() {
  if (process.env.NODE_ENV === "production" && !process.env.FORCE_SEED) {
    console.error("CRITICAL: Seed script cannot run in production without FORCE_SEED=true");
    process.exit(1);
  }

  console.log("Connecting to MongoDB:", MONGODB_URI);
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB_NAME });
  const db = mongoose.connection.db;

  console.log("Clearing existing sample collections...");
  const collections = [
    "users",
    "restaurantsettings",
    "categories",
    "menuitems",
    "floors",
    "tables",
    "customers",
    "orders",
    "inventoryitems",
    "stockmovements",
    "recipes",
    "suppliers",
    "purchases",
    "expenses",
    "cashshifts",
    "notifications",
    "auditlogs",
  ];

  for (const col of collections) {
    try {
      await db.collection(col).drop();
    } catch {
      // Collection doesn't exist yet
    }
  }

  console.log("Seeding Restaurant Settings...");
  await db.collection("restaurantsettings").insertOne({
    name: "Swad Restaurant",
    nameBn: "স্বাদ রেস্টুরেন্ট",
    tagline: "খাঁটি স্বাদের ঐতিহ্যবাহী রেস্টুরেন্ট",
    phone: "01711000000",
    email: "info@swadrestaurant.com",
    address: "মিরপুর-১০, ঢাকা, বাংলাদেশ",
    vatEnabled: true,
    vatRate: 5,
    vatRegistrationNumber: "BIN-987654321",
    serviceChargeEnabled: true,
    serviceChargeRate: 5,
    receiptFooterMessageBn: "আমাদের সাথে আহারের জন্য আপনাকে ধন্যবাদ! আবার আসবেন।",
    receiptFooterMessage: "Thank you for dining with us!",
    currency: "BDT",
    currencySymbol: "৳",
    timezone: "Asia/Dhaka",
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
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log("Seeding Staff Users...");
  const users = [
    {
      firebaseUid: "dev-uid-owner",
      name: "আওলাদ হোসেন (মালিক)",
      email: "owner@swadrestaurant.com",
      phone: "01711000001",
      role: "OWNER",
      permissions: [],
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      firebaseUid: "dev-uid-manager",
      name: "মোঃ তানভীর আহমেদ (ম্যানেজার)",
      email: "manager@swadrestaurant.com",
      phone: "01711000002",
      role: "MANAGER",
      permissions: [],
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      firebaseUid: "dev-uid-cashier",
      name: "সাবরিনা আক্তার (ক্যাশিয়ার)",
      email: "cashier@swadrestaurant.com",
      phone: "01711000003",
      role: "CASHIER",
      permissions: [],
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      firebaseUid: "dev-uid-waiter",
      name: "মোঃ রাসেল (ওয়েটার)",
      email: "waiter@swadrestaurant.com",
      phone: "01711000004",
      role: "WAITER",
      permissions: [],
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      firebaseUid: "dev-uid-kitchen",
      name: "শেফ করিম উল্লাহ (কিচেন)",
      email: "kitchen@swadrestaurant.com",
      phone: "01711000005",
      role: "KITCHEN",
      permissions: [],
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      firebaseUid: "dev-uid-inventory_manager",
      name: "মোঃ কামরুল হাসান (ইনভেন্টরি)",
      email: "inventory@swadrestaurant.com",
      phone: "01711000006",
      role: "INVENTORY_MANAGER",
      permissions: [],
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  await db.collection("users").insertMany(users);

  console.log("Seeding Categories...");
  const catDocs = [
    { nameBn: "বিরিয়ানি", nameEn: "Biryani", sortOrder: 1, active: true },
    { nameBn: "বার্গার", nameEn: "Burger", sortOrder: 2, active: true },
    { nameBn: "পিজ্জা", nameEn: "Pizza", sortOrder: 3, active: true },
    { nameBn: "ড্রিংকস", nameEn: "Drinks", sortOrder: 4, active: true },
    { nameBn: "ডেজার্ট", nameEn: "Dessert", sortOrder: 5, active: true },
  ];
  const catResult = await db.collection("categories").insertMany(catDocs);
  const catMap = {};
  catDocs.forEach((c, idx) => {
    catMap[c.nameBn] = catResult.insertedIds[idx];
  });

  console.log("Seeding Inventory Items...");
  const inventoryData = [
    { nameBn: "বাসমতী চাল", nameEn: "Basmati Rice", category: "চাল", unit: "kg", currentStock: 80, minimumStock: 20, averageCost: 110, active: true },
    { nameBn: "চিকেন ব্রয়লার", nameEn: "Chicken Broiler", category: "মাংস", unit: "kg", currentStock: 45, minimumStock: 15, averageCost: 180, active: true },
    { nameBn: "খাসির মাংস", nameEn: "Mutton", category: "মাংস", unit: "kg", currentStock: 30, minimumStock: 10, averageCost: 950, active: true },
    { nameBn: "বার্গার বান", nameEn: "Burger Bun", category: "বেকারি", unit: "pcs", currentStock: 60, minimumStock: 25, averageCost: 15, active: true },
    { nameBn: "চিজ স্লাইস", nameEn: "Cheese Slice", category: "দুগ্ধজাত", unit: "pcs", currentStock: 100, minimumStock: 30, averageCost: 20, active: true },
    { nameBn: "পিজ্জা ডো/ময়দা", nameEn: "Pizza Flour", category: "ময়দা", unit: "kg", currentStock: 25, minimumStock: 10, averageCost: 65, active: true },
    { nameBn: "মোজারেলা চিজ", nameEn: "Mozzarella Cheese", category: "দুগ্ধজাত", unit: "kg", currentStock: 12, minimumStock: 5, averageCost: 850, active: true },
    { nameBn: "কোকাকোলা ক্যান", nameEn: "Coca-Cola Can", category: "পানীয়", unit: "pcs", currentStock: 120, minimumStock: 30, averageCost: 32, active: true },
    { nameBn: "দুধ", nameEn: "Milk", category: "দুগ্ধজাত", unit: "liter", currentStock: 15, minimumStock: 8, averageCost: 85, active: true },
    { nameBn: "ঘি", nameEn: "Ghee", category: "মসলা", unit: "kg", currentStock: 8, minimumStock: 3, averageCost: 1200, active: true },
  ];
  const invResult = await db.collection("inventoryitems").insertMany(inventoryData);
  const invMap = {};
  inventoryData.forEach((i, idx) => {
    invMap[i.nameBn] = invResult.insertedIds[idx];
  });

  console.log("Seeding Menu Items...");
  const menuData = [
    {
      nameBn: "কাচ্চি বিরিয়ানি",
      nameEn: "Kacchi Biryani",
      categoryId: catMap["বিরিয়ানি"],
      categoryName: "বিরিয়ানি",
      basePrice: 350,
      costPrice: 210,
      hasVariants: true,
      variants: [
        { nameBn: "১:১ ফুল", nameEn: "1:1 Full", price: 350, costPrice: 210 },
        { nameBn: "১:২ ফ্যামিলি", nameEn: "1:2 Family", price: 680, costPrice: 400 },
      ],
      addOns: [{ nameBn: "এক্সট্রা বোরহানি", price: 50 }, { nameBn: "এক্সট্রা আলুবোখারা", price: 20 }],
      availability: true,
      active: true,
    },
    {
      nameBn: "চিকেন বিরিয়ানি",
      nameEn: "Chicken Biryani",
      categoryId: catMap["বিরিয়ানি"],
      categoryName: "বিরিয়ানি",
      basePrice: 220,
      costPrice: 130,
      hasVariants: false,
      variants: [],
      addOns: [{ nameBn: "ডিম", price: 20 }],
      availability: true,
      active: true,
    },
    {
      nameBn: "চিকেন বার্গার",
      nameEn: "Chicken Burger",
      categoryId: catMap["বার্গার"],
      categoryName: "বার্গার",
      basePrice: 180,
      costPrice: 95,
      hasVariants: false,
      variants: [],
      addOns: [{ nameBn: "এক্সট্রা চিজ", price: 30 }, { nameBn: "এক্সট্রা প্যাটি", price: 60 }],
      availability: true,
      active: true,
    },
    {
      nameBn: "বিফ বার্গার",
      nameEn: "Beef Burger",
      categoryId: catMap["বার্গার"],
      categoryName: "বার্গার",
      basePrice: 250,
      costPrice: 140,
      hasVariants: false,
      variants: [],
      addOns: [{ nameBn: "এক্সট্রা চিজ", price: 30 }],
      availability: true,
      active: true,
    },
    {
      nameBn: "চিকেন পিজ্জা",
      nameEn: "Chicken Pizza",
      categoryId: catMap["পিজ্জা"],
      categoryName: "পিজ্জা",
      basePrice: 550,
      costPrice: 290,
      hasVariants: true,
      variants: [
        { nameBn: "৮ ইঞ্চি (Regular)", nameEn: "8 inch", price: 350, costPrice: 180 },
        { nameBn: "১০ ইঞ্চি (Medium)", nameEn: "10 inch", price: 550, costPrice: 290 },
        { nameBn: "১২ ইঞ্চি (Large)", nameEn: "12 inch", price: 750, costPrice: 410 },
      ],
      addOns: [{ nameBn: "এক্সট্রা চিজ", price: 70 }, { nameBn: "সসেজ", price: 50 }],
      availability: true,
      active: true,
    },
    {
      nameBn: "কোকাকোলা",
      nameEn: "Coca-Cola",
      categoryId: catMap["ড্রিংকস"],
      categoryName: "ড্রিংকস",
      basePrice: 40,
      costPrice: 32,
      hasVariants: false,
      variants: [],
      addOns: [],
      availability: true,
      active: true,
    },
    {
      nameBn: "স্পেশাল ফালুদা",
      nameEn: "Special Falooda",
      categoryId: catMap["ডেজার্ট"],
      categoryName: "ডেজার্ট",
      basePrice: 150,
      costPrice: 75,
      hasVariants: false,
      variants: [],
      addOns: [{ nameBn: "এক্সট্রা আইসক্রিম", price: 40 }],
      availability: true,
      active: true,
    },
  ];
  const menuResult = await db.collection("menuitems").insertMany(menuData);

  console.log("Seeding Recipes (BOM)...");
  // Link Chicken Burger to Bun (1), Chicken (150g), Cheese (1)
  const chickenBurgerId = menuResult.insertedIds[2];
  await db.collection("recipes").insertOne({
    menuItemId: chickenBurgerId,
    menuItemNameBn: "চিকেন বার্গার",
    variantName: "",
    ingredients: [
      { inventoryItemId: invMap["বার্গার বান"], quantity: 1, unit: "pcs" },
      { inventoryItemId: invMap["চিকেন ব্রয়লার"], quantity: 150, unit: "gram" },
      { inventoryItemId: invMap["চিজ স্লাইস"], quantity: 1, unit: "pcs" },
    ],
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log("Seeding Floors & Tables...");
  await db.collection("floors").insertMany([
    { name: "Ground Floor", nameBn: "নিচতলা", sortOrder: 1, active: true },
    { name: "First Floor", nameBn: "দোতলা (ফ্যামিলি জোন)", sortOrder: 2, active: true },
  ]);

  const tablesData = [
    { tableNumber: "T-01", floor: "Ground Floor", capacity: 4, status: "AVAILABLE", active: true },
    { tableNumber: "T-02", floor: "Ground Floor", capacity: 4, status: "AVAILABLE", active: true },
    { tableNumber: "T-03", floor: "Ground Floor", capacity: 6, status: "AVAILABLE", active: true },
    { tableNumber: "T-04", floor: "Ground Floor", capacity: 2, status: "AVAILABLE", active: true },
    { tableNumber: "F-01", floor: "First Floor", capacity: 8, status: "AVAILABLE", active: true },
    { tableNumber: "F-02", floor: "First Floor", capacity: 6, status: "AVAILABLE", active: true },
  ];
  await db.collection("tables").insertMany(tablesData);

  console.log("Seeding Suppliers...");
  const supplierDocs = [
    { name: "মোঃ রফিক", company: "সিটি পোলট্রি অ্যান্ড মিট", phone: "01811223344", currentDue: 5000, active: true },
    { name: "করিম উল্লাহ", company: "ফ্রেশ রাইস এজেন্সি", phone: "01911223344", currentDue: 0, active: true },
  ];
  await db.collection("suppliers").insertMany(supplierDocs);

  console.log("Seeding Customers...");
  await db.collection("customers").insertMany([
    { name: "সাকিব আল হাসান", phone: "01712345678", address: "মিরপুর-২", totalOrders: 5, totalSpent: 3500, totalDue: 0, active: true },
    { name: "তামিম ইকবাল", phone: "01787654321", address: "উত্তরা-৭", totalOrders: 2, totalSpent: 1200, totalDue: 450, active: true },
  ]);

  console.log("Seeding Expenses...");
  await db.collection("expenses").insertMany([
    {
      category: "বাজার",
      amount: 4500,
      description: "দৈনিক কাঁচা সবজি, পেঁয়াজ ও মসলা ক্রয়",
      paymentMethod: "CASH",
      date: new Date(),
      createdBy: { userId: "dev-uid-owner", name: "আওলাদ হোসেন (মালিক)" },
      createdAt: new Date(),
    },
    {
      category: "বিদ্যুৎ",
      amount: 6200,
      description: "মে মাসের বিদ্যুৎ বিল পরিশোধ",
      paymentMethod: "BKASH",
      date: new Date(),
      createdBy: { userId: "dev-uid-owner", name: "আওলাদ হোসেন (মালিক)" },
      createdAt: new Date(),
    },
  ]);

  console.log("Seeding Sample Completed Order...");
  await db.collection("orders").insertOne({
    orderNumber: "ORD-20261001-0001",
    orderType: "DINE_IN",
    tableName: "T-01",
    floorName: "Ground Floor",
    guestCount: 2,
    customerName: "সাকিব আল হাসান",
    customerPhone: "01712345678",
    items: [
      {
        menuItemId: menuResult.insertedIds[0],
        nameBn: "কাচ্চি বিরিয়ানি",
        nameEn: "Kacchi Biryani",
        variantNameBn: "১:১ ফুল",
        variantNameEn: "1:1 Full",
        unitPrice: 350,
        costPrice: 210,
        quantity: 2,
        totalPrice: 700,
      },
      {
        menuItemId: menuResult.insertedIds[5],
        nameBn: "কোকাকোলা",
        nameEn: "Coca-Cola",
        unitPrice: 40,
        costPrice: 32,
        quantity: 2,
        totalPrice: 80,
      },
    ],
    subtotal: 780,
    discountType: "FIXED",
    discountRate: 0,
    discountAmount: 0,
    vatRate: 5,
    vatAmount: 39,
    serviceChargeRate: 5,
    serviceChargeAmount: 39,
    deliveryCharge: 0,
    grandTotal: 858,
    paidAmount: 858,
    dueAmount: 0,
    paymentStatus: "PAID",
    paymentRecords: [
      { method: "CASH", amount: 858, receivedAt: new Date() },
    ],
    orderStatus: "COMPLETED",
    kitchenStatus: "SERVED",
    inventoryDeducted: true,
    createdBy: { userId: "dev-uid-cashier", name: "সাবরিনা আক্তার (ক্যাশিয়ার)", role: "CASHIER" },
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log("\n✓ SEED COMPLETE! Sample restaurant 'স্বাদ রেস্টুরেন্ট' is ready.");
  await mongoose.disconnect();
}

runSeed().catch((err) => {
  console.error("Seed Error:", err);
  process.exit(1);
});
