import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requirePermission } from "@/lib/auth/server-auth";
import { Order } from "@/models/Order";
import { Expense } from "@/models/Expense";
import { InventoryItem } from "@/models/InventoryItem";
import { Customer } from "@/models/Customer";
import { roundCurrency } from "@/lib/calculations/financial";
import { startOfDay, endOfDay, subDays, startOfMonth } from "date-fns";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, "reports:view");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "today"; // today, yesterday, 7days, month, custom
    const customStart = searchParams.get("startDate");
    const customEnd = searchParams.get("endDate");

    const now = new Date();
    let startDate = startOfDay(now);
    let endDate = endOfDay(now);

    if (range === "yesterday") {
      const yesterday = subDays(now, 1);
      startDate = startOfDay(yesterday);
      endDate = endOfDay(yesterday);
    } else if (range === "7days") {
      startDate = startOfDay(subDays(now, 7));
      endDate = endOfDay(now);
    } else if (range === "month") {
      startDate = startOfMonth(now);
      endDate = endOfDay(now);
    } else if (range === "custom" && customStart && customEnd) {
      startDate = startOfDay(new Date(customStart));
      endDate = endOfDay(new Date(customEnd));
    }

    // 1. Fetch valid orders in range
    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
      orderStatus: { $ne: "CANCELLED" },
    }).lean();

    // 2. Fetch expenses in range
    const expenses = await Expense.find({
      date: { $gte: startDate, $lte: endDate },
    }).lean();

    // 3. Compute KPI Metrics
    const totalSales = roundCurrency(orders.reduce((sum, o) => sum + o.grandTotal, 0));
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? roundCurrency(totalSales / totalOrders) : 0;
    const totalExpense = roundCurrency(expenses.reduce((sum, e) => sum + e.amount, 0));

    // COGS (Cost of Goods Sold)
    let totalCOGS = 0;
    let missingCostItemsCount = 0;

    for (const order of orders) {
      for (const item of order.items) {
        if (!item.costPrice || item.costPrice <= 0) {
          missingCostItemsCount++;
        }
        totalCOGS = roundCurrency(totalCOGS + (item.costPrice || 0) * item.quantity);
      }
    }

    const estimatedGrossProfit = roundCurrency(totalSales - totalCOGS);
    const estimatedNetProfit = roundCurrency(estimatedGrossProfit - totalExpense);

    // Dues & Active
    const customerDueAgg = await Customer.aggregate([
      { $match: { active: true } },
      { $group: { _id: null, totalDue: { $sum: "$totalDue" } } },
    ]);
    const totalOutstandingDue = customerDueAgg[0]?.totalDue || 0;

    const activeOrdersCount = await Order.countDocuments({
      orderStatus: { $in: ["CONFIRMED", "PREPARING", "READY"] },
    });

    const lowStockCount = await InventoryItem.countDocuments({
      active: true,
      $expr: { $lte: ["$currentStock", "$minimumStock"] },
    });

    // 4. Sales by Order Type
    const orderTypeBreakdown: Record<string, number> = {
      DINE_IN: 0,
      TAKEAWAY: 0,
      DELIVERY: 0,
    };
    for (const o of orders) {
      orderTypeBreakdown[o.orderType] = (orderTypeBreakdown[o.orderType] || 0) + o.grandTotal;
    }

    // 5. Sales by Payment Method
    const paymentMethodBreakdown: Record<string, number> = {
      CASH: 0,
      BKASH: 0,
      NAGAD: 0,
      ROCKET: 0,
      CARD: 0,
      BANK: 0,
      DUE: 0,
    };
    for (const o of orders) {
      for (const p of o.paymentRecords) {
        paymentMethodBreakdown[p.method] =
          roundCurrency((paymentMethodBreakdown[p.method] || 0) + p.amount);
      }
      if (o.dueAmount > 0) {
        paymentMethodBreakdown.DUE =
          roundCurrency(paymentMethodBreakdown.DUE + o.dueAmount);
      }
    }

    // 6. Best Selling Items
    const itemMap = new Map<string, { nameBn: string; quantity: number; revenue: number }>();
    for (const o of orders) {
      for (const item of o.items) {
        const existing = itemMap.get(item.menuItemId.toString()) || {
          nameBn: item.nameBn,
          quantity: 0,
          revenue: 0,
        };
        existing.quantity += item.quantity;
        existing.revenue = roundCurrency(existing.revenue + item.totalPrice);
        itemMap.set(item.menuItemId.toString(), existing);
      }
    }
    const topItems = Array.from(itemMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // 7. Expense by Category
    const expenseByCategory: Record<string, number> = {};
    for (const e of expenses) {
      expenseByCategory[e.category] =
        roundCurrency((expenseByCategory[e.category] || 0) + e.amount);
    }

    return NextResponse.json({
      success: true,
      kpis: {
        totalSales,
        totalOrders,
        avgOrderValue,
        totalExpense,
        totalCOGS,
        estimatedGrossProfit,
        estimatedNetProfit,
        missingCostWarning: missingCostItemsCount > 0,
        totalOutstandingDue,
        activeOrdersCount,
        lowStockCount,
      },
      charts: {
        orderTypeBreakdown,
        paymentMethodBreakdown,
        topItems,
        expenseByCategory,
      },
      dateRange: {
        startDate,
        endDate,
        range,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error generating reports";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
