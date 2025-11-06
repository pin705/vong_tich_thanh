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

  const body = await readBody(event);
  const { targetPlayerId } = body;

  if (!targetPlayerId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Target player ID is required.'
    });
  }

  const inviterId = user.user.id;
  
  // Get inviter
  const inviter = await PlayerSchema.findById(inviterId);
  if (!inviter || !inviter.guild) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bạn không có bang hội.'
    });
  }

  // Get guild
  const guild = await GuildSchema.findById(inviter.guild);
  if (!guild) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Không tìm thấy bang hội.'
    });
  }

  // Check if inviter is leader or officer
  const isLeader = guild.leader.toString() === inviterId;
  const isOfficer = guild.officers.some((o: any) => o.toString() === inviterId);
  
  if (!isLeader && !isOfficer) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Chỉ bang chủ và sĩ quan mới có thể mời thành viên.'
    });
  }

  // Get target player
  const targetPlayer = await PlayerSchema.findById(targetPlayerId);
  if (!targetPlayer) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Không tìm thấy người chơi.'
    });
  }

  // Check if target already in a guild
  if (targetPlayer.guild) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Người chơi đã có bang hội.'
    });
  }

  // Send invitation via guild service
  const result = guildService.sendInvitation(
    guild._id.toString(),
    guild.name,
    inviterId,
    inviter.username,
    targetPlayerId
  );

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.message
    });
  }

  // Store invitation in player document
  targetPlayer.guildInvite = guild._id;
  await targetPlayer.save();

  // Send WebSocket notification to target player if online
  const { gameState } = await import('../../utils/gameState');
  const targetPlayerState = gameState.getPlayer(targetPlayerId);
  if (targetPlayerState?.ws) {
    targetPlayerState.ws.send(JSON.stringify({
      type: 'guild_invitation',
      payload: {
        guildId: guild._id.toString(),
        guildName: guild.name,
        guildTag: guild.tag,
        inviterId: inviterId,
        inviterName: inviter.username
      }
    }));
  }

  return {
    success: true,
    message: `Đã gửi lời mời vào bang [${guild.tag}] ${guild.name} cho ${targetPlayer.username}.`
  };
});
