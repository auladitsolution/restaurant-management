import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requireAuth } from "@/lib/auth/server-auth";
import { Order } from "@/models/Order";
import { Customer } from "@/models/Customer";
import { MenuItem } from "@/models/MenuItem";
import { Supplier } from "@/models/Supplier";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").trim();

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        results: { orders: [], customers: [], menuItems: [], suppliers: [] },
      });
    }

    await connectToDatabase();
    const regex = new RegExp(query, "i");

    const [orders, customers, menuItems, suppliers] = await Promise.all([
      Order.find({
        $or: [
          { orderNumber: regex },
          { customerPhone: regex },
          { customerName: regex },
        ],
      })
        .select("orderNumber customerName grandTotal orderStatus createdAt")
        .limit(5)
        .lean(),

      Customer.find({
        active: true,
        $or: [{ name: regex }, { phone: regex }],
      })
        .select("name phone totalDue totalSpent")
        .limit(5)
        .lean(),

      MenuItem.find({
        active: true,
        $or: [{ nameBn: regex }, { nameEn: regex }],
      })
        .select("nameBn nameEn basePrice categoryName availability image")
        .limit(5)
        .lean(),

      Supplier.find({
        active: true,
        $or: [{ name: regex }, { company: regex }, { phone: regex }],
      })
        .select("name company phone currentDue")
        .limit(5)
        .lean(),
    ]);

    return NextResponse.json({
      success: true,
      results: {
        orders,
        customers,
        menuItems,
        suppliers,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error performing search";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
