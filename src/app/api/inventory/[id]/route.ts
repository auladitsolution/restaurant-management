import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requirePermission, logAuditEvent } from "@/lib/auth/server-auth";
import { InventoryItem } from "@/models/InventoryItem";
import { StockMovement } from "@/models/StockMovement";
import { InventoryItemSchema } from "@/lib/validation/schemas";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(req, "inventory:manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await context.params;

  try {
    await connectToDatabase();
    const item = await InventoryItem.findById(id).lean();

    if (!item) {
      return NextResponse.json(
        { success: false, message: "আইটেম পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    const movements = await StockMovement.find({ inventoryItemId: id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ success: true, item, movements });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error fetching item";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(req, "inventory:manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await context.params;

  try {
    const body = await req.json();
    const parsed = InventoryItemSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const item = await InventoryItem.findById(id);

    if (!item) {
      return NextResponse.json(
        { success: false, message: "আইটেম পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    const before = item.toObject();
    Object.assign(item, parsed.data);
    await item.save();

    await logAuditEvent({
      user: auth.user,
      action: "INVENTORY_ITEM_UPDATED",
      entityType: "InventoryItem",
      entityId: id,
      beforeSnapshot: before,
      afterSnapshot: item.toObject(),
    });

    return NextResponse.json({
      success: true,
      message: "ইনভেন্টরি আইটেম সফলভাবে আপডেট হয়েছে",
      item,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error updating item";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(req, "inventory:manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await context.params;

  try {
    await connectToDatabase();
    const item = await InventoryItem.findById(id);

    if (!item) {
      return NextResponse.json(
        { success: false, message: "আইটেম পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    item.active = false;
    await item.save();

    await logAuditEvent({
      user: auth.user,
      action: "INVENTORY_ITEM_DEACTIVATED",
      entityType: "InventoryItem",
      entityId: id,
    });

    return NextResponse.json({
      success: true,
      message: "ইনভেন্টরি আইটেম মুছে ফেলা হয়েছে",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error deleting item";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
