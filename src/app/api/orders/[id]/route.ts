import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requirePermission, logAuditEvent } from "@/lib/auth/server-auth";
import { Order } from "@/models/Order";
import { Table } from "@/models/Table";
import { OrderStatusUpdateSchema } from "@/lib/validation/schemas";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(req, "orders:read");
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await context.params;

  try {
    await connectToDatabase();
    const order = await Order.findById(id).lean();

    if (!order) {
      return NextResponse.json(
        { success: false, message: "অর্ডার পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, order });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error fetching order";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(req, "orders:update");
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await context.params;

  try {
    const body = await req.json();
    const parsed = OrderStatusUpdateSchema.safeParse(body);

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

    const beforeStatus = {
      orderStatus: order.orderStatus,
      kitchenStatus: order.kitchenStatus,
    };

    if (parsed.data.orderStatus) {
      order.orderStatus = parsed.data.orderStatus;
      // If completed, release table if linked
      if (parsed.data.orderStatus === "COMPLETED" && order.tableId) {
        await Table.findByIdAndUpdate(order.tableId, {
          status: "CLEANING",
          activeOrderId: undefined,
        });
      }
    }

    if (parsed.data.kitchenStatus) {
      order.kitchenStatus = parsed.data.kitchenStatus;
      if (parsed.data.kitchenStatus === "PREPARING" && order.orderStatus === "CONFIRMED") {
        order.orderStatus = "PREPARING";
      } else if (parsed.data.kitchenStatus === "READY") {
        order.orderStatus = "READY";
      } else if (parsed.data.kitchenStatus === "SERVED") {
        order.orderStatus = "SERVED";
      }
    }

    await order.save();

    await logAuditEvent({
      user: auth.user,
      action: "ORDER_STATUS_CHANGED",
      entityType: "Order",
      entityId: id,
      beforeSnapshot: beforeStatus,
      afterSnapshot: {
        orderStatus: order.orderStatus,
        kitchenStatus: order.kitchenStatus,
      },
    });

    return NextResponse.json({
      success: true,
      message: "অর্ডার স্ট্যাটাস সফলভাবে আপডেট হয়েছে",
      order,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error updating order";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
