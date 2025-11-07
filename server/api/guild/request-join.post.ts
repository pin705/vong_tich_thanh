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

    const body = await readBody(event);
    const { guildId } = body;

    if (!guildId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Guild ID is required',
      });
    }

    const player = await PlayerSchema.findById(user.user.id);
    
    if (!player) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Player not found',
      });
    }

    // Check if player is already in a guild
    if (player.guild) {
      throw createError({
        statusCode: 400,
        statusMessage: 'You are already in a guild',
      });
    }

    // Check if player already has a pending invite
    if (player.guildInvite) {
      throw createError({
        statusCode: 400,
        statusMessage: 'You already have a pending guild invite',
      });
    }

    const guild = await GuildSchema.findById(guildId);
    
    if (!guild) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Guild not found',
      });
    }

    // Check if guild is full
    const memberCount = await PlayerSchema.countDocuments({ guild: guild._id });
    const maxMembers = guild.maxMembers || 20;
    
    if (memberCount >= maxMembers) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Guild is full',
      });
    }

    // Set pending invite
    player.guildInvite = guild._id;
    await player.save();

    // Note: In a full implementation, this would notify guild leaders/officers
    // For now, the invite is stored and can be accepted by guild leaders

    return {
      success: true,
      message: 'Guild join request sent',
      guild: {
        id: guild._id.toString(),
        name: guild.name,
        tag: guild.tag
      }
    };
  } catch (error) {
    console.error('Error requesting guild join:', error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send guild join request'
    });
  }
});
