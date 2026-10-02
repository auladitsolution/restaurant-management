import mongoose, { Schema, Model, Document } from "mongoose";
import { IRestaurantSettings } from "@/types";

export interface IRestaurantSettingsDocument extends Document, Omit<IRestaurantSettings, "_id"> {}

const RestaurantSettingsSchema = new Schema<IRestaurantSettingsDocument>(
  {
    name: { type: String, default: "Swad Restaurant" },
    nameBn: { type: String, default: "স্বাদ রেস্টুরেন্ট" },
    tagline: { type: String, default: "খাঁটি স্বাদের ঐতিহ্যবাহী রেস্টুরেন্ট" },
    logo: { type: String, default: "" },
    phone: { type: String, default: "01700000000" },
    email: { type: String, default: "info@swadrestaurant.com" },
    address: { type: String, default: "মিরপুর-১০, ঢাকা, বাংলাদেশ" },
    vatEnabled: { type: Boolean, default: false },
    vatRate: { type: Number, default: 5 },
    vatRegistrationNumber: { type: String, default: "" },
    serviceChargeEnabled: { type: Boolean, default: false },
    serviceChargeRate: { type: Number, default: 5 },
    receiptFooterMessage: { type: String, default: "Thank you for dining with us!" },
    receiptFooterMessageBn: {
      type: String,
      default: "আমাদের সাথে আহারের জন্য আপনাকে ধন্যবাদ! আবার আসবেন।",
    },
    currency: { type: String, default: "BDT" },
    currencySymbol: { type: String, default: "৳" },
    timezone: { type: String, default: "Asia/Dhaka" },
    invoicePrefix: { type: String, default: "INV-" },
    orderPrefix: { type: String, default: "ORD-" },
    features: {
      inventory: { type: Boolean, default: true },
      kitchenDisplay: { type: Boolean, default: true },
      purchaseManagement: { type: Boolean, default: true },
      expenseManagement: { type: Boolean, default: true },
      advancedReports: { type: Boolean, default: true },
      customerManagement: { type: Boolean, default: true },
      shiftManagement: { type: Boolean, default: true },
      autoIngredientDeduction: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export const RestaurantSettings: Model<IRestaurantSettingsDocument> =
  mongoose.models.RestaurantSettings ||
  mongoose.model<IRestaurantSettingsDocument>(
    "RestaurantSettings",
    RestaurantSettingsSchema
  );
