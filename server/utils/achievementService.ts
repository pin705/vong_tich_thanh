import { AchievementSchema } from '../../models/Achievement';
import { PlayerAchievementSchema } from '../../models/PlayerAchievement';
import { PlayerSchema } from '../../models/Player';
import { gameState } from './gameState';
import { applyExpBuff } from './buffSystem';
import { addGoldToPlayer } from './inventoryService';

/**
 * Post an event to the achievement system
 * @param playerId - The player ID
 * @param eventType - Type of event (KILL_AGENT, VISIT_ROOM, COMPLETE_QUEST, GET_ITEM)
 * @param data - Event data containing the key (agentKey, roomKey, questKey, itemKey)
 */
export async function postEvent(
  playerId: string,
  eventType: 'KILL_AGENT' | 'VISIT_ROOM' | 'COMPLETE_QUEST' | 'GET_ITEM',
  data: { key: string }
) {
  try {
    // Find all achievements matching this event type and key
    const matchingAchievements = await AchievementSchema.find({
      'criteria.type': eventType,
      'criteria.key': data.key,
    });

    if (!matchingAchievements || matchingAchievements.length === 0) {
      return; // No achievements for this event
    }

    // Process each matching achievement
    for (const achievement of matchingAchievements) {
      // Find or create player achievement
      let playerAchievement = await PlayerAchievementSchema.findOne({
        playerId,
        achievementKey: achievement.achievementKey,
      });

      if (!playerAchievement) {
        // Create new player achievement
        playerAchievement = await PlayerAchievementSchema.create({
          playerId,
          achievementKey: achievement.achievementKey,
          progress: 0,
          target: achievement.criteria.amount,
          completed: false,
        });
      }

      // If already completed, skip
      if (playerAchievement.completed) {
        continue;
      }

      // Increment progress
      playerAchievement.progress += 1;

      // Check if achievement is now complete
      if (playerAchievement.progress >= playerAchievement.target) {
        playerAchievement.completed = true;
        playerAchievement.completedAt = new Date();
        await playerAchievement.save();

        // Grant rewards
        await grantAchievementRewards(playerId, achievement);

        // Send notification to player
        await sendAchievementNotification(playerId, achievement.name);
      } else {
        await playerAchievement.save();
      }
    }
  } catch (error) {
    console.error('Error in achievementService.postEvent:', error);
  }
}

/**
 * Grant rewards for completing an achievement
 * @param playerId - The player ID
 * @param achievement - The achievement object
 */
async function grantAchievementRewards(playerId: string, achievement: any) {
  try {
    const player = await PlayerSchema.findById(playerId);
    if (!player) {
      console.error('Player not found for achievement rewards:', playerId);
      return;
    }

    let rewardsMessage = `Thành tựu mở khóa: ${achievement.name}!\n`;

    // Grant EXP
    if (achievement.rewards?.exp) {
      const { exp: modifiedExp, multiplier } = await applyExpBuff(playerId, achievement.rewards.exp);
      player.experience += modifiedExp;
      rewardsMessage += `+${modifiedExp} EXP`;
      if (multiplier > 1) {
        rewardsMessage += ` (${multiplier}x)`;
      }
      rewardsMessage += '\n';
    }

    // Grant Gold
    if (achievement.rewards?.gold) {
      await addGoldToPlayer(playerId, achievement.rewards.gold);
      rewardsMessage += `+${achievement.rewards.gold} vàng\n`;
    }

    // Grant Title
    if (achievement.rewards?.title) {
      const title = achievement.rewards.title;
      
      // Check if player already has this title
      const hasTitle = player.unlockedTitles?.some((t: any) => t.key === title.key);
      
      if (!hasTitle) {
        if (!player.unlockedTitles) {
          player.unlockedTitles = [];
        }
        player.unlockedTitles.push(title);
        rewardsMessage += `Danh hiệu mới: ${title.name}\n`;
      }
    }

    await player.save();

    // Send rewards message to player
    const playerObj = gameState.getPlayer(playerId);
    if (playerObj?.ws) {
      playerObj.ws.send(JSON.stringify({
        type: 'game_message',
        payload: {
          message: rewardsMessage,
          messageType: 'achievement',
        },
      }));
    }
  } catch (error) {
    console.error('Error granting achievement rewards:', error);
  }
}

/**
 * Send achievement unlock notification to player
 * @param playerId - The player ID
 * @param achievementName - Name of the achievement
 */
async function sendAchievementNotification(playerId: string, achievementName: string) {
  try {
    const playerObj = gameState.getPlayer(playerId);
    if (playerObj?.ws) {
      playerObj.ws.send(JSON.stringify({
        type: 'achievement_unlocked',
        payload: {
          name: achievementName,
        },
      }));
    }
  } catch (error) {
    console.error('Error sending achievement notification:', error);
  }
}
