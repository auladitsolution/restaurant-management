import mongoose, { Schema, Model, Document } from "mongoose";
import { PaymentMethod, IPurchaseItem } from "@/types";

export interface IPurchaseDocument extends Document {
  purchaseNumber: string;
  supplierId: mongoose.Types.ObjectId;
  supplierName: string;
  items: IPurchaseItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  status: "DRAFT" | "RECEIVED" | "CANCELLED";
  purchaseDate: Date;
  notes?: string;
  attachment?: string;
  createdBy: {
    userId: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseSchema = new Schema<IPurchaseDocument>(
  {
    purchaseNumber: { type: String, required: true, unique: true, index: true },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
      index: true,
    },
    supplierName: { type: String, required: true },
    items: [
      {
        inventoryItemId: {
          type: Schema.Types.ObjectId,
          ref: "InventoryItem",
          required: true,
        },
        itemName: { type: String, required: true },
        unit: { type: String, required: true },
        quantity: { type: Number, required: true, min: 0.001 },
        unitCost: { type: Number, required: true, min: 0 },
        totalCost: { type: Number, required: true, min: 0 },
      },
    ],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    paymentMethod: {
      type: String,
      enum: ["CASH", "BKASH", "NAGAD", "ROCKET", "CARD", "BANK", "DUE"],
      required: true,
    },
    paymentReference: { type: String },
    status: {
      type: String,
      enum: ["DRAFT", "RECEIVED", "CANCELLED"],
      default: "RECEIVED",
      index: true,
    },
    purchaseDate: { type: Date, default: Date.now },
    notes: { type: String },
    attachment: { type: String },
    createdBy: {
      userId: { type: String, required: true },
      name: { type: String, required: true },
    },
  },
  { timestamps: true }
);

PurchaseSchema.index({ createdAt: -1 });

export const Purchase: Model<IPurchaseDocument> =
  mongoose.models.Purchase ||
  mongoose.model<IPurchaseDocument>("Purchase", PurchaseSchema);
