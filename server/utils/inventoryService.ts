import { PlayerSchema } from '../../models/Player';
import { ItemSchema } from '../../models/Item';

/**
 * Inventory Service - Centralized item and currency management
 * Handles all operations related to player inventory, items, and gold
 */

/**
 * Add an item to a player's inventory
 * @param playerId - The player's ID
 * @param itemId - The item ID to add
 * @param quantity - Number of items to add (default: 1)
 * @returns Success status and message
 */
export async function addItemToPlayer(
  playerId: string,
  itemId: string,
  quantity: number = 1
): Promise<{ success: boolean; message: string; item?: any }> {
  try {
    const player = await PlayerSchema.findById(playerId);
    if (!player) {
      return { success: false, message: 'Không tìm thấy người chơi.' };
    }

    const item = await ItemSchema.findById(itemId);
    if (!item) {
      return { success: false, message: 'Không tìm thấy vật phẩm.' };
    }

    // Add item(s) to inventory
    for (let i = 0; i < quantity; i++) {
      player.inventory.push(itemId);
    }
    
    await player.save();

    return {
      success: true,
      message: `Đã thêm [${item.name}] vào túi đồ.`,
      item
    };
  } catch (error) {
    console.error('Error adding item to player:', error);
    return { success: false, message: 'Lỗi khi thêm vật phẩm.' };
  }
}

/**
 * Remove an item from a player's inventory by instance ID
 * @param playerId - The player's ID
 * @param itemInstanceId - The specific item instance ID to remove
 * @returns Success status and message
 */
export async function removeItemFromPlayer(
  playerId: string,
  itemInstanceId: string
): Promise<{ success: boolean; message: string; item?: any }> {
  try {
    const player = await PlayerSchema.findById(playerId);
    if (!player) {
      return { success: false, message: 'Không tìm thấy người chơi.' };
    }

    const item = await ItemSchema.findById(itemInstanceId);
    if (!item) {
      return { success: false, message: 'Không tìm thấy vật phẩm.' };
    }

    // Check if item exists in inventory
    const itemIndex = player.inventory.findIndex(
      (id: any) => id.toString() === itemInstanceId
    );

    if (itemIndex === -1) {
      return { success: false, message: 'Vật phẩm không có trong túi đồ.' };
    }

    // Remove item from inventory
    player.inventory.splice(itemIndex, 1);
    await player.save();

    return {
      success: true,
      message: `Đã xóa [${item.name}] khỏi túi đồ.`,
      item
    };
  } catch (error) {
    console.error('Error removing item from player:', error);
    return { success: false, message: 'Lỗi khi xóa vật phẩm.' };
  }
}

/**
 * Remove an item from a player's inventory by item ID (first matching instance)
 * @param playerId - The player's ID
 * @param itemId - The item ID to remove
 * @param quantity - Number of items to remove (default: 1)
 * @returns Success status and message
 */
export async function removeItemByIdFromPlayer(
  playerId: string,
  itemId: string,
  quantity: number = 1
): Promise<{ success: boolean; message: string; item?: any }> {
  try {
    const player = await PlayerSchema.findById(playerId);
    if (!player) {
      return { success: false, message: 'Không tìm thấy người chơi.' };
    }

    const item = await ItemSchema.findById(itemId);
    if (!item) {
      return { success: false, message: 'Không tìm thấy vật phẩm.' };
    }

    // Count how many of this item the player has
    const itemCount = player.inventory.filter(
      (id: any) => id.toString() === itemId
    ).length;

    if (itemCount < quantity) {
      return { 
        success: false, 
        message: `Không đủ [${item.name}] trong túi đồ. Cần ${quantity}, có ${itemCount}.` 
      };
    }

    // Remove the specified quantity
    let removed = 0;
    player.inventory = player.inventory.filter((id: any) => {
      if (removed < quantity && id.toString() === itemId) {
        removed++;
        return false;
      }
      return true;
    });

    await player.save();

    return {
      success: true,
      message: `Đã xóa ${quantity}x [${item.name}] khỏi túi đồ.`,
      item
    };
  } catch (error) {
    console.error('Error removing item by ID from player:', error);
    return { success: false, message: 'Lỗi khi xóa vật phẩm.' };
  }
}

/**
 * Check if a player has sufficient items
 * @param playerId - The player's ID
 * @param itemId - The item ID to check
 * @param quantity - Required quantity (default: 1)
 * @returns Whether the player has enough items
 */
export async function hasSufficientItems(
  playerId: string,
  itemId: string,
  quantity: number = 1
): Promise<{ sufficient: boolean; currentCount: number }> {
  try {
    const player = await PlayerSchema.findById(playerId);
    if (!player) {
      return { sufficient: false, currentCount: 0 };
    }

    const itemCount = player.inventory.filter(
      (id: any) => id.toString() === itemId
    ).length;

    return {
      sufficient: itemCount >= quantity,
      currentCount: itemCount
    };
  } catch (error) {
    console.error('Error checking item sufficiency:', error);
    return { sufficient: false, currentCount: 0 };
  }
}

/**
 * Add gold to a player
 * @param playerId - The player's ID
 * @param amount - Amount of gold to add
 * @returns Success status and message
 */
export async function addGoldToPlayer(
  playerId: string,
  amount: number
): Promise<{ success: boolean; message: string; newBalance?: number }> {
  try {
    if (amount <= 0) {
      return { success: false, message: 'Số vàng phải lớn hơn 0.' };
    }

    const player = await PlayerSchema.findById(playerId);
    if (!player) {
      return { success: false, message: 'Không tìm thấy người chơi.' };
    }

    player.gold = (player.gold || 0) + amount;
    await player.save();

    return {
      success: true,
      message: `Đã thêm ${amount} vàng.`,
      newBalance: player.gold
    };
  } catch (error) {
    console.error('Error adding gold to player:', error);
    return { success: false, message: 'Lỗi khi thêm vàng.' };
  }
}

/**
 * Remove gold from a player
 * @param playerId - The player's ID
 * @param amount - Amount of gold to remove
 * @returns Success status and message
 */
export async function removeGoldFromPlayer(
  playerId: string,
  amount: number
): Promise<{ success: boolean; message: string; newBalance?: number }> {
  try {
    if (amount <= 0) {
      return { success: false, message: 'Số vàng phải lớn hơn 0.' };
    }

    const player = await PlayerSchema.findById(playerId);
    if (!player) {
      return { success: false, message: 'Không tìm thấy người chơi.' };
    }

    if (player.gold < amount) {
      return {
        success: false,
        message: `Không đủ vàng. Cần ${amount}, có ${player.gold}.`
      };
    }

    player.gold -= amount;
    await player.save();

    return {
      success: true,
      message: `Đã trừ ${amount} vàng.`,
      newBalance: player.gold
    };
  } catch (error) {
    console.error('Error removing gold from player:', error);
    return { success: false, message: 'Lỗi khi trừ vàng.' };
  }
}

/**
 * Check if a player has sufficient gold
 * @param playerId - The player's ID
 * @param amount - Required amount
 * @returns Whether the player has enough gold
 */
export async function hasSufficientGold(
  playerId: string,
  amount: number
): Promise<{ sufficient: boolean; currentBalance: number }> {
  try {
    const player = await PlayerSchema.findById(playerId);
    if (!player) {
      return { sufficient: false, currentBalance: 0 };
    }

    return {
      sufficient: player.gold >= amount,
      currentBalance: player.gold
    };
  } catch (error) {
    console.error('Error checking gold sufficiency:', error);
    return { sufficient: false, currentBalance: 0 };
  }
}

/**
 * Add premium currency to a player
 * @param playerId - The player's ID
 * @param amount - Amount of premium currency to add
 * @returns Success status and message
 */
export async function addPremiumCurrencyToPlayer(
  playerId: string,
  amount: number
): Promise<{ success: boolean; message: string; newBalance?: number }> {
  try {
    if (amount <= 0) {
      return { success: false, message: 'Số Cổ Thạch phải lớn hơn 0.' };
    }

    const player = await PlayerSchema.findById(playerId);
    if (!player) {
      return { success: false, message: 'Không tìm thấy người chơi.' };
    }

    player.premiumCurrency = (player.premiumCurrency || 0) + amount;
    await player.save();

    return {
      success: true,
      message: `Đã thêm ${amount} Cổ Thạch.`,
      newBalance: player.premiumCurrency
    };
  } catch (error) {
    console.error('Error adding premium currency to player:', error);
    return { success: false, message: 'Lỗi khi thêm Cổ Thạch.' };
  }
}

/**
 * Remove premium currency from a player
 * @param playerId - The player's ID
 * @param amount - Amount of premium currency to remove
 * @returns Success status and message
 */
export async function removePremiumCurrencyFromPlayer(
  playerId: string,
  amount: number
): Promise<{ success: boolean; message: string; newBalance?: number }> {
  try {
    if (amount <= 0) {
      return { success: false, message: 'Số Cổ Thạch phải lớn hơn 0.' };
    }

    const player = await PlayerSchema.findById(playerId);
    if (!player) {
      return { success: false, message: 'Không tìm thấy người chơi.' };
    }

    if ((player.premiumCurrency || 0) < amount) {
      return {
        success: false,
        message: `Không đủ Cổ Thạch. Cần ${amount}, có ${player.premiumCurrency || 0}.`
      };
    }

    player.premiumCurrency = (player.premiumCurrency || 0) - amount;
    await player.save();

    return {
      success: true,
      message: `Đã trừ ${amount} Cổ Thạch.`,
      newBalance: player.premiumCurrency
    };
  } catch (error) {
    console.error('Error removing premium currency from player:', error);
    return { success: false, message: 'Lỗi khi trừ Cổ Thạch.' };
  }
}

/**
 * Transfer items between two players
 * @param fromPlayerId - Source player ID
 * @param toPlayerId - Target player ID
 * @param itemId - Item instance ID to transfer
 * @returns Success status and message
 */
export async function transferItem(
  fromPlayerId: string,
  toPlayerId: string,
  itemId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const removeResult = await removeItemFromPlayer(fromPlayerId, itemId);
    if (!removeResult.success) {
      return removeResult;
    }

    // Add the exact same item instance to the target player
    const toPlayer = await PlayerSchema.findById(toPlayerId);
    if (!toPlayer) {
      // Rollback: add item back to original player
      const fromPlayer = await PlayerSchema.findById(fromPlayerId);
      if (fromPlayer) {
        fromPlayer.inventory.push(itemId);
        await fromPlayer.save();
      }
      return { success: false, message: 'Không tìm thấy người chơi đích.' };
    }

    toPlayer.inventory.push(itemId);
    await toPlayer.save();

    return {
      success: true,
      message: `Đã chuyển [${removeResult.item?.name}] thành công.`
    };
  } catch (error) {
    console.error('Error transferring item:', error);
    return { success: false, message: 'Lỗi khi chuyển vật phẩm.' };
  }
}

/**
 * Transfer gold between two players
 * @param fromPlayerId - Source player ID
 * @param toPlayerId - Target player ID
 * @param amount - Amount of gold to transfer
 * @returns Success status and message
 */
export async function transferGold(
  fromPlayerId: string,
  toPlayerId: string,
  amount: number
): Promise<{ success: boolean; message: string }> {
  try {
    const removeResult = await removeGoldFromPlayer(fromPlayerId, amount);
    if (!removeResult.success) {
      return removeResult;
    }

    const addResult = await addGoldToPlayer(toPlayerId, amount);
    if (!addResult.success) {
      // Rollback: add gold back to original player
      await addGoldToPlayer(fromPlayerId, amount);
      return { success: false, message: 'Lỗi khi chuyển vàng.' };
    }

    return {
      success: true,
      message: `Đã chuyển ${amount} vàng thành công.`
    };
  } catch (error) {
    console.error('Error transferring gold:', error);
    return { success: false, message: 'Lỗi khi chuyển vàng.' };
  }
}
