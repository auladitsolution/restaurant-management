import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requirePermission, logAuditEvent } from "@/lib/auth/server-auth";
import { CashShift, ICashShiftDocument } from "@/models/CashShift";
import { Order } from "@/models/Order";
import { CashShiftOpenSchema, CashShiftCloseSchema } from "@/lib/validation/schemas";
import { calculateShiftExpectedCash, roundCurrency } from "@/lib/calculations/financial";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, "shifts:manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const current = searchParams.get("current") === "true";

    if (current) {
      // Find current open shift for this user
      const openShift = await CashShift.findOne({
        cashierId: auth.user._id,
        status: "OPEN",
      }).lean();

      if (openShift) {
        // Calculate real-time cash sales during this shift window
        const orders = await Order.find({
          createdAt: { $gte: openShift.startTime },
          "paymentRecords.method": "CASH",
          orderStatus: { $ne: "CANCELLED" },
        }).lean();

        let liveCashSales = 0;
        for (const order of orders) {
          for (const pay of order.paymentRecords) {
            if (pay.method === "CASH") {
              liveCashSales = roundCurrency(liveCashSales + pay.amount);
            }
          }
        }

        const expectedCash = calculateShiftExpectedCash({
          openingCash: openShift.openingCash,
          cashSales: liveCashSales,
          cashIn: openShift.cashIn || 0,
          cashOut: openShift.cashOut || 0,
          refunds: openShift.refunds || 0,
        });

        return NextResponse.json({
          success: true,
          shift: {
            ...openShift,
            cashSales: liveCashSales,
            expectedCash,
          },
        });
      }

      return NextResponse.json({ success: true, shift: null });
    }

    const shifts = await CashShift.find({})
      .sort({ startTime: -1 })
      .limit(50)
      .lean<ICashShiftDocument[]>();

    return NextResponse.json({ success: true, shifts });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error fetching shifts";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, "shifts:manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const action = body.action || "OPEN";

    await connectToDatabase();

    if (action === "OPEN") {
      const parsed = CashShiftOpenSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, errors: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      // Check if already has open shift
      const existing = await CashShift.findOne({
        cashierId: auth.user._id,
        status: "OPEN",
      });
      if (existing) {
        return NextResponse.json(
          { success: false, message: "আপনার ইতিমধ্যে একটি সক্রিয় শিফট চালু আছে।" },
          { status: 400 }
        );
      }

      const today = new Date();
      const count = await CashShift.countDocuments();
      const shiftNumber = `SFT-${today.toISOString().slice(0, 10).replace(/-/g, "")}-${count + 1}`;

      const shift = await CashShift.create({
        shiftNumber,
        cashierId: auth.user._id,
        cashierName: auth.user.name,
        startTime: new Date(),
        openingCash: roundCurrency(parsed.data.openingCash),
        expectedCash: roundCurrency(parsed.data.openingCash),
        status: "OPEN",
        notes: parsed.data.notes,
      });

      await logAuditEvent({
        user: auth.user,
        action: "CASH_SHIFT_OPENED",
        entityType: "CashShift",
        entityId: shift._id.toString(),
        afterSnapshot: shift.toObject(),
      });

      return NextResponse.json(
        { success: true, message: "শিফট সফলভাবে ওপেন করা হয়েছে", shift },
        { status: 201 }
      );
    } else if (action === "CLOSE") {
      const parsed = CashShiftCloseSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, errors: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const shift = await CashShift.findOne({
        cashierId: auth.user._id,
        status: "OPEN",
      });

      if (!shift) {
        return NextResponse.json(
          { success: false, message: "কোন সক্রিয় শিফট পাওয়া যায়নি।" },
          { status: 404 }
        );
      }

      // Calculate cash sales during this shift window
      const orders = await Order.find({
        createdAt: { $gte: shift.startTime },
        "paymentRecords.method": "CASH",
        orderStatus: { $ne: "CANCELLED" },
      }).lean();

      let liveCashSales = 0;
      for (const order of orders) {
        for (const pay of order.paymentRecords) {
          if (pay.method === "CASH") {
            liveCashSales = roundCurrency(liveCashSales + pay.amount);
          }
        }
      }

      const expectedCash = calculateShiftExpectedCash({
        openingCash: shift.openingCash,
        cashSales: liveCashSales,
        cashIn: shift.cashIn || 0,
        cashOut: shift.cashOut || 0,
        refunds: shift.refunds || 0,
      });

      const actualCash = roundCurrency(parsed.data.actualCash);
      const difference = roundCurrency(actualCash - expectedCash);

      shift.endTime = new Date();
      shift.cashSales = liveCashSales;
      shift.expectedCash = expectedCash;
      shift.actualCash = actualCash;
      shift.difference = difference;
      shift.status = "CLOSED";
      if (parsed.data.notes) {
        shift.notes = (shift.notes ? shift.notes + " | " : "") + parsed.data.notes;
      }

      await shift.save();

      await logAuditEvent({
        user: auth.user,
        action: "CASH_SHIFT_CLOSED",
        entityType: "CashShift",
        entityId: shift._id.toString(),
        afterSnapshot: {
          expectedCash,
          actualCash,
          difference,
        },
      });

      return NextResponse.json({
        success: true,
        message: "শিফট সফলভাবে ক্লোজ করা হয়েছে",
        shift,
      });
    }

    return NextResponse.json({ success: false, message: "অবৈধ অ্যাকশন" }, { status: 400 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error managing shift";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
