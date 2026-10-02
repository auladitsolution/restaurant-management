import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requirePermission } from "@/lib/auth/server-auth";
import { AuditLog, IAuditLogDocument } from "@/models/AuditLog";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, "audit:view");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const entityType = searchParams.get("entityType");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};
    if (action) filter.action = action;
    if (entityType) filter.entityType = entityType;

    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(100)
      .lean<IAuditLogDocument[]>();

    return NextResponse.json({ success: true, logs });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error fetching audit logs";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
