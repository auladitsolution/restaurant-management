import mongoose, { Schema, Model, Document } from "mongoose";
import { UserRole, Permission } from "@/types";

export interface IUserDocument extends Document {
  firebaseUid: string;
  name: string;
  email: string;
  phone?: string;
  photo?: string;
  role: UserRole;
  permissions: Permission[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String },
    photo: { type: String },
    role: {
      type: String,
      enum: ["OWNER", "MANAGER", "CASHIER", "WAITER", "KITCHEN", "INVENTORY_MANAGER"],
      default: "CASHIER",
      index: true,
    },
    permissions: [{ type: String }],
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);
