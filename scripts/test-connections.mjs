import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
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

async function testMongoDB() {
  console.log("\n==========================================");
  console.log("1. MONGODB ATLAS সংযোগ পরীক্ষা");
  console.log("==========================================");

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI অনুপস্থিত (.env.local এ পাওয়া যায়নি)");
    return { success: false, reason: "Missing MONGODB_URI" };
  }

  try {
    console.log("⏳ MongoDB ক্লাস্টারে সংযোগ স্থাপন করা হচ্ছে...");
    const conn = await mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB_NAME || "restaurant-db",
      serverSelectionTimeoutMS: 8000,
    });

    const adminDb = conn.connection.db.admin();
    const pingResult = await adminDb.ping();
    const collections = await conn.connection.db.listCollections().toArray();

    console.log("✅ MongoDB Atlas সফলভাবে সংযুক্ত হয়েছে!");
    console.log(`   - ডাটাবেস নাম: ${conn.connection.db.databaseName}`);
    console.log(`   - হোস্ট: ${conn.connection.host}`);
    console.log(`   - পিং রেসপন্স:`, pingResult);
    console.log(`   - বিদ্যমান কালেকশন সংখ্যা: ${collections.length} টি (${collections.map(c => c.name).join(", ") || "কোন কালেকশন নেই"})`);

    await mongoose.disconnect();
    return { success: true };
  } catch (err) {
    console.error("❌ MongoDB Atlas সংযোগ ব্যর্থ হয়েছে!");
    console.error("   ত্রুটি:", err.message);
    if (err.message.includes("IP") || err.message.includes("whitelist") || err.message.includes("ETIMEDOUT")) {
      console.error("   💡 টিপ: MongoDB Atlas এর Network Access এ গিয়ে IP Whitelist (0.0.0.0/0) সক্রিয় আছে কিনা যাচাই করুন।");
    }
    return { success: false, error: err.message };
  }
}

async function testFirebase() {
  console.log("\n==========================================");
  console.log("2. FIREBASE সংযোগ পরীক্ষা");
  console.log("==========================================");

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const adminProjectId = process.env.FIREBASE_PROJECT_ID;
  const adminClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const adminPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  console.log("🔹 Client SDK কনফিগারেশন:");
  console.log(`   - Project ID: ${projectId || "অনুপস্থিত"}`);
  console.log(`   - API Key: ${apiKey ? apiKey.substring(0, 10) + "..." : "অনুপস্থিত"}`);

  let clientValid = false;
  try {
    console.log("⏳ Firebase Authentication API যাচাই করা হচ্ছে...");
    // Ping Google Firebase Identity Toolkit endpoint with the API key
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        continueUri: "http://localhost",
        identifier: "test@example.com",
      }),
    });

    const data = await res.json();
    if (res.ok || (data && !data.error?.message?.includes("API_KEY_INVALID"))) {
      console.log("✅ Firebase Client API Key ও Auth সার্ভিস সক্রিয় ও কার্যকর!");
      clientValid = true;
    } else {
      console.error("❌ Firebase Client API Key ত্রুটিপূর্ণ বা অবৈধ:", data.error?.message);
    }
  } catch (err) {
    console.error("❌ Firebase API যাচাইকালে নেটওয়ার্ক সমস্যা:", err.message);
  }

  console.log("\n🔹 Firebase Admin SDK (সার্ভার-সাইড) কনফিগারেশন:");
  const isAdminPlaceholder = 
    !adminPrivateKey || 
    adminPrivateKey.includes("MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7...") ||
    adminProjectId === "your-restaurant-app" ||
    adminClientEmail?.includes("your-restaurant-app");

  if (isAdminPlaceholder) {
    console.log("⚠️ Firebase Admin SDK সার্ভিস অ্যাকাউন্ট এখনো প্লেসহোল্ডার রয়েছে:");
    console.log("   - FIREBASE_PROJECT_ID:", adminProjectId);
    console.log("   - FIREBASE_CLIENT_EMAIL:", adminClientEmail);
    console.log("   💡 দ্রষ্টব্য: লোকাল ডেভেলপমেন্টের জন্য আমরা মক টোকেন বাইপাস সক্রিয় রেখেছি। তবে প্রডাকশনে Firebase Console > Project Settings > Service Accounts থেকে সার্ভিস অ্যাকাউন্ট JSON কি জেনারেট করে .env.local এ বসাতে হবে।");
  } else {
    console.log("✅ Firebase Admin Credentials কনফিগার করা আছে।");
  }

  return { clientSuccess: clientValid, adminConfigured: !isAdminPlaceholder };
}

async function testCloudinary() {
  console.log("\n==========================================");
  console.log("3. CLOUDINARY সংযোগ পরীক্ষা");
  console.log("==========================================");

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.error("❌ Cloudinary ক্রেডেনশিয়াল অনুপস্থিত (.env.local এ পাওয়া যায়নি)");
    return { success: false, reason: "Missing credentials" };
  }

  console.log(`   - Cloud Name: ${cloudName}`);
  console.log(`   - API Key: ${apiKey.substring(0, 6)}...`);

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  try {
    console.log("⏳ Cloudinary API সার্ভারে পিং করা হচ্ছে...");
    const pingResult = await cloudinary.api.ping();
    console.log("✅ Cloudinary সফলভাবে সংযুক্ত ও কার্যকর!");
    console.log("   - পিং স্ট্যাটাস:", pingResult.status);

    // Test usage info
    try {
      const usage = await cloudinary.api.usage();
      console.log(`   - প্ল্যান: ${usage.plan}`);
      console.log(`   - স্টোরেজ ব্যবহার: ${(usage.storage?.used_percent || 0).toFixed(2)}%`);
    } catch {
      // Usage endpoint might require admin privileges; ping is sufficient
    }

    return { success: true };
  } catch (err) {
    console.error("❌ Cloudinary সংযোগ ব্যর্থ হয়েছে!");
    console.error("   ত্রুটি:", err.message);
    return { success: false, error: err.message };
  }
}

async function runAllTests() {
  console.log("==================================================");
  console.log("🚀 AULAD IT SOLUTION — সার্ভিস সংযোগ পরীক্ষা");
  console.log("==================================================");

  const mongoResult = await testMongoDB();
  const firebaseResult = await testFirebase();
  const cloudinaryResult = await testCloudinary();

  console.log("\n==================================================");
  console.log("📋 সামগ্রিক ফলাফল সারাংশ");
  console.log("==================================================");
  console.log(`1. MongoDB Atlas: ${mongoResult.success ? "✅ সক্রিয় ও সংযুক্ত" : "❌ সংযোগে ত্রুটি"}`);
  console.log(`2. Firebase Client: ${firebaseResult.clientSuccess ? "✅ সক্রিয় ও বৈধ" : "❌ ত্রুটিপূর্ণ"}`);
  console.log(`   Firebase Admin:  ${firebaseResult.adminConfigured ? "✅ কনফিগার করা" : "⚠️ প্লেসহোল্ডার (লোকাল মক সেশন সচল)"}`);
  console.log(`3. Cloudinary:    ${cloudinaryResult.success ? "✅ সক্রিয় ও সংযুক্ত" : "❌ সংযোগে ত্রুটি"}`);
  console.log("==================================================\n");

  process.exit(0);
}

runAllTests();
