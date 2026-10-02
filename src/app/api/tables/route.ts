import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requirePermission } from "@/lib/auth/server-auth";
import { Table, ITableDocument } from "@/models/Table";
import { TableSchema } from "@/lib/validation/schemas";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const floor = searchParams.get("floor");
    const status = searchParams.get("status");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = { active: true };
    if (floor && floor !== "all") filter.floor = floor;
    if (status && status !== "all") filter.status = status;

    const tables = await Table.find(filter)
      .populate("activeOrderId", "orderNumber grandTotal paidAmount dueAmount orderStatus createdAt items")
      .sort({ tableNumber: 1 })
      .lean<ITableDocument[]>();

    return NextResponse.json({ success: true, tables });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error fetching tables";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, "tables:manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const parsed = TableSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const existing = await Table.findOne({
      tableNumber: parsed.data.tableNumber.trim(),
      active: true,
    });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "এই টেবিল নম্বরটি ইতিমধ্যে বিদ্যমান।" },
        { status: 400 }
      );
    }

    const table = await Table.create(parsed.data);

    return NextResponse.json(
      { success: true, message: "টেবিল সফলভাবে তৈরি করা হয়েছে", table },
      { status: 201 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error creating table";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
