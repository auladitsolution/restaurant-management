import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requirePermission, logAuditEvent } from "@/lib/auth/server-auth";
import { User, IUserDocument } from "@/models/User";
import { UserCreateSchema } from "@/lib/validation/schemas";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, "users:manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    await connectToDatabase();
    const users = await User.find({})
      .select("-__v")
      .sort({ createdAt: -1 })
      .lean<IUserDocument[]>();

    return NextResponse.json({ success: true, users });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error fetching users";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, "users:manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const parsed = UserCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check duplicate email
    const existing = await User.findOne({ email: parsed.data.email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "এই ইমেইলটি ইতিমধ্যে ব্যবহৃত হচ্ছে।" },
        { status: 400 }
      );
    }

    const newUser: any = await User.create({
      ...parsed.data,
      permissions: parsed.data.permissions as any,
      email: parsed.data.email.toLowerCase(),
    });

    await logAuditEvent({
      user: auth.user,
      action: "USER_CREATED",
      entityType: "User",
      entityId: newUser._id.toString(),
      afterSnapshot: {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });

    return NextResponse.json(
      { success: true, message: "কর্মী সফলভাবে তৈরি করা হয়েছে", user: newUser },
      { status: 201 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error creating user";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
