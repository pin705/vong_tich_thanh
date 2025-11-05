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

  const playerId = user.user.id;
  
  // Get player
  const player = await PlayerSchema.findById(playerId);
  if (!player || !player.guild) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bạn không có bang hội.'
    });
  }

  // Get guild
  const guild = await GuildSchema.findById(player.guild);
  if (!guild) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Không tìm thấy bang hội.'
    });
  }

  const isLeader = guild.leader.toString() === playerId;

  // Remove player from guild
  guild.members = guild.members.filter((m: any) => m.toString() !== playerId);
  guild.officers = guild.officers.filter((o: any) => o.toString() !== playerId);

  // If leader is leaving
  if (isLeader) {
    if (guild.members.length === 0) {
      // Dissolve guild if leader is last member
      await GuildSchema.findByIdAndDelete(guild._id);
      player.guild = null;
      await player.save();
      
      return {
        success: true,
        message: 'Đã rời bang. Bang hội đã bị giải tán.',
        dissolved: true
      };
    } else {
      // Promote first officer or first member to leader
      if (guild.officers.length > 0) {
        guild.leader = guild.officers[0];
        guild.officers = guild.officers.slice(1);
      } else {
        guild.leader = guild.members[0];
      }
    }
  }

  await guild.save();

  // Update player
  player.guild = null;
  await player.save();

  return {
    success: true,
    message: 'Đã rời bang hội.',
    dissolved: false
  };
});
