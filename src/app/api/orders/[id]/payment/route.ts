import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requirePermission, logAuditEvent } from "@/lib/auth/server-auth";
import { Order } from "@/models/Order";
import { Customer } from "@/models/Customer";
import { Table } from "@/models/Table";
import { OrderPaymentSchema } from "@/lib/validation/schemas";
import {
  determinePaymentStatus,
  calculateDue,
  roundCurrency,
} from "@/lib/calculations/financial";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(req, "orders:update");
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await context.params;

  try {
    const body = await req.json();
    const parsed = OrderPaymentSchema.safeParse(body);

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
        { success: false, message: "বাতিলকৃত অর্ডারে পেমেন্ট যোগ করা যাবে না।" },
        { status: 400 }
      );
    }

    const previousDue = order.dueAmount;

    // Add new payment records
    for (const record of parsed.data.paymentRecords) {
      order.paymentRecords.push({
        method: record.method,
        amount: roundCurrency(record.amount),
        reference: record.reference || "",
        note: record.note || "",
        receivedAt: record.receivedAt ? new Date(record.receivedAt) : new Date(),
      });
    }

    // Recalculate totals
    const totalPaid = roundCurrency(
      order.paymentRecords.reduce((sum, p) => sum + p.amount, 0)
    );
    const newDue = calculateDue(order.grandTotal, totalPaid);
    const newStatus = determinePaymentStatus(order.grandTotal, totalPaid);

    order.paidAmount = totalPaid;
    order.dueAmount = newDue;
    order.paymentStatus = newStatus;

    // If fully paid and served, auto complete order & release table
    if (newStatus === "PAID" && (order.kitchenStatus === "SERVED" || order.orderType !== "DINE_IN")) {
      order.orderStatus = "COMPLETED";
      if (order.tableId) {
        await Table.findByIdAndUpdate(order.tableId, {
          status: "CLEANING",
          activeOrderId: undefined,
        });
      }
    }

    await order.save();

    // Update customer due if customer exists
    if (order.customerId) {
      const dueDelta = roundCurrency(previousDue - newDue);
      if (dueDelta > 0) {
        const customer = await Customer.findById(order.customerId);
        if (customer) {
          customer.totalDue = Math.max(0, roundCurrency(customer.totalDue - dueDelta));
          await customer.save();
        }
      }
    }

    await logAuditEvent({
      user: auth.user,
      action: "PAYMENT_RECORDED",
      entityType: "Order",
      entityId: id,
      afterSnapshot: {
        paidAmount: order.paidAmount,
        dueAmount: order.dueAmount,
        paymentStatus: order.paymentStatus,
        addedPayments: parsed.data.paymentRecords,
      },
    });

    return NextResponse.json({
      success: true,
      message: "পেমেন্ট সফলভাবে সংরক্ষণ করা হয়েছে",
      order,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error processing payment";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
