import { PlayerSchema } from '../../../models/Player';
import { ItemSchema } from '../../../models/Item';
import { validateObjectId } from '~/server/utils/validation';

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

  // Validate recipeId format
  const validation = validateObjectId(recipeId);
  if (!validation.valid) {
    throw createError({
      statusCode: 400,
      statusMessage: validation.error || 'Recipe ID không hợp lệ.'
    });
  }

  const playerId = user.user.id;

  try {
    // Get player with populated knownRecipes and inventory
    const player = await PlayerSchema.findById(playerId)
      .populate('knownRecipes')
      .populate('inventory');
      
    if (!player) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Không tìm thấy thông tin người chơi.'
      });
    }

    // Check if player knows this recipe
    const knownRecipe = player.knownRecipes?.find((r: any) => 
      r._id.toString() === recipeId
    );

    if (!knownRecipe) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bạn chưa học công thức này.'
      });
    }

    // Get recipe details
    const recipe = await ItemSchema.findById(recipeId).populate('recipe.materialId').populate('resultItem');
    if (!recipe || recipe.type !== 'Recipe') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Không tìm thấy công thức chế tạo.'
      });
    }

    // Check if player has required materials
    const requiredMaterials = recipe.recipe || [];
    const inventoryItems = player.inventory as any[];
    
    // Count materials in inventory by ID
    const materialCounts = new Map<string, number>();
    inventoryItems.forEach((item: any) => {
      const itemId = item._id.toString();
      const count = materialCounts.get(itemId) || 0;
      materialCounts.set(itemId, count + 1);
    });

    // Verify all materials are available
    const materialsNeeded: { name: string; needed: number; have: number }[] = [];
    for (const material of requiredMaterials) {
      const materialId = material.materialId._id.toString();
      const available = materialCounts.get(materialId) || 0;
      const needed = material.quantity;
      
      materialsNeeded.push({
        name: material.materialId.name,
        needed,
        have: available
      });
      
      if (available < needed) {
        throw createError({
          statusCode: 400,
          statusMessage: `Thiếu nguyên liệu: ${material.materialId.name} (cần ${needed}, có ${available})`
        });
      }
    }

    // Remove materials from inventory
    const materialsToRemove = new Map<string, number>();
    requiredMaterials.forEach((mat: any) => {
      const materialId = mat.materialId._id.toString();
      materialsToRemove.set(materialId, mat.quantity);
    });

    const remainingInventory: any[] = [];
    inventoryItems.forEach((item: any) => {
      const itemId = item._id.toString();
      const needed = materialsToRemove.get(itemId) || 0;
      if (needed > 0) {
        materialsToRemove.set(itemId, needed - 1);
        // This item is consumed in crafting
      } else {
        remainingInventory.push(item._id);
      }
    });

    // Get result item template
    const resultTemplate = recipe.resultItem as any;
    if (!resultTemplate) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Công thức không có kết quả chế tạo.'
      });
    }

    // Create new item based on template
    const newItem = await ItemSchema.create({
      name: resultTemplate.name,
      description: resultTemplate.description,
      type: resultTemplate.type,
      value: resultTemplate.value,
      stats: resultTemplate.stats,
      slot: resultTemplate.slot,
      quality: resultTemplate.quality,
      requiredLevel: resultTemplate.requiredLevel,
      setKey: resultTemplate.setKey,
      setBonus: resultTemplate.setBonus
    });

    // Update player inventory
    player.inventory = [...remainingInventory, newItem._id] as any;
    await player.save();

    return {
      success: true,
      message: `Đã chế tạo [${resultTemplate.name}]!`,
      result: {
        itemId: newItem._id,
        itemName: resultTemplate.name,
        quality: resultTemplate.quality
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
