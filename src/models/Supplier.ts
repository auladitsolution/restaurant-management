import mongoose, { Schema, Model, Document } from "mongoose";

export interface ISupplierDocument extends Document {
  name: string;
  company: string;
  phone: string;
  email?: string;
  address?: string;
  currentDue: number;
  notes?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplierDocument>(
  {
    name: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String },
    currentDue: { type: Number, default: 0, index: true },
    notes: { type: String },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const Supplier: Model<ISupplierDocument> =
  mongoose.models.Supplier ||
  mongoose.model<ISupplierDocument>("Supplier", SupplierSchema);
