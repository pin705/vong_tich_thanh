import { PlayerSchema } from '~/models/Player';
import { getTalentById } from '~/server/utils/talentData';

export default defineEventHandler(async (event) => {
  const user = await getUserSession(event);

  if (!user || !user.user?.id) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  const body = await readBody(event);
  const { talentId } = body;

  if (!talentId) {
    throw createError({
      statusCode: 400,
      message: 'Talent ID is required',
    });
  }

  try {
    const player = await PlayerSchema.findById(user.user.id);
    
    if (!player) {
      throw createError({
        statusCode: 404,
        message: 'Player not found',
      });
    }

    // Check if player has talent points
    if ((player.talentPoints || 0) <= 0) {
      throw createError({
        statusCode: 400,
        message: 'No talent points available',
      });
    }

    // Get talent info
    const talent = getTalentById(player.class, talentId);
    if (!talent) {
      throw createError({
        statusCode: 404,
        message: 'Talent not found',
      });
    }

    // Initialize talents map if needed
    if (!player.talents) {
      player.talents = new Map();
    }

    // Check current rank
    const currentRank = player.talents.get(talentId) || 0;
    if (currentRank >= talent.maxRank) {
      throw createError({
        statusCode: 400,
        message: 'Talent already at max rank',
      });
    }

    // Allocate point
    player.talents.set(talentId, currentRank + 1);
    player.talentPoints = (player.talentPoints || 0) - 1;

    await player.save();

    return {
      success: true,
      talentPoints: player.talentPoints,
      allocatedTalents: Object.fromEntries(player.talents),
    };
  } catch (error) {
    console.error('Error allocating talent:', error);
    throw createError({
      statusCode: 500,
      message: 'Error allocating talent',
    });
  }
});
