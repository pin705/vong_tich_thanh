import { PlayerSchema } from '~/models/Player';
import { SkillSchema } from '~/models/Skill';

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
    const { skillId } = body;

    if (!skillId) {
      throw createError({
        statusCode: 400,
        message: 'Skill ID is required',
      });
    }

    const player = await PlayerSchema.findById(userId);
    if (!player) {
      throw createError({
        statusCode: 404,
        message: 'Player not found',
      });
    }

    const skill = await SkillSchema.findById(skillId);
    if (!skill) {
      throw createError({
        statusCode: 404,
        message: 'Skill not found',
      });
    }

    // Check if skill is learned
    if (!player.skills.includes(skillId)) {
      throw createError({
        statusCode: 400,
        message: 'Skill not learned yet',
      });
    }

    // Get current upgrade level
    const currentLevel = player.learnedSkills?.get(skillId.toString()) || 1;
    const maxLevel = skill.maxUpgradeLevel || 1;

    if (currentLevel >= maxLevel) {
      throw createError({
        statusCode: 400,
        message: 'Skill already at max level',
      });
    }

    // Check skill point cost for upgrade
    const upgradeCost = skill.skillPointCost || 1;
    if ((player.skillPoints || 0) < upgradeCost) {
      throw createError({
        statusCode: 400,
        message: 'Not enough skill points',
      });
    }

    // Upgrade the skill
    player.skillPoints = (player.skillPoints || 0) - upgradeCost;
    
    if (!player.learnedSkills) {
      player.learnedSkills = new Map();
    }
    player.learnedSkills.set(skillId.toString(), currentLevel + 1);

    await player.save();

    return {
      success: true,
      message: `Upgraded ${skill.name} to level ${currentLevel + 1}!`,
      skillPoints: player.skillPoints,
      newLevel: currentLevel + 1,
    };
  } catch (error: any) {
    console.error('Error upgrading skill:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      message: 'Error upgrading skill',
    });
  }
});
