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
  if (!player) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Không tìm thấy thông tin người chơi.'
    });
  }

  // Check if player in a guild
  if (!player.guild) {
    return {
      success: true,
      hasGuild: false,
      guild: null
    };
  }

  // Get guild information
  const guild = await GuildSchema.findById(player.guild)
    .populate('leader', 'username level')
    .populate('officers', 'username level')
    .populate('members', 'username level hp maxHp');

  if (!guild) {
    // Guild was deleted, clean up player reference
    player.guild = null;
    await player.save();
    
    return {
      success: true,
      hasGuild: false,
      guild: null
    };
  }

  return {
    success: true,
    hasGuild: true,
    guild: {
      id: guild._id,
      name: guild.name,
      tag: guild.tag,
      level: guild.level,
      experience: guild.experience,
      leader: guild.leader,
      officers: guild.officers,
      members: guild.members,
      bankGold: guild.bank.gold,
      bankItemCount: guild.bank.items?.length || 0,
      createdAt: guild.createdAt,
      announcements: guild.announcements?.slice(-5) || [], // Last 5 announcements
      isLeader: guild.leader._id.toString() === playerId,
      isOfficer: guild.officers.some((o: any) => o._id.toString() === playerId)
    }
  };
});
