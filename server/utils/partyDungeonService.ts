// Party Dungeon Service - Manages instanced puzzle dungeons for small parties

import { PlayerSchema } from '../../models/Player';
import { RoomSchema } from '../../models/Room';
import { ItemSchema } from '../../models/Item';
import { gameState } from './gameState';
import { partyService } from './partyService';

// Dungeon instance structure
interface DungeonInstance {
  instanceId: string;
  partyId: string;
  rooms: Map<string, any>; // roomKey -> room data
  puzzleStates: Map<string, any>; // puzzleKey -> puzzle state
  startTime: number;
  completed: boolean;
}

// Active dungeon instances
const activeDungeonInstances: Map<string, DungeonInstance> = new Map();

/**
 * Create a new dungeon instance for a party
 */
export async function createDungeonInstance(partyId: string, dungeonKey: string): Promise<{ success: boolean; message: string; instanceId?: string }> {
  try {
    // Check if party already has an active instance
    for (const instance of activeDungeonInstances.values()) {
      if (instance.partyId === partyId && !instance.completed) {
        return { success: false, message: 'Nhóm của bạn đã có một phiên bản hầm ngục đang hoạt động.' };
      }
    }

    const instanceId = `dungeon-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // Create dungeon rooms based on key
    let dungeonRooms: Map<string, any> = new Map();
    let puzzleStates: Map<string, any> = new Map();

    if (dungeonKey === 'ancient_tomb') {
      // Ancient Tomb dungeon layout
      const entrance = {
        key: 'entrance',
        name: 'Lối Vào Khu Hầm Mộ Cũ',
        description: 'Một lối vào tối tăm với những ngọn đuốc cũ trên tường. Không khí ẩm ướt và có mùi mốc.',
        exits: { north: 'hall1' },
        items: [],
        puzzles: [],
      };

      const hall1 = {
        key: 'hall1',
        name: 'Hành Lang Cũ Nát',
        description: 'Một hành lang dài với các bức tường đá rêu phủ. Có một cánh cửa bị khóa ở phía bắc.',
        exits: { south: 'entrance', north: 'locked' },
        items: [],
        puzzles: ['key_door'],
        lockedExits: { north: 'rusty_key' }, // Requires rusty key
      };

      const hall2 = {
        key: 'hall2',
        name: 'Phòng Bí Mật',
        description: 'Một phòng nhỏ ẩn giấu với một bức tường có khắc chữ.',
        exits: { south: 'hall1', east: 'treasure' },
        items: ['rusty_key'],
        puzzles: ['password_door'],
        lockedExits: { east: 'password' }, // Requires password
      };

      const treasure = {
        key: 'treasure',
        name: 'Phòng Kho Báu',
        description: 'Một phòng rộng với rương kho báu ở giữa.',
        exits: { west: 'hall2', north: 'boss' },
        items: ['ancient_skill_book'],
        puzzles: [],
      };

      const boss = {
        key: 'boss',
        name: 'Phòng Boss - Thủ Lĩnh Hầm Mộ',
        description: 'Một phòng rộng lớn với một con boss khổng lồ.',
        exits: { south: 'treasure' },
        items: [],
        puzzles: ['boss_fight'],
        boss: true,
      };

      dungeonRooms.set('entrance', entrance);
      dungeonRooms.set('hall1', hall1);
      dungeonRooms.set('hall2', hall2);
      dungeonRooms.set('treasure', treasure);
      dungeonRooms.set('boss', boss);

      // Initialize puzzle states
      puzzleStates.set('key_door', { unlocked: false });
      puzzleStates.set('password_door', { unlocked: false, password: 'BÍ MẬT' });
      puzzleStates.set('boss_fight', { completed: false });
    }

    // Create instance
    const instance: DungeonInstance = {
      instanceId,
      partyId,
      rooms: dungeonRooms,
      puzzleStates,
      startTime: Date.now(),
      completed: false,
    };

    activeDungeonInstances.set(instanceId, instance);

    return { success: true, message: 'Đã tạo phiên bản hầm ngục!', instanceId };
  } catch (error) {
    console.error('Error creating dungeon instance:', error);
    return { success: false, message: 'Lỗi khi tạo phiên bản hầm ngục.' };
  }
}

/**
 * Enter dungeon instance
 */
export async function enterDungeonInstance(playerId: string, instanceId: string): Promise<{ success: boolean; message: string }> {
  try {
    const instance = activeDungeonInstances.get(instanceId);
    if (!instance) {
      return { success: false, message: 'Không tìm thấy phiên bản hầm ngục.' };
    }

    const player = await PlayerSchema.findById(playerId);
    if (!player) {
      return { success: false, message: 'Không tìm thấy người chơi.' };
    }

    // Teleport player to entrance
    // For now, we'll just send a message since we can't directly create rooms
    // In a full implementation, we'd create actual room instances

    return { success: true, message: 'Bạn đã vào hầm ngục!' };
  } catch (error) {
    console.error('Error entering dungeon:', error);
    return { success: false, message: 'Lỗi khi vào hầm ngục.' };
  }
}

/**
 * Use key on locked door
 */
export async function useKeyOnDoor(playerId: string, instanceId: string, keyItemName: string): Promise<{ success: boolean; message: string }> {
  try {
    const instance = activeDungeonInstances.get(instanceId);
    if (!instance) {
      return { success: false, message: 'Không tìm thấy phiên bản hầm ngục.' };
    }

    const player = await PlayerSchema.findById(playerId).populate('inventory');
    if (!player) {
      return { success: false, message: 'Không tìm thấy người chơi.' };
    }

    // Check if player has the key
    const items = await ItemSchema.find({ _id: { $in: player.inventory } });
    const keyItem = items.find((i: any) => i.name.toLowerCase().includes(keyItemName.toLowerCase()));

    if (!keyItem) {
      return { success: false, message: `Bạn không có [${keyItemName}].` };
    }

    // Unlock the door
    const puzzleState = instance.puzzleStates.get('key_door');
    if (puzzleState) {
      puzzleState.unlocked = true;
      
      // Remove key from inventory
      player.inventory = player.inventory.filter((id: any) => id.toString() !== keyItem._id.toString());
      await player.save();
      // Delete the specific key item instance (it's player-specific)
      await ItemSchema.findByIdAndDelete(keyItem._id);

      // Notify party
      const playerObj = gameState.getPlayer(playerId);
      if (playerObj?.ws) {
        playerObj.ws.send(JSON.stringify({
          type: 'xp',
          message: `Bạn sử dụng [${keyItem.name}] để mở cửa!`,
        }));
      }

      return { success: true, message: 'Cửa đã được mở!' };
    }

    return { success: false, message: 'Không tìm thấy cửa để mở.' };
  } catch (error) {
    console.error('Error using key:', error);
    return { success: false, message: 'Lỗi khi sử dụng chìa khóa.' };
  }
}

/**
 * Say password to unlock door
 */
export async function sayPassword(playerId: string, instanceId: string, password: string): Promise<{ success: boolean; message: string }> {
  try {
    const instance = activeDungeonInstances.get(instanceId);
    if (!instance) {
      return { success: false, message: 'Không tìm thấy phiên bản hầm ngục.' };
    }

    const puzzleState = instance.puzzleStates.get('password_door');
    if (!puzzleState) {
      return { success: false, message: 'Không có gì xảy ra.' };
    }

    if (password.toUpperCase() === puzzleState.password) {
      puzzleState.unlocked = true;

      // Notify party
      const playerObj = gameState.getPlayer(playerId);
      if (playerObj?.ws) {
        playerObj.ws.send(JSON.stringify({
          type: 'critical',
          message: `✨ Bạn nói đúng mật khẩu! Cửa bí mật đã mở ra! ✨`,
        }));
      }

      return { success: true, message: 'Cửa bí mật đã mở!' };
    } else {
      return { success: false, message: 'Mật khẩu không đúng.' };
    }
  } catch (error) {
    console.error('Error checking password:', error);
    return { success: false, message: 'Lỗi khi kiểm tra mật khẩu.' };
  }
}

/**
 * Complete dungeon and distribute rewards
 */
export async function completeDungeon(instanceId: string): Promise<void> {
  try {
    const instance = activeDungeonInstances.get(instanceId);
    if (!instance || instance.completed) {
      return;
    }

    instance.completed = true;

    // Get party members
    const party = partyService.getParty(instance.partyId);
    if (!party) {
      return;
    }

    const memberIds = Array.from(party.memberIds);

    // Distribute rewards to all party members
    for (const memberId of memberIds) {
      try {
        const member = await PlayerSchema.findById(memberId);
        if (!member) continue;

        // Give rewards
        const goldReward = 200;
        const expReward = 300;

        member.gold = (member.gold || 0) + goldReward;
        member.experience = (member.experience || 0) + expReward;

        // Random chance for skill book
        if (Math.random() < 0.5) {
          const skillBook = await ItemSchema.findOne({ itemKey: 'ancient_skill_book' });
          if (skillBook) {
            // Create a player-specific copy (without unique itemKey)
            const newBook = await ItemSchema.create({
              name: skillBook.name,
              description: skillBook.description,
              type: skillBook.type,
              rarity: skillBook.rarity,
              value: skillBook.value,
              sellValue: skillBook.sellValue,
            });
            member.inventory.push(newBook._id);
          }
        }

        await member.save();

        // Notify player
        const memberObj = gameState.getPlayer(memberId);
        if (memberObj?.ws) {
          memberObj.ws.send(JSON.stringify({
            type: 'critical',
            message: `═══════════════════════════════════`,
          }));
          memberObj.ws.send(JSON.stringify({
            type: 'critical',
            message: `🎉 HOÀN THÀNH HẦM NGỤC! 🎉`,
          }));
          memberObj.ws.send(JSON.stringify({
            type: 'xp',
            message: `Phần thưởng: ${goldReward} vàng, ${expReward} EXP`,
          }));
          memberObj.ws.send(JSON.stringify({
            type: 'critical',
            message: `═══════════════════════════════════`,
          }));
        }
      } catch (error) {
        console.error('Error distributing reward to member:', error);
      }
    }

    // Clean up instance after 5 minutes
    setTimeout(() => {
      activeDungeonInstances.delete(instanceId);
    }, 5 * 60 * 1000);
  } catch (error) {
    console.error('Error completing dungeon:', error);
  }
}

/**
 * Get instance by party ID
 */
export function getInstanceByPartyId(partyId: string): DungeonInstance | null {
  for (const instance of activeDungeonInstances.values()) {
    if (instance.partyId === partyId && !instance.completed) {
      return instance;
    }
  }
  return null;
}

/**
 * Get instance by player ID (through their party)
 */
export function getInstanceByPlayerId(playerId: string): DungeonInstance | null {
  const playerParty = partyService.getPlayerParty(playerId);
  if (!playerParty) return null;
  
  return getInstanceByPartyId(playerParty.partyId);
}
