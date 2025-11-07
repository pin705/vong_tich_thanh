import { PlayerSchema } from '../../../models/Player';
import { ItemSchema } from '../../../models/Item';
import { removeGoldFromPlayer, removeItemByIdFromPlayer } from '../../utils/inventoryService';

/**
 * Enhancement API - Handle equipment enhancement requests
 * POST /api/item/enhance
 */
export default defineEventHandler(async (event) => {
  try {
    // Get session
    const session = await getUserSession(event);
    if (!session?.user?.id) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized',
      });
    }

    const playerId = session.user.id;

    // Get request body
    const body = await readBody(event);
    const { itemId, materialId } = body;

    if (!itemId || !materialId) {
      throw createError({
        statusCode: 400,
        message: 'Thiếu thông tin vật phẩm hoặc vật liệu.',
      });
    }

    // Get player
    const player = await PlayerSchema.findById(playerId);
    if (!player) {
      throw createError({
        statusCode: 404,
        message: 'Không tìm thấy người chơi.',
      });
    }

    // Find item and material in inventory
    const item = await ItemSchema.findById(itemId);
    const material = await ItemSchema.findById(materialId);

    if (!item || !material) {
      throw createError({
        statusCode: 404,
        message: 'Không tìm thấy vật phẩm hoặc vật liệu.',
      });
    }

    // Check if item is equipment
    if (!['weapon', 'armor', 'Equipment'].includes(item.type)) {
      throw createError({
        statusCode: 400,
        message: 'Chỉ có thể cường hóa trang bị.',
      });
    }

    // Check if material is enhancement stone
    if (material.type !== 'upgrade_material' || material.upgradeType !== 'enhancement') {
      throw createError({
        statusCode: 400,
        message: 'Vật liệu không hợp lệ. Cần dùng Đá Cường Hóa.',
      });
    }

    // Check if player has the items
    const hasItem = player.inventory.some((id: any) => id.toString() === itemId);
    const hasMaterial = player.inventory.some((id: any) => id.toString() === materialId);

    if (!hasItem) {
      throw createError({
        statusCode: 400,
        message: 'Vật phẩm không có trong túi đồ.',
      });
    }

    if (!hasMaterial) {
      throw createError({
        statusCode: 400,
        message: 'Không có vật liệu trong túi đồ.',
      });
    }

    // Get current enhancement level from the item
    const currentLevel = item.enhancementLevel || 0;

    // Check maximum enhancement level
    if (currentLevel >= 20) {
      throw createError({
        statusCode: 400,
        message: 'Vật phẩm đã đạt cấp cường hóa tối đa (+20).',
      });
    }

    // Calculate gold cost based on enhancement level
    const goldCost = calculateGoldCost(currentLevel);

    // Check if player has enough gold
    if (player.gold < goldCost) {
      throw createError({
        statusCode: 400,
        message: `Không đủ vàng. Cần ${goldCost} vàng, có ${player.gold} vàng.`,
      });
    }

    // Calculate success chance
    const successChance = calculateSuccessChance(currentLevel);
    const isSuccess = Math.random() < successChance;

    // Remove gold and material
    await removeGoldFromPlayer(playerId, goldCost);
    await removeItemByIdFromPlayer(playerId, materialId, 1);

    let message = '';
    const newLevel = currentLevel + (isSuccess ? 1 : 0);

    if (isSuccess) {
      // Update item enhancement level
      item.enhancementLevel = newLevel;
      
      // Add to enhancement history
      if (!item.enhancementHistory) {
        item.enhancementHistory = [];
      }
      item.enhancementHistory.push({
        date: new Date(),
        level: newLevel,
        success: true,
        playerId: playerId,
      });
      
      await item.save();
      
      message = `✨ Cường hóa thành công! [${item.name}] đã lên +${newLevel}.`;
    } else {
      // Handle failure based on level
      const shouldDestroy = currentLevel >= 15 && Math.random() < 0.3; // 30% destroy chance at +15 and above
      const shouldDowngrade = currentLevel >= 10 && !shouldDestroy && Math.random() < 0.5; // 50% downgrade chance at +10 and above
      
      if (shouldDestroy) {
        // Remove item from inventory
        await removeItemByIdFromPlayer(playerId, itemId, 1);
        message = `💔 Cường hóa thất bại! [${item.name}] đã bị phá hủy.`;
      } else if (shouldDowngrade) {
        // Downgrade by 1 level
        item.enhancementLevel = Math.max(0, currentLevel - 1);
        
        // Add to enhancement history
        if (!item.enhancementHistory) {
          item.enhancementHistory = [];
        }
        item.enhancementHistory.push({
          date: new Date(),
          level: item.enhancementLevel,
          success: false,
          playerId: playerId,
        });
        
        await item.save();
        message = `⚠️ Cường hóa thất bại! [${item.name}] đã giảm xuống +${item.enhancementLevel}.`;
      } else {
        // No change
        if (!item.enhancementHistory) {
          item.enhancementHistory = [];
        }
        item.enhancementHistory.push({
          date: new Date(),
          level: currentLevel,
          success: false,
          playerId: playerId,
        });
        
        await item.save();
        message = `❌ Cường hóa thất bại! [${item.name}] vẫn ở +${currentLevel}.`;
      }
    }

    // Reload player
    const updatedPlayer = await PlayerSchema.findById(playerId).populate('inventory');

    return {
      success: isSuccess,
      message,
      newLevel,
      player: {
        gold: updatedPlayer.gold,
        inventory: updatedPlayer.inventory,
      },
    };
  } catch (error: any) {
    console.error('Enhancement error:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Lỗi khi cường hóa.',
    });
  }
});

/**
 * Calculate gold cost for enhancement based on current level
 */
function calculateGoldCost(level: number): number {
  const baseCost = 100;
  return Math.floor(baseCost * Math.pow(1.5, level));
}

/**
 * Calculate success chance for enhancement based on current level
 */
function calculateSuccessChance(level: number): number {
  const baseChance = 0.9; // 90% at level 0
  const decreasePerLevel = 0.05; // Decrease 5% per level
  const minChance = 0.1; // Minimum 10% chance

  return Math.max(minChance, baseChance - level * decreasePerLevel);
}
