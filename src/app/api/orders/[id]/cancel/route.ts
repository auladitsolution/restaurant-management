import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requirePermission, logAuditEvent } from "@/lib/auth/server-auth";
import { Order } from "@/models/Order";
import { Table } from "@/models/Table";
import { Customer } from "@/models/Customer";
import { OrderCancelSchema } from "@/lib/validation/schemas";
import { reverseInventoryForOrder } from "@/services/inventory-service";
import { roundCurrency } from "@/lib/calculations/financial";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(req, "orders:cancel");
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await context.params;

  try {
    const body = await req.json();
    const parsed = OrderCancelSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json(
        { success: false, message: "অর্ডার পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    if (order.orderStatus === "CANCELLED") {
      return NextResponse.json(
        { success: false, message: "অর্ডারটি ইতিমধ্যে বাতিল করা হয়েছে।" },
        { status: 400 }
      );
    }

    const previousStatus = order.orderStatus;

    // 1. Mark as CANCELLED with tracking metadata
    order.orderStatus = "CANCELLED";
    order.cancellationReason = parsed.data.reason;
    order.cancelledBy = {
      userId: auth.user._id,
      name: auth.user.name,
    };
    order.cancelledAt = new Date();

    // 2. Reverse inventory deductions if they were made
    if (order.inventoryDeducted) {
      await reverseInventoryForOrder(order.orderNumber, {
        userId: auth.user._id,
        name: auth.user.name,
      });
      order.inventoryDeducted = false;
    }

    // 3. Release table if occupied
    if (order.tableId) {
      await Table.findByIdAndUpdate(order.tableId, {
        status: "AVAILABLE",
        activeOrderId: undefined,
      });
    }

    // 4. Reverse customer due if order had due
    if (order.customerId && order.dueAmount > 0) {
      const customer = await Customer.findById(order.customerId);
      if (customer) {
        customer.totalDue = Math.max(0, roundCurrency(customer.totalDue - order.dueAmount));
        customer.totalSpent = Math.max(0, roundCurrency(customer.totalSpent - order.paidAmount));
        await customer.save();
      }
    }

    await order.save();

    await logAuditEvent({
      user: auth.user,
      action: "ORDER_CANCELLED",
      entityType: "Order",
      entityId: id,
      beforeSnapshot: { orderStatus: previousStatus },
      afterSnapshot: {
        orderStatus: "CANCELLED",
        cancellationReason: parsed.data.reason,
        cancelledBy: auth.user.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: "অর্ডার সফলভাবে বাতিল করা হয়েছে এবং স্টক সমন্বয় করা হয়েছে",
      order,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error cancelling order";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
