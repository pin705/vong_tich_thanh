import { MailSchema } from '~/models/Mail';
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
    const mailId = getRouterParam(event, 'id');

    if (!mailId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Mail ID is required'
      });
    }

    // Find mail
    const mail = await MailSchema.findById(mailId).populate('attachedItems.itemId');
    if (!mail) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Thư không tồn tại.'
      });
    }

    // Verify ownership
    if (mail.recipientId.toString() !== playerId) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Bạn không có quyền nhận thưởng từ thư này.'
      });
    }

    // Check if there are any attachments
    if (mail.attachedItems.length === 0 && mail.attachedGold === 0 && mail.attachedPremium === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Thư này không có phần thưởng nào.'
      });
    }

    // Store attachment data before clearing (for atomic operation)
    const goldToTransfer = mail.attachedGold;
    const premiumToTransfer = mail.attachedPremium;
    const itemsToTransfer = [...mail.attachedItems];

    // Clear attachments from mail atomically to prevent duplicate claims
    const clearedMail = await MailSchema.findOneAndUpdate(
      { 
        _id: mailId,
        recipientId: playerId,
        $or: [
          { attachedGold: { $gt: 0 } },
          { attachedPremium: { $gt: 0 } },
          { attachedItems: { $ne: [] } }
        ]
      },
      {
        attachedItems: [],
        attachedGold: 0,
        attachedPremium: 0
      },
      { new: false } // Return old document
    );

    // If update failed, mail was already claimed
    if (!clearedMail || (clearedMail.attachedItems.length === 0 && clearedMail.attachedGold === 0 && clearedMail.attachedPremium === 0)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Thư này đã được nhận thưởng rồi.'
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

    // Transfer gold
    if (goldToTransfer > 0) {
      player.gold += goldToTransfer;
      rewards.push(`${goldToTransfer} Vàng`);
    }

    // Transfer premium currency
    if (premiumToTransfer > 0) {
      player.premiumCurrency = (player.premiumCurrency || 0) + premiumToTransfer;
      rewards.push(`${premiumToTransfer} Kim Cương`);
    }

    // Transfer items
    for (const attachedItem of itemsToTransfer) {
      const itemId = (attachedItem.itemId as any)?._id || attachedItem.itemId;
      const item = await ItemSchema.findById(itemId);
      
      if (item) {
        // Add items to player inventory
        for (let i = 0; i < attachedItem.quantity; i++) {
          player.inventory.push(itemId);
        }
        
        rewards.push(`${(attachedItem.itemId as any)?.name || 'Vật phẩm'} x${attachedItem.quantity}`);
      }
    }

    // Save player
    await player.save();

    return {
      success: true,
      message: `Bạn nhận được: ${rewards.join(', ')}!`
    };
  } catch (error: any) {
    console.error('Error claiming mail rewards:', error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to claim mail rewards'
    });
  }
});
