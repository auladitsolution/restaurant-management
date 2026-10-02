import mongoose, { Schema, Model, Document } from "mongoose";

export interface INotificationDocument extends Document {
  title: string;
  message: string;
  type: "ORDER" | "KITCHEN" | "LOW_STOCK" | "CUSTOMER_DUE" | "SUPPLIER_DUE" | "SYSTEM";
  read: boolean;
  relatedEntityId?: string;
  relatedEntityType?: "ORDER" | "INVENTORY" | "CUSTOMER" | "SUPPLIER";
  createdAt: Date;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["ORDER", "KITCHEN", "LOW_STOCK", "CUSTOMER_DUE", "SUPPLIER_DUE", "SYSTEM"],
      default: "SYSTEM",
      index: true,
    },
    read: { type: Boolean, default: false, index: true },
    relatedEntityId: { type: String },
    relatedEntityType: {
      type: String,
      enum: ["ORDER", "INVENTORY", "CUSTOMER", "SUPPLIER"],
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

NotificationSchema.index({ read: 1, createdAt: -1 });

export const Notification: Model<INotificationDocument> =
  mongoose.models.Notification ||
  mongoose.model<INotificationDocument>("Notification", NotificationSchema);
