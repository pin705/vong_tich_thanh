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

    const playerId = session.user.id;

    // Get player
    const player = await PlayerSchema.findById(playerId);
    if (!player) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Không tìm thấy người chơi.'
      });
    }

    return {
      success: true,
      player: {
        id: player._id.toString(),
        username: player.username,
        autoCombat: player.autoCombat || false,
        customAliases: Object.fromEntries(player.customAliases || new Map())
      }
    };
  } catch (error: any) {
    console.error('Error loading player info:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Lỗi khi tải thông tin người chơi.'
    });
  }
});
