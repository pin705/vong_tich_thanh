import { PlayerSchema } from '~/models/Player';
import { professionProgressions } from '~/server/utils/professionData';

export default defineEventHandler(async (event) => {
  const user = await getUserSession(event);

  if (!user || !user.user?.id) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  try {
    const userId = (user.user as any).id;
    const player = await PlayerSchema.findById(userId);
    
    if (!player) {
      throw createError({
        statusCode: 404,
        message: 'Player not found',
      });
    }

    // Return profession progressions data
    return {
      success: true,
      progressions: professionProgressions,
      currentProfession: player.profession,
      currentTier: player.professionTier || 1,
      professionLevel: player.professionLevel || 0,
      playerLevel: player.level,
    };
  } catch (error: any) {
    console.error('Error fetching profession data:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      message: 'Error fetching profession data',
    });
  }
});
