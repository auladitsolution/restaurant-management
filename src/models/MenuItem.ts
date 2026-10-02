import mongoose, { Schema, Model, Document } from "mongoose";

export interface IMenuItemDocument extends Document {
  nameBn: string;
  nameEn: string;
  categoryId: mongoose.Types.ObjectId;
  categoryName?: string;
  description?: string;
  image?: string;
  basePrice: number;
  costPrice: number;
  hasVariants: boolean;
  variants: Array<{
    nameBn: string;
    nameEn: string;
    price: number;
    costPrice?: number;
  }>;
  addOns: Array<{
    nameBn: string;
    nameEn: string;
    price: number;
  }>;
  ingredients: Array<{
    inventoryItemId: mongoose.Types.ObjectId;
    quantity: number;
    unit: string;
  }>;
  availability: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema = new Schema<IMenuItemDocument>(
  {
    nameBn: { type: String, required: true, trim: true, index: true },
    nameEn: { type: String, required: true, trim: true, index: true },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    categoryName: { type: String },
    description: { type: String },
    image: { type: String },
    basePrice: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, default: 0, min: 0 },
    hasVariants: { type: Boolean, default: false },
    variants: [
      {
        nameBn: { type: String, required: true },
        nameEn: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        costPrice: { type: Number, default: 0 },
      },
    ],
    addOns: [
      {
        nameBn: { type: String, required: true },
        nameEn: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
      },
    ],
    ingredients: [
      {
        inventoryItemId: { type: Schema.Types.ObjectId, ref: "InventoryItem" },
        quantity: { type: Number, required: true },
        unit: { type: String, required: true },
      },
    ],
    availability: { type: Boolean, default: true, index: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

MenuItemSchema.index({ categoryId: 1, active: 1, availability: 1 });

export const MenuItem: Model<IMenuItemDocument> =
  mongoose.models.MenuItem ||
  mongoose.model<IMenuItemDocument>("MenuItem", MenuItemSchema);
