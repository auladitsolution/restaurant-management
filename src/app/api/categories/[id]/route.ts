import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requirePermission, logAuditEvent } from "@/lib/auth/server-auth";
import { Category } from "@/models/Category";
import { CategorySchema } from "@/lib/validation/schemas";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(req, "menu:manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await context.params;

  try {
    const body = await req.json();
    const parsed = CategorySchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const category = await Category.findById(id);

    if (!category) {
      return NextResponse.json(
        { success: false, message: "ক্যাটাগরি পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    const before = category.toObject();
    Object.assign(category, parsed.data);
    await category.save();

    await logAuditEvent({
      user: auth.user,
      action: "CATEGORY_UPDATED",
      entityType: "Category",
      entityId: id,
      beforeSnapshot: before,
      afterSnapshot: category.toObject(),
    });

    return NextResponse.json({
      success: true,
      message: "ক্যাটাগরি হালনাগাদ সম্পন্ন",
      category,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error updating category";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(req, "menu:manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await context.params;

  try {
    await connectToDatabase();
    const category = await Category.findById(id);

    if (!category) {
      return NextResponse.json(
        { success: false, message: "ক্যাটাগরি পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    // Soft delete
    category.active = false;
    await category.save();

    await logAuditEvent({
      user: auth.user,
      action: "CATEGORY_DEACTIVATED",
      entityType: "Category",
      entityId: id,
    });

    return NextResponse.json({
      success: true,
      message: "ক্যাটাগরি মুছে ফেলা হয়েছে",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error deleting category";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
