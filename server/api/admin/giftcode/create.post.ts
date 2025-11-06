import { GiftCodeSchema } from '~/models/GiftCode';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { code, rewards, maxUses, expiresAt } = body;

    // Validate input
    if (!code || !expiresAt) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Thiếu mã code hoặc ngày hết hạn.'
      });
    }

    // Check if code already exists
    const existingCode = await GiftCodeSchema.findOne({ 
      code: code.trim().toUpperCase() 
    });

    if (existingCode) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Mã code này đã tồn tại.'
      });
    }

    // Create gift code
    const giftCode = await GiftCodeSchema.create({
      code: code.trim().toUpperCase(),
      rewards: {
        items: rewards?.items || [],
        gold: rewards?.gold || 0,
        premium: rewards?.premium || 0
      },
      maxUses: maxUses || 1,
      expiresAt: new Date(expiresAt)
    });

    return {
      success: true,
      message: `Đã tạo Gift Code: ${giftCode.code}`,
      giftCode: {
        id: giftCode._id,
        code: giftCode.code,
        maxUses: giftCode.maxUses,
        expiresAt: giftCode.expiresAt
      }
    };
  } catch (error: any) {
    console.error('Error creating gift code:', error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create gift code'
    });
  }
});
