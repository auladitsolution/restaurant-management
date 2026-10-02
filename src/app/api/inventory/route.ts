import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requirePermission, logAuditEvent } from "@/lib/auth/server-auth";
import { InventoryItem, IInventoryItemDocument } from "@/models/InventoryItem";
import { InventoryItemSchema } from "@/lib/validation/schemas";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, "inventory:manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const lowStock = searchParams.get("lowStock") === "true";
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = { active: true };

    if (category && category !== "ALL") filter.category = category;
    if (search) {
      filter.$or = [
        { nameBn: { $regex: search, $options: "i" } },
        { nameEn: { $regex: search, $options: "i" } },
      ];
    }

    if (lowStock) {
      filter.$expr = { $lte: ["$currentStock", "$minimumStock"] };
    }

    const items = await InventoryItem.find(filter)
      .sort({ nameBn: 1 })
      .lean<IInventoryItemDocument[]>();

    return NextResponse.json({ success: true, items });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error fetching inventory";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, "inventory:manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const parsed = InventoryItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const item = await InventoryItem.create(parsed.data);

    await logAuditEvent({
      user: auth.user,
      action: "INVENTORY_ITEM_CREATED",
      entityType: "InventoryItem",
      entityId: item._id.toString(),
      afterSnapshot: item.toObject(),
    });

    return NextResponse.json(
      { success: true, message: "ইনভেন্টরি আইটেম সফলভাবে তৈরি হয়েছে", item },
      { status: 201 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error creating inventory item";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
