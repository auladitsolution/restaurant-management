import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requirePermission, logAuditEvent } from "@/lib/auth/server-auth";
import { Order, IOrderDocument } from "@/models/Order";
import { KitchenStatus } from "@/types";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, "kitchen:access");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    await connectToDatabase();

    // Fetch active kitchen orders (not CANCELLED or COMPLETED, kitchenStatus not SERVED or served within 10 mins)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const orders = await Order.find({
      orderStatus: { $in: ["CONFIRMED", "PREPARING", "READY"] },
      $or: [
        { kitchenStatus: { $in: ["NEW", "PREPARING", "READY"] } },
        { kitchenStatus: "SERVED", updatedAt: { $gte: tenMinutesAgo } },
      ],
    })
      .sort({ createdAt: 1 }) // oldest first for kitchen FIFO
      .select(
        "orderNumber orderType tableName floorName waiterName items notes kitchenStatus orderStatus createdAt updatedAt"
      )
      .lean<IOrderDocument[]>();

    return NextResponse.json({ success: true, orders });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error fetching kitchen orders";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, "kitchen:access");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const { orderId, kitchenStatus } = body;

    const validStatuses: KitchenStatus[] = ["NEW", "PREPARING", "READY", "SERVED"];
    if (!validStatuses.includes(kitchenStatus)) {
      return NextResponse.json(
        { success: false, message: "অবৈধ কিচেন স্ট্যাটাস" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const order = await Order.findById(orderId);

    if (!order) {
      return NextResponse.json(
        { success: false, message: "অর্ডার পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    const prev = order.kitchenStatus;
    order.kitchenStatus = kitchenStatus;

    if (kitchenStatus === "PREPARING") {
      order.orderStatus = "PREPARING";
    } else if (kitchenStatus === "READY") {
      order.orderStatus = "READY";
    } else if (kitchenStatus === "SERVED") {
      order.orderStatus = "SERVED";
    }

    await order.save();

    await logAuditEvent({
      user: auth.user,
      action: "KITCHEN_STATUS_CHANGED",
      entityType: "Order",
      entityId: orderId,
      beforeSnapshot: { kitchenStatus: prev },
      afterSnapshot: { kitchenStatus },
    });

    return NextResponse.json({
      success: true,
      message: "কিচেন স্ট্যাটাস আপডেট সম্পন্ন",
      order,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error updating kitchen status";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
