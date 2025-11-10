import { PlayerSchema } from '../../models/Player';
import { AgentSchema } from '../../models/Agent';
import { RoomSchema } from '../../models/Room';
import { addGoldToPlayer } from './inventoryService';
import { gameState } from './gameState';
import { DUNGEON_BASE_GOLD_REWARD, DUNGEON_GOLD_MULTIPLIER, DUNGEON_BASE_COIN_REWARD, DUNGEON_COIN_FLOOR_DIVISOR } from './constants';

/**
 * Dungeon Service - Core logic for dungeon system
 * Handles dungeon progression, monster generation, and rewards
 */

/**
 * Get dungeon status for a player
 * @param playerId - Player ID
 * @returns Dungeon progress and currency
 */
export async function getDungeonStatus(playerId: string) {
  try {
    const player = await PlayerSchema.findById(playerId);
    if (!player) {
      return { success: false, message: 'Không tìm thấy người chơi.' };
    }

    return {
      success: true,
      data: {
        currentFloor: player.dungeonProgress?.currentFloor || 1,
        highestFloor: player.dungeonProgress?.highestFloor || 1,
        dungeonCoin: player.dungeonCoin || 0,
        lastWeeklyReset: player.dungeonProgress?.lastWeeklyReset || new Date(),
      },
    };
  } catch (error) {
    console.error('Error getting dungeon status:', error);
    return { success: false, message: 'Lỗi khi lấy thông tin hầm ngục.' };
  }
}

/**
 * Generate a monster for a specific dungeon floor
 * @param floorNumber - Floor number
 * @returns Monster configuration
 */
export async function generateMonsterForFloor(floorNumber: number) {
  try {
    let agentKey = 'goblin'; // Default base mob
    let agentName = 'Goblin Hầm Ngục';
    let agentType = 'mob';
    let statsMultiplier = 1.1;

    // Boss every 10 floors
    if (floorNumber % 10 === 0) {
      agentKey = 'boss';
      agentName = `Thủ Lĩnh Tầng ${floorNumber}`;
      agentType = 'boss';
      statsMultiplier = 2.0;
    }
    // Elite every 5 floors
    else if (floorNumber % 5 === 0) {
      agentKey = 'elite';
      agentName = `Tinh Anh Tầng ${floorNumber}`;
      agentType = 'elite';
      statsMultiplier = 1.5;
    }
    // Regular mobs with increasing difficulty
    else {
      agentName = `Quái Tầng ${floorNumber}`;
    }

    // Calculate stats based on floor
    const baseHp = 50;
    const baseDamage = 5;
    const baseExp = 10;

    const hp = Math.floor(baseHp * Math.pow(floorNumber, 1.1) * statsMultiplier);
    const maxHp = hp;
    const damage = Math.floor(baseDamage * Math.pow(floorNumber, 1.05) * statsMultiplier);
    const experience = Math.floor(baseExp * floorNumber * statsMultiplier);
    const level = Math.max(1, Math.floor(floorNumber / 2));

    // Generate unique agentKey for this dungeon monster
    const agentKey = `dungeon_${agentType}_floor_${floorNumber}_${Date.now()}`;

    return {
      name: agentName,
      description: `Quái vật nguy hiểm từ tầng ${floorNumber} của hầm ngục.`,
      type: 'mob',
      agentType,
      agentKey,
      hp,
      maxHp,
      damage,
      experience,
      level,
      behavior: 'aggressive',
      isDungeonBoss: true,
      dungeonFloor: floorNumber,
    };
  } catch (error) {
    console.error('Error generating monster for floor:', error);
    return null;
  }
}

/**
 * Start a dungeon challenge for a player
 * @param playerId - Player ID
 * @param floorNumber - Floor number to challenge
 * @returns Success status and message
 */
export async function startChallenge(playerId: string, floorNumber: number) {
  try {
    const player = await PlayerSchema.findById(playerId);
    if (!player) {
      return { success: false, message: 'Không tìm thấy người chơi.' };
    }

    // Check if player can access this floor
    if (floorNumber > (player.dungeonProgress?.currentFloor || 1)) {
      return {
        success: false,
        message: `Bạn chưa thể vào tầng ${floorNumber}. Hãy hoàn thành tầng ${player.dungeonProgress?.currentFloor || 1} trước.`,
      };
    }

    // Get player's current room
    const room = await RoomSchema.findById(player.currentRoomId);
    if (!room) {
      return { success: false, message: 'Không tìm thấy phòng.' };
    }

    // Generate monster for this floor
    const monsterData = await generateMonsterForFloor(floorNumber);
    if (!monsterData) {
      return { success: false, message: 'Lỗi khi tạo quái vật.' };
    }

    // Create the dungeon boss in the room
    const dungeonBoss = await AgentSchema.create({
      ...monsterData,
      currentRoomId: room._id,
    });

    // Broadcast the spawn to room
    gameState.broadcastToRoom(room._id.toString(), {
      type: 'normal',
      message: `[${dungeonBoss.name}] xuất hiện!`,
    });

    return {
      success: true,
      message: `Bắt đầu thử thách tầng ${floorNumber}! [${dungeonBoss.name}] đã xuất hiện.`,
      boss: dungeonBoss,
    };
  } catch (error) {
    console.error('Error starting challenge:', error);
    return { success: false, message: 'Lỗi khi bắt đầu thử thách.' };
  }
}

/**
 * Complete a dungeon floor and grant rewards
 * @param playerId - Player ID
 * @param floorNumber - Completed floor number
 * @returns Success status and rewards
 */
export async function completeFloor(playerId: string, floorNumber: number) {
  try {
    const player = await PlayerSchema.findById(playerId);
    if (!player) {
      return { success: false, message: 'Không tìm thấy người chơi.' };
    }

    // Calculate rewards based on floor
    const goldReward = Math.floor(DUNGEON_BASE_GOLD_REWARD * floorNumber * DUNGEON_GOLD_MULTIPLIER);
    const dungeonCoinReward = Math.floor(DUNGEON_BASE_COIN_REWARD * Math.max(1, floorNumber / DUNGEON_COIN_FLOOR_DIVISOR));

    // Grant rewards
    await addGoldToPlayer(playerId, goldReward);
    player.dungeonCoin = (player.dungeonCoin || 0) + dungeonCoinReward;

    // Update progress
    const currentFloor = player.dungeonProgress?.currentFloor || 1;
    if (floorNumber >= currentFloor) {
      if (!player.dungeonProgress) {
        player.dungeonProgress = {
          currentFloor: floorNumber + 1,
          highestFloor: floorNumber,
          lastWeeklyReset: new Date(),
        };
      } else {
        player.dungeonProgress.currentFloor = floorNumber + 1;
        if (floorNumber > (player.dungeonProgress.highestFloor || 1)) {
          player.dungeonProgress.highestFloor = floorNumber;
        }
      }
    }

    await player.save();

    // Send message to player
    const playerObj = gameState.getPlayer(playerId);
    if (playerObj && playerObj.ws) {
      playerObj.ws.send(
        JSON.stringify({
          type: 'message',
          payload: {
            text: `🎉 Hoàn thành tầng ${floorNumber}! Nhận được ${goldReward} vàng và ${dungeonCoinReward} Xu Hầm Ngục.`,
            type: 'system',
          },
        })
      );
      playerObj.ws.send(
        JSON.stringify({
          type: 'message',
          payload: {
            text: 'Gõ [tiếp] để lên tầng tiếp theo hoặc [thoát] để rời khỏi hầm ngục.',
            type: 'system',
          },
        })
      );
    }

    return {
      success: true,
      message: `Hoàn thành tầng ${floorNumber}!`,
      rewards: {
        gold: goldReward,
        dungeonCoin: dungeonCoinReward,
      },
    };
  } catch (error) {
    console.error('Error completing floor:', error);
    return { success: false, message: 'Lỗi khi hoàn thành tầng.' };
  }
}

/**
 * Reset dungeon progress (for weekly reset)
 * @param playerId - Player ID (optional, resets all if not provided)
 */
export async function resetDungeonProgress(playerId?: string) {
  try {
    const query = playerId
      ? { _id: playerId }
      : { 'dungeonProgress.currentFloor': { $gt: 1 } };

    await PlayerSchema.updateMany(query, {
      $set: {
        'dungeonProgress.currentFloor': 1,
        'dungeonProgress.lastWeeklyReset': new Date(),
      },
    });

    return { success: true, message: 'Đã reset tiến độ hầm ngục.' };
  } catch (error) {
    console.error('Error resetting dungeon progress:', error);
    return { success: false, message: 'Lỗi khi reset tiến độ.' };
  }
}
