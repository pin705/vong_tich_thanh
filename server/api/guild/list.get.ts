import { GuildSchema } from '~/models/Guild';
import { PlayerSchema } from '~/models/Player';

export default defineEventHandler(async (event) => {
  try {
    const user = await getUserSession(event);

    if (!user || !user.user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      });
    }

    const player = await PlayerSchema.findById(user.user.id).select('guild').lean();
    
    if (!player) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Player not found',
      });
    }

    // Get all guilds with member count and basic info
    const guilds = await GuildSchema.find({}).lean();
    
    const guildList = await Promise.all(guilds.map(async (guild: any) => {
      // Count members
      const memberCount = await PlayerSchema.countDocuments({ guild: guild._id });
      
      // Get leader info
      const leader = await PlayerSchema.findById(guild.leader).select('username').lean();
      
      return {
        id: guild._id.toString(),
        name: guild.name,
        tag: guild.tag,
        description: guild.description,
        level: guild.level,
        memberCount,
        maxMembers: guild.maxMembers || 20,
        leaderName: leader?.username || 'Unknown',
        createdAt: guild.createdAt,
        isPlayerMember: player.guild?.toString() === guild._id.toString()
      };
    }));

    // Sort by level desc, then by member count desc
    guildList.sort((a, b) => {
      if (a.level !== b.level) return b.level - a.level;
      return b.memberCount - a.memberCount;
    });

    return {
      success: true,
      guilds: guildList,
      playerGuildId: player.guild?.toString() || null
    };
  } catch (error) {
    console.error('Error fetching guild list:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch guild list'
    });
  }
});
