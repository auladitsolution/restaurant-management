import mongoose, { Schema, Model, Document } from "mongoose";

export interface IFloorDocument extends Document {
  name: string;
  nameBn: string;
  sortOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FloorSchema = new Schema<IFloorDocument>(
  {
    name: { type: String, required: true, trim: true },
    nameBn: { type: String, required: true, trim: true },
    sortOrder: { type: Number, default: 0, index: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Floor: Model<IFloorDocument> =
  mongoose.models.Floor ||
  mongoose.model<IFloorDocument>("Floor", FloorSchema);
