import mongoose, { Schema, Model, Document } from "mongoose";
import { StockMovementType, InventoryUnit } from "@/types";

export interface IStockMovementDocument extends Document {
  inventoryItemId: mongoose.Types.ObjectId;
  inventoryItemName: string;
  unit: InventoryUnit;
  type: StockMovementType;
  quantityDelta: number;
  previousStock: number;
  newStock: number;
  unitCost: number;
  totalCost: number;
  referenceType?: "ORDER" | "PURCHASE" | "MANUAL_ADJUSTMENT" | "ORDER_CANCEL";
  referenceId?: string;
  reason?: string;
  performedBy: {
    userId: string;
    name: string;
  };
  createdAt: Date;
}

const StockMovementSchema = new Schema<IStockMovementDocument>(
  {
    inventoryItemId: {
      type: Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
      index: true,
    },
    inventoryItemName: { type: String, required: true },
    unit: { type: String, required: true },
    type: {
      type: String,
      enum: ["PURCHASE", "SALE_CONSUMPTION", "ADJUSTMENT", "WASTE", "RETURN"],
      required: true,
      index: true,
    },
    quantityDelta: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    unitCost: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    referenceType: {
      type: String,
      enum: ["ORDER", "PURCHASE", "MANUAL_ADJUSTMENT", "ORDER_CANCEL"],
      index: true,
    },
    referenceId: { type: String, index: true },
    reason: { type: String },
    performedBy: {
      userId: { type: String, required: true },
      name: { type: String, required: true },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

StockMovementSchema.index({ inventoryItemId: 1, createdAt: -1 });

export const StockMovement: Model<IStockMovementDocument> =
  mongoose.models.StockMovement ||
  mongoose.model<IStockMovementDocument>("StockMovement", StockMovementSchema);
