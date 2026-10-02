import mongoose, { Schema, Model, Document } from "mongoose";

export interface ICategoryDocument extends Document {
  nameBn: string;
  nameEn: string;
  icon?: string;
  image?: string;
  sortOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategoryDocument>(
  {
    nameBn: { type: String, required: true, trim: true },
    nameEn: { type: String, required: true, trim: true },
    icon: { type: String },
    image: { type: String },
    sortOrder: { type: Number, default: 0, index: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

CategorySchema.index({ active: 1, sortOrder: 1 });

export const Category: Model<ICategoryDocument> =
  mongoose.models.Category ||
  mongoose.model<ICategoryDocument>("Category", CategorySchema);
