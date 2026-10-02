import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requirePermission, logAuditEvent } from "@/lib/auth/server-auth";
import { Category, ICategoryDocument } from "@/models/Category";
import { CategorySchema } from "@/lib/validation/schemas";

export async function GET() {
  try {
    await connectToDatabase();
    const categories = await Category.find({ active: true })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean<ICategoryDocument[]>();

    return NextResponse.json({ success: true, categories });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error fetching categories";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, "menu:manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const parsed = CategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const category = await Category.create(parsed.data);

    await logAuditEvent({
      user: auth.user,
      action: "CATEGORY_CREATED",
      entityType: "Category",
      entityId: category._id.toString(),
      afterSnapshot: category.toObject(),
    });

    return NextResponse.json(
      { success: true, message: "ক্যাটাগরি তৈরি সম্পন্ন", category },
      { status: 201 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error creating category";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
