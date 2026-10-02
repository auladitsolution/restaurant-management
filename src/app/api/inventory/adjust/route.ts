import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requirePermission, logAuditEvent } from "@/lib/auth/server-auth";
import { InventoryItem } from "@/models/InventoryItem";
import { StockMovement } from "@/models/StockMovement";
import { StockAdjustmentSchema } from "@/lib/validation/schemas";
import { roundCurrency } from "@/lib/calculations/financial";

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, "inventory:manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const parsed = StockAdjustmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const item = await InventoryItem.findById(parsed.data.inventoryItemId);

    if (!item) {
      return NextResponse.json(
        { success: false, message: "ইনভেন্টরি আইটেম পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    const prevStock = item.currentStock;
    const delta = roundCurrency(parsed.data.quantityDelta);
    const newStock = Math.max(0, roundCurrency(prevStock + delta));

    item.currentStock = newStock;
    await item.save();

    const movement = await StockMovement.create({
      inventoryItemId: item._id,
      inventoryItemName: item.nameBn,
      unit: item.unit,
      type: parsed.data.type,
      quantityDelta: delta,
      previousStock: prevStock,
      newStock: newStock,
      unitCost: item.averageCost,
      totalCost: roundCurrency(Math.abs(delta) * item.averageCost),
      referenceType: "MANUAL_ADJUSTMENT",
      reason: parsed.data.reason,
      performedBy: {
        userId: auth.user._id,
        name: auth.user.name,
      },
    });

    await logAuditEvent({
      user: auth.user,
      action: "STOCK_MANUALLY_ADJUSTED",
      entityType: "InventoryItem",
      entityId: item._id.toString(),
      beforeSnapshot: { currentStock: prevStock },
      afterSnapshot: { currentStock: newStock, delta, reason: parsed.data.reason },
    });

    return NextResponse.json({
      success: true,
      message: "স্টক সফলভাবে সমন্বয় করা হয়েছে",
      item,
      movement,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error adjusting stock";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
