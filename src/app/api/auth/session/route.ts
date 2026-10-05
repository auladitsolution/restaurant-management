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

    // 1. Try to find user by firebaseUid
    let user = await User.findOne({ firebaseUid: verified.uid }).lean<IUserDocument | null>();

    // 2. If not found by firebaseUid, look up by email to link Google account
    if (!user && verified.email) {
      const existingByEmail = await User.findOne({ email: verified.email.toLowerCase() });
      if (existingByEmail) {
        existingByEmail.firebaseUid = verified.uid;
        if (verified.picture && !existingByEmail.photo) {
          existingByEmail.photo = verified.picture;
        }
        if (verified.name && (!existingByEmail.name || existingByEmail.name.startsWith("Dev "))) {
          existingByEmail.name = verified.name;
        }
        await existingByEmail.save();
        user = existingByEmail.toObject();
      }
    }

    // 3. In local development, if this is a dev user and doesn't exist, create it automatically
    if (!user && process.env.NODE_ENV !== "production" && verified.uid.startsWith("dev-uid-")) {
      const validRoles = ["OWNER", "MANAGER", "CASHIER", "WAITER", "KITCHEN", "INVENTORY_MANAGER"];
      const roleStr = verified.uid.replace("dev-uid-", "").toUpperCase();
      const role = (validRoles.includes(roleStr) ? roleStr : "OWNER") as any;

      const createdDev = await User.create({
        firebaseUid: verified.uid,
        name: `Dev ${role}`,
        email: `${role.toLowerCase()}@swadrestaurant.com`,
        phone: "01711000000",
        role: role,
        permissions: [],
        active: true,
      });
      user = createdDev.toObject();
    }

    // 4. If still not found and email is available:
    // Check if this matches INITIAL_OWNER_EMAIL or if no real owner exists yet in MongoDB
    if (!user && verified.email) {
      const initialOwnerEmail = (process.env.INITIAL_OWNER_EMAIL || "").toLowerCase().trim();
      const isInitialOwner = initialOwnerEmail && verified.email.toLowerCase() === initialOwnerEmail;
      const hasRealOwner = await User.exists({
        role: "OWNER",
        active: true,
        firebaseUid: { $not: /^dev-uid-/ },
      });

      if (isInitialOwner || !hasRealOwner) {
        const createdOwner = await User.create({
          firebaseUid: verified.uid,
          name: verified.name || verified.email.split("@")[0],
          email: verified.email.toLowerCase(),
          phone: "",
          role: "OWNER",
          permissions: [],
          photo: verified.picture,
          active: true,
        });
        user = createdOwner.toObject();
      }
    }

    if (!user) {
      return NextResponse.json(
        { user: null, message: "অ্যাকাউন্টটি সিস্টেমে নিবন্ধিত নয়। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।" },
        { status: 200 }
      );
    }

    if (!user.active) {
      return NextResponse.json({ user: null, message: "ব্যবহারকারী অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে।" }, { status: 200 });
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
