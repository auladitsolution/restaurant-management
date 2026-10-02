import mongoose, { Schema, Model, Document } from "mongoose";

export interface ICashShiftDocument extends Document {
  shiftNumber: string;
  cashierId: mongoose.Types.ObjectId;
  cashierName: string;
  startTime: Date;
  endTime?: Date;
  openingCash: number;
  cashSales: number;
  cashIn: number;
  cashOut: number;
  refunds: number;
  expectedCash: number;
  actualCash?: number;
  difference?: number;
  notes?: string;
  status: "OPEN" | "CLOSED";
  createdAt: Date;
  updatedAt: Date;
}

const CashShiftSchema = new Schema<ICashShiftDocument>(
  {
    shiftNumber: { type: String, required: true, unique: true, index: true },
    cashierId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    cashierName: { type: String, required: true },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    openingCash: { type: Number, default: 0, min: 0 },
    cashSales: { type: Number, default: 0 },
    cashIn: { type: Number, default: 0 },
    cashOut: { type: Number, default: 0 },
    refunds: { type: Number, default: 0 },
    expectedCash: { type: Number, default: 0 },
    actualCash: { type: Number },
    difference: { type: Number },
    notes: { type: String },
    status: { type: String, enum: ["OPEN", "CLOSED"], default: "OPEN", index: true },
  },
  { timestamps: true }
);

CashShiftSchema.index({ cashierId: 1, status: 1 });

export const CashShift: Model<ICashShiftDocument> =
  mongoose.models.CashShift ||
  mongoose.model<ICashShiftDocument>("CashShift", CashShiftSchema);
