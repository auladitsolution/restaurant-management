import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requirePermission, logAuditEvent } from "@/lib/auth/server-auth";
import { Recipe } from "@/models/Recipe";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(req, "inventory:manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await context.params;

  try {
    await connectToDatabase();
    const recipe = await Recipe.findById(id);

    if (!recipe) {
      return NextResponse.json(
        { success: false, message: "রেসিপি পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    recipe.active = false;
    await recipe.save();

    await logAuditEvent({
      user: auth.user,
      action: "RECIPE_DEACTIVATED",
      entityType: "Recipe",
      entityId: id,
    });

    return NextResponse.json({
      success: true,
      message: "রেসিপি মুছে ফেলা হয়েছে",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error deleting recipe";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
