import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { verifyFirebaseToken } from "@/lib/firebase/admin";
import { User, IUserDocument } from "@/models/User";
import { RestaurantSettings } from "@/models/RestaurantSettings";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    let token = "";

    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    } else {
      const cookie = req.cookies.get("auth-token");
      if (cookie) token = cookie.value;
    }

    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const verified = await verifyFirebaseToken(token);
    if (!verified || !verified.uid) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    await connectToDatabase();

    // Ensure settings exist
    let settings = await RestaurantSettings.findOne().lean();
    if (!settings) {
      settings = await RestaurantSettings.create({});
    }

    let user = await User.findOne({ firebaseUid: verified.uid }).lean<IUserDocument | null>();

    // In local development, if this is a dev user and doesn't exist, create it automatically
    if (!user && process.env.NODE_ENV !== "production" && verified.uid.startsWith("dev-uid-")) {
      const validRoles = ["OWNER", "MANAGER", "CASHIER", "WAITER", "KITCHEN", "INVENTORY_MANAGER"];
      const roleStr = verified.uid.replace("dev-uid-", "").toUpperCase();
      const role = (validRoles.includes(roleStr) ? roleStr : "OWNER") as any;

      user = await User.create({
        firebaseUid: verified.uid,
        name: `Dev ${role}`,
        email: `${role.toLowerCase()}@swadrestaurant.com`,
        phone: "01711000000",
        role: role,
        permissions: [],
        active: true,
      });
    }

    if (!user || !user.active) {
      return NextResponse.json({ user: null, message: "ব্যবহারকারী সক্রিয় নয়" }, { status: 200 });
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id.toString(),
        firebaseUid: user.firebaseUid,
        name: user.name,
        email: user.email,
        phone: user.phone,
        photo: user.photo,
        role: user.role,
        permissions: user.permissions || [],
        active: user.active,
      },
      settings,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    console.error("[Session API Error]", error);
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
