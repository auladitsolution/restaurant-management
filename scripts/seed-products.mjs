import mongoose from "mongoose";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env.local");

// Load .env.local variables
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

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "restaurant-db";

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in .env.local");
  process.exit(1);
}

async function seedProducts() {
  console.log("==================================================");
  console.log("🍽️  রেস্টুরেন্ট ডেমো পণ্য ও ক্যাটাগরি তৈরি প্রক্রিয়া");
  console.log("==================================================");
  console.log("📡 MongoDB Atlas সংযোগ স্থাপন করা হচ্ছে...");
  
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB_NAME });
  const db = mongoose.connection.db;
  console.log(`✅ MongoDB সংযুক্ত: ${db.databaseName}\n`);

  // 1. Categories
  console.log("⏳ ১. ক্যাটাগরি ডাটা তৈরি করা হচ্ছে...");
  await db.collection("categories").deleteMany({});

  const categoriesData = [
    { nameBn: "বিরিয়ানি ও পোলাও", nameEn: "Biryani & Polao", icon: "Utensils", sortOrder: 1, active: true },
    { nameBn: "বার্গার ও স্যান্ডউইচ", nameEn: "Burgers & Sandwiches", icon: "Sandwich", sortOrder: 2, active: true },
    { nameBn: "পিজ্জা", nameEn: "Pizza", icon: "Pizza", sortOrder: 3, active: true },
    { nameBn: "ফ্রাইড চিকেন ও স্ন্যাক্স", nameEn: "Fried Chicken & Snacks", icon: "Drumstick", sortOrder: 4, active: true },
    { nameBn: "কাবাব ও গ্রিল", nameEn: "Kebab & Grill", icon: "Flame", sortOrder: 5, active: true },
    { nameBn: "চাইনিজ ও পাস্তা", nameEn: "Chinese & Pasta", icon: "Bowl", sortOrder: 6, active: true },
    { nameBn: "স্যুপ ও অ্যাপেটাইজার", nameEn: "Soup & Appetizers", icon: "Coffee", sortOrder: 7, active: true },
    { nameBn: "ডেজার্ট ও মিষ্টি", nameEn: "Desserts & Sweets", icon: "Cake", sortOrder: 8, active: true },
    { nameBn: "ঠান্ডা ও গরম পানীয়", nameEn: "Beverages & Drinks", icon: "CupSoda", sortOrder: 9, active: true },
  ];

  const catResult = await db.collection("categories").insertMany(
    categoriesData.map(c => ({ ...c, createdAt: new Date(), updatedAt: new Date() }))
  );
  console.log(`✅ ${catResult.insertedCount} টি ক্যাটাগরি সফলভাবে তৈরি হয়েছে।`);

  const catMap = {};
  categoriesData.forEach((c, idx) => {
    catMap[c.nameBn] = catResult.insertedIds[idx];
  });

  // 2. Inventory Items (Raw Materials)
  console.log("\n⏳ ২. প্রয়োজনীয় ইনভেন্টরি কাঁচামাল তৈরি করা হচ্ছে...");
  await db.collection("inventoryitems").deleteMany({});

  const inventoryData = [
    { nameBn: "বাসমতী চাল", nameEn: "Basmati Rice", category: "চাল ও শস্য", unit: "kg", currentStock: 100, minimumStock: 25, averageCost: 120, active: true },
    { nameBn: "পোলাও চাল (চিনschemaগুঁড়া)", nameEn: "Chinigura Rice", category: "চাল ও শস্য", unit: "kg", currentStock: 80, minimumStock: 20, averageCost: 110, active: true },
    { nameBn: "চিকেন ব্রয়লার", nameEn: "Chicken Broiler", category: "মাংস", unit: "kg", currentStock: 60, minimumStock: 20, averageCost: 185, active: true },
    { nameBn: "খাসির মাংস (মাটন)", nameEn: "Mutton", category: "মাংস", unit: "kg", currentStock: 35, minimumStock: 12, averageCost: 980, active: true },
    { nameBn: "গরুর মাংস (বিফ)", nameEn: "Beef", category: "মাংস", unit: "kg", currentStock: 50, minimumStock: 15, averageCost: 750, active: true },
    { nameBn: "বার্গার বান", nameEn: "Burger Bun", category: "বেকারি", unit: "pcs", currentStock: 120, minimumStock: 40, averageCost: 16, active: true },
    { nameBn: "চিজ স্লাইস", nameEn: "Cheese Slice", category: "দুগ্ধজাত", unit: "pcs", currentStock: 200, minimumStock: 50, averageCost: 22, active: true },
    { nameBn: "মোজারেলা চিজ", nameEn: "Mozzarella Cheese", category: "দুগ্ধজাত", unit: "kg", currentStock: 18, minimumStock: 6, averageCost: 880, active: true },
    { nameBn: "পিজ্জা ফ্লাওয়ার / ডো", nameEn: "Pizza Flour / Dough", category: "বেকারি", unit: "kg", currentStock: 30, minimumStock: 10, averageCost: 75, active: true },
    { nameBn: "ঘি (খাঁটি গাওয়া)", nameEn: "Pure Ghee", category: "মসলা ও ফ্যাট", unit: "kg", currentStock: 15, minimumStock: 5, averageCost: 1250, active: true },
    { nameBn: "সরিষার তেল", nameEn: "Mustard Oil", category: "তেল", unit: "liter", currentStock: 25, minimumStock: 10, averageCost: 280, active: true },
    { nameBn: "সয়াবিন তেল", nameEn: "Soybean Oil", category: "তেল", unit: "liter", currentStock: 50, minimumStock: 15, averageCost: 175, active: true },
    { nameBn: "আলু", nameEn: "Potato", category: "সবজি", unit: "kg", currentStock: 70, minimumStock: 25, averageCost: 45, active: true },
    { nameBn: "পেঁয়াজ", nameEn: "Onion", category: "সবজি", unit: "kg", currentStock: 50, minimumStock: 20, averageCost: 70, active: true },
    { nameBn: "টক দই", nameEn: "Sour Curd", category: "দুগ্ধজাত", unit: "kg", currentStock: 20, minimumStock: 8, averageCost: 90, active: true },
    { nameBn: "তরল দুধ", nameEn: "Liquid Milk", category: "দুগ্ধজাত", unit: "liter", currentStock: 30, minimumStock: 10, averageCost: 85, active: true },
    { nameBn: "কোকাকোলা ক্যান ২৫০ মিলি", nameEn: "Coca-Cola Can 250ml", category: "পানীয়", unit: "pcs", currentStock: 150, minimumStock: 40, averageCost: 32, active: true },
    { nameBn: "স্প্রাইট ক্যান ২৫০ মিলি", nameEn: "Sprite Can 250ml", category: "পানীয়", unit: "pcs", currentStock: 100, minimumStock: 30, averageCost: 32, active: true },
    { nameBn: "ফ্রেঞ্চ ফ্রাইজ প্যাক (ফ্রোজেন)", nameEn: "Frozen French Fries", category: "স্ন্যাক্স", unit: "kg", currentStock: 25, minimumStock: 8, averageCost: 180, active: true },
    { nameBn: "পেন্নে পাস্তা", nameEn: "Penne Pasta", category: "পাস্তা", unit: "kg", currentStock: 20, minimumStock: 5, averageCost: 160, active: true },
  ];

  const invResult = await db.collection("inventoryitems").insertMany(
    inventoryData.map(i => ({ ...i, createdAt: new Date(), updatedAt: new Date() }))
  );
  console.log(`✅ ${invResult.insertedCount} টি ইনভেন্টরি কাঁচামাল তৈরি হয়েছে।`);

  const invMap = {};
  inventoryData.forEach((item, idx) => {
    invMap[item.nameBn] = invResult.insertedIds[idx];
  });

  // 3. Menu Items (Demo Products)
  console.log("\n⏳ ৩. ডেমো মেনু আইটেম (পণ্য) ডাটাবেসে যোগ করা হচ্ছে...");
  await db.collection("menuitems").deleteMany({});

  const menuItems = [
    // --- বিরিয়ানি ও পোলাও ---
    {
      nameBn: "কাচ্চি বিরিয়ানি (বাসমতী)",
      nameEn: "Kacchi Biryani (Basmati)",
      categoryId: catMap["বিরিয়ানি ও পোলাও"],
      categoryName: "বিরিয়ানি ও পোলাও",
      description: "খাঁটি গাওয়া ঘি ও বাসমতী চাল দিয়ে রান্না করা প্রিমিয়াম মাটন কাচ্চি বিরিয়ানি সাথে আলু ও ডিম।",
      image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80",
      basePrice: 380,
      costPrice: 220,
      hasVariants: true,
      variants: [
        { nameBn: "১:১ রেগুলার (১ পিস মাটন)", nameEn: "1:1 Regular (1 pc Mutton)", price: 380, costPrice: 220 },
        { nameBn: "১:২ স্পেশাল (২ পিস মাটন)", nameEn: "1:2 Special (2 pcs Mutton)", price: 720, costPrice: 410 },
        { nameBn: "১:৪ ফ্যামিলি প্যাক", nameEn: "1:4 Family Pack", price: 1400, costPrice: 790 },
      ],
      addOns: [
        { nameBn: "এক্সট্রা বোরহানি (২৫০ মি.লি.)", nameEn: "Extra Borhani (250ml)", price: 50 },
        { nameBn: "জালি কাবাব (১ পিস)", nameEn: "Jali Kebab (1 pc)", price: 70 },
        { nameBn: "এক্সট্রা রোস্টেড আলু", nameEn: "Extra Roasted Potato", price: 30 },
      ],
      availability: true,
      active: true,
    },
    {
      nameBn: "চিকেন দম বিরিয়ানি",
      nameEn: "Chicken Dum Biryani",
      categoryId: catMap["বিরিয়ানি ও পোলাও"],
      categoryName: "বিরিয়ানি ও পোলাও",
      description: "সুগন্ধি চাল ও স্পেশাল মসলায় সেদ্ধ রসালো চিকেন পিস সহ ঐতিহ্যবাহী বিরিয়ানি।",
      image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&auto=format&fit=crop&q=80",
      basePrice: 260,
      costPrice: 140,
      hasVariants: true,
      variants: [
        { nameBn: "১:১ হাফ", nameEn: "1:1 Half", price: 260, costPrice: 140 },
        { nameBn: "১:২ ফুল", nameEn: "1:2 Full", price: 490, costPrice: 260 },
      ],
      addOns: [
        { nameBn: "সেদ্ধ ডিম (১ পিস)", nameEn: "Boiled Egg (1 pc)", price: 20 },
        { nameBn: "এক্সট্রা শসা-পেঁয়াজ সালাদ", nameEn: "Extra Cucumber Salad", price: 15 },
      ],
      availability: true,
      active: true,
    },
    {
      nameBn: "বিফ তেহারি (সরিষার তেল)",
      nameEn: "Beef Tehari (Mustard Oil)",
      categoryId: catMap["বিরিয়ানি ও পোলাও"],
      categoryName: "বিরিয়ানি ও পোলাও",
      description: "খাঁটি সরিষার তেলে ছোট ছোট নরম বিফ কিউব ও চিনিগুঁড়া চাল দিয়ে রান্না পুরান ঢাকার স্পেশাল তেহারি।",
      image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=600&auto=format&fit=crop&q=80",
      basePrice: 250,
      costPrice: 135,
      hasVariants: true,
      variants: [
        { nameBn: "১:১ রেগুলার", nameEn: "1:1 Regular", price: 250, costPrice: 135 },
        { nameBn: "১:২ ডাবল", nameEn: "1:2 Double", price: 480, costPrice: 250 },
      ],
      addOns: [
        { nameBn: "কাঁচামরিচ ও সালাদ", nameEn: "Green Chili Salad", price: 10 },
        { nameBn: "বোরহানি", nameEn: "Borhani", price: 50 },
      ],
      availability: true,
      active: true,
    },
    {
      nameBn: "মোরগ পোলাও (দেশি স্টাইল)",
      nameEn: "Morog Polao (Deshi Style)",
      categoryId: catMap["বিরিয়ানি ও পোলাও"],
      categoryName: "বিরিয়ানি ও পোলাও",
      description: "ঘিয়ে ভাজা সুবাসিত চিনিগুঁড়া চালের পোলাও সাথে ঐতিহ্যবাহী স্বাদের মোরগ রোস্ট ও ডিম।",
      image: "https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=600&auto=format&fit=crop&q=80",
      basePrice: 280,
      costPrice: 150,
      hasVariants: false,
      variants: [],
      addOns: [
        { nameBn: "এক্সট্রা রোস্ট গ্রেভি", nameEn: "Extra Roast Gravy", price: 30 },
        { nameBn: "শামী কাবাব", nameEn: "Shami Kebab", price: 60 },
      ],
      availability: true,
      active: true,
    },

    // --- বার্গার ও স্যান্ডউইচ ---
    {
      nameBn: "ক্লাসিক বিফ চিজ বার্গার",
      nameEn: "Classic Beef Cheese Burger",
      categoryId: catMap["বার্গার ও স্যান্ডউইচ"],
      categoryName: "বার্গার ও স্যান্ডউইচ",
      description: "১০০% ফ্রেশ বিফ প্যাটি, মেল্টেড চেডার চিজ, তাজা লেটুস, টমেটো ও সিক্রেট সস।",
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
      basePrice: 260,
      costPrice: 130,
      hasVariants: true,
      variants: [
        { nameBn: "সিঙ্গেল প্যাটি", nameEn: "Single Patty", price: 260, costPrice: 130 },
        { nameBn: "ডাবল প্যাটি চিজ ব্লাস্ট", nameEn: "Double Patty Cheese Blast", price: 370, costPrice: 195 },
      ],
      addOns: [
        { nameBn: "এক্সট্রা চিজ স্লাইস", nameEn: "Extra Cheese Slice", price: 30 },
        { nameBn: "ফ্রেঞ্চ ফ্রাইজ বাস্কেট", nameEn: "French Fries Basket", price: 60 },
        { nameBn: "স্মোকি বিবিকিউ সস", nameEn: "Smoky BBQ Sauce", price: 20 },
      ],
      availability: true,
      active: true,
    },
    {
      nameBn: "ক্রিস্পি চিকেন বার্গার",
      nameEn: "Crispy Chicken Burger",
      categoryId: catMap["বার্গার ও স্যান্ডউইচ"],
      categoryName: "বার্গার ও স্যান্ডউইচ",
      description: "গোল্ডেন ক্রিস্পি ফ্রাইড চিকেন ব্রেস্ট প্যাটি, ক্রাঞ্চি আইসবার্গ লেটুস ও গার্লিক মেয়োনিজ।",
      image: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=600&auto=format&fit=crop&q=80",
      basePrice: 220,
      costPrice: 105,
      hasVariants: true,
      variants: [
        { nameBn: "রেগুলার ক্রিস্পি", nameEn: "Regular Crispy", price: 220, costPrice: 105 },
        { nameBn: "স্পাইসি মেক্সিকান", nameEn: "Spicy Mexican", price: 250, costPrice: 120 },
      ],
      addOns: [
        { nameBn: "এক্সট্রা চিজ", nameEn: "Extra Cheese", price: 30 },
        { nameBn: "জালাপেনো পিপার", nameEn: "Jalapeno Pepper", price: 25 },
      ],
      availability: true,
      active: true,
    },
    {
      nameBn: "ক্লাব স্যান্ডউইচ (ফ্রাইজ সহ)",
      nameEn: "Club Sandwich with Fries",
      categoryId: catMap["বার্গার ও স্যান্ডউইচ"],
      categoryName: "বার্গার ও স্যান্ডউইচ",
      description: "৩ স্তরের টোস্টেড পাউরুটিতে চিকেন, ডিম, চিজ, শসা ও মেয়োনিজ সাথে মচমচে ফ্রেঞ্চ ফ্রাইজ।",
      image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80",
      basePrice: 240,
      costPrice: 110,
      hasVariants: false,
      variants: [],
      addOns: [
        { nameBn: "এক্সট্রা চিজ", nameEn: "Extra Cheese", price: 30 },
        { nameBn: "গার্লিক ডিপ", nameEn: "Garlic Dip", price: 25 },
      ],
      availability: true,
      active: true,
    },

    // --- পিজ্জা ---
    {
      nameBn: "চিকেন পেপারনি পিজ্জা",
      nameEn: "Chicken Pepperoni Pizza",
      categoryId: catMap["পিজ্জা"],
      categoryName: "পিজ্জা",
      description: "ইতালিয়ান সস, প্রিমিয়াম মোজারেলা চিজ ও স্পাইসি চিকেন পেপারনি স্লাইসের সুস্বাদু সমাহার।",
      image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&auto=format&fit=crop&q=80",
      basePrice: 520,
      costPrice: 260,
      hasVariants: true,
      variants: [
        { nameBn: '৮ ইঞ্চি রেগুলার', nameEn: '8" Regular', price: 370, costPrice: 180 },
        { nameBn: '১০ ইঞ্চি মিডিয়াম', nameEn: '10" Medium', price: 520, costPrice: 260 },
        { nameBn: '১২ ইঞ্চি লার্জ', nameEn: '12" Large', price: 760, costPrice: 380 },
      ],
      addOns: [
        { nameBn: "চিজ বাস্ট ক্রাস্ট", nameEn: "Cheese Burst Crust", price: 90 },
        { nameBn: "ব্ল্যাক অলিভ ও মাশরুম", nameEn: "Black Olive & Mushroom", price: 45 },
      ],
      availability: true,
      active: true,
    },
    {
      nameBn: "বিফ বিবিকিউ পিজ্জা",
      nameEn: "Beef BBQ Pizza",
      categoryId: catMap["পিজ্জা"],
      categoryName: "পিজ্জা",
      description: "স্মোকি বিবিকিউ বিফ কিমা, অনিয়ন রিং, গ্রিন ক্যাপসিকাম ও লোডেড মোজারেলা চিজ।",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80",
      basePrice: 560,
      costPrice: 280,
      hasVariants: true,
      variants: [
        { nameBn: '৮ ইঞ্চি রেগুলার', nameEn: '8" Regular', price: 410, costPrice: 200 },
        { nameBn: '১০ ইঞ্চি মিডিয়াম', nameEn: '10" Medium', price: 560, costPrice: 280 },
        { nameBn: '১২ ইঞ্চি লার্জ', nameEn: '12" Large', price: 820, costPrice: 410 },
      ],
      addOns: [
        { nameBn: "এক্সট্রা মোজারেলা চিজ", nameEn: "Extra Mozzarella", price: 80 },
        { nameBn: "স্পাইসি সস ডিপ", nameEn: "Spicy Sauce Dip", price: 30 },
      ],
      availability: true,
      active: true,
    },
    {
      nameBn: "ফোর চিজ মার্গারিটা পিজ্জা",
      nameEn: "Four Cheese Margherita Pizza",
      categoryId: catMap["পিজ্জা"],
      categoryName: "পিজ্জা",
      description: "মোজারেলা, চেডার, পারমেসান ও রিকোটা চিজের ক্রিমি সুস্বাদু ইতালিয়ান মার্গারিটা পিজ্জা।",
      image: "https://images.unsplash.com/photo-1573821663912-569905455b1a?w=600&auto=format&fit=crop&q=80",
      basePrice: 480,
      costPrice: 240,
      hasVariants: true,
      variants: [
        { nameBn: '৮ ইঞ্চি রেগুলার', nameEn: '8" Regular', price: 350, costPrice: 175 },
        { nameBn: '১০ ইঞ্চি মিডিয়াম', nameEn: '10" Medium', price: 480, costPrice: 240 },
        { nameBn: '১২ ইঞ্চি লার্জ', nameEn: '12" Large', price: 720, costPrice: 360 },
      ],
      addOns: [
        { nameBn: "ড্রাইড ওরেগানো ও চিলি ফ্লেক্স", nameEn: "Oregano & Chili Flakes", price: 15 },
      ],
      availability: true,
      active: true,
    },

    // --- ফ্রাইড চিকেন ও স্ন্যাক্স ---
    {
      nameBn: "ক্রিস্পি ফ্রাইড চিকেন",
      nameEn: "Crispy Fried Chicken",
      categoryId: catMap["ফ্রাইড চিকেন ও স্ন্যাক্স"],
      categoryName: "ফ্রাইড চিকেন ও স্ন্যাক্স",
      description: "সিক্রেট ১২ হার্বস ও মসলায় মেরিনেট করা গোল্ডেন ক্রিস্পি ও রসালো ফ্রাইড চিকেন।",
      image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop&q=80",
      basePrice: 180,
      costPrice: 90,
      hasVariants: true,
      variants: [
        { nameBn: "২ পিস প্যাক", nameEn: "2 Pcs Pack", price: 180, costPrice: 90 },
        { nameBn: "৪ পিস প্যাক", nameEn: "4 Pcs Pack", price: 340, costPrice: 170 },
        { nameBn: "৮ পিস বাকেট", nameEn: "8 Pcs Bucket", price: 650, costPrice: 320 },
      ],
      addOns: [
        { nameBn: "গার্লিক মেয়োনিজ সস", nameEn: "Garlic Mayo Sauce", price: 30 },
        { nameBn: "হট চিলি সস ডিপ", nameEn: "Hot Chili Sauce Dip", price: 25 },
        { nameBn: "বান (১ পিস)", nameEn: "Bun (1 pc)", price: 20 },
      ],
      availability: true,
      active: true,
    },
    {
      nameBn: "পেরি পেরি ফ্রেঞ্চ ফ্রাইজ",
      nameEn: "Peri Peri French Fries",
      categoryId: catMap["ফ্রাইড চিকেন ও স্ন্যাক্স"],
      categoryName: "ফ্রাইড চিকেন ও স্ন্যাক্স",
      description: "গরম গরম গোল্ডেন ক্রাঞ্চি আলু ভাজা ও ঝাল-টক পেরি পেরি মসলার মেলবন্ধন।",
      image: "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&auto=format&fit=crop&q=80",
      basePrice: 140,
      costPrice: 50,
      hasVariants: true,
      variants: [
        { nameBn: "রেগুলার", nameEn: "Regular", price: 140, costPrice: 50 },
        { nameBn: "লার্জ জাম্বো", nameEn: "Large Jumbo", price: 200, costPrice: 70 },
      ],
      addOns: [
        { nameBn: "চিজ সস টপিং", nameEn: "Cheese Sauce Topping", price: 40 },
        { nameBn: "হানি মাস্টার্ড ডিপ", nameEn: "Honey Mustard Dip", price: 30 },
      ],
      availability: true,
      active: true,
    },
    {
      nameBn: "হট অ্যান্ড স্পাইসি চিকেন উইংস",
      nameEn: "Hot & Spicy Chicken Wings",
      categoryId: catMap["ফ্রাইড চিকেন ও স্ন্যাক্স"],
      categoryName: "ফ্রাইড চিকেন ও স্ন্যাক্স",
      description: "টপিং স্পাইসি বিবিকিউ সসে গ্লেজ করা মুচমুচে ও রসালো উইংস।",
      image: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&auto=format&fit=crop&q=80",
      basePrice: 240,
      costPrice: 115,
      hasVariants: true,
      variants: [
        { nameBn: "৬ পিস", nameEn: "6 Pieces", price: 240, costPrice: 115 },
        { nameBn: "১২ পিস ফ্যামিলি প্যাক", nameEn: "12 Pieces Family Pack", price: 440, costPrice: 210 },
      ],
      addOns: [
        { nameBn: "ব্লু চিজ সস", nameEn: "Blue Cheese Dip", price: 35 },
      ],
      availability: true,
      active: true,
    },

    // --- কাবাব ও গ্রিল ---
    {
      nameBn: "চিকেন টিক্কা কাবাব (তন্দুরি)",
      nameEn: "Chicken Tikka Kebab (Tandoori)",
      categoryId: catMap["কাবাব ও গ্রিল"],
      categoryName: "কাবাব ও গ্রিল",
      description: "দই ও স্পেশাল তন্দুরি মসলায় মেরিনেট করা কাঠকয়লার আগুনে পোড়ানো সুস্বাদু টিক্কা (৬ পিস)।",
      image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80",
      basePrice: 270,
      costPrice: 135,
      hasVariants: false,
      variants: [],
      addOns: [
        { nameBn: "বাটার নান (১ পিস)", nameEn: "Butter Naan (1 pc)", price: 45 },
        { nameBn: "পুদিনা চাটনি", nameEn: "Mint Chutney", price: 20 },
      ],
      availability: true,
      active: true,
    },
    {
      nameBn: "বিফ শিক কাবাব",
      nameEn: "Beef Seekh Kebab",
      categoryId: catMap["কাবাব ও গ্রিল"],
      categoryName: "কাবাব ও গ্রিল",
      description: "মশলাদার বিফ কিমায় তৈরি কয়লায় ঝলসে নেওয়া নরম ও জুসি শিক কাবাব।",
      image: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=600&auto=format&fit=crop&q=80",
      basePrice: 260,
      costPrice: 130,
      hasVariants: false,
      variants: [],
      addOns: [
        { nameBn: "স্পেশাল পরোটা", nameEn: "Special Paratha", price: 35 },
        { nameBn: "কাঁচামরিচ পেঁয়াজ সালাদ", nameEn: "Chili Onion Salad", price: 15 },
      ],
      availability: true,
      active: true,
    },
    {
      nameBn: "গ্রিল চিকেন (কোয়ার্টার / ফুল)",
      nameEn: "Grilled Chicken (Quarter / Full)",
      categoryId: catMap["কাবাব ও গ্রিল"],
      categoryName: "কাবাব ও গ্রিল",
      description: "রোলিং গ্রিল মেশিনে ভাজা সুস্বাদু গ্রিল চিকেন সাথে মেয়োনিজ ও সালাদ।",
      image: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=600&auto=format&fit=crop&q=80",
      basePrice: 130,
      costPrice: 65,
      hasVariants: true,
      variants: [
        { nameBn: "১/৪ কোয়ার্টার পিস", nameEn: "1/4 Quarter Piece", price: 130, costPrice: 65 },
        { nameBn: "১/২ হাফ পিস", nameEn: "1/2 Half Piece", price: 250, costPrice: 125 },
        { nameBn: "১:১ সম্পূর্ণ চিকেন", nameEn: "1:1 Full Chicken", price: 480, costPrice: 240 },
      ],
      addOns: [
        { nameBn: "রুমালি রুটি (২ পিস)", nameEn: "Rumali Roti (2 pcs)", price: 40 },
        { nameBn: "গার্লিক সস", nameEn: "Garlic Sauce", price: 25 },
      ],
      availability: true,
      active: true,
    },

    // --- চাইনিজ ও পাস্তা ---
    {
      nameBn: "হোয়াইট সস ক্রিমি পাস্তা",
      nameEn: "White Sauce Creamy Pasta",
      categoryId: catMap["চাইনিজ ও পাস্তা"],
      categoryName: "চাইনিজ ও পাস্তা",
      description: "সমৃদ্ধ আলফ্রেডো ক্রিমি সসে রান্না করা পেন্নে পাস্তা সাথে ফ্রেশ মাশরুম, চিকেন কিউব ও চিজ।",
      image: "https://images.unsplash.com/photo-1621996346565-e3d5d6281728?w=600&auto=format&fit=crop&q=80",
      basePrice: 300,
      costPrice: 145,
      hasVariants: false,
      variants: [],
      addOns: [
        { nameBn: "এক্সট্রা চিজ টপিং", nameEn: "Extra Cheese Topping", price: 50 },
        { nameBn: "গার্লিক ব্রেড (২ পিস)", nameEn: "Garlic Bread (2 pcs)", price: 60 },
      ],
      availability: true,
      active: true,
    },
    {
      nameBn: "চিকেন চাউমিন (হাক্কা স্টাইল)",
      nameEn: "Chicken Chowmein (Hakka Style)",
      categoryId: catMap["চাইনিজ ও পাস্তা"],
      categoryName: "চাইনিজ ও পাস্তা",
      description: "চিকেন কুচি, বাঁধাকপি, গাজর, ক্যাপসিকাম ও চাইনিজ সসে হাই ফ্লেমে নাড়াচাড়া করা চাউমিন।",
      image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&auto=format&fit=crop&q=80",
      basePrice: 240,
      costPrice: 110,
      hasVariants: true,
      variants: [
        { nameBn: "১:১ সিঙ্গেল", nameEn: "1:1 Single", price: 240, costPrice: 110 },
        { nameBn: "১:৩ ফ্যামিলি", nameEn: "1:3 Family", price: 580, costPrice: 270 },
      ],
      addOns: [
        { nameBn: "এক্সট্রা ডিম ভাজা", nameEn: "Extra Fried Egg", price: 25 },
      ],
      availability: true,
      active: true,
    },
    {
      nameBn: "চিকেন ফ্রাইড রাইস ও চিলি চিকেন কম্বো",
      nameEn: "Chicken Fried Rice & Chili Chicken Combo",
      categoryId: catMap["চাইনিজ ও পাস্তা"],
      categoryName: "চাইনিজ ও পাস্তা",
      description: "ডিম ও সবজি দিয়ে তৈরি চাইনিজ ফ্রাইড রাইস সাথে স্পাইসি চিলি চিকেন কারি ও সালাদ।",
      image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=80",
      basePrice: 320,
      costPrice: 160,
      hasVariants: false,
      variants: [],
      addOns: [
        { nameBn: "ফ্রাইড ওনথন (২ পিস)", nameEn: "Fried Wonton (2 pcs)", price: 50 },
        { nameBn: "কোকাকোলা ক্যান", nameEn: "Coca-Cola Can", price: 45 },
      ],
      availability: true,
      active: true,
    },

    // --- স্যুপ ও অ্যাপেটাইজার ---
    {
      nameBn: "স্পেশাল থাই থিক স্যুপ",
      nameEn: "Special Thai Thick Soup",
      categoryId: catMap["স্যুপ ও অ্যাপেটাইজার"],
      categoryName: "স্যুপ ও অ্যাপেটাইজার",
      description: "লেমনগ্রাস, থাই পাতা ও আদার সুবাসযুক্ত ঐতিহ্যবাহী স্যুপ সাথে চিকেন ও প্রন।",
      image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&auto=format&fit=crop&q=80",
      basePrice: 190,
      costPrice: 85,
      hasVariants: true,
      variants: [
        { nameBn: "১:১ বাউল", nameEn: "1:1 Bowl", price: 190, costPrice: 85 },
        { nameBn: "১:৩ ফ্যামিলি বাউল", nameEn: "1:3 Family Bowl", price: 490, costPrice: 220 },
      ],
      addOns: [
        { nameBn: "ক্রিস্পি ওনথন (৪ পিস)", nameEn: "Crispy Wonton (4 pcs)", price: 70 },
      ],
      availability: true,
      active: true,
    },
    {
      nameBn: "চিকেন কর্ন স্যুপ",
      nameEn: "Chicken Corn Soup",
      categoryId: catMap["স্যুপ ও অ্যাপেটাইজার"],
      categoryName: "স্যুপ ও অ্যাপেটাইজার",
      description: "সুইট কর্ন, ডিমের ফিতার মতো আস্তরণ ও চিকেন শ্রেড সহ ক্লাসিক পুষ্টিকর হালকা স্যুপ।",
      image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&auto=format&fit=crop&q=80",
      basePrice: 170,
      costPrice: 70,
      hasVariants: true,
      variants: [
        { nameBn: "১:১ বাউল", nameEn: "1:1 Bowl", price: 170, costPrice: 70 },
        { nameBn: "১:৩ ফ্যামিলি বাউল", nameEn: "1:3 Family Bowl", price: 440, costPrice: 190 },
      ],
      addOns: [
        { nameBn: "চিলি ভিনেগার ও সস", nameEn: "Chili Vinegar & Sauce", price: 15 },
      ],
      availability: true,
      active: true,
    },

    // --- ডেজার্ট ও মিষ্টি ---
    {
      nameBn: "রয়েল ফালুদা (আইসক্রিম সহ)",
      nameEn: "Royal Falooda with Ice Cream",
      categoryId: catMap["ডেজার্ট ও মিষ্টি"],
      categoryName: "ডেজার্ট ও মিষ্টি",
      description: "ঘন দুধ, রুহ আফজা, নুডুলস, তোকমা দানা, কলা, আপেল ও প্রিমিয়াম ভ্যানিলা আইসক্রিম।",
      image: "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=600&auto=format&fit=crop&q=80",
      basePrice: 160,
      costPrice: 75,
      hasVariants: true,
      variants: [
        { nameBn: "রেগুলার ফালুদা", nameEn: "Regular Falooda", price: 160, costPrice: 75 },
        { nameBn: "স্পেশাল ড্রাই ফ্রুটস ফালুদা", nameEn: "Special Dry Fruits Falooda", price: 210, costPrice: 100 },
      ],
      addOns: [
        { nameBn: "এক্সট্রা স্কুপ আইসক্রিম", nameEn: "Extra Scoop Ice Cream", price: 40 },
        { nameBn: "কাজুবাদাম ও পেস্তা কুচি", nameEn: "Almond & Pista Flakes", price: 30 },
      ],
      availability: true,
      active: true,
    },
    {
      nameBn: "গরম রসালো গুলাব জামুন (২ পিস)",
      nameEn: "Hot Juicy Gulab Jamun (2 pcs)",
      categoryId: catMap["ডেজার্ট ও মিষ্টি"],
      categoryName: "ডেজার্ট ও মিষ্টি",
      description: "ঘিয়ে ভাজা ছানার তৈরি গরম গরম এলাচ সুবাসিত মিষ্টি গুলাব জামুন।",
      image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
      basePrice: 80,
      costPrice: 35,
      hasVariants: false,
      variants: [],
      addOns: [
        { nameBn: "ভ্যানিলা আইসক্রিম স্কুপ", nameEn: "Vanilla Ice Cream Scoop", price: 40 },
      ],
      availability: true,
      active: true,
    },

    // --- ঠান্ডা ও গরম পানীয় ---
    {
      nameBn: "স্পেশাল নবাবী বোরহানি",
      nameEn: "Special Nawabi Borhani",
      categoryId: catMap["ঠান্ডা ও গরম পানীয়"],
      categoryName: "ঠান্ডা ও গরম পানীয়",
      description: "টক দই, পুদিনা পাতা, ধনেপাতা, বিট লবণ ও শাহী মসলায় তৈরি হজমকারক ঐতিহ্যবাহী পানীয়।",
      image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80",
      basePrice: 60,
      costPrice: 25,
      hasVariants: true,
      variants: [
        { nameBn: "২৫০ মিলি গ্লাস", nameEn: "250ml Glass", price: 60, costPrice: 25 },
        { nameBn: "১ লিটার ফ্যামিলি বোতল", nameEn: "1 Liter Family Bottle", price: 220, costPrice: 90 },
      ],
      addOns: [],
      availability: true,
      active: true,
    },
    {
      nameBn: "ম্যাংগো স্মুদি / লাচ্ছি",
      nameEn: "Mango Smoothie / Lassi",
      categoryId: catMap["ঠান্ডা ও গরম পানীয়"],
      categoryName: "ঠান্ডা ও গরম পানীয়",
      description: "তাজা মিষ্টি আমের পাল্প ও মিষ্টি ঘন দইয়ের ব্লেন্ডেড রিফ্রেশিং ড্রিংক।",
      image: "https://images.unsplash.com/photo-1546173159-315724a31696?w=600&auto=format&fit=crop&q=80",
      basePrice: 120,
      costPrice: 50,
      hasVariants: true,
      variants: [
        { nameBn: "সুইট দই লাচ্ছি", nameEn: "Sweet Yogurt Lassi", price: 90, costPrice: 40 },
        { nameBn: "স্পেশাল ম্যাংগো লাচ্ছি", nameEn: "Special Mango Lassi", price: 120, costPrice: 50 },
      ],
      addOns: [
        { nameBn: "চিয়া সিডস", nameEn: "Chia Seeds", price: 20 },
      ],
      availability: true,
      active: true,
    },
    {
      nameBn: "ক্যাপুচিনো কফি",
      nameEn: "Cappuccino Coffee",
      categoryId: catMap["ঠান্ডা ও গরম পানীয়"],
      categoryName: "ঠান্ডা ও গরম পানীয়",
      description: "সমৃদ্ধ ডার্ক রোস্টেড এসপ্রেসো শট ও মখমলের মতো দুধের ফোম সহ ক্লাসিক কফি।",
      image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&auto=format&fit=crop&q=80",
      basePrice: 140,
      costPrice: 45,
      hasVariants: true,
      variants: [
        { nameBn: "হট ক্যাপুচিনো", nameEn: "Hot Cappuccino", price: 140, costPrice: 45 },
        { nameBn: "আইসড কোল্ড কফি", nameEn: "Iced Cold Coffee", price: 160, costPrice: 55 },
      ],
      addOns: [
        { nameBn: "ক্যারামেল সিরাপ শট", nameEn: "Caramel Syrup Shot", price: 30 },
        { nameBn: "এক্সট্রা এসপ্রেসো শট", nameEn: "Extra Espresso Shot", price: 40 },
      ],
      availability: true,
      active: true,
    },
    {
      nameBn: "মালাই চা (মাটির ভাঁড়ে)",
      nameEn: "Malai Cha (Clay Pot)",
      categoryId: catMap["ঠান্ডা ও গরম পানীয়"],
      categoryName: "ঠান্ডা ও গরম পানীয়",
      description: "ঘন খাঁটি দুধের মালাই ও এলাচের সুগন্ধে ভরা ঐতিহ্যবাহী মাটির ভাঁড়ের স্পেশাল চা।",
      image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80",
      basePrice: 40,
      costPrice: 18,
      hasVariants: false,
      variants: [],
      addOns: [
        { nameBn: "এক্সট্রা মালাই", nameEn: "Extra Malai", price: 15 },
      ],
      availability: true,
      active: true,
    },
    {
      nameBn: "কোল্ড সফট ড্রিংকস (ক্যান ২৫০ মিলি)",
      nameEn: "Cold Soft Drinks (Can 250ml)",
      categoryId: catMap["ঠান্ডা ও গরম পানীয়"],
      categoryName: "ঠান্ডা ও গরম পানীয়",
      description: "ঠান্ডা রিফ্রেশিং কোমল পানীয় ক্যান।",
      image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80",
      basePrice: 45,
      costPrice: 32,
      hasVariants: true,
      variants: [
        { nameBn: "কোকাকোলা ২৫০ মি.লি.", nameEn: "Coca-Cola 250ml", price: 45, costPrice: 32 },
        { nameBn: "স্প্রাইট ২৫০ মি.লি.", nameEn: "Sprite 250ml", price: 45, costPrice: 32 },
      ],
      addOns: [],
      availability: true,
      active: true,
    },
  ];

  const menuResult = await db.collection("menuitems").insertMany(
    menuItems.map(m => ({ ...m, createdAt: new Date(), updatedAt: new Date() }))
  );
  console.log(`✅ ${menuResult.insertedCount} টি ডেমো মেনু পণ্য সফলভাবে ডাটাবেসে যোগ করা হয়েছে!`);

  // 4. Recipes (BOM) linking menu items to inventory items
  console.log("\n⏳ ৪. রেসিপি (Bill of Materials) তৈরি করা হচ্ছে...");
  await db.collection("recipes").deleteMany({});

  const kacchiBiryaniId = menuResult.insertedIds[0];
  const chickenBurgerId = menuResult.insertedIds[5];
  const chickenPizzaId = menuResult.insertedIds[7];

  const recipes = [
    {
      menuItemId: kacchiBiryaniId,
      menuItemNameBn: "কাচ্চি বিরিয়ানি (বাসমতী)",
      variantName: "১:১ রেগুলার (১ পিস মাটন)",
      ingredients: [
        { inventoryItemId: invMap["বাসমতী চাল"], quantity: 200, unit: "gram" },
        { inventoryItemId: invMap["খাসির মাংস (মাটন)"], quantity: 250, unit: "gram" },
        { inventoryItemId: invMap["ঘি (খাঁটি গাওয়া)"], quantity: 30, unit: "gram" },
        { inventoryItemId: invMap["আলু"], quantity: 100, unit: "gram" },
      ],
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      menuItemId: chickenBurgerId,
      menuItemNameBn: "ক্রিস্পি চিকেন বার্গার",
      variantName: "",
      ingredients: [
        { inventoryItemId: invMap["বার্গার বান"], quantity: 1, unit: "pcs" },
        { inventoryItemId: invMap["চিকেন ব্রয়লার"], quantity: 150, unit: "gram" },
        { inventoryItemId: invMap["চিজ স্লাইস"], quantity: 1, unit: "pcs" },
        { inventoryItemId: invMap["সয়াবিন তেল"], quantity: 30, unit: "ml" },
      ],
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      menuItemId: chickenPizzaId,
      menuItemNameBn: "চিকেন পেপারনি পিজ্জা",
      variantName: '১০ ইঞ্চি মিডিয়াম',
      ingredients: [
        { inventoryItemId: invMap["পিজ্জা ফ্লাওয়ার / ডো"], quantity: 250, unit: "gram" },
        { inventoryItemId: invMap["মোজারেলা চিজ"], quantity: 180, unit: "gram" },
        { inventoryItemId: invMap["চিকেন ব্রয়লার"], quantity: 120, unit: "gram" },
      ],
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  await db.collection("recipes").insertMany(recipes);
  console.log(`✅ ${recipes.length} টি রেসিপি সফলভাবে কনফিগার করা হয়েছে।`);

  // 5. Ensure Floors & Tables exist for POS Dine-In
  const tableCount = await db.collection("tables").countDocuments();
  if (tableCount === 0) {
    console.log("\n⏳ ৫. রেস্টুরেন্ট টেবিল ও ফ্লোর তৈরি করা হচ্ছে...");
    let floorDoc = await db.collection("floors").findOne({});
    if (!floorDoc) {
      const fRes = await db.collection("floors").insertOne({
        name: "Ground Floor",
        nameBn: "নিচতলা",
        sortOrder: 1,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      floorDoc = { _id: fRes.insertedId, name: "Ground Floor" };
    }

    const tables = [
      { tableNumber: "T-01", nameBn: "টেবিল ০১", floor: floorDoc.name, capacity: 4, status: "AVAILABLE", active: true, createdAt: new Date(), updatedAt: new Date() },
      { tableNumber: "T-02", nameBn: "টেবিল ০২", floor: floorDoc.name, capacity: 4, status: "AVAILABLE", active: true, createdAt: new Date(), updatedAt: new Date() },
      { tableNumber: "T-03", nameBn: "টেবিল ০৩", floor: floorDoc.name, capacity: 6, status: "AVAILABLE", active: true, createdAt: new Date(), updatedAt: new Date() },
      { tableNumber: "T-04", nameBn: "টেবিল ০৪", floor: floorDoc.name, capacity: 2, status: "AVAILABLE", active: true, createdAt: new Date(), updatedAt: new Date() },
      { tableNumber: "T-05", nameBn: "টেবিল ০৫", floor: floorDoc.name, capacity: 8, status: "AVAILABLE", active: true, createdAt: new Date(), updatedAt: new Date() },
    ];
    await db.collection("tables").insertMany(tables);
    console.log(`✅ ${tables.length} টি টেবিল সফলভাবে তৈরি হয়েছে।`);
  }

  console.log("\n==================================================");
  console.log("🎉 অভিনন্দন! ডেমো পণ্য ও ক্যাটাগরি তৈরি সফলভাবে সম্পন্ন হয়েছে!");
  console.log("==================================================");
  console.log(`📊 মোট ক্যাটাগরি: ${categoriesData.length} টি`);
  console.log(`🍗 মোট পণ্য (মেনু আইটেম): ${menuItems.length} টি`);
  console.log(`📦 মোট ইনভেন্টরি কাঁচামাল: ${inventoryData.length} টি`);
  console.log(`🍽️  মোট রেসিপি: ${recipes.length} টি`);
  console.log("==================================================\n");

  await mongoose.disconnect();
}

seedProducts().catch((err) => {
  console.error("❌ সিডিং প্রক্রিয়ায় ত্রুটি:", err);
  process.exit(1);
});
