import mongoose, { Schema, Model, Document } from "mongoose";
import { OrderType, OrderStatus, KitchenStatus, PaymentStatus, IPaymentRecord, IOrderItem } from "@/types";

export interface IOrderDocument extends Document {
  orderNumber: string;
  orderType: OrderType;
  tableId?: mongoose.Types.ObjectId;
  tableName?: string;
  floorName?: string;
  guestCount?: number;
  customerId?: mongoose.Types.ObjectId;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  waiterId?: mongoose.Types.ObjectId;
  waiterName?: string;
  items: IOrderItem[];
  subtotal: number;
  discountType: "PERCENT" | "FIXED";
  discountRate: number;
  discountAmount: number;
  vatRate: number;
  vatAmount: number;
  serviceChargeRate: number;
  serviceChargeAmount: number;
  deliveryCharge: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: PaymentStatus;
  paymentRecords: IPaymentRecord[];
  orderStatus: OrderStatus;
  kitchenStatus: KitchenStatus;
  notes?: string;
  cancellationReason?: string;
  cancelledBy?: {
    userId: string;
    name: string;
  };
  cancelledAt?: Date;
  inventoryDeducted: boolean;
  createdBy: {
    userId: string;
    name: string;
    role: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrderDocument>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    orderType: {
      type: String,
      enum: ["DINE_IN", "TAKEAWAY", "DELIVERY"],
      required: true,
      index: true,
    },
    tableId: { type: Schema.Types.ObjectId, ref: "Table", index: true },
    tableName: { type: String },
    floorName: { type: String },
    guestCount: { type: Number, default: 1 },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", index: true },
    customerName: { type: String },
    customerPhone: { type: String, index: true },
    deliveryAddress: { type: String },
    waiterId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    waiterName: { type: String },
    items: [
      {
        menuItemId: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true },
        nameBn: { type: String, required: true },
        nameEn: { type: String, required: true },
        variantNameBn: { type: String },
        variantNameEn: { type: String },
        unitPrice: { type: Number, required: true },
        costPrice: { type: Number, default: 0 },
        quantity: { type: Number, required: true, min: 1 },
        totalPrice: { type: Number, required: true },
        notes: { type: String },
        addOns: [
          {
            nameBn: { type: String, required: true },
            price: { type: Number, required: true },
          },
        ],
      },
    ],
    subtotal: { type: Number, required: true },
    discountType: { type: String, enum: ["PERCENT", "FIXED"], default: "FIXED" },
    discountRate: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    vatRate: { type: Number, default: 0 },
    vatAmount: { type: Number, default: 0 },
    serviceChargeRate: { type: Number, default: 0 },
    serviceChargeAmount: { type: Number, default: 0 },
    deliveryCharge: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ["UNPAID", "PARTIAL", "PAID", "REFUNDED"],
      default: "UNPAID",
      index: true,
    },
    paymentRecords: [
      {
        method: {
          type: String,
          enum: ["CASH", "BKASH", "NAGAD", "ROCKET", "CARD", "BANK", "DUE"],
          required: true,
        },
        amount: { type: Number, required: true },
        reference: { type: String },
        note: { type: String },
        receivedAt: { type: Date, default: Date.now },
      },
    ],
    orderStatus: {
      type: String,
      enum: ["DRAFT", "CONFIRMED", "PREPARING", "READY", "SERVED", "COMPLETED", "CANCELLED"],
      default: "CONFIRMED",
      index: true,
    },
    kitchenStatus: {
      type: String,
      enum: ["NEW", "PREPARING", "READY", "SERVED"],
      default: "NEW",
      index: true,
    },
    notes: { type: String },
    cancellationReason: { type: String },
    cancelledBy: {
      userId: { type: String },
      name: { type: String },
    },
    cancelledAt: { type: Date },
    inventoryDeducted: { type: Boolean, default: false, index: true },
    createdBy: {
      userId: { type: String, required: true },
      name: { type: String, required: true },
      role: { type: String, required: true },
    },
  },
  { timestamps: true }
);

OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ orderStatus: 1, kitchenStatus: 1 });
OrderSchema.index({ createdAt: -1, orderStatus: 1 });

export const Order: Model<IOrderDocument> =
  mongoose.models.Order || mongoose.model<IOrderDocument>("Order", OrderSchema);
