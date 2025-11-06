import { PlayerSchema } from '~/models/Player';

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event);
    
    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Bạn chưa đăng nhập.'
      });
    }

    const body = await readBody(event);
    const playerId = session.user.id;

    // Get player
    const player = await PlayerSchema.findById(playerId);
    if (!player) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Không tìm thấy người chơi.'
      });
    }

    // Update settings
    if (typeof body.autoCombat !== 'undefined') {
      player.autoCombat = body.autoCombat;
    }

    if (body.customAliases) {
      player.customAliases = new Map(Object.entries(body.customAliases));
    }

    await player.save();

    return {
      success: true,
      message: 'Đã lưu cài đặt.',
      settings: {
        autoCombat: player.autoCombat,
        customAliases: Object.fromEntries(player.customAliases || new Map())
      }
    };
  } catch (error: any) {
    console.error('Error saving player settings:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Lỗi khi lưu cài đặt.'
    });
  }
});
