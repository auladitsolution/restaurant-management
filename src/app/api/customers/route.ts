import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requirePermission, logAuditEvent } from "@/lib/auth/server-auth";
import { Customer, ICustomerDocument } from "@/models/Customer";
import { CustomerSchema } from "@/lib/validation/schemas";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, "customers:manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const dueOnly = searchParams.get("dueOnly") === "true";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = { active: true };
    if (dueOnly) filter.totalDue = { $gt: 0 };
    if (search) {
      filter.$or = [
        { phone: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
      ];
    }

    const customers = await Customer.find(filter)
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean<ICustomerDocument[]>();

    return NextResponse.json({ success: true, customers });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error fetching customers";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, "customers:manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const parsed = CustomerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const existing = await Customer.findOne({
      phone: parsed.data.phone.trim(),
      active: true,
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "এই ফোন নম্বরের কাস্টমার ইতিমধ্যে বিদ্যমান।" },
        { status: 400 }
      );
    }

    const customer = await Customer.create(parsed.data);

    await logAuditEvent({
      user: auth.user,
      action: "CUSTOMER_CREATED",
      entityType: "Customer",
      entityId: customer._id.toString(),
      afterSnapshot: customer.toObject(),
    });

    return NextResponse.json(
      { success: true, message: "কাস্টমার সফলভাবে নিবন্ধিত হয়েছে", customer },
      { status: 201 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error creating customer";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
