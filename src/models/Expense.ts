import mongoose, { Schema, Model, Document } from "mongoose";
import { ExpenseCategory, PaymentMethod } from "@/types";

export interface IExpenseDocument extends Document {
  category: ExpenseCategory;
  amount: number;
  description: string;
  date: Date;
  paymentMethod: PaymentMethod;
  attachment?: string;
  createdBy: {
    userId: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpenseDocument>(
  {
    category: {
      type: String,
      enum: [
        "বাজার",
        "বেতন",
        "ভাড়া",
        "বিদ্যুৎ",
        "গ্যাস",
        "পানি",
        "পরিবহন",
        "মেরামত",
        "মার্কেটিং",
        "অন্যান্য",
      ],
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, required: true, trim: true },
    date: { type: Date, default: Date.now, index: true },
    paymentMethod: {
      type: String,
      enum: ["CASH", "BKASH", "NAGAD", "ROCKET", "CARD", "BANK", "DUE"],
      default: "CASH",
    },
    attachment: { type: String },
    createdBy: {
      userId: { type: String, required: true },
      name: { type: String, required: true },
    },
  },
  { timestamps: true }
);

ExpenseSchema.index({ date: -1, category: 1 });

export const Expense: Model<IExpenseDocument> =
  mongoose.models.Expense ||
  mongoose.model<IExpenseDocument>("Expense", ExpenseSchema);
