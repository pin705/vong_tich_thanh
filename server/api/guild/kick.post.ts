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

  const kickerId = user.user.id;
  
  // Get kicker
  const kicker = await PlayerSchema.findById(kickerId);
  if (!kicker || !kicker.guild) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bạn không có bang hội.'
    });
  }

  // Get guild
  const guild = await GuildSchema.findById(kicker.guild);
  if (!guild) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Không tìm thấy bang hội.'
    });
  }

  // Check if kicker is leader or officer
  const isLeader = guild.leader.toString() === kickerId;
  const isOfficer = guild.officers.some((o: any) => o.toString() === kickerId);
  
  if (!isLeader && !isOfficer) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Chỉ bang chủ và sĩ quan mới có thể đuổi thành viên.'
    });
  }

  // Can't kick yourself
  if (targetPlayerId === kickerId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Không thể đuổi chính mình. Hãy dùng lệnh rời bang.'
    });
  }

  // Can't kick the leader
  if (guild.leader.toString() === targetPlayerId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Không thể đuổi bang chủ.'
    });
  }

  // Officers can't kick other officers
  if (isOfficer && !isLeader) {
    const isTargetOfficer = guild.officers.some((o: any) => o.toString() === targetPlayerId);
    if (isTargetOfficer) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Sĩ quan không thể đuổi sĩ quan khác.'
      });
    }
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

  // Remove player from guild
  guild.members = guild.members.filter((m: any) => m.toString() !== targetPlayerId);
  guild.officers = guild.officers.filter((o: any) => o.toString() !== targetPlayerId);
  await guild.save();

  // Update target player
  targetPlayer.guild = null;
  await targetPlayer.save();

  return {
    success: true,
    message: `Đã đuổi ${targetPlayer.username} khỏi bang.`
  };
});
