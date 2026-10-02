import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requirePermission, logAuditEvent, notify } from "@/lib/auth/server-auth";
import { Order, IOrderDocument } from "@/models/Order";
import { MenuItem } from "@/models/MenuItem";
import { Table } from "@/models/Table";
import { Customer } from "@/models/Customer";
import { RestaurantSettings } from "@/models/RestaurantSettings";
import { OrderCreateSchema } from "@/lib/validation/schemas";
import {
  calculateOrderTotals,
  determinePaymentStatus,
  calculateDue,
  roundCurrency,
} from "@/lib/calculations/financial";
import { deductInventoryForOrder } from "@/services/inventory-service";
import { IOrderItem } from "@/types";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, "orders:read");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const status = searchParams.get("status");
    const kitchenStatus = searchParams.get("kitchenStatus");
    const orderType = searchParams.get("orderType");
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};
    if (status && status !== "ALL") filter.orderStatus = status;
    if (kitchenStatus && kitchenStatus !== "ALL") filter.kitchenStatus = kitchenStatus;
    if (orderType && orderType !== "ALL") filter.orderType = orderType;

    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { customerPhone: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { tableName: { $regex: search, $options: "i" } },
      ];
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<IOrderDocument[]>(),
      Order.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error fetching orders";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, "orders:create");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const parsed = OrderCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // 1. Fetch Restaurant Settings for VAT & Service Charge
    const settings = await RestaurantSettings.findOne().lean();
    const vatEnabled = settings?.vatEnabled ?? false;
    const vatRate = vatEnabled ? (settings?.vatRate ?? 0) : 0;
    const serviceChargeEnabled = settings?.serviceChargeEnabled ?? false;
    const serviceChargeRate = serviceChargeEnabled ? (settings?.serviceChargeRate ?? 0) : 0;

    // 2. Fetch fresh items from database to prevent client price tampering
    const validatedItems: IOrderItem[] = [];
    for (const item of parsed.data.items) {
      const dbItem = await MenuItem.findById(item.menuItemId);
      if (!dbItem) {
        return NextResponse.json(
          { success: false, message: `মেনু আইটেম পাওয়া যায়নি: ${item.nameBn}` },
          { status: 400 }
        );
      }

      if (!dbItem.availability || !dbItem.active) {
        return NextResponse.json(
          { success: false, message: `${dbItem.nameBn} বর্তমানে উপলব্ধ নয়।` },
          { status: 400 }
        );
      }

      let unitPrice = dbItem.basePrice;
      let costPrice = dbItem.costPrice || 0;
      let variantNameBn = "";
      let variantNameEn = "";

      if (dbItem.hasVariants && item.variantNameBn) {
        const foundVariant = dbItem.variants.find(
          (v) => v.nameBn === item.variantNameBn || v.nameEn === item.variantNameEn
        );
        if (foundVariant) {
          unitPrice = foundVariant.price;
          costPrice = foundVariant.costPrice || costPrice;
          variantNameBn = foundVariant.nameBn;
          variantNameEn = foundVariant.nameEn;
        }
      }

      // Validated AddOns
      const validAddOns = (item.addOns || []).map((a) => {
        const matched = dbItem.addOns.find((dbA) => dbA.nameBn === a.nameBn);
        return {
          nameBn: a.nameBn,
          price: matched ? matched.price : a.price,
        };
      });

      const addOnsTotal = validAddOns.reduce((sum, a) => sum + a.price, 0);
      const itemTotal = roundCurrency((unitPrice + addOnsTotal) * item.quantity);

      validatedItems.push({
        menuItemId: dbItem._id.toString(),
        nameBn: dbItem.nameBn,
        nameEn: dbItem.nameEn,
        variantNameBn,
        variantNameEn,
        unitPrice,
        costPrice,
        quantity: item.quantity,
        totalPrice: itemTotal,
        notes: item.notes || "",
        addOns: validAddOns,
      });
    }

    // 3. Strict Server Recalculation
    const totals = calculateOrderTotals({
      items: validatedItems,
      discountType: parsed.data.discountType,
      discountRate: parsed.data.discountRate,
      vatEnabled,
      vatRate,
      serviceChargeEnabled,
      serviceChargeRate,
      deliveryCharge: parsed.data.orderType === "DELIVERY" ? parsed.data.deliveryCharge : 0,
    });

    // 4. Calculate Payments
    const paymentRecords = (parsed.data.paymentRecords || []).map((p) => ({
      method: p.method,
      amount: roundCurrency(p.amount),
      reference: p.reference || "",
      note: p.note || "",
      receivedAt: p.receivedAt ? new Date(p.receivedAt) : new Date(),
    }));

    const paidAmount = roundCurrency(
      paymentRecords.reduce((sum, p) => sum + p.amount, 0)
    );
    const dueAmount = calculateDue(totals.grandTotal, paidAmount);
    const paymentStatus = determinePaymentStatus(totals.grandTotal, paidAmount);

    // 5. Generate unique sequential Order Number
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const countToday = await Order.countDocuments({
      createdAt: {
        $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      },
    });
    const orderSeq = String(countToday + 1).padStart(4, "0");
    const orderPrefix = settings?.orderPrefix || "ORD-";
    const orderNumber = `${orderPrefix}${dateStr}-${orderSeq}`;

    // 6. Handle Dine-in Table
    let tableDoc = null;
    if (parsed.data.orderType === "DINE_IN" && parsed.data.tableId) {
      tableDoc = await Table.findById(parsed.data.tableId);
      if (tableDoc) {
        tableDoc.status = "OCCUPIED";
      }
    }

    // 7. Handle Customer (auto-create or update totals)
    let customerDoc = null;
    if (parsed.data.customerPhone) {
      const cleanPhone = parsed.data.customerPhone.trim();
      customerDoc = await Customer.findOne({ phone: cleanPhone });
      if (!customerDoc) {
        customerDoc = await Customer.create({
          name: parsed.data.customerName || "অতিথি",
          phone: cleanPhone,
          address: parsed.data.deliveryAddress || "",
          totalOrders: 1,
          totalSpent: totals.grandTotal,
          totalDue: dueAmount,
          lastOrderDate: new Date(),
        });
      } else {
        customerDoc.totalOrders += 1;
        customerDoc.totalSpent = roundCurrency(customerDoc.totalSpent + totals.grandTotal);
        customerDoc.totalDue = roundCurrency(customerDoc.totalDue + dueAmount);
        customerDoc.lastOrderDate = new Date();
        if (parsed.data.customerName) customerDoc.name = parsed.data.customerName;
        if (parsed.data.deliveryAddress) customerDoc.address = parsed.data.deliveryAddress;
        await customerDoc.save();
      }
    }

    // 8. Create Order Document
    const newOrder = await Order.create({
      orderNumber,
      orderType: parsed.data.orderType,
      tableId: tableDoc?._id,
      tableName: tableDoc?.tableNumber || parsed.data.tableName,
      floorName: tableDoc?.floor || parsed.data.floorName,
      guestCount: parsed.data.guestCount || 1,
      customerId: customerDoc?._id,
      customerName: customerDoc?.name || parsed.data.customerName,
      customerPhone: customerDoc?.phone || parsed.data.customerPhone,
      deliveryAddress: parsed.data.deliveryAddress,
      waiterId: parsed.data.waiterId,
      waiterName: parsed.data.waiterName,
      items: validatedItems,
      subtotal: totals.subtotal,
      discountType: parsed.data.discountType,
      discountRate: parsed.data.discountRate,
      discountAmount: totals.discountAmount,
      vatRate,
      vatAmount: totals.vatAmount,
      serviceChargeRate,
      serviceChargeAmount: totals.serviceChargeAmount,
      deliveryCharge: totals.deliveryCharge,
      grandTotal: totals.grandTotal,
      paidAmount,
      dueAmount,
      paymentStatus,
      paymentRecords,
      orderStatus: "CONFIRMED",
      kitchenStatus: "NEW",
      notes: parsed.data.notes,
      inventoryDeducted: false,
      createdBy: {
        userId: auth.user._id,
        name: auth.user.name,
        role: auth.user.role,
      },
    });

    // Link table to order
    if (tableDoc) {
      tableDoc.activeOrderId = newOrder._id;
      await tableDoc.save();
    }

    // 9. Auto Deduct Recipe Ingredients if enabled
    const autoDeduct = settings?.features?.autoIngredientDeduction ?? true;
    if (autoDeduct) {
      const deducted = await deductInventoryForOrder(
        newOrder._id.toString(),
        newOrder.orderNumber,
        validatedItems,
        { userId: auth.user._id, name: auth.user.name }
      );
      if (deducted) {
        newOrder.inventoryDeducted = true;
        await newOrder.save();
      }
    }

    // 10. Audit Log & Notifications
    await logAuditEvent({
      user: auth.user,
      action: "ORDER_CREATED",
      entityType: "Order",
      entityId: newOrder._id.toString(),
      afterSnapshot: {
        orderNumber: newOrder.orderNumber,
        grandTotal: newOrder.grandTotal,
        orderType: newOrder.orderType,
        paymentStatus: newOrder.paymentStatus,
      },
    });

    await notify({
      title: "নতুন অর্ডার তৈরি হয়েছে",
      message: `অর্ডার নম্বর: ${orderNumber}, পরিমাণ: ৳${totals.grandTotal}`,
      type: "ORDER",
      relatedEntityId: newOrder._id.toString(),
      relatedEntityType: "ORDER",
    });

    return NextResponse.json(
      {
        success: true,
        message: "অর্ডার সফলভাবে তৈরি হয়েছে",
        order: newOrder,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error creating order";
    console.error("[Create Order Error]", error);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
