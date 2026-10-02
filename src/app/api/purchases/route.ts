import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requirePermission, logAuditEvent } from "@/lib/auth/server-auth";
import { Purchase, IPurchaseDocument } from "@/models/Purchase";
import { InventoryItem } from "@/models/InventoryItem";
import { Supplier } from "@/models/Supplier";
import { StockMovement } from "@/models/StockMovement";
import { PurchaseSchema } from "@/lib/validation/schemas";
import { roundCurrency, convertUnitQuantity } from "@/lib/calculations/financial";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, "purchases:manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const supplierId = searchParams.get("supplierId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};
    if (supplierId && supplierId !== "ALL") filter.supplierId = supplierId;
    if (startDate || endDate) {
      filter.purchaseDate = {};
      if (startDate) filter.purchaseDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.purchaseDate.$lte = end;
      }
    }

    const purchases = await Purchase.find(filter)
      .sort({ purchaseDate: -1 })
      .lean<IPurchaseDocument[]>();

    return NextResponse.json({ success: true, purchases });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error fetching purchases";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, "purchases:manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const parsed = PurchaseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const supplier = await Supplier.findById(parsed.data.supplierId);
    if (!supplier) {
      return NextResponse.json(
        { success: false, message: "নির্বাচিত সাপ্লায়ার পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    // Calculate subtotal
    let subtotal = 0;
    const validatedItems = parsed.data.items.map((item) => {
      const totalCost = roundCurrency(item.quantity * item.unitCost);
      subtotal = roundCurrency(subtotal + totalCost);
      return {
        ...item,
        totalCost,
      };
    });

    const discount = roundCurrency(parsed.data.discount);
    const totalAmount = roundCurrency(Math.max(0, subtotal - discount));
    const paidAmount = roundCurrency(Math.min(totalAmount, parsed.data.paidAmount));
    const dueAmount = roundCurrency(Math.max(0, totalAmount - paidAmount));

    // Generate purchaseNumber
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const countToday = await Purchase.countDocuments({
      createdAt: {
        $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      },
    });
    const purchaseSeq = String(countToday + 1).padStart(3, "0");
    const purchaseNumber = `PUR-${dateStr}-${purchaseSeq}`;

    // 1. Create Purchase record
    const purchase = await Purchase.create({
      purchaseNumber,
      supplierId: supplier._id,
      supplierName: supplier.name,
      items: validatedItems,
      subtotal,
      discount,
      totalAmount,
      paidAmount,
      dueAmount,
      paymentMethod: parsed.data.paymentMethod,
      paymentReference: parsed.data.paymentReference,
      status: "RECEIVED",
      purchaseDate: parsed.data.purchaseDate || new Date(),
      notes: parsed.data.notes,
      attachment: parsed.data.attachment,
      createdBy: {
        userId: auth.user._id,
        name: auth.user.name,
      },
    });

    // 2. Increment Inventory Stock and record StockMovement
    for (const item of validatedItems) {
      const inventoryItem = await InventoryItem.findById(item.inventoryItemId);
      if (!inventoryItem) continue;

      const quantityInStockUnit = convertUnitQuantity(
        item.quantity,
        item.unit,
        inventoryItem.unit
      );

      const prevStock = inventoryItem.currentStock;
      const newStock = roundCurrency(prevStock + quantityInStockUnit);

      // Weighted average cost calculation
      const currentTotalVal = prevStock * inventoryItem.averageCost;
      const newTotalVal = currentTotalVal + item.totalCost;
      const newAvgCost = newStock > 0 ? roundCurrency(newTotalVal / newStock) : item.unitCost;

      inventoryItem.currentStock = newStock;
      inventoryItem.averageCost = newAvgCost;
      await inventoryItem.save();

      await StockMovement.create({
        inventoryItemId: inventoryItem._id,
        inventoryItemName: inventoryItem.nameBn,
        unit: inventoryItem.unit,
        type: "PURCHASE",
        quantityDelta: quantityInStockUnit,
        previousStock: prevStock,
        newStock: newStock,
        unitCost: item.unitCost,
        totalCost: item.totalCost,
        referenceType: "PURCHASE",
        referenceId: purchaseNumber,
        reason: `সাপ্লায়ার ক্রয় (${supplier.name})`,
        performedBy: {
          userId: auth.user._id,
          name: auth.user.name,
        },
      });
    }

    // 3. Update Supplier Due
    if (dueAmount > 0) {
      supplier.currentDue = roundCurrency(supplier.currentDue + dueAmount);
      await supplier.save();
    }

    // 4. Audit Log
    await logAuditEvent({
      user: auth.user,
      action: "PURCHASE_CREATED",
      entityType: "Purchase",
      entityId: purchase._id.toString(),
      afterSnapshot: {
        purchaseNumber,
        supplierName: supplier.name,
        totalAmount,
        dueAmount,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "ক্রয় সফলভাবে সম্পন্ন হয়েছে এবং ইনভেন্টরি স্টক বৃদ্ধি করা হয়েছে",
        purchase,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error creating purchase";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
