import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requirePermission, logAuditEvent } from "@/lib/auth/server-auth";
import { Expense, IExpenseDocument } from "@/models/Expense";
import { ExpenseSchema } from "@/lib/validation/schemas";
import { roundCurrency } from "@/lib/calculations/financial";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, "expenses:manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};
    if (category && category !== "ALL") filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const expenses = await Expense.find(filter)
      .sort({ date: -1 })
      .lean<IExpenseDocument[]>();

    const totalExpense = roundCurrency(
      expenses.reduce((sum, exp) => sum + exp.amount, 0)
    );

    return NextResponse.json({ success: true, expenses, totalExpense });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error fetching expenses";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, "expenses:manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const parsed = ExpenseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const expense = await Expense.create({
      ...parsed.data,
      amount: roundCurrency(parsed.data.amount),
      createdBy: {
        userId: auth.user._id,
        name: auth.user.name,
      },
    });

    await logAuditEvent({
      user: auth.user,
      action: "EXPENSE_CREATED",
      entityType: "Expense",
      entityId: expense._id.toString(),
      afterSnapshot: expense.toObject(),
    });

    return NextResponse.json(
      { success: true, message: "খরচের হিসাব যোগ করা হয়েছে", expense },
      { status: 201 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error creating expense";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
