import mongoose, { Schema, Model, Document } from "mongoose";
import { InventoryUnit } from "@/types";

export interface IInventoryItemDocument extends Document {
  nameBn: string;
  nameEn: string;
  category: string;
  unit: InventoryUnit;
  currentStock: number;
  minimumStock: number;
  averageCost: number;
  supplierId?: mongoose.Types.ObjectId;
  supplierName?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryItemSchema = new Schema<IInventoryItemDocument>(
  {
    nameBn: { type: String, required: true, trim: true, index: true },
    nameEn: { type: String, required: true, trim: true, index: true },
    category: { type: String, required: true, trim: true, index: true },
    unit: {
      type: String,
      enum: ["kg", "gram", "liter", "ml", "pcs", "packet", "box"],
      required: true,
    },
    currentStock: { type: Number, default: 0, min: 0 },
    minimumStock: { type: Number, default: 0, min: 0 },
    averageCost: { type: Number, default: 0, min: 0 },
    supplierId: { type: Schema.Types.ObjectId, ref: "Supplier" },
    supplierName: { type: String },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

InventoryItemSchema.index({ currentStock: 1, minimumStock: 1 });

export const InventoryItem: Model<IInventoryItemDocument> =
  mongoose.models.InventoryItem ||
  mongoose.model<IInventoryItemDocument>("InventoryItem", InventoryItemSchema);
