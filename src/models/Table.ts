import mongoose, { Schema, Model, Document } from "mongoose";
import { TableStatus } from "@/types";

export interface ITableDocument extends Document {
  tableNumber: string;
  nameBn?: string;
  floor: string;
  capacity: number;
  status: TableStatus;
  activeOrderId?: mongoose.Types.ObjectId;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TableSchema = new Schema<ITableDocument>(
  {
    tableNumber: { type: String, required: true, trim: true, unique: true, index: true },
    nameBn: { type: String, trim: true },
    floor: { type: String, required: true, trim: true, index: true },
    capacity: { type: Number, required: true, min: 1, default: 4 },
    status: {
      type: String,
      enum: ["AVAILABLE", "OCCUPIED", "RESERVED", "CLEANING"],
      default: "AVAILABLE",
      index: true,
    },
    activeOrderId: { type: Schema.Types.ObjectId, ref: "Order" },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const Table: Model<ITableDocument> =
  mongoose.models.Table ||
  mongoose.model<ITableDocument>("Table", TableSchema);
