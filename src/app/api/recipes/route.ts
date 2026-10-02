import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requirePermission, logAuditEvent } from "@/lib/auth/server-auth";
import { Recipe, IRecipeDocument } from "@/models/Recipe";
import { MenuItem } from "@/models/MenuItem";
import { RecipeSchema } from "@/lib/validation/schemas";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, "inventory:manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const menuItemId = searchParams.get("menuItemId");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = { active: true };
    if (menuItemId) filter.menuItemId = menuItemId;

    const recipes = await Recipe.find(filter)
      .populate("ingredients.inventoryItemId", "nameBn nameEn unit averageCost")
      .sort({ createdAt: -1 })
      .lean<IRecipeDocument[]>();

    return NextResponse.json({ success: true, recipes });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error fetching recipes";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, "inventory:manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const parsed = RecipeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const menuItem = await MenuItem.findById(parsed.data.menuItemId);
    if (!menuItem) {
      return NextResponse.json(
        { success: false, message: "মেনু আইটেম পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    // Check if recipe already exists for this item + variant
    const existing = await Recipe.findOne({
      menuItemId: parsed.data.menuItemId,
      variantName: parsed.data.variantName || "",
      active: true,
    });

    let recipeDoc;
    if (existing) {
      existing.ingredients = parsed.data.ingredients as any;
      existing.menuItemNameBn = menuItem.nameBn;
      await existing.save();
      recipeDoc = existing;
    } else {
      recipeDoc = await Recipe.create({
        ...parsed.data,
        menuItemNameBn: menuItem.nameBn,
      });
    }

    await logAuditEvent({
      user: auth.user,
      action: "RECIPE_SAVED",
      entityType: "Recipe",
      entityId: recipeDoc._id.toString(),
      afterSnapshot: {
        menuItemId: recipeDoc.menuItemId,
        menuItemNameBn: recipeDoc.menuItemNameBn,
        ingredientsCount: recipeDoc.ingredients.length,
      },
    });

    return NextResponse.json({
      success: true,
      message: "রেসিপি সফলভাবে সংরক্ষিত হয়েছে",
      recipe: recipeDoc,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error saving recipe";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
