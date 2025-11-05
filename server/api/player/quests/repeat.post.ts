import { PlayerQuestSchema } from '~/models/PlayerQuest';
import { QuestSchema } from '~/models/Quest';

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

    // Check if quest is repeatable
    const quest = await QuestSchema.findById(questId);
    if (!quest) {
      return { success: false, message: 'Quest not found' };
    }

    if (!quest.isRepeatable) {
      return { success: false, message: 'Nhiệm vụ này không thể làm lại!' };
    }

    // Find completed quest
    const existingQuest = await PlayerQuestSchema.findOne({ 
      playerId, 
      questId,
      status: 'completed'
    });

    if (!existingQuest) {
      return { success: false, message: 'Bạn chưa hoàn thành nhiệm vụ này!' };
    }

    // Reset quest objectives
    const objectives = quest.objectives.map((obj: any) => ({
      type: obj.type,
      target: obj.target,
      count: obj.count,
      progress: 0
    }));

    // Update quest status
    existingQuest.status = 'active';
    existingQuest.objectives = objectives;
    existingQuest.startedAt = new Date();
    existingQuest.completedAt = undefined;
    await existingQuest.save();

    return {
      success: true,
      message: 'Đã nhận lại nhiệm vụ'
    };
  } catch (error) {
    console.error('Error repeating quest:', error);
    return { 
      success: false, 
      message: 'Failed to repeat quest'
    };
  }
});
