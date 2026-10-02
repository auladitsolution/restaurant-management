import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requireAuth } from "@/lib/auth/server-auth";
import { Notification, INotificationDocument } from "@/models/Notification";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    await connectToDatabase();
    const notifications = await Notification.find({})
      .sort({ createdAt: -1 })
      .limit(30)
      .lean<INotificationDocument[]>();

    const unreadCount = await Notification.countDocuments({ read: false });

    return NextResponse.json({ success: true, notifications, unreadCount });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error fetching notifications";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const { notificationId, markAll } = body;

    await connectToDatabase();

    if (markAll) {
      await Notification.updateMany({ read: false }, { read: true });
      return NextResponse.json({ success: true, message: "সব নোটিফিকেশন পড়া হিসেবে চিহ্নিত হয়েছে" });
    }

    if (notificationId) {
      await Notification.findByIdAndUpdate(notificationId, { read: true });
      return NextResponse.json({ success: true, message: "পড়া হিসেবে চিহ্নিত হয়েছে" });
    }

    return NextResponse.json({ success: false, message: "অবৈধ রিকোয়েস্ট" }, { status: 400 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error updating notification";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
