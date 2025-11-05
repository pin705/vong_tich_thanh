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
    const player = await PlayerSchema.findById(user.user.id).populate('skills');
    
    if (!player) {
      throw createError({
        statusCode: 404,
        message: 'Player not found',
      });
    }

    return {
      success: true,
      skills: player.skills || [],
      playerClass: player.class,
    };
  } catch (error) {
    console.error('Error fetching skills:', error);
    throw createError({
      statusCode: 500,
      message: 'Error fetching skills',
    });
  }
});
