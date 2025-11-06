import { GiftCodeSchema } from '~/models/GiftCode';
import { PlayerSchema } from '~/models/Player';
import { ItemSchema } from '~/models/Item';

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event);
    if (!session?.user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      });
    }

    const playerId = session.user.id;
    const body = await readBody(event);
    const { code } = body;

    // Validate input
    if (!code) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Vui lòng nhập mã Gift Code.'
      });
    }

    // Find gift code
    const giftCode = await GiftCodeSchema.findOne({ code: code.trim().toUpperCase() });
    if (!giftCode) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Mã không hợp lệ.'
      });
    }

    // Check if expired
    if (giftCode.expiresAt < new Date()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Mã đã hết hạn.'
      });
    }

    // Check if max uses reached
    if (giftCode.redeemedBy.length >= giftCode.maxUses) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Mã đã hết lượt sử dụng.'
      });
    }

    // Check if player already redeemed this code
    if (giftCode.redeemedBy.some((id: any) => id.toString() === playerId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bạn đã dùng mã này rồi.'
      });
    }

    // Get player
    const player = await PlayerSchema.findById(playerId);
    if (!player) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Không tìm thấy thông tin người chơi.'
      });
    }

    // Prepare reward message
    const rewards = [];

    // Add gold
    if (giftCode.rewards.gold > 0) {
      player.gold += giftCode.rewards.gold;
      rewards.push(`${giftCode.rewards.gold} Vàng`);
    }

    // Add premium currency
    if (giftCode.rewards.premium > 0) {
      player.premiumCurrency = (player.premiumCurrency || 0) + giftCode.rewards.premium;
      rewards.push(`${giftCode.rewards.premium} Kim Cương`);
    }

    // Add items
    for (const rewardItem of giftCode.rewards.items) {
      const item = await ItemSchema.findById(rewardItem.itemId);
      if (item) {
        // Add items to player inventory
        for (let i = 0; i < rewardItem.quantity; i++) {
          player.inventory.push(rewardItem.itemId);
        }
        rewards.push(`${item.name} x${rewardItem.quantity}`);
      }
    }

    // Save player
    await player.save();

    // Add player to redeemed list
    giftCode.redeemedBy.push(playerId as any);
    await giftCode.save();

    return {
      success: true,
      message: `Bạn nhận được: ${rewards.join(', ')}!`
    };
  } catch (error: any) {
    console.error('Error redeeming gift code:', error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to redeem gift code'
    });
  }
});
