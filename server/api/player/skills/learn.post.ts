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

    // Check if skill is already learned
    if (player.skills.includes(skillId)) {
      throw createError({
        statusCode: 400,
        message: 'Skill already learned',
      });
    }

    // Check level requirement
    if (skill.levelRequirement && player.level < skill.levelRequirement) {
      throw createError({
        statusCode: 400,
        message: `Requires level ${skill.levelRequirement}`,
      });
    }

    // Check class requirement
    if (skill.class && player.class !== skill.class) {
      throw createError({
        statusCode: 400,
        message: 'Wrong class for this skill',
      });
    }

    // Check skill point cost
    const skillPointCost = skill.skillPointCost || 1;
    if ((player.skillPoints || 0) < skillPointCost) {
      throw createError({
        statusCode: 400,
        message: 'Not enough skill points',
      });
    }

    // Check prerequisites
    if (skill.prerequisiteSkills && skill.prerequisiteSkills.length > 0) {
      const hasPrerequisites = skill.prerequisiteSkills.every((prereqId: any) =>
        player.skills.some((s: any) => s.toString() === prereqId.toString())
      );
      if (!hasPrerequisites) {
        throw createError({
          statusCode: 400,
          message: 'Missing prerequisite skills',
        });
      }
    }

    // Check profession requirement
    if (skill.professionRequirement && player.profession !== skill.professionRequirement) {
      throw createError({
        statusCode: 400,
        message: `Requires ${skill.professionRequirement} profession`,
      });
    }

    // Learn the skill
    player.skills.push(skillId);
    player.skillPoints = (player.skillPoints || 0) - skillPointCost;
    
    // Initialize skill upgrade level
    if (!player.learnedSkills) {
      player.learnedSkills = new Map();
    }
    player.learnedSkills.set(skillId.toString(), 1);
    
    // Mark the learnedSkills field as modified to ensure Mongoose saves it
    player.markModified('learnedSkills');

    await player.save();

    return {
      success: true,
      message: `Learned ${skill.name}!`,
      skillPoints: player.skillPoints,
    };
  } catch (error: any) {
    console.error('Error learning skill:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      message: 'Error learning skill',
    });
  }
});
