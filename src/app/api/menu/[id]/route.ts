import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requirePermission, logAuditEvent } from "@/lib/auth/server-auth";
import { MenuItem } from "@/models/MenuItem";
import { Category } from "@/models/Category";
import { MenuItemSchema } from "@/lib/validation/schemas";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    await connectToDatabase();
    const item = await MenuItem.findById(id).populate("categoryId", "nameBn nameEn");
    if (!item) {
      return NextResponse.json(
        { success: false, message: "মেনু আইটেম পাওয়া যায়নি" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, item });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error fetching menu item";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(req, "menu:manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await context.params;

  try {
    const body = await req.json();
    const parsed = MenuItemSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const item = await MenuItem.findById(id);

    if (!item) {
      return NextResponse.json(
        { success: false, message: "মেনু আইটেম পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    const beforeSnapshot = {
      nameBn: item.nameBn,
      basePrice: item.basePrice,
      costPrice: item.costPrice,
      availability: item.availability,
      variants: item.variants,
    };

    if (parsed.data.categoryId && parsed.data.categoryId !== item.categoryId.toString()) {
      const category = await Category.findById(parsed.data.categoryId);
      if (category) {
        item.categoryName = category.nameBn;
      }
    }

    Object.assign(item, parsed.data);
    await item.save();

    const priceChanged = beforeSnapshot.basePrice !== item.basePrice;

    await logAuditEvent({
      user: auth.user,
      action: priceChanged ? "MENU_PRICE_CHANGED" : "MENU_ITEM_UPDATED",
      entityType: "MenuItem",
      entityId: id,
      beforeSnapshot,
      afterSnapshot: {
        nameBn: item.nameBn,
        basePrice: item.basePrice,
        costPrice: item.costPrice,
        availability: item.availability,
        variants: item.variants,
      },
    });

    return NextResponse.json({
      success: true,
      message: "মেনু আইটেম সফলভাবে আপডেট করা হয়েছে",
      item,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error updating menu item";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(req, "menu:manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await context.params;

  try {
    await connectToDatabase();
    const item = await MenuItem.findById(id);

    if (!item) {
      return NextResponse.json(
        { success: false, message: "মেনু আইটেম পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    item.active = false;
    await item.save();

    await logAuditEvent({
      user: auth.user,
      action: "MENU_ITEM_DEACTIVATED",
      entityType: "MenuItem",
      entityId: id,
    });

    return NextResponse.json({
      success: true,
      message: "মেনু আইটেম মুছে ফেলা হয়েছে",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error deleting menu item";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
