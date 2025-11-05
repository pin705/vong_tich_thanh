import { PlayerSchema } from '../../../models/Player';
import { ItemSchema } from '../../../models/Item';

export default defineEventHandler(async (event) => {
  const user = await getUserSession(event);
  if (!user?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    });
  }

  const body = await readBody(event);
  const { recipeId } = body;

  if (!recipeId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Recipe ID is required.'
    });
  }

  const playerId = user.user.id;

  try {
    // Get player with populated inventory
    const player = await PlayerSchema.findById(playerId).populate('inventory');
    if (!player) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Không tìm thấy thông tin người chơi.'
      });
    }

    // Get recipe
    const recipe = await ItemSchema.findById(recipeId);
    if (!recipe || recipe.type !== 'recipe' || !recipe.craftingRecipe) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Không tìm thấy công thức chế tạo.'
      });
    }

    // Check if player has the recipe item
    const hasRecipe = player.inventory.some((item: any) => 
      item._id.toString() === recipeId
    );

    if (!hasRecipe) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bạn không có công thức này.'
      });
    }

    // Get all inventory items
    const inventoryItems = await ItemSchema.find({
      _id: { $in: player.inventory }
    });

    // Check if player has required materials
    const requiredMaterials = recipe.craftingRecipe.materials || [];
    const materialCounts = new Map<string, number>();

    // Count materials in inventory
    inventoryItems.forEach((item: any) => {
      const count = materialCounts.get(item.name) || 0;
      materialCounts.set(item.name, count + 1);
    });

    // Verify all materials are available
    for (const material of requiredMaterials) {
      const available = materialCounts.get(material.itemName) || 0;
      if (available < material.quantity) {
        throw createError({
          statusCode: 400,
          statusMessage: `Thiếu nguyên liệu: ${material.itemName} (cần ${material.quantity}, có ${available})`
        });
      }
    }

    // Remove materials from inventory
    const materialsToRemove = new Map<string, number>();
    requiredMaterials.forEach(mat => {
      materialsToRemove.set(mat.itemName, mat.quantity);
    });

    const remainingInventory: any[] = [];
    inventoryItems.forEach((item: any) => {
      const needed = materialsToRemove.get(item.name) || 0;
      if (needed > 0) {
        materialsToRemove.set(item.name, needed - 1);
        // Delete this item (consumed in crafting)
      } else {
        remainingInventory.push(item._id);
      }
    });

    // Find or create result item
    const resultItemName = recipe.craftingRecipe.result.itemName;
    const resultQuantity = recipe.craftingRecipe.result.quantity || 1;

    // Create new items for the result
    const newItems: any[] = [];
    for (let i = 0; i < resultQuantity; i++) {
      // Find a template item with this name to clone its properties
      let templateItem = await ItemSchema.findOne({ name: resultItemName });
      
      if (!templateItem) {
        throw createError({
          statusCode: 500,
          statusMessage: `Không tìm thấy template cho vật phẩm: ${resultItemName}`
        });
      }

      // Create a new item based on template
      const newItem = await ItemSchema.create({
        name: templateItem.name,
        description: templateItem.description,
        type: templateItem.type,
        value: templateItem.value,
        stats: templateItem.stats
      });

      newItems.push(newItem._id);
    }

    // Update player inventory
    player.inventory = [...remainingInventory, ...newItems];
    await player.save();

    return {
      success: true,
      message: `Đã chế tạo ${resultQuantity}x [${resultItemName}]!`,
      result: {
        itemName: resultItemName,
        quantity: resultQuantity
      }
    };
  } catch (error: any) {
    console.error('Error crafting item:', error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Lỗi khi chế tạo vật phẩm.'
    });
  }
});
