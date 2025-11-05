import { PlayerQuestSchema } from '~/models/PlayerQuest';

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

    // Find and delete player quest
    const result = await PlayerQuestSchema.findOneAndDelete({ 
      playerId, 
      questId,
      status: 'active'
    });

    if (!result) {
      return { success: false, message: 'Quest not found or already completed' };
    }

    return {
      success: true,
      message: 'Đã hủy bỏ nhiệm vụ'
    };
  } catch (error) {
    console.error('Error abandoning quest:', error);
    return { 
      success: false, 
      message: 'Failed to abandon quest'
    };
  }
});
