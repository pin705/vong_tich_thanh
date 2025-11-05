import { PlayerSchema } from '~/models/Player';
import { ItemSchema } from '~/models/Item';

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
    if (player.premiumCurrency < item.premiumPrice) {
      return { 
        success: false, 
        message: `Không đủ Cổ Thạch! Cần ${item.premiumPrice} Cổ Thạch, bạn có ${player.premiumCurrency} Cổ Thạch`
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

    // Add item to player inventory
    player.inventory.push(newItem._id);
    
    // Deduct premium currency
    player.premiumCurrency -= item.premiumPrice;
    
    await player.save();

    return {
      success: true,
      message: `Đã mua [${item.name}] với ${item.premiumPrice} Cổ Thạch!`,
      item: {
        _id: newItem._id,
        name: newItem.name,
        description: newItem.description
      },
      remainingPremiumCurrency: player.premiumCurrency
    };
  } catch (error) {
    console.error('Error buying premium item:', error);
    return {
      success: false,
      message: 'Failed to purchase item'
    };
  }
});
