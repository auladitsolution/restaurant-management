import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requirePermission, logAuditEvent } from "@/lib/auth/server-auth";
import { Supplier, ISupplierDocument } from "@/models/Supplier";
import { SupplierSchema } from "@/lib/validation/schemas";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, "purchases:manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = { active: true };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const suppliers = await Supplier.find(filter)
      .sort({ company: 1 })
      .lean<ISupplierDocument[]>();

    return NextResponse.json({ success: true, suppliers });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error fetching suppliers";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, "purchases:manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const parsed = SupplierSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const supplier = await Supplier.create(parsed.data);

    await logAuditEvent({
      user: auth.user,
      action: "SUPPLIER_CREATED",
      entityType: "Supplier",
      entityId: supplier._id.toString(),
      afterSnapshot: supplier.toObject(),
    });

    return NextResponse.json(
      { success: true, message: "সাপ্লায়ার যোগ করা হয়েছে", supplier },
      { status: 201 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error creating supplier";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
