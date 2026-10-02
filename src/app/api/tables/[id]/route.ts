import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requirePermission, logAuditEvent } from "@/lib/auth/server-auth";
import { Table } from "@/models/Table";
import { Order } from "@/models/Order";
import { TableSchema } from "@/lib/validation/schemas";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(req, "tables:manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await context.params;

  try {
    const body = await req.json();

    // Check if this is a table transfer request
    if (body.targetTableId && body.action === "TRANSFER") {
      await connectToDatabase();
      const sourceTable = await Table.findById(id);
      const targetTable = await Table.findById(body.targetTableId);

      if (!sourceTable || !targetTable) {
        return NextResponse.json(
          { success: false, message: "উৎস বা গন্তব্য টেবিল পাওয়া যায়নি।" },
          { status: 404 }
        );
      }

      if (!sourceTable.activeOrderId) {
        return NextResponse.json(
          { success: false, message: "বর্তমান টেবিলে কোন সক্রিয় অর্ডার নেই।" },
          { status: 400 }
        );
      }

      const activeOrderId = sourceTable.activeOrderId;

      // Update Order
      await Order.findByIdAndUpdate(activeOrderId, {
        tableId: targetTable._id,
        tableName: targetTable.tableNumber,
        floorName: targetTable.floor,
      });

      // Update source and target tables
      sourceTable.status = "CLEANING";
      sourceTable.activeOrderId = undefined;
      await sourceTable.save();

      targetTable.status = "OCCUPIED";
      targetTable.activeOrderId = activeOrderId;
      await targetTable.save();

      await logAuditEvent({
        user: auth.user,
        action: "TABLE_ORDER_TRANSFERRED",
        entityType: "Table",
        entityId: id,
        metadata: {
          orderId: activeOrderId.toString(),
          fromTable: sourceTable.tableNumber,
          toTable: targetTable.tableNumber,
        },
      });

      return NextResponse.json({
        success: true,
        message: `অর্ডার টেবিল ${sourceTable.tableNumber} থেকে টেবিল ${targetTable.tableNumber}-এ স্থানান্তর করা হয়েছে।`,
      });
    }

    const parsed = TableSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const table = await Table.findById(id);
    if (!table) {
      return NextResponse.json(
        { success: false, message: "টেবিল পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    Object.assign(table, parsed.data);
    await table.save();

    return NextResponse.json({
      success: true,
      message: "টেবিল তথ্য আপডেট সম্পন্ন",
      table,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error updating table";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(req, "tables:manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await context.params;

  try {
    await connectToDatabase();
    const table = await Table.findById(id);
    if (!table) {
      return NextResponse.json(
        { success: false, message: "টেবিল পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    if (table.status === "OCCUPIED") {
      return NextResponse.json(
        { success: false, message: "ব্যস্ত টেবিল ডিলিট করা সম্ভব নয়।" },
        { status: 400 }
      );
    }

    table.active = false;
    await table.save();

    return NextResponse.json({
      success: true,
      message: "টেবিল মুছে ফেলা হয়েছে",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error deleting table";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
