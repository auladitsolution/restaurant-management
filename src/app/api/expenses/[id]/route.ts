import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requirePermission, logAuditEvent } from "@/lib/auth/server-auth";
import { Expense } from "@/models/Expense";
import { ExpenseSchema } from "@/lib/validation/schemas";
import { roundCurrency } from "@/lib/calculations/financial";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(req, "expenses:manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await context.params;

  try {
    const body = await req.json();
    const parsed = ExpenseSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const expense = await Expense.findById(id);

    if (!expense) {
      return NextResponse.json(
        { success: false, message: "খরচের হিসাব পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    const before = expense.toObject();
    if (parsed.data.amount) parsed.data.amount = roundCurrency(parsed.data.amount);
    Object.assign(expense, parsed.data);
    await expense.save();

    await logAuditEvent({
      user: auth.user,
      action: "EXPENSE_UPDATED",
      entityType: "Expense",
      entityId: id,
      beforeSnapshot: before,
      afterSnapshot: expense.toObject(),
    });

    return NextResponse.json({
      success: true,
      message: "খরচের হিসাব আপডেট সম্পন্ন",
      expense,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error updating expense";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(req, "expenses:manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await context.params;

  try {
    await connectToDatabase();
    const expense = await Expense.findById(id);

    if (!expense) {
      return NextResponse.json(
        { success: false, message: "খরচ পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    const before = expense.toObject();
    await Expense.findByIdAndDelete(id);

    await logAuditEvent({
      user: auth.user,
      action: "EXPENSE_DELETED",
      entityType: "Expense",
      entityId: id,
      beforeSnapshot: before,
    });

    return NextResponse.json({
      success: true,
      message: "খরচ সফলভাবে মুছে ফেলা হয়েছে",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error deleting expense";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
