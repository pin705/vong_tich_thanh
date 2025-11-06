import type { Command } from '~/types';
import { PlayerSchema } from '../../models/Player';
import { RoomSchema } from '../../models/Room';
import { gameState } from '../utils/gameState';

/**
 * Handle movement commands (go, n, s, e, w, u, d, etc.)
 */
export async function handleMovementCommand(command: Command, playerId: string): Promise<string[]> {
  const { action, target } = command;
  const responses: string[] = [];

  try {
    const player = await PlayerSchema.findById(playerId).populate('inventory');
    if (!player) {
      responses.push('Lỗi: Không tìm thấy thông tin người chơi.');
      return responses;
    }

    // Check if player is in combat
    if (player.inCombat) {
      responses.push('Bạn không thể di chuyển khi đang trong chiến đấu! Hãy dùng lệnh "flee" để thoát.');
      return responses;
    }

    // Map command to direction
    const directionMap: Record<string, string> = {
      'n': 'north', 'bắc': 'north', 'north': 'north',
      's': 'south', 'nam': 'south', 'south': 'south',
      'e': 'east', 'đông': 'east', 'east': 'east',
      'w': 'west', 'tây': 'west', 'west': 'west',
      'u': 'up', 'lên': 'up', 'up': 'up',
      'd': 'down', 'xuống': 'down', 'down': 'down',
    };

    let direction: string;
    if (action === 'go' && target) {
      direction = directionMap[target] || target;
    } else {
      direction = directionMap[action] || action;
    }

    // Get current room
    const currentRoom = await RoomSchema.findById(player.currentRoomId);
    if (!currentRoom) {
      responses.push('Lỗi: Không tìm thấy phòng hiện tại.');
      return responses;
    }

    // Check if exit exists
    const nextRoomId = (currentRoom.exits as any)[direction];
    if (!nextRoomId) {
      responses.push(`Bạn không thể đi về hướng đó.`);
      return responses;
    }

    // Get next room
    const nextRoom = await RoomSchema.findById(nextRoomId);
    if (!nextRoom) {
      responses.push('Lỗi: Không tìm thấy phòng đích.');
      return responses;
    }

    // Broadcast to current room that player is leaving
    gameState.broadcastToRoom(
      currentRoom._id.toString(),
      {
        type: 'system',
        message: `[${player.username}] đi về phía ${direction}.`
      },
      playerId
    );

    // Update player's room
    player.currentRoomId = nextRoom._id;
    await player.save();

    // Update in-memory state
    gameState.updatePlayerRoom(playerId, nextRoom._id.toString());

    // Broadcast to new room that player arrived
    gameState.broadcastToRoom(
      nextRoom._id.toString(),
      {
        type: 'system',
        message: `[${player.username}] đến từ hướng ${getOppositeDirection(direction)}.`
      },
      playerId
    );

    // Show new room description using formatRoomDescription
    const roomDescription = await formatRoomDescription(nextRoom, player);
    responses.push(...roomDescription);

  } catch (error) {
    console.error('Error in movement command:', error);
    responses.push('Lỗi khi di chuyển.');
  }

  return responses;
}

/**
 * Handle goto command (admin/debug command for teleportation)
 */
export async function handleGotoCommand(command: Command, playerId: string): Promise<string[]> {
  const { target } = command;
  const responses: string[] = [];

  try {
    const player = await PlayerSchema.findById(playerId);
    if (!player) {
      responses.push('Lỗi: Không tìm thấy thông tin người chơi.');
      return responses;
    }

    // Check if player is admin (optional - can be added later)
    // if (player.role !== 'admin') {
    //   responses.push('Lệnh này chỉ dành cho admin.');
    //   return responses;
    // }

    if (!target) {
      responses.push('Cú pháp: goto [tên phòng]');
      return responses;
    }

    // Find room by name (case-insensitive)
    const room = await RoomSchema.findOne({
      name: new RegExp(target, 'i')
    });

    if (!room) {
      responses.push(`Không tìm thấy phòng "${target}".`);
      return responses;
    }

    // Check if player is in combat
    if (player.inCombat) {
      responses.push('Bạn không thể teleport khi đang trong chiến đấu!');
      return responses;
    }

    const oldRoomId = player.currentRoomId.toString();

    // Broadcast to old room
    gameState.broadcastToRoom(
      oldRoomId,
      {
        type: 'system',
        message: `[${player.username}] đã biến mất!`
      },
      playerId
    );

    // Update player room
    player.currentRoomId = room._id;
    await player.save();

    // Update in-memory state
    gameState.updatePlayerRoom(playerId, room._id.toString());

    // Broadcast to new room
    gameState.broadcastToRoom(
      room._id.toString(),
      {
        type: 'system',
        message: `[${player.username}] xuất hiện bất ngờ!`
      },
      playerId
    );

    responses.push(`Bạn đã dịch chuyển đến [${room.name}].`);
    responses.push('');

    // Show room description
    const roomDescription = await formatRoomDescription(room, player);
    responses.push(...roomDescription);

  } catch (error) {
    console.error('Error in goto command:', error);
    responses.push('Lỗi khi dịch chuyển.');
  }

  return responses;
}

// Helper function to get opposite direction
function getOppositeDirection(direction: string): string {
  const opposites: Record<string, string> = {
    'north': 'nam', 'south': 'bắc',
    'east': 'tây', 'west': 'đông',
    'up': 'dưới', 'down': 'trên'
  };
  return opposites[direction] || direction;
}

// Helper function to format room description
async function formatRoomDescription(room: any, player: any): Promise<string[]> {
  const { ItemSchema } = await import('../../models/Item');
  const { AgentSchema } = await import('../../models/Agent');
  const responses: string[] = [];
  
  // Room name
  responses.push(`[${room.name}]`);
  
  // Room description
  responses.push(room.description);
  responses.push('');
  
  // Exits
  const exits = [];
  if (room.exits.north) exits.push('bắc');
  if (room.exits.south) exits.push('nam');
  if (room.exits.east) exits.push('đông');
  if (room.exits.west) exits.push('tây');
  if (room.exits.up) exits.push('lên');
  if (room.exits.down) exits.push('xuống');
  
  if (exits.length > 0) {
    responses.push(`Lối ra: [${exits.join(', ')}]`);
  } else {
    responses.push('Không có lối ra rõ ràng.');
  }
  
  // Items in room
  if (room.items && room.items.length > 0) {
    const items = await ItemSchema.find({ _id: { $in: room.items } });
    if (items.length > 0) {
      responses.push('Bạn thấy:');
      items.forEach((item: any) => {
        responses.push(`  - [${item.name}]`);
      });
    }
  }
  
  // Agents in room
  if (room.agents && room.agents.length > 0) {
    const agents = await AgentSchema.find({ _id: { $in: room.agents } });
    agents.forEach((agent: any) => {
      responses.push(`Một [${agent.name}] đang đứng đây.`);
    });
  }
  
  // Other players in room
  const playersInRoom = gameState.getPlayersInRoom(room._id.toString());
  const otherPlayers = playersInRoom.filter(p => p.id !== player._id.toString());
  if (otherPlayers.length > 0) {
    otherPlayers.forEach(p => {
      responses.push(`[${p.username}] đang ở đây.`);
    });
  }
  
  return responses;
}
