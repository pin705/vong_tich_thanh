import { PlayerSchema } from '~/models/Player';

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
    const player = await PlayerSchema.findById(userId).populate('autoSkills.skillId');
    
    if (!player) {
      throw createError({
        statusCode: 404,
        message: 'Player not found',
      });
    }

    return {
      success: true,
      autoSkills: player.autoSkills || [],
    };
  } catch (error: any) {
    console.error('Error fetching auto-skill config:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      message: 'Error fetching auto-skill configuration',
    });
  }
});
