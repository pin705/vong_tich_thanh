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
  const { itemId, slot } = body;

  if (!itemId || !slot) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Item ID and slot are required.'
    });
  }

  const playerId = user.user.id;

  try {
    // Get player with populated inventory and equipment
    const player = await PlayerSchema.findById(playerId)
      .populate('inventory')
      .populate('equipment.helmet')
      .populate('equipment.chest')
      .populate('equipment.legs')
      .populate('equipment.boots')
      .populate('equipment.weapon');
      
    if (!player) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Không tìm thấy thông tin người chơi.'
      });
    }

    // Find item in inventory
    const itemIndex = player.inventory.findIndex((item: any) => 
      item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Không tìm thấy vật phẩm trong túi đồ.'
      });
    }

    const item = player.inventory[itemIndex] as any;

    // Check if item is equipment
    if (item.type !== 'Equipment' || item.slot !== slot) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Vật phẩm này không thể trang bị ở vị trí đó.'
      });
    }

    // Check level requirement
    if (item.requiredLevel && player.level < item.requiredLevel) {
      throw createError({
        statusCode: 400,
        statusMessage: `Bạn chưa đủ cấp độ (Cần Cấp ${item.requiredLevel}) để mặc [${item.name}].`
      });
    }

    // Initialize equipment if not exists
    if (!player.equipment) {
      player.equipment = {
        helmet: null,
        chest: null,
        legs: null,
        boots: null,
        weapon: null
      };
    }

    // Unequip current item in slot if exists
    const currentEquippedId = player.equipment[slot as keyof typeof player.equipment];
    if (currentEquippedId) {
      // Add currently equipped item back to inventory
      player.inventory.push(currentEquippedId);
    }

    // Remove item from inventory and equip it
    player.inventory.splice(itemIndex, 1);
    (player.equipment as any)[slot] = item._id;

    await player.save();

    // Calculate and apply stats with set bonuses
    const { applyStatsToPlayer } = await import('../../utils/playerStats');
    const statsResult = await applyStatsToPlayer(playerId);

    const messages = [
      `Đã trang bị [${item.name}] vào vị trí ${slot}!`,
      ...statsResult.messages
    ];

    return {
      success: true,
      message: messages.join('\n'),
      equipment: player.equipment
    };
  } catch (error: any) {
    console.error('Error equipping item:', error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Lỗi khi trang bị vật phẩm.'
    });
  }
});
