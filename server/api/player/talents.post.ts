import { PlayerSchema } from '~/models/Player';
import { getTalentById, getTalentsByClass } from '~/server/utils/talentData';

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

  if (!talentId || typeof talentId !== 'string') {
    throw createError({
      statusCode: 400,
      message: 'Talent ID is required và phải là chuỗi',
    });
  }

  // Sanitize talentId to prevent injection
  if (!/^[a-zA-Z0-9_-]+$/.test(talentId)) {
    throw createError({
      statusCode: 400,
      message: 'Talent ID không hợp lệ',
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

    // Default to mutant_warrior if no class set (backward compatibility)
    const playerClass = player.class || 'mutant_warrior';
    
    // Get talent info
    const talent = getTalentById(playerClass, talentId);
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

    // Validate level requirement
    if (player.level < talent.levelRequired) {
      throw createError({
        statusCode: 400,
        message: `Level ${talent.levelRequired} required`,
      });
    }

    // Validate points in branch requirement
    const branches = getTalentsByClass(playerClass);
    const branch = branches.find((b: any) => b.id === talent.branch);
    if (branch) {
      let pointsInBranch = 0;
      for (const branchTalent of branch.talents) {
        pointsInBranch += player.talents.get(branchTalent.id) || 0;
      }
      if (pointsInBranch < talent.pointsInBranchRequired) {
        throw createError({
          statusCode: 400,
          message: `${talent.pointsInBranchRequired} points in branch required`,
        });
      }
    }

    // Validate prerequisite talents
    if (talent.prerequisiteTalents && talent.prerequisiteTalents.length > 0) {
      for (const prereqId of talent.prerequisiteTalents) {
        const prereqRank = player.talents.get(prereqId) || 0;
        if (prereqRank === 0) {
          throw createError({
            statusCode: 400,
            message: 'Prerequisite talent required',
          });
        }
      }
    }

    // Allocate point
    player.talents.set(talentId, currentRank + 1);
    player.talentPoints = (player.talentPoints || 0) - 1;
    
    // Mark the talents field as modified to ensure Mongoose saves it
    player.markModified('talents');

    await player.save();

    // Recalculate player stats to apply talent bonuses
    const { recalculateStats } = await import('~/server/utils/playerStats');
    await recalculateStats(user.user.id);

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
