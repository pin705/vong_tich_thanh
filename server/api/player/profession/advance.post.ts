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
    const body = await readBody(event);
    const { targetTier } = body;

    if (!targetTier || typeof targetTier !== 'number') {
      throw createError({
        statusCode: 400,
        message: 'Target tier is required',
      });
    }

    const player = await PlayerSchema.findById(userId);
    if (!player) {
      throw createError({
        statusCode: 404,
        message: 'Player not found',
      });
    }

    if (!player.profession) {
      throw createError({
        statusCode: 400,
        message: 'No profession selected',
      });
    }

    const currentTier = player.professionTier || 1;
    
    // Can only advance to next tier
    if (targetTier !== currentTier + 1) {
      throw createError({
        statusCode: 400,
        message: 'Can only advance to next tier',
      });
    }

    // Get profession progression data
    const progression = professionProgressions[player.profession as keyof typeof professionProgressions];
    if (!progression) {
      throw createError({
        statusCode: 400,
        message: 'Invalid profession',
      });
    }

    const nextTier = progression.tiers.find(t => t.tier === targetTier);
    if (!nextTier) {
      throw createError({
        statusCode: 400,
        message: 'Invalid tier',
      });
    }

    // Check requirements
    const requirements = nextTier.requirements;
    
    if (requirements.level && player.level < requirements.level) {
      throw createError({
        statusCode: 400,
        message: `Requires level ${requirements.level}`,
      });
    }

    if (requirements.professionLevel && player.professionLevel < requirements.professionLevel) {
      throw createError({
        statusCode: 400,
        message: `Requires profession level ${requirements.professionLevel}`,
      });
    }

    if (requirements.completedQuests && requirements.completedQuests.length > 0) {
      const hasAllQuests = requirements.completedQuests.every(questId =>
        player.completedProfessionQuests?.includes(questId)
      );
      if (!hasAllQuests) {
        throw createError({
          statusCode: 400,
          message: 'Missing required quest completions',
        });
      }
    }

    // Advance to next tier
    player.professionTier = targetTier;
    await player.save();

    return {
      success: true,
      message: `Advanced to ${nextTier.name}!`,
      tier: targetTier,
      tierName: nextTier.name,
      benefits: nextTier.benefits,
    };
  } catch (error: any) {
    console.error('Error advancing profession tier:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      message: 'Error advancing profession tier',
    });
  }
});
