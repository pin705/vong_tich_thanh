import { AchievementSchema } from '~/models/Achievement';
import { PlayerAchievementSchema } from '~/models/PlayerAchievement';

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event);
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    const playerId = session.user.id;

    // Get all achievements
    const allAchievements = await AchievementSchema.find({}).lean();

    // Get player's achievement progress
    const playerAchievements = await PlayerAchievementSchema.find({ playerId }).lean();

    // Create a map for quick lookup
    const progressMap = new Map();
    playerAchievements.forEach((pa: any) => {
      progressMap.set(pa.achievementKey, pa);
    });

    // Merge achievements with player progress
    const mergedAchievements = allAchievements.map((achievement: any) => {
      const progress = progressMap.get(achievement.achievementKey);
      
      return {
        achievementKey: achievement.achievementKey,
        name: achievement.name,
        description: achievement.description,
        category: achievement.category,
        progress: progress?.progress || 0,
        target: achievement.criteria.amount,
        completed: progress?.completed || false,
        completedAt: progress?.completedAt || null,
        rewards: achievement.rewards,
      };
    });

    // Group by category
    const grouped = {
      COMBAT: mergedAchievements.filter((a: any) => a.category === 'COMBAT'),
      EXPLORATION: mergedAchievements.filter((a: any) => a.category === 'EXPLORATION'),
      SOCIAL: mergedAchievements.filter((a: any) => a.category === 'SOCIAL'),
      COLLECTION: mergedAchievements.filter((a: any) => a.category === 'COLLECTION'),
    };

    return {
      success: true,
      achievements: grouped,
      allAchievements: mergedAchievements,
    };
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return {
      success: false,
      message: 'Failed to fetch achievements',
    };
  }
});
