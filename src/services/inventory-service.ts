import { MenuItem } from "@/models/MenuItem";
import { Recipe } from "@/models/Recipe";
import { InventoryItem } from "@/models/InventoryItem";
import { StockMovement } from "@/models/StockMovement";
import { Notification } from "@/models/Notification";
import { convertUnitQuantity, roundCurrency } from "@/lib/calculations/financial";
import { IOrderItem } from "@/types";

interface Performer {
  userId: string;
  name: string;
}

/**
 * Deducts inventory ingredients according to recipes for an order.
 * Strictly idempotent: called only once per order.
 */
export async function deductInventoryForOrder(
  orderId: string,
  orderNumber: string,
  items: IOrderItem[],
  performedBy: Performer
): Promise<boolean> {
  try {
    for (const item of items) {
      // Find recipe for this menu item (and optional variant)
      let recipe = await Recipe.findOne({
        menuItemId: item.menuItemId,
        variantName: item.variantNameBn || item.variantNameEn || "",
        active: true,
      });

      if (!recipe) {
        // Fallback to base recipe without variant
        recipe = await Recipe.findOne({
          menuItemId: item.menuItemId,
          active: true,
        });
      }

      // If no explicit Recipe document, check if MenuItem has inline ingredients
      const ingredientsToDeduct = recipe
        ? recipe.ingredients
        : [];

      if (!ingredientsToDeduct || ingredientsToDeduct.length === 0) {
        // Check inline ingredients on MenuItem model
        const menuItemDoc = await MenuItem.findById(item.menuItemId);
        if (menuItemDoc && menuItemDoc.ingredients && menuItemDoc.ingredients.length > 0) {
          for (const ing of menuItemDoc.ingredients) {
            await processSingleIngredientDeduction({
              inventoryItemId: ing.inventoryItemId.toString(),
              recipeQuantity: ing.quantity,
              recipeUnit: ing.unit,
              orderItemQuantity: item.quantity,
              orderId,
              orderNumber,
              itemName: item.nameBn,
              performedBy,
            });
          }
        }
        continue;
      }

      for (const ing of ingredientsToDeduct) {
        await processSingleIngredientDeduction({
          inventoryItemId: ing.inventoryItemId.toString(),
          recipeQuantity: ing.quantity,
          recipeUnit: ing.unit,
          orderItemQuantity: item.quantity,
          orderId,
          orderNumber,
          itemName: item.nameBn,
          performedBy,
        });
      }
    }

    return true;
  } catch (error) {
    console.error("[Inventory Deduction Error]", error);
    return false;
  }
}

async function processSingleIngredientDeduction(params: {
  inventoryItemId: string;
  recipeQuantity: number;
  recipeUnit: string;
  orderItemQuantity: number;
  orderId: string;
  orderNumber: string;
  itemName: string;
  performedBy: Performer;
}) {
  const {
    inventoryItemId,
    recipeQuantity,
    recipeUnit,
    orderItemQuantity,
    orderId: _orderId,
    orderNumber,
    itemName,
    performedBy,
  } = params;

  const inventoryItem = await InventoryItem.findById(inventoryItemId);
  if (!inventoryItem) return;

  // Convert recipe unit to inventory stock unit
  const requiredInRecipeUnit = recipeQuantity * orderItemQuantity;
  const deductionInStockUnit = convertUnitQuantity(
    requiredInRecipeUnit,
    recipeUnit,
    inventoryItem.unit
  );

  const prevStock = inventoryItem.currentStock;
  const newStock = Math.max(0, roundCurrency(prevStock - deductionInStockUnit));

  inventoryItem.currentStock = newStock;
  await inventoryItem.save();

  // Create StockMovement record (Section 17: Never update stock without recording movement)
  await StockMovement.create({
    inventoryItemId: inventoryItem._id,
    inventoryItemName: inventoryItem.nameBn,
    unit: inventoryItem.unit,
    type: "SALE_CONSUMPTION",
    quantityDelta: -deductionInStockUnit,
    previousStock: prevStock,
    newStock: newStock,
    unitCost: inventoryItem.averageCost,
    totalCost: roundCurrency(deductionInStockUnit * inventoryItem.averageCost),
    referenceType: "ORDER",
    referenceId: orderNumber,
    reason: `বিক্রি: ${itemName} (${orderNumber})`,
    performedBy,
  });

  // Low Stock Alert Check (Section 19: If currentStock <= minimumStock, trigger alert)
  if (newStock <= inventoryItem.minimumStock) {
    await Notification.create({
      title: "স্টক কম সতর্কবার্তা",
      message: `${inventoryItem.nameBn} এর স্টক কমে গেছে (${newStock} ${inventoryItem.unit})। পুনরায় সংগ্রহের ব্যবস্থা নিন।`,
      type: "LOW_STOCK",
      relatedEntityId: inventoryItem._id.toString(),
      relatedEntityType: "INVENTORY",
    });
  }
}

/**
 * Reverses inventory deductions when an order is cancelled.
 */
export async function reverseInventoryForOrder(
  orderNumber: string,
  performedBy: Performer
): Promise<boolean> {
  try {
    // Find all movements created for this order
    const movements = await StockMovement.find({
      referenceType: "ORDER",
      referenceId: orderNumber,
      type: "SALE_CONSUMPTION",
    });

    for (const mov of movements) {
      const inventoryItem = await InventoryItem.findById(mov.inventoryItemId);
      if (!inventoryItem) continue;

      const restoredQuantity = Math.abs(mov.quantityDelta);
      const prevStock = inventoryItem.currentStock;
      const newStock = roundCurrency(prevStock + restoredQuantity);

      inventoryItem.currentStock = newStock;
      await inventoryItem.save();

      // Record reversal movement
      await StockMovement.create({
        inventoryItemId: inventoryItem._id,
        inventoryItemName: inventoryItem.nameBn,
        unit: inventoryItem.unit,
        type: "RETURN",
        quantityDelta: restoredQuantity,
        previousStock: prevStock,
        newStock: newStock,
        unitCost: mov.unitCost,
        totalCost: roundCurrency(restoredQuantity * mov.unitCost),
        referenceType: "ORDER_CANCEL",
        referenceId: orderNumber,
        reason: `অর্ডার বাতিলজনিত স্টক ফেরত (${orderNumber})`,
        performedBy,
      });
    }

    return true;
  } catch (error) {
    console.error("[Inventory Reversal Error]", error);
    return false;
  }
}
