import { GuildSchema } from '../../../models/Guild';
import { PlayerSchema } from '../../../models/Player';

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

  const leaderId = user.user.id;
  
  // Get leader
  const leader = await PlayerSchema.findById(leaderId);
  if (!leader || !leader.guild) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bạn không có bang hội.'
    });
  }

  // Get guild
  const guild = await GuildSchema.findById(leader.guild);
  if (!guild) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Không tìm thấy bang hội.'
    });
  }

  // Check if requester is leader
  if (guild.leader.toString() !== leaderId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Chỉ bang chủ mới có thể thăng chức.'
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

  // Check if target is in the guild
  if (targetPlayer.guild?.toString() !== guild._id.toString()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Người chơi không ở trong bang này.'
    });
  }

  // Check if target is already an officer
  const isOfficer = guild.officers.some((o: any) => o.toString() === targetPlayerId);
  if (isOfficer) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Người chơi đã là sĩ quan.'
    });
  }

  // Can't promote yourself (you're already the leader)
  if (targetPlayerId === leaderId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bạn đã là bang chủ.'
    });
  }

  // Promote to officer
  guild.officers.push(targetPlayer._id);
  await guild.save();

  return {
    success: true,
    message: `Đã thăng ${targetPlayer.username} lên sĩ quan.`
  };
});
