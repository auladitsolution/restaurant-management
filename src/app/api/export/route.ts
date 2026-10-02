import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requirePermission } from "@/lib/auth/server-auth";
import { Order } from "@/models/Order";
import { Customer } from "@/models/Customer";
import { InventoryItem } from "@/models/InventoryItem";
import { Expense } from "@/models/Expense";
import { Purchase } from "@/models/Purchase";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, "backup:export");
  if ("errorResponse" in auth) return auth.errorResponse;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "orders"; // orders, customers, inventory, expenses, purchases

  try {
    await connectToDatabase();

    let csvContent = "";
    const filename = `${type}_export_${Date.now()}.csv`;

    if (type === "orders") {
      const orders = await Order.find({}).sort({ createdAt: -1 }).limit(1000).lean();
      const headers = ["Order Number", "Date", "Type", "Table", "Customer", "Phone", "Subtotal", "Discount", "VAT", "Grand Total", "Paid", "Due", "Status"];
      const rows = orders.map((o) => [
        `"${o.orderNumber}"`,
        `"${new Date(o.createdAt).toLocaleString("en-GB")}"`,
        `"${o.orderType}"`,
        `"${o.tableName || ""}"`,
        `"${o.customerName || ""}"`,
        `"${o.customerPhone || ""}"`,
        o.subtotal,
        o.discountAmount,
        o.vatAmount,
        o.grandTotal,
        o.paidAmount,
        o.dueAmount,
        `"${o.orderStatus}"`,
      ]);
      csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    } else if (type === "customers") {
      const customers = await Customer.find({ active: true }).sort({ name: 1 }).lean();
      const headers = ["Name", "Phone", "Email", "Address", "Total Orders", "Total Spent", "Total Due"];
      const rows = customers.map((c) => [
        `"${c.name}"`,
        `"${c.phone}"`,
        `"${c.email || ""}"`,
        `"${c.address || ""}"`,
        c.totalOrders,
        c.totalSpent,
        c.totalDue,
      ]);
      csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    } else if (type === "inventory") {
      const items = await InventoryItem.find({ active: true }).sort({ nameBn: 1 }).lean();
      const headers = ["Name (BN)", "Name (EN)", "Category", "Unit", "Current Stock", "Min Stock", "Average Cost"];
      const rows = items.map((i) => [
        `"${i.nameBn}"`,
        `"${i.nameEn}"`,
        `"${i.category}"`,
        `"${i.unit}"`,
        i.currentStock,
        i.minimumStock,
        i.averageCost,
      ]);
      csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    } else if (type === "expenses") {
      const expenses = await Expense.find({}).sort({ date: -1 }).lean();
      const headers = ["Date", "Category", "Description", "Amount", "Payment Method", "Created By"];
      const rows = expenses.map((e) => [
        `"${new Date(e.date).toLocaleDateString("en-GB")}"`,
        `"${e.category}"`,
        `"${e.description.replace(/"/g, '""')}"`,
        e.amount,
        `"${e.paymentMethod}"`,
        `"${e.createdBy?.name || ""}"`,
      ]);
      csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    } else if (type === "purchases") {
      const purchases = await Purchase.find({}).sort({ purchaseDate: -1 }).lean();
      const headers = ["Purchase Number", "Date", "Supplier", "Total Amount", "Paid", "Due", "Status"];
      const rows = purchases.map((p) => [
        `"${p.purchaseNumber}"`,
        `"${new Date(p.purchaseDate).toLocaleDateString("en-GB")}"`,
        `"${p.supplierName}"`,
        p.totalAmount,
        p.paidAmount,
        p.dueAmount,
        `"${p.status}"`,
      ]);
      csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    }

    // Add UTF-8 BOM so Excel opens Bangla text with perfect unicode rendering
    const bom = "\uFEFF";
    const fullCsv = bom + csvContent;

    return new Response(fullCsv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error exporting data";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
