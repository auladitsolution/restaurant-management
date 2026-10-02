import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requirePermission, logAuditEvent } from "@/lib/auth/server-auth";
import { User, IUserDocument } from "@/models/User";
import { UserUpdateSchema } from "@/lib/validation/schemas";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(req, "users:manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await context.params;

  try {
    const body = await req.json();
    const parsed = UserUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const existing = await User.findById(id);

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "ব্যবহারকারী পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    // Owner protection: cannot deactivate sole active owner
    if (existing.role === "OWNER" && parsed.data.active === false) {
      const activeOwners = await User.countDocuments({ role: "OWNER", active: true });
      if (activeOwners <= 1) {
        return NextResponse.json(
          { success: false, message: "একমাত্র সক্রিয় মালিককে নিষ্ক্রিয় করা যাবে না।" },
          { status: 400 }
        );
      }
    }

    const beforeSnapshot = {
      name: existing.name,
      role: existing.role,
      active: existing.active,
      permissions: existing.permissions,
    };

    if (parsed.data.name !== undefined) existing.name = parsed.data.name;
    if (parsed.data.phone !== undefined) existing.phone = parsed.data.phone;
    if (parsed.data.role !== undefined) existing.role = parsed.data.role;
    if (parsed.data.permissions !== undefined) existing.permissions = parsed.data.permissions as any;
    if (parsed.data.active !== undefined) existing.active = parsed.data.active;

    await existing.save();

    await logAuditEvent({
      user: auth.user,
      action: "USER_UPDATED",
      entityType: "User",
      entityId: id,
      beforeSnapshot,
      afterSnapshot: {
        name: existing.name,
        role: existing.role,
        active: existing.active,
        permissions: existing.permissions,
      },
    });

    return NextResponse.json({
      success: true,
      message: "তথ্য সফলভাবে হালনাগাদ করা হয়েছে",
      user: existing,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error updating user";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
