import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requirePermission, logAuditEvent } from "@/lib/auth/server-auth";
import { Customer } from "@/models/Customer";
import { Order } from "@/models/Order";
import { CustomerSchema } from "@/lib/validation/schemas";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(req, "customers:manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await context.params;

  try {
    await connectToDatabase();
    const customer = await Customer.findById(id).lean();

    if (!customer) {
      return NextResponse.json(
        { success: false, message: "কাস্টমার পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    const orders = await Order.find({ customerId: id })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    return NextResponse.json({ success: true, customer, orders });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error fetching customer";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(req, "customers:manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await context.params;

  try {
    const body = await req.json();
    const parsed = CustomerSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const customer = await Customer.findById(id);

    if (!customer) {
      return NextResponse.json(
        { success: false, message: "কাস্টমার পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    const before = customer.toObject();
    Object.assign(customer, parsed.data);
    await customer.save();

    await logAuditEvent({
      user: auth.user,
      action: "CUSTOMER_UPDATED",
      entityType: "Customer",
      entityId: id,
      beforeSnapshot: before,
      afterSnapshot: customer.toObject(),
    });

    return NextResponse.json({
      success: true,
      message: "কাস্টমার তথ্য আপডেট সম্পন্ন",
      customer,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error updating customer";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
