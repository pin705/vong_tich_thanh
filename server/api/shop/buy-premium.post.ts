import { PlayerSchema } from '~/models/Player';
import { ItemSchema } from '~/models/Item';
import { removePremiumCurrencyFromPlayer, addItemToPlayer } from '~/server/utils/inventoryService';

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event);
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    const body = await readBody(event);
    const { itemId } = body;

    if (!itemId) {
      return { success: false, message: 'Item ID is required' };
    }

    const playerId = session.user.id;

    // Get the item
    const item = await ItemSchema.findById(itemId);
    if (!item) {
      return { success: false, message: 'Item not found' };
    }

    // Check if item is available for premium purchase
    if (!item.premiumPrice || item.premiumPrice <= 0) {
      return { success: false, message: 'This item is not available in the premium shop' };
    }

    // Get player
    const player = await PlayerSchema.findById(playerId);
    if (!player) {
      return { success: false, message: 'Player not found' };
    }

    // Check if player has enough premium currency
    if ((player.premiumCurrency || 0) < item.premiumPrice) {
      return { 
        success: false, 
        message: `Không đủ Cổ Thạch! Cần ${item.premiumPrice} Cổ Thạch, bạn có ${player.premiumCurrency || 0} Cổ Thạch`
      };
    }

    // Create a new instance of the item
    const newItem = await ItemSchema.create({
      name: item.name,
      description: item.description,
      type: item.type,
      value: item.value,
      premiumPrice: item.premiumPrice,
      stats: item.stats,
      effects: item.effects
    });

    // Use inventory service to add item and deduct premium currency
    const addResult = await addItemToPlayer(playerId, newItem._id.toString());
    if (!addResult.success) {
      // Clean up the created item if adding failed
      await ItemSchema.findByIdAndDelete(newItem._id);
      return { success: false, message: 'Failed to add item to inventory' };
    }

    const deductResult = await removePremiumCurrencyFromPlayer(playerId, item.premiumPrice);
    if (!deductResult.success) {
      // Rollback: remove the item we just added
      const updatedPlayer = await PlayerSchema.findById(playerId);
      if (updatedPlayer) {
        updatedPlayer.inventory = updatedPlayer.inventory.filter(
          (id: any) => id.toString() !== newItem._id.toString()
        );
        await updatedPlayer.save();
      }
      await ItemSchema.findByIdAndDelete(newItem._id);
      return { success: false, message: deductResult.message };
    }

    return {
      success: true,
      message: `Đã mua [${item.name}] với ${item.premiumPrice} Cổ Thạch!`,
      item: {
        _id: newItem._id,
        name: newItem.name,
        description: newItem.description
      },
      remainingPremiumCurrency: deductResult.newBalance
    };
  } catch (error) {
    console.error('Error buying premium item:', error);
    return {
      success: false,
      message: 'Failed to purchase item'
    };
  }
});
