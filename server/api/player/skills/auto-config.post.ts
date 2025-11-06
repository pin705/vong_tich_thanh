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
    const body = await readBody(event);
    const { autoSkills } = body;

    if (!Array.isArray(autoSkills)) {
      throw createError({
        statusCode: 400,
        message: 'Auto skills must be an array',
      });
    }

    const player = await PlayerSchema.findById(userId);
    if (!player) {
      throw createError({
        statusCode: 404,
        message: 'Player not found',
      });
    }

    // Validate auto-skills configuration
    const validatedAutoSkills = autoSkills.map((autoSkill: any) => {
      if (!autoSkill.skillId) {
        throw createError({
          statusCode: 400,
          message: 'Skill ID is required',
        });
      }

      // Check if player has this skill
      if (!player.skills.some((s: any) => s.toString() === autoSkill.skillId)) {
        throw createError({
          statusCode: 400,
          message: 'Player does not have this skill',
        });
      }

      return {
        skillId: autoSkill.skillId,
        priority: autoSkill.priority || 0,
        conditions: new Map(Object.entries(autoSkill.conditions || {})),
      };
    });

    // Save auto-skills configuration
    player.autoSkills = validatedAutoSkills;
    await player.save();

    return {
      success: true,
      message: 'Auto-skill configuration saved',
    };
  } catch (error: any) {
    console.error('Error saving auto-skill config:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      message: 'Error saving auto-skill configuration',
    });
  }
});
