import { PetSchema } from '../../models/Pet';
import { PetTemplateSchema } from '../../models/PetTemplate';
import { PlayerSchema } from '../../models/Player';
import { gameState } from './gameState';

/**
 * Pet Service - Core pet system logic
 * Handles pet summoning, leveling, and management
 */

// Quality growth multipliers
export const QUALITY_GROWTH_MULTIPLIER = {
  COMMON: 1.0,
  UNCOMMON: 1.3,
  RARE: 1.7,
  EPIC: 2.2,
  LEGENDARY: 3.0,
};

// Quality determination chances (ordered from common to rare)
const QUALITY_CHANCES = [
  { quality: 'LEGENDARY', chance: 0.01 },  // 1%
  { quality: 'EPIC', chance: 0.04 },       // 4%
  { quality: 'RARE', chance: 0.15 },       // 15%
  { quality: 'UNCOMMON', chance: 0.30 },   // 30%
  { quality: 'COMMON', chance: 0.50 },     // 50%
];

/**
 * Determine random pet quality based on weighted chances
 */
export function determinePetQuality(): string {
  const roll = Math.random();
  let cumulative = 0;
  
  for (const entry of QUALITY_CHANCES) {
    cumulative += entry.chance;
    if (roll < cumulative) {
      return entry.quality;
    }
  }
  
  return 'COMMON'; // Fallback
}

/**
 * Summon a pet to the player's current room
 */
export async function summonPet(playerId: string, petId: string) {
  try {
    const player = await PlayerSchema.findById(playerId);
    if (!player) {
      return { success: false, message: 'Không tìm thấy người chơi.' };
    }

    const pet = await PetSchema.findById(petId).populate('templateId');
    if (!pet) {
      return { success: false, message: 'Không tìm thấy thú cưng.' };
    }

    // Check if pet belongs to player
    if (pet.ownerId.toString() !== playerId) {
      return { success: false, message: 'Thú cưng này không thuộc về bạn.' };
    }

    // Unsummon current pet if any
    if (player.activePetId) {
      await unsummonPet(playerId);
    }

    // Set active pet
    player.activePetId = petId;
    await player.save();

    // Recalculate player stats to apply pet bonuses
    const { recalculateStats } = await import('./playerStats');
    await recalculateStats(playerId);

    // Add pet to game state
    const petState = {
      _id: pet._id.toString(),
      name: pet.nickname,
      ownerId: playerId,
      templateId: pet.templateId._id.toString(),
      currentRoomId: player.currentRoomId.toString(),
      currentStats: pet.currentStats,
      level: pet.level,
      quality: pet.quality,
    };
    
    gameState.addPet(petState);

    // Broadcast to room
    gameState.broadcastToRoom(player.currentRoomId.toString(), {
      type: 'message',
      payload: {
        text: `[${pet.nickname}] xuất hiện bên cạnh [${player.username}]!`,
        messageType: 'action',
      },
    });

    return {
      success: true,
      message: `Bạn đã triệu hồi [${pet.nickname}]!`,
      pet: petState,
    };
  } catch (error) {
    console.error('Error summoning pet:', error);
    return { success: false, message: 'Lỗi khi triệu hồi thú cưng.' };
  }
}

/**
 * Unsummon the active pet
 */
export async function unsummonPet(playerId: string) {
  try {
    const player = await PlayerSchema.findById(playerId);
    if (!player) {
      return { success: false, message: 'Không tìm thấy người chơi.' };
    }

    if (!player.activePetId) {
      return { success: false, message: 'Bạn không có thú cưng nào được triệu hồi.' };
    }

    const pet = await PetSchema.findById(player.activePetId);
    if (pet) {
      // Broadcast to room
      gameState.broadcastToRoom(player.currentRoomId.toString(), {
        type: 'message',
        payload: {
          text: `[${pet.nickname}] biến mất!`,
          messageType: 'action',
        },
      });
    }

    // Remove pet from game state
    gameState.removePet(player.activePetId.toString());

    // Clear active pet
    player.activePetId = null;
    await player.save();

    // Recalculate player stats to remove pet bonuses
    const { recalculateStats } = await import('./playerStats');
    await recalculateStats(playerId);

    return {
      success: true,
      message: `Bạn đã thu hồi thú cưng.`,
    };
  } catch (error) {
    console.error('Error unsummoning pet:', error);
    return { success: false, message: 'Lỗi khi thu hồi thú cưng.' };
  }
}

/**
 * Move pet to a new room when player moves
 */
export async function movePetToRoom(petId: string, newRoomId: string, oldRoomId: string) {
  try {
    const pet = gameState.getPet(petId);
    if (!pet) {
      return { success: false, message: 'Không tìm thấy thú cưng trong game state.' };
    }

    // Update pet room in game state
    pet.currentRoomId = newRoomId;

    // Broadcast to old room
    gameState.broadcastToRoom(oldRoomId, {
      type: 'message',
      payload: {
        text: `[${pet.name}] rời khỏi phòng.`,
        messageType: 'action',
      },
    });

    // Broadcast to new room
    gameState.broadcastToRoom(newRoomId, {
      type: 'message',
      payload: {
        text: `[${pet.name}] đi vào phòng.`,
        messageType: 'action',
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error moving pet to room:', error);
    return { success: false, message: 'Lỗi khi di chuyển thú cưng.' };
  }
}

/**
 * Add experience to pet and handle leveling
 */
export async function addExp(petId: string, expAmount: number) {
  try {
    const pet = await PetSchema.findById(petId).populate('templateId');
    if (!pet) {
      return { success: false, message: 'Không tìm thấy thú cưng.' };
    }

    pet.exp += expAmount;
    const leveledUp: number[] = [];

    // Handle leveling
    while (pet.exp >= pet.expToNextLevel) {
      pet.level++;
      pet.exp -= pet.expToNextLevel;
      
      // Calculate new exp requirement
      pet.expToNextLevel = Math.floor(100 * Math.pow(1.5, pet.level - 1));

      // Apply stat growth
      const template: any = pet.templateId;
      const multiplier = QUALITY_GROWTH_MULTIPLIER[pet.quality as keyof typeof QUALITY_GROWTH_MULTIPLIER] || 1.0;

      const hpIncrease = Math.floor(template.statGrowth.hpPerLevel * multiplier);
      const attackIncrease = Math.floor(template.statGrowth.attackPerLevel * multiplier);
      const defenseIncrease = Math.floor(template.statGrowth.defensePerLevel * multiplier);

      pet.currentStats.maxHp += hpIncrease;
      pet.currentStats.hp = pet.currentStats.maxHp; // Heal on level up
      pet.currentStats.attack += attackIncrease;
      pet.currentStats.defense += defenseIncrease;

      leveledUp.push(pet.level);
    }

    await pet.save();

    // Update game state if pet is active
    const petState = gameState.getPet(petId);
    if (petState) {
      petState.level = pet.level;
      petState.currentStats = pet.currentStats;
    }

    return {
      success: true,
      leveledUp,
      pet,
    };
  } catch (error) {
    console.error('Error adding exp to pet:', error);
    return { success: false, message: 'Lỗi khi thêm kinh nghiệm cho thú cưng.' };
  }
}

/**
 * Handle pet defeat (death)
 */
export async function petDefeated(petId: string) {
  try {
    const pet = await PetSchema.findById(petId);
    if (!pet) {
      return { success: false, message: 'Không tìm thấy thú cưng.' };
    }

    // Unsummon the pet
    await unsummonPet(pet.ownerId.toString());

    // Broadcast defeat message
    const player = await PlayerSchema.findById(pet.ownerId);
    if (player) {
      gameState.broadcastToRoom(player.currentRoomId.toString(), {
        type: 'message',
        payload: {
          text: `[${pet.nickname}] đã bị đánh bại và biến mất!`,
          messageType: 'damage_in',
        },
      });
    }

    return { success: true, message: `${pet.nickname} đã bị đánh bại.` };
  } catch (error) {
    console.error('Error handling pet defeat:', error);
    return { success: false, message: 'Lỗi khi xử lý thú cưng bị đánh bại.' };
  }
}
