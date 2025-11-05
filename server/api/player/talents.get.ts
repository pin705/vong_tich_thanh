import { PlayerSchema } from '~/models/Player';
import { getTalentsByClass } from '~/server/utils/talentData';

export default defineEventHandler(async (event) => {
  const user = await getUserSession(event);

  if (!user || !user.user?.id) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
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

    const branches = getTalentsByClass(player.class);
    const allocatedTalents: Record<string, number> = {};
    
    // Convert Map to object
    if (player.talents) {
      player.talents.forEach((value: number, key: string) => {
        allocatedTalents[key] = value;
      });
    }

    return {
      success: true,
      playerClass: player.class,
      playerLevel: player.level,
      talentPoints: player.talentPoints || 0,
      branches,
      allocatedTalents,
    };
  } catch (error) {
    console.error('Error fetching talents:', error);
    throw createError({
      statusCode: 500,
      message: 'Error fetching talents',
    });
  }
});
