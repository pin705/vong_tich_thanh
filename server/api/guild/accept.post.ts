import { GuildSchema } from '../../../models/Guild';
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

  // Check if player already in a guild
  if (player.guild) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bạn đã có bang hội.'
    });
  }

  // Get guild
  const guild = await GuildSchema.findById(guildId);
  if (!guild) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Không tìm thấy bang hội.'
    });
  }

  // Accept invitation via guild service
  const result = guildService.acceptInvitation(playerId, guildId);
  
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.message
    });
  }

  // Add player to guild members using atomic operation to prevent race conditions
  await GuildSchema.findByIdAndUpdate(
    guildId,
    { $addToSet: { members: player._id } }, // $addToSet prevents duplicates
    { new: true }
  );

  // Update player's guild and clear invitation
  player.guild = guild._id;
  player.guildInvite = null;
  await player.save();

  return {
    success: true,
    message: `Đã tham gia bang [${guild.tag}] ${guild.name}.`,
    guild: {
      id: guild._id,
      name: guild.name,
      tag: guild.tag,
      level: guild.level
    }
  };
});
