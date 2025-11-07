import { AchievementSchema } from '~/models/Achievement';
import { SAMPLE_ACHIEVEMENTS } from '~/server/data/sampleAchievements';

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event);
    
    // Check if user is admin (optional - remove this check if you want anyone to be able to init)
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    // Initialize all sample achievements
    let created = 0;
    let updated = 0;

    for (const achievement of SAMPLE_ACHIEVEMENTS) {
      const existing = await AchievementSchema.findOne({ 
        achievementKey: achievement.achievementKey 
      });

      if (existing) {
        // Update existing achievement
        await AchievementSchema.updateOne(
          { achievementKey: achievement.achievementKey },
          achievement
        );
        updated++;
      } else {
        // Create new achievement
        await AchievementSchema.create(achievement);
        created++;
      }
    }

    return {
      success: true,
      message: `Achievements initialized: ${created} created, ${updated} updated`,
      total: SAMPLE_ACHIEVEMENTS.length,
      created,
      updated,
    };
  } catch (error) {
    console.error('Error initializing achievements:', error);
    return {
      success: false,
      message: 'Failed to initialize achievements',
      error: error.message,
    };
  }
});
