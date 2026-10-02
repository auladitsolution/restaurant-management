import mongoose, { Schema, Model, Document } from "mongoose";

export interface ICustomerDocument extends Document {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  totalOrders: number;
  totalSpent: number;
  totalDue: number;
  lastOrderDate?: Date;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomerDocument>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String },
    notes: { type: String },
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    totalDue: { type: Number, default: 0, index: true },
    lastOrderDate: { type: Date },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

CustomerSchema.index({ phone: 1, active: 1 });

export const Customer: Model<ICustomerDocument> =
  mongoose.models.Customer ||
  mongoose.model<ICustomerDocument>("Customer", CustomerSchema);
