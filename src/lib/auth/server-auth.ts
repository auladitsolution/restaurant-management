import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { verifyFirebaseToken } from "@/lib/firebase/admin";
import { User, IUserDocument } from "@/models/User";
import { AuditLog } from "@/models/AuditLog";
import { Notification } from "@/models/Notification";
import { hasPermission, hasRole } from "@/lib/permissions/rbac";
import { Permission, UserRole, IUser } from "@/types";

export interface AuthenticatedUser extends IUser {
  _id: string;
}

/**
 * Authenticates an incoming Next.js API Request using Firebase ID token
 * and attaches verified user record from MongoDB.
 */
export async function authenticateRequest(
  req: Request
): Promise<AuthenticatedUser | null> {
  const authHeader = req.headers.get("authorization") || "";
  let token = "";

  if (authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  }

  // Also check cookie if header is absent
  if (!token) {
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/auth-token=([^;]+)/);
    if (match) {
      token = match[1];
    }
  }

  if (!token) {
    return null;
  }

  const verified = await verifyFirebaseToken(token);
  if (!verified || !verified.uid) {
    return null;
  }

  await connectToDatabase();
  let dbUser = await User.findOne({
    firebaseUid: verified.uid,
    active: true,
  }).lean<IUserDocument | null>();

  // If not found by firebaseUid, look up by email and link
  if (!dbUser && verified.email) {
    const existing = await User.findOne({ email: verified.email.toLowerCase(), active: true });
    if (existing) {
      existing.firebaseUid = verified.uid;
      await existing.save();
      dbUser = existing.toObject();
    }
  }

  if (!dbUser && process.env.NODE_ENV !== "production" && verified.uid.startsWith("dev-uid-")) {
    const validRoles = ["OWNER", "MANAGER", "CASHIER", "WAITER", "KITCHEN", "INVENTORY_MANAGER"];
    const roleStr = verified.uid.replace("dev-uid-", "").toUpperCase();
    const role = (validRoles.includes(roleStr) ? roleStr : "OWNER") as UserRole;

    const created = await User.create({
      firebaseUid: verified.uid,
      name: `Dev ${role}`,
      email: `${role.toLowerCase()}@swadrestaurant.com`,
      phone: "01711000000",
      role: role,
      permissions: [],
      active: true,
    });
    dbUser = created.toObject();
  }

  if (!dbUser) {
    return null;
  }

  return {
    _id: dbUser._id.toString(),
    firebaseUid: dbUser.firebaseUid,
    name: dbUser.name,
    email: dbUser.email,
    phone: dbUser.phone,
    photo: dbUser.photo,
    role: dbUser.role,
    permissions: dbUser.permissions || [],
    active: dbUser.active,
    createdAt: dbUser.createdAt,
    updatedAt: dbUser.updatedAt,
  };
}

/**
 * Enforces authentication. Returns the user or a JSON 401 error response.
 */
export async function requireAuth(
  req: Request
): Promise<{ user: AuthenticatedUser } | { errorResponse: NextResponse }> {
  const user = await authenticateRequest(req);
  if (!user) {
    return {
      errorResponse: NextResponse.json(
        { success: false, message: "অননুমোদিত প্রবেশাধিকার। অনুগ্রহ করে লগইন করুন।" },
        { status: 401 }
      ),
    };
  }
  return { user };
}

/**
 * Enforces a specific RBAC permission.
 */
export async function requirePermission(
  req: Request,
  permission: Permission
): Promise<{ user: AuthenticatedUser } | { errorResponse: NextResponse }> {
  const auth = await requireAuth(req);
  if ("errorResponse" in auth) {
    return auth;
  }

  if (!hasPermission(auth.user, permission)) {
    return {
      errorResponse: NextResponse.json(
        {
          success: false,
          message: "এই কাজটি সম্পাদনের অনুমতি আপনার নেই।",
          requiredPermission: permission,
        },
        { status: 403 }
      ),
    };
  }

  return auth;
}

/**
 * Enforces specific role membership.
 */
export async function requireRole(
  req: Request,
  allowedRoles: UserRole[]
): Promise<{ user: AuthenticatedUser } | { errorResponse: NextResponse }> {
  const auth = await requireAuth(req);
  if ("errorResponse" in auth) {
    return auth;
  }

  if (!hasRole(auth.user, allowedRoles)) {
    return {
      errorResponse: NextResponse.json(
        { success: false, message: "আপনার রোল এই কাজের জন্য অনুমোদিত নয়।" },
        { status: 403 }
      ),
    };
  }

  return auth;
}

/**
 * Helper to record an audit log entry for sensitive operations
 */
export async function logAuditEvent(params: {
  user: AuthenticatedUser;
  action: string;
  entityType: string;
  entityId?: string;
  beforeSnapshot?: any;
  afterSnapshot?: any;
  metadata?: any;
}): Promise<void> {
  try {
    await connectToDatabase();
    await AuditLog.create({
      userId: params.user._id,
      userName: params.user.name,
      userRole: params.user.role,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      beforeSnapshot: params.beforeSnapshot,
      afterSnapshot: params.afterSnapshot,
      metadata: params.metadata,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error("[AuditLog Error]", err);
  }
}

/**
 * Helper to create an in-app notification
 */
export async function notify(params: {
  title: string;
  message: string;
  type: "ORDER" | "KITCHEN" | "LOW_STOCK" | "CUSTOMER_DUE" | "SUPPLIER_DUE" | "SYSTEM";
  relatedEntityId?: string;
  relatedEntityType?: "ORDER" | "INVENTORY" | "CUSTOMER" | "SUPPLIER";
}): Promise<void> {
  try {
    await connectToDatabase();
    await Notification.create({
      title: params.title,
      message: params.message,
      type: params.type,
      relatedEntityId: params.relatedEntityId,
      relatedEntityType: params.relatedEntityType,
      read: false,
    });
  } catch (err) {
    console.error("[Notification Error]", err);
  }
}
