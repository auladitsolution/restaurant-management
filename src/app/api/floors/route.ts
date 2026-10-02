import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requirePermission } from "@/lib/auth/server-auth";
import { Floor, IFloorDocument } from "@/models/Floor";
import { FloorSchema } from "@/lib/validation/schemas";

export async function GET() {
  try {
    await connectToDatabase();
    let floors = await Floor.find({ active: true }).sort({ sortOrder: 1 }).lean<IFloorDocument[]>();
    if (floors.length === 0) {
      // Auto seed standard Ground Floor
      const defaultFloor = await Floor.create({
        name: "Ground Floor",
        nameBn: "নিচতলা",
        sortOrder: 1,
        active: true,
      });
      floors = [defaultFloor.toObject()];
    }
    return NextResponse.json({ success: true, floors });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error fetching floors";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, "tables:manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const parsed = FloorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const floor = await Floor.create(parsed.data);

    return NextResponse.json(
      { success: true, message: "ফ্লোর যোগ করা হয়েছে", floor },
      { status: 201 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error creating floor";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
