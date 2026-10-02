import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requirePermission, logAuditEvent } from "@/lib/auth/server-auth";
import { MenuItem, IMenuItemDocument } from "@/models/MenuItem";
import { Category } from "@/models/Category";
import { MenuItemSchema } from "@/lib/validation/schemas";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("category");
    const search = searchParams.get("search");
    const activeOnly = searchParams.get("activeOnly") !== "false";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};
    if (activeOnly) {
      filter.active = true;
    }
    if (categoryId && categoryId !== "all") {
      filter.categoryId = categoryId;
    }
    if (search) {
      filter.$or = [
        { nameBn: { $regex: search, $options: "i" } },
        { nameEn: { $regex: search, $options: "i" } },
      ];
    }

    const items = await MenuItem.find(filter)
      .populate("categoryId", "nameBn nameEn")
      .sort({ createdAt: -1 })
      .lean<IMenuItemDocument[]>();

    return NextResponse.json({ success: true, items });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error fetching menu items";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, "menu:manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const parsed = MenuItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Verify category exists
    const category = await Category.findById(parsed.data.categoryId);
    if (!category) {
      return NextResponse.json(
        { success: false, message: "নির্বাচিত ক্যাটাগরি পাওয়া যায়নি" },
        { status: 400 }
      );
    }

    const menuItem = await MenuItem.create({
      ...parsed.data,
      categoryName: category.nameBn,
    });

    await logAuditEvent({
      user: auth.user,
      action: "MENU_ITEM_CREATED",
      entityType: "MenuItem",
      entityId: menuItem._id.toString(),
      afterSnapshot: {
        nameBn: menuItem.nameBn,
        nameEn: menuItem.nameEn,
        basePrice: menuItem.basePrice,
      },
    });

    return NextResponse.json(
      { success: true, message: "মেনু আইটেম সফলভাবে যোগ করা হয়েছে", item: menuItem },
      { status: 201 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error creating menu item";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
