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
    const player = await PlayerSchema.findById(userId).populate('skills');
    
    if (!player) {
      throw createError({
        statusCode: 404,
        message: 'Player not found',
      });
    }

    // Default to mutant_warrior if no class set (backward compatibility)
    const playerClass = player.class || 'mutant_warrior';
    const playerProfession = player.profession;

    // Get all available skills for this player (class + profession)
    const classSkills = await SkillSchema.find({
      class: playerClass,
      professionRequirement: null,
    });

    let professionSkills: any[] = [];
    if (playerProfession) {
      professionSkills = await SkillSchema.find({
        professionRequirement: playerProfession,
      });
    }

    // Combine class skills and profession skills
    const allSkills = [...classSkills, ...professionSkills];

    return {
      success: true,
      skills: allSkills || [],
      playerClass,
      profession: playerProfession,
    };
  } catch (error) {
    console.error('Error fetching skills:', error);
    throw createError({
      statusCode: 500,
      message: 'Error fetching skills',
    });
  }
});
