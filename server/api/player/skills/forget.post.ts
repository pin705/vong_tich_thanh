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
    const { skillId } = body;

    const player = await PlayerSchema.findById(userId);
    if (!player) {
      throw createError({
        statusCode: 404,
        message: 'Player not found',
      });
    }

    if (skillId) {
      // Forget specific skill
      const skillIndex = player.skills.findIndex((s: any) => s.toString() === skillId);
      if (skillIndex === -1) {
        throw createError({
          statusCode: 400,
          message: 'Skill not learned',
        });
      }

      // Remove skill and refund points
      player.skills.splice(skillIndex, 1);
      
      // Get upgrade level to calculate refund
      const upgradeLevel = player.learnedSkills?.get(skillId) || 1;
      const refund = upgradeLevel; // Refund 1 point per level
      
      player.skillPoints = (player.skillPoints || 0) + refund;
      
      // Remove from learned skills
      if (player.learnedSkills) {
        player.learnedSkills.delete(skillId);
      }

      await player.save();

      return {
        success: true,
        message: 'Skill forgotten. Skill points refunded.',
        skillPoints: player.skillPoints,
      };
    } else {
      // Reset all skills
      const totalRefund = player.skills.length;
      
      // Add upgrade level refunds
      let upgradeRefund = 0;
      if (player.learnedSkills) {
        player.learnedSkills.forEach((level: number) => {
          upgradeRefund += level - 1; // Refund upgrade levels (not base level)
        });
      }

      player.skills = [];
      player.learnedSkills = new Map();
      player.skillPoints = (player.skillPoints || 0) + totalRefund + upgradeRefund;

      await player.save();

      return {
        success: true,
        message: 'All skills reset. Skill points refunded.',
        skillPoints: player.skillPoints,
      };
    }
  } catch (error: any) {
    console.error('Error forgetting skill:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      message: 'Error forgetting skill',
    });
  }
});
