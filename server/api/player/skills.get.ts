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

    // Default to mutant_warrior if no class set (backward compatibility)
    const playerClass = player.class || 'mutant_warrior';

    return {
      success: true,
      skills: player.skills || [],
      playerClass,
    };
  } catch (error) {
    console.error('Error fetching skills:', error);
    throw createError({
      statusCode: 500,
      message: 'Error fetching skills',
    });
  }
});
