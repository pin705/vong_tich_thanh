import { PlayerQuestSchema } from '~/models/PlayerQuest';
import { QuestSchema } from '~/models/Quest';
import { PlayerSchema } from '~/models/Player';

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event);
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    const body = await readBody(event);
    const { questId } = body;

    if (!questId) {
      return { success: false, message: 'Quest ID is required' };
    }

    const playerId = session.user.id;

    // Check if quest exists
    const quest = await QuestSchema.findById(questId);
    if (!quest) {
      return { success: false, message: 'Quest not found' };
    }

    // Get player info to check requirements
    const player = await PlayerSchema.findById(playerId);
    if (!player) {
      return { success: false, message: 'Player not found' };
    }

    // Check level requirement
    if (quest.levelRequirement && player.level < quest.levelRequirement) {
      return { 
        success: false, 
        message: `Bạn cần đạt cấp ${quest.levelRequirement} để nhận nhiệm vụ này!` 
      };
    }

    // Check profession requirement
    if (quest.professionRequirement && player.profession !== quest.professionRequirement) {
      return { 
        success: false, 
        message: `Bạn cần nghề nghiệp ${quest.professionRequirement} để nhận nhiệm vụ này!` 
      };
    }

    // Check if player already has this quest
    const existingQuest = await PlayerQuestSchema.findOne({ 
      playerId, 
      questId,
      status: { $in: ['active'] }
    });

    if (existingQuest) {
      return { success: false, message: 'Bạn đã nhận nhiệm vụ này rồi!' };
    }

    // Initialize quest objectives with progress = 0
    const objectives = quest.objectives.map((obj: any) => ({
      type: obj.type,
      target: obj.target,
      count: obj.count,
      progress: 0
    }));

    // Create new player quest
    const newPlayerQuest = new PlayerQuestSchema({
      playerId,
      questId,
      status: 'active',
      objectives,
      startedAt: new Date()
    });

    await newPlayerQuest.save();

    return {
      success: true,
      message: `Đã nhận nhiệm vụ: ${quest.name}`
    };
  } catch (error) {
    console.error('Error accepting quest:', error);
    return { 
      success: false, 
      message: 'Failed to accept quest'
    };
  }
});
