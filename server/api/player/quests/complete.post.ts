import { PlayerQuestSchema } from '~/models/PlayerQuest';
import { QuestSchema } from '~/models/Quest';
import { PlayerSchema } from '~/models/Player';
import { ItemSchema } from '~/models/Item';

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

    // Find player quest
    const playerQuest = await PlayerQuestSchema.findOne({ 
      playerId, 
      questId,
      status: 'active'
    });

    if (!playerQuest) {
      return { success: false, message: 'Quest not found or already completed' };
    }

    // Check if all objectives are completed
    const allCompleted = playerQuest.objectives.every((obj: any) => obj.progress >= obj.count);
    if (!allCompleted) {
      return { success: false, message: 'Chưa hoàn thành tất cả mục tiêu!' };
    }

    // Get quest for rewards
    const quest = await QuestSchema.findById(questId);
    if (!quest) {
      return { success: false, message: 'Quest data not found' };
    }

    // Give rewards
    const player = await PlayerSchema.findById(playerId);
    if (!player) {
      return { success: false, message: 'Player not found' };
    }

    // Add experience
    if (quest.rewards.exp) {
      player.experience += quest.rewards.exp;
    }

    // Add gold
    if (quest.rewards.gold) {
      player.gold += quest.rewards.gold;
    }

    // Add items
    if (quest.rewards.items && quest.rewards.items.length > 0) {
      // Fetch all reward items
      const rewardItems = await ItemSchema.find({ _id: { $in: quest.rewards.items } }).lean();
      
      if (rewardItems.length > 0) {
        // Create copies of all items in one operation
        const newItemsData = rewardItems.map(item => ({
          name: item.name,
          description: item.description,
          type: item.type,
          value: item.value,
          stats: item.stats || {}
        }));
        
        const newItems = await ItemSchema.insertMany(newItemsData);
        
        // Add all new item IDs to inventory
        newItems.forEach(item => {
          player.inventory.push(item._id);
        });
      }
    }

    await player.save();

    // Mark quest as completed
    playerQuest.status = 'completed';
    playerQuest.completedAt = new Date();
    await playerQuest.save();

    return {
      success: true,
      message: 'Đã hoàn thành nhiệm vụ!',
      rewards: quest.rewards
    };
  } catch (error) {
    console.error('Error completing quest:', error);
    return { 
      success: false, 
      message: 'Failed to complete quest'
    };
  }
});
