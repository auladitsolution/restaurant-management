import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requirePermission, logAuditEvent } from "@/lib/auth/server-auth";
import { RestaurantSettings, IRestaurantSettingsDocument } from "@/models/RestaurantSettings";
import { SettingsSchema } from "@/lib/validation/schemas";

export async function GET() {
  try {
    await connectToDatabase();
    let settings = await RestaurantSettings.findOne().lean<IRestaurantSettingsDocument | null>();
    if (!settings) {
      settings = await RestaurantSettings.create({});
    }
    return NextResponse.json({ success: true, settings });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error fetching settings";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requirePermission(req, "settings:manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const parsed = SettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectToDatabase();
    let settings = await RestaurantSettings.findOne();

    const beforeSnapshot = settings ? settings.toObject() : undefined;

    if (!settings) {
      settings = new RestaurantSettings(parsed.data);
    } else {
      Object.assign(settings, parsed.data);
    }

    await settings.save();

    await logAuditEvent({
      user: auth.user,
      action: "SETTINGS_UPDATED",
      entityType: "RestaurantSettings",
      entityId: settings._id.toString(),
      beforeSnapshot,
      afterSnapshot: settings.toObject(),
    });

    return NextResponse.json({
      success: true,
      message: "সেটিংস সফলভাবে সংরক্ষিত হয়েছে",
      settings,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error updating settings";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
