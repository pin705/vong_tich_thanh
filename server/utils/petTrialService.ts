import { PlayerSchema } from '../../models/Player';
import { AgentSchema } from '../../models/Agent';
import { RoomSchema } from '../../models/Room';
import { PetSchema } from '../../models/Pet';
import { BuffSchema } from '../../models/Buff';
import { gameState } from './gameState';

/**
 * Pet Trial Service - Core logic for Pet Trial Tower system
 * Handles trial progression, monster generation, and rewards
 * In this tower, only pets can fight while players act as trainers
 */

// Reward constants
const TRIAL_BASE_TAMER_BADGE_REWARD = 2;
const TRIAL_BADGE_FLOOR_DIVISOR = 5;

// Buff duration constants
const PACIFIED_BUFF_DURATION = 7200000; // 2 hours in milliseconds

/**
 * Get pet trial status for a player
 * @param playerId - Player ID
 * @returns Trial progress and currency
 */
export async function getPetTrialStatus(playerId: string) {
  try {
    const player = await PlayerSchema.findById(playerId);
    if (!player) {
      return { success: false, message: 'Không tìm thấy người chơi.' };
    }

    return {
      success: true,
      data: {
        currentFloor: player.petTrialProgress?.currentFloor || 1,
        highestFloor: player.petTrialProgress?.highestFloor || 1,
        tamerBadge: player.tamerBadge || 0,
        lastWeeklyReset: player.petTrialProgress?.lastWeeklyReset || new Date(),
      },
    };
  } catch (error) {
    console.error('Error getting pet trial status:', error);
    return { success: false, message: 'Lỗi khi lấy thông tin tháp thử luyện.' };
  }
}

/**
 * Generate a trial monster for a specific floor
 * @param floorNumber - Floor number
 * @returns Monster configuration
 */
export async function generateTrialMonster(floorNumber: number) {
  try {
    let agentName = 'Thú Dữ';
    let agentType = 'mob';
    let statsMultiplier = 1.1;

    // Boss every 10 floors
    if (floorNumber % 10 === 0) {
      agentName = `Thủ Hộ Tầng ${floorNumber}`;
      agentType = 'boss';
      statsMultiplier = 2.5;
    }
    // Elite every 5 floors
    else if (floorNumber % 5 === 0) {
      agentName = `Thú Tinh Anh Tầng ${floorNumber}`;
      agentType = 'elite';
      statsMultiplier = 1.8;
    }
    // Regular trial monsters with increasing difficulty
    else {
      agentName = `Thú Thử Thách Tầng ${floorNumber}`;
    }

    // Calculate stats based on floor
    const baseHp = 60;
    const baseDamage = 6;
    const baseExp = 15;

    const hp = Math.floor(baseHp * Math.pow(floorNumber, 1.15) * statsMultiplier);
    const maxHp = hp;
    const damage = Math.floor(baseDamage * Math.pow(floorNumber, 1.1) * statsMultiplier);
    const experience = Math.floor(baseExp * floorNumber * statsMultiplier);
    const level = Math.max(1, Math.floor(floorNumber / 2) + 2);

    return {
      name: agentName,
      description: `Sinh vật mạnh mẽ từ tầng ${floorNumber} của Tháp Thử Luyện. Nó chỉ tấn công thú cưng.`,
      type: 'mob',
      agentType,
      hp,
      maxHp,
      damage,
      experience,
      level,
      behavior: 'aggressive',
      isTrialMonster: true,
      trialFloor: floorNumber,
    };
  } catch (error) {
    console.error('Error generating trial monster for floor:', error);
    return null;
  }
}

/**
 * Start a pet trial challenge for a player
 * @param playerId - Player ID
 * @returns Success status and message
 */
export async function startTrial(playerId: string) {
  try {
    const player = await PlayerSchema.findById(playerId).populate('activePetId');
    if (!player) {
      return { success: false, message: 'Không tìm thấy người chơi.' };
    }

    // Check if player has an active pet
    if (!player.activePetId) {
      return {
        success: false,
        message: 'Bạn phải có một thú cưng đang hoạt động để vào Tháp Thử Luyện! Gõ "pet summon <tên>" để triệu hồi thú cưng.',
      };
    }

    const pet = await PetSchema.findById(player.activePetId);
    if (!pet || pet.hp <= 0) {
      return {
        success: false,
        message: 'Thú cưng của bạn không đủ sức khỏe để chiến đấu. Hãy chữa lành nó trước.',
      };
    }

    // Get the current floor number
    const floorNumber = player.petTrialProgress?.currentFloor || 1;

    // Find trial instance room
    const trialRoom = await RoomSchema.findOne({ name: 'Tháp Thử Luyện - Đấu Trường' });
    if (!trialRoom) {
      return { success: false, message: 'Không tìm thấy đấu trường thử luyện.' };
    }

    // Move player to trial room
    player.currentRoomId = trialRoom._id;
    await player.save();

    // Generate monster for this floor
    const monsterData = await generateTrialMonster(floorNumber);
    if (!monsterData) {
      return { success: false, message: 'Lỗi khi tạo thú thử thách.' };
    }

    // Create the trial monster in the room
    const trialMonster = await AgentSchema.create({
      ...monsterData,
      currentRoomId: trialRoom._id,
    });

    // Apply PACIFIED buff to player (prevents player from attacking)
    const existingBuff = await BuffSchema.findOne({
      playerId: player._id,
      buffKey: 'PACIFIED',
      active: true,
    });

    if (!existingBuff) {
      await BuffSchema.create({
        playerId: player._id,
        buffKey: 'PACIFIED',
        duration: PACIFIED_BUFF_DURATION,
        active: true,
        startTime: new Date(),
        metadata: {
          description: 'Bạn không thể tấn công. Chỉ thú cưng của bạn mới có thể chiến đấu.',
        },
      });
    }

    // Broadcast to player
    const playerObj = gameState.getPlayer(playerId);
    if (playerObj && playerObj.ws) {
      playerObj.ws.send(
        JSON.stringify({
          type: 'message',
          payload: {
            text: '═══════════════════════════════════════════════════',
            type: 'system',
          },
        })
      );
      playerObj.ws.send(
        JSON.stringify({
          type: 'message',
          payload: {
            text: `       THÁP THỬ LUYỆN - TẦNG ${floorNumber}`,
            type: 'critical',
          },
        })
      );
      playerObj.ws.send(
        JSON.stringify({
          type: 'message',
          payload: {
            text: '═══════════════════════════════════════════════════',
            type: 'system',
          },
        })
      );
      playerObj.ws.send(
        JSON.stringify({
          type: 'message',
          payload: {
            text: `[${trialMonster.name}] xuất hiện trước mặt bạn!`,
            type: 'action',
          },
        })
      );
      playerObj.ws.send(
        JSON.stringify({
          type: 'message',
          payload: {
            text: `[${pet.name}] của bạn chuẩn bị chiến đấu!`,
            type: 'action',
          },
        })
      );
      playerObj.ws.send(
        JSON.stringify({
          type: 'message',
          payload: {
            text: '[!] Bạn bị PACIFIED - không thể tấn công. Chỉ thú cưng có thể chiến đấu!',
            type: 'system',
          },
        })
      );
      playerObj.ws.send(
        JSON.stringify({
          type: 'message',
          payload: {
            text: 'Gõ "pet attack" để ra lệnh cho thú cưng tấn công.',
            type: 'system',
          },
        })
      );
      playerObj.ws.send(
        JSON.stringify({
          type: 'message',
          payload: {
            text: 'Gõ "use <vật phẩm>" để dùng vật phẩm hỗ trợ cho thú cưng.',
            type: 'system',
          },
        })
      );
    }

    return {
      success: true,
      message: `Bắt đầu tầng ${floorNumber}! [${trialMonster.name}] đã xuất hiện.`,
      monster: trialMonster,
      floor: floorNumber,
    };
  } catch (error) {
    console.error('Error starting trial:', error);
    return { success: false, message: 'Lỗi khi bắt đầu thử thách.' };
  }
}

/**
 * Complete a trial floor and grant rewards
 * @param playerId - Player ID
 * @param floorNumber - Completed floor number
 * @returns Success status and rewards
 */
export async function completeTrialFloor(playerId: string, floorNumber: number) {
  try {
    const player = await PlayerSchema.findById(playerId);
    if (!player) {
      return { success: false, message: 'Không tìm thấy người chơi.' };
    }

    // Calculate rewards based on floor
    const tamerBadgeReward = Math.floor(
      TRIAL_BASE_TAMER_BADGE_REWARD * Math.max(1, floorNumber / TRIAL_BADGE_FLOOR_DIVISOR)
    );

    // Bonus for boss floors
    const isBossFloor = floorNumber % 10 === 0;
    const finalBadgeReward = isBossFloor ? tamerBadgeReward * 3 : tamerBadgeReward;

    // Grant rewards
    player.tamerBadge = (player.tamerBadge || 0) + finalBadgeReward;

    // Update progress
    const currentFloor = player.petTrialProgress?.currentFloor || 1;
    if (floorNumber >= currentFloor) {
      if (!player.petTrialProgress) {
        player.petTrialProgress = {
          currentFloor: floorNumber + 1,
          highestFloor: floorNumber,
          lastWeeklyReset: new Date(),
        };
      } else {
        player.petTrialProgress.currentFloor = floorNumber + 1;
        if (floorNumber > (player.petTrialProgress.highestFloor || 1)) {
          player.petTrialProgress.highestFloor = floorNumber;
        }
      }
    }

    await player.save();

    // Remove PACIFIED buff
    await BuffSchema.updateMany(
      {
        playerId: player._id,
        buffKey: 'PACIFIED',
        active: true,
      },
      {
        $set: { active: false },
      }
    );

    // Send message to player
    const playerObj = gameState.getPlayer(playerId);
    if (playerObj && playerObj.ws) {
      playerObj.ws.send(
        JSON.stringify({
          type: 'message',
          payload: {
            text: '═══════════════════════════════════════════════════',
            type: 'system',
          },
        })
      );
      playerObj.ws.send(
        JSON.stringify({
          type: 'message',
          payload: {
            text: `🎉 HOÀN THÀNH TẦNG ${floorNumber}!`,
            type: 'critical',
          },
        })
      );
      playerObj.ws.send(
        JSON.stringify({
          type: 'message',
          payload: {
            text: `Nhận được ${finalBadgeReward} Huy Hiệu Huấn Luyện!`,
            type: 'loot',
          },
        })
      );
      if (isBossFloor) {
        playerObj.ws.send(
          JSON.stringify({
            type: 'message',
            payload: {
              text: '[+] Phần thưởng x3 cho tầng Boss!',
              type: 'critical',
            },
          })
        );
      }
      playerObj.ws.send(
        JSON.stringify({
          type: 'message',
          payload: {
            text: '═══════════════════════════════════════════════════',
            type: 'system',
          },
        })
      );
      playerObj.ws.send(
        JSON.stringify({
          type: 'message',
          payload: {
            text: 'Gõ [tiếp] để lên tầng tiếp theo hoặc [thoát] để rời khỏi tháp.',
            type: 'system',
          },
        })
      );
    }

    return {
      success: true,
      message: `Hoàn thành tầng ${floorNumber}!`,
      rewards: {
        tamerBadge: finalBadgeReward,
      },
    };
  } catch (error) {
    console.error('Error completing trial floor:', error);
    return { success: false, message: 'Lỗi khi hoàn thành tầng thử luyện.' };
  }
}

/**
 * Reset pet trial progress (for weekly reset)
 * @param playerId - Player ID (optional, resets all if not provided)
 */
export async function resetPetTrialProgress(playerId?: string) {
  try {
    const query = playerId
      ? { _id: playerId }
      : { 'petTrialProgress.currentFloor': { $gt: 1 } };

    await PlayerSchema.updateMany(query, {
      $set: {
        'petTrialProgress.currentFloor': 1,
        'petTrialProgress.lastWeeklyReset': new Date(),
      },
    });

    return { success: true, message: 'Đã reset tiến độ tháp thử luyện thú cưng.' };
  } catch (error) {
    console.error('Error resetting pet trial progress:', error);
    return { success: false, message: 'Lỗi khi reset tiến độ.' };
  }
}
