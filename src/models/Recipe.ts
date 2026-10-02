import mongoose, { Schema, Model, Document } from "mongoose";
import { InventoryUnit } from "@/types";

export interface IRecipeDocument extends Document {
  menuItemId: mongoose.Types.ObjectId;
  menuItemNameBn: string;
  variantName?: string;
  ingredients: Array<{
    inventoryItemId: mongoose.Types.ObjectId;
    quantity: number;
    unit: InventoryUnit;
  }>;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RecipeSchema = new Schema<IRecipeDocument>(
  {
    menuItemId: {
      type: Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
      index: true,
    },
    menuItemNameBn: { type: String, required: true },
    variantName: { type: String, default: "" },
    ingredients: [
      {
        inventoryItemId: {
          type: Schema.Types.ObjectId,
          ref: "InventoryItem",
          required: true,
        },
        quantity: { type: Number, required: true, min: 0.0001 },
        unit: {
          type: String,
          enum: ["kg", "gram", "liter", "ml", "pcs", "packet", "box"],
          required: true,
        },
      },
    ],
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

RecipeSchema.index({ menuItemId: 1, variantName: 1 });

export const Recipe: Model<IRecipeDocument> =
  mongoose.models.Recipe ||
  mongoose.model<IRecipeDocument>("Recipe", RecipeSchema);
