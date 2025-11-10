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

  const body = await readBody(event);
  const { skillId, slot } = body;

  if (!skillId) {
    throw createError({
      statusCode: 400,
      message: 'Skill ID is required',
    });
  }

  // Validate slot number (1-10)
  const slotNum = slot ? parseInt(slot) : null;
  if (slotNum && (isNaN(slotNum) || slotNum < 1 || slotNum > 10)) {
    throw createError({
      statusCode: 400,
      message: 'Slot phải từ 1 đến 10',
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

    // Check if player has learned this skill
    const hasSkill = player.skills.some((s: any) => s._id.toString() === skillId);
    if (!hasSkill) {
      throw createError({
        statusCode: 400,
        message: 'Bạn chưa học kỹ năng này',
      });
    }

    // Get skill details
    const skill = await SkillSchema.findById(skillId);
    if (!skill) {
      throw createError({
        statusCode: 404,
        message: 'Skill not found',
      });
    }

    // Only active skills can be equipped
    if (skill.type !== 'active') {
      throw createError({
        statusCode: 400,
        message: `[${skill.name}] là kỹ năng bị động, không thể trang bị vào hotbar`,
      });
    }

    // Initialize equippedSkills if not exists
    if (!player.equippedSkills) {
      player.equippedSkills = new Map();
    }

    // Find first available slot if not specified
    let targetSlot = slotNum;
    if (!targetSlot) {
      // Find first empty slot
      for (let i = 1; i <= 10; i++) {
        if (!player.equippedSkills.has(i.toString())) {
          targetSlot = i;
          break;
        }
      }
      
      if (!targetSlot) {
        throw createError({
          statusCode: 400,
          message: 'Không còn slot trống. Hãy chỉ định slot để thay thế kỹ năng hiện tại',
        });
      }
    }

    // Equip skill to slot
    player.equippedSkills.set(targetSlot.toString(), skill._id);
    await player.save();

    return {
      success: true,
      message: `Đã gán kỹ năng [${skill.name}] vào slot ${targetSlot}`,
      slot: targetSlot,
      skill: {
        id: skill._id.toString(),
        name: skill.name,
        description: skill.description,
        type: skill.type,
        cooldown: skill.cooldown || 0,
        resourceCost: skill.resourceCost || 0,
      },
    };
  } catch (error: any) {
    console.error('Error equipping skill:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Error equipping skill',
    });
  }
});
