import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requirePermission, logAuditEvent } from "@/lib/auth/server-auth";
import { Supplier } from "@/models/Supplier";
import { Purchase } from "@/models/Purchase";
import { SupplierSchema } from "@/lib/validation/schemas";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(req, "purchases:manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await context.params;

  try {
    await connectToDatabase();
    const supplier = await Supplier.findById(id).lean();

    if (!supplier) {
      return NextResponse.json(
        { success: false, message: "সাপ্লায়ার পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    const purchases = await Purchase.find({ supplierId: id })
      .sort({ purchaseDate: -1 })
      .limit(30)
      .lean();

    return NextResponse.json({ success: true, supplier, purchases });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error fetching supplier";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(req, "purchases:manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await context.params;

  try {
    const body = await req.json();
    const parsed = SupplierSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const supplier = await Supplier.findById(id);

    if (!supplier) {
      return NextResponse.json(
        { success: false, message: "সাপ্লায়ার পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    const before = supplier.toObject();
    Object.assign(supplier, parsed.data);
    await supplier.save();

    await logAuditEvent({
      user: auth.user,
      action: "SUPPLIER_UPDATED",
      entityType: "Supplier",
      entityId: id,
      beforeSnapshot: before,
      afterSnapshot: supplier.toObject(),
    });

    return NextResponse.json({
      success: true,
      message: "সাপ্লায়ার তথ্য আপডেট সম্পন্ন",
      supplier,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error updating supplier";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(req, "purchases:manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await context.params;

  try {
    await connectToDatabase();
    const supplier = await Supplier.findById(id);

    if (!supplier) {
      return NextResponse.json(
        { success: false, message: "সাপ্লায়ার পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    supplier.active = false;
    await supplier.save();

    await logAuditEvent({
      user: auth.user,
      action: "SUPPLIER_DEACTIVATED",
      entityType: "Supplier",
      entityId: id,
    });

    return NextResponse.json({
      success: true,
      message: "সাপ্লায়ার মুছে ফেলা হয়েছে",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error deleting supplier";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
