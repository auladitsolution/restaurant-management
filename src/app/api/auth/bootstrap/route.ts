import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { RestaurantSettings } from "@/models/RestaurantSettings";
import { AuditLog } from "@/models/AuditLog";
import { BootstrapOwnerSchema } from "@/lib/validation/schemas";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    // Check if an Owner already exists
    const existingOwner = await User.findOne({ role: "OWNER", active: true });
    if (existingOwner) {
      return NextResponse.json(
        {
          success: false,
          message: "রেস্টুরেন্টটিতে ইতিমধ্যে একজন সক্রিয় মালিক নিবন্ধিত আছে। বুটস্ট্র্যাপ নিষ্ক্রিয় করা হয়েছে।",
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = BootstrapOwnerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { setupToken, name, email, phone, firebaseUid } = parsed.data;

    const expectedToken = process.env.SETUP_SECRET_TOKEN;
    if (!expectedToken || setupToken !== expectedToken) {
      return NextResponse.json(
        { success: false, message: "অবৈধ সেটআপ সিক্রেট টোকেন!" },
        { status: 403 }
      );
    }

    // Create Owner user
    const owner = await User.create({
      firebaseUid,
      name,
      email: email.toLowerCase(),
      phone: phone || "",
      role: "OWNER",
      permissions: [],
      active: true,
    });

    // Create or update default restaurant settings
    let settings = await RestaurantSettings.findOne();
    if (!settings) {
      settings = await RestaurantSettings.create({
        name: "স্বাদ রেস্টুরেন্ট",
        nameBn: "স্বাদ রেস্টুরেন্ট",
        phone: phone || "01700000000",
        email: email.toLowerCase(),
      });
    }

    // Log the bootstrap audit event
    await AuditLog.create({
      userId: owner._id.toString(),
      userName: owner.name,
      userRole: "OWNER",
      action: "BOOTSTRAP_OWNER_CREATED",
      entityType: "User",
      entityId: owner._id.toString(),
      metadata: { email, setupTime: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: "মালিক অ্যাকাউন্ট সফলভাবে তৈরি এবং সক্রিয় করা হয়েছে!",
      user: {
        _id: owner._id.toString(),
        name: owner.name,
        email: owner.email,
        role: owner.role,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error during bootstrap";
    console.error("[Bootstrap Error]", error);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    const existingOwner = await User.findOne({ role: "OWNER", active: true });
    return NextResponse.json({
      isBootstrapped: !!existingOwner,
    });
  } catch {
    return NextResponse.json({ isBootstrapped: false }, { status: 500 });
  }
}
