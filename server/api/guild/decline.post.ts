import { PlayerSchema } from '../../../models/Player';
import { guildService } from '../../utils/guildService';

export default defineEventHandler(async (event) => {
  const user = await getUserSession(event);
  if (!user?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    });
  }

  const playerId = user.user.id;

  // Get player
  const player = await PlayerSchema.findById(playerId);
  if (!player) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Không tìm thấy thông tin người chơi.'
    });
  }

  // Check if player has pending invitation
  if (!player.guildInvite) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bạn không có lời mời bang hội nào.'
    });
  }

  const guildId = player.guildInvite.toString();

  // Decline invitation via guild service
  const result = guildService.declineInvitation(playerId, guildId);
  
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.message
    });
  }

  // Clear player's guild invitation
  player.guildInvite = null;
  await player.save();

  return {
    success: true,
    message: result.message
  };
});
