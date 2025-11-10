import { QuestSchema } from '~/models/Quest';
import { PlayerQuestSchema } from '~/models/PlayerQuest';

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event);
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    const playerId = session.user.id;

    // Get player's active and completed quests
    const playerQuests = await PlayerQuestSchema.find({ playerId }).lean();

    // Get all available quests
    const allQuests = await QuestSchema.find({ active: true }).lean();

    // Map to quest format
    const quests = [];

    // Add active quests
    for (const pq of playerQuests) {
      if (pq.status === 'active') {
        const quest = allQuests.find((q: any) => q._id.toString() === pq.questId.toString());
        if (quest) {
          quests.push({
            id: quest._id.toString(),
            name: quest.name,
            description: quest.description,
            type: quest.type,
            questGiver: quest.questGiver,
            objectives: pq.objectives,
            rewards: quest.rewards,
            status: pq.status,
            levelRequirement: quest.levelRequirement,
            professionRequirement: quest.professionRequirement,
            isRepeatable: quest.isRepeatable
          });
        }
      }
    }

    // Add available quests (not yet started or repeatable completed quests)
    const PlayerSchema = await import('~/models/Player').then(m => m.PlayerSchema);
    const player = await PlayerSchema.findById(playerId).lean();

    for (const quest of allQuests) {
      const playerQuest = playerQuests.find((pq: any) => 
        pq.questId.toString() === quest._id.toString()
      );

      // Show quest if:
      // 1. Player doesn't have it, OR
      // 2. It's a repeatable quest that was completed
      const shouldShow = !playerQuest || 
        (playerQuest.status === 'completed' && quest.isRepeatable);

      if (shouldShow) {
        // Check requirements
        const meetsLevel = !quest.levelRequirement || (player?.level || 1) >= quest.levelRequirement;
        const meetsProfession = !quest.professionRequirement || player?.profession === quest.professionRequirement;

        if (meetsLevel && meetsProfession) {
          quests.push({
            id: quest._id.toString(),
            name: quest.name,
            description: quest.description,
            type: quest.type,
            questGiver: quest.questGiver,
            objectives: quest.objectives.map((obj: any) => ({
              type: obj.type,
              target: obj.target,
              count: obj.count,
              progress: 0
            })),
            rewards: quest.rewards,
            status: 'available',
            levelRequirement: quest.levelRequirement,
            professionRequirement: quest.professionRequirement,
            isRepeatable: quest.isRepeatable
          });
        }
      }
    }

    return {
      success: true,
      quests
    };
  } catch (error) {
    console.error('Error loading quests:', error);
    return { 
      success: false, 
      message: 'Failed to load quests',
      quests: []
    };
  }
});
