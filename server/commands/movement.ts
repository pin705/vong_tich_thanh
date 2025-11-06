import type { Command } from '~/types';
import { PlayerSchema } from '../../models/Player';
import { RoomSchema } from '../../models/Room';
import { gameState } from '../utils/gameState';
import { formatRoomDescription, DIRECTION_MAP, DIRECTION_NAMES_VI, getOppositeDirection } from '../utils/roomUtils';
import type { Types } from 'mongoose';

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
      responses.push('Bạn không thể di chuyển khi đang trong chiến đấu! Hãy dùng lệnh "flee" để bỏ chạy.');
      return responses;
    }

    // Map command to direction
    let direction: string;
    if (action === 'go') {
      if (!target) {
        responses.push('Bạn muốn đi hướng nào? (bắc/nam/đông/tây/lên/xuống)');
        return responses;
      }
      direction = DIRECTION_MAP[target] || target;
    } else {
      direction = DIRECTION_MAP[action] || action;
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
      // Log the error for debugging
      console.error(`Room exit error: Room ${currentRoom._id} (${currentRoom.name}) has exit ${direction} pointing to non-existent room ${nextRoomId}`);
      return responses;
    }

    // Get Vietnamese direction name for broadcasting
    const directionVi = DIRECTION_NAMES_VI[direction] || direction;

    // Broadcast to current room that player is leaving
    gameState.broadcastToRoom(
      currentRoom._id.toString(),
      {
        type: 'system',
        message: `[${player.username}] đi về phía ${directionVi}.`
      },
      playerId
    );

    // Update player's room
    player.currentRoomId = nextRoom._id;
    
    // Track visited room
    if (!player.visitedRooms) {
      player.visitedRooms = [];
    }
    const roomIdStr = nextRoom._id.toString();
    const alreadyVisited = player.visitedRooms.some((id: Types.ObjectId) => id.toString() === roomIdStr);
    if (!alreadyVisited) {
      player.visitedRooms.push(nextRoom._id);
    }
    
    await player.save();

    // Update in-memory state
    gameState.updatePlayerRoom(playerId, nextRoom._id.toString());

    // Broadcast to new room that player arrived
    const oppositeDir = getOppositeDirection(direction);
    gameState.broadcastToRoom(
      nextRoom._id.toString(),
      {
        type: 'system',
        message: `[${player.username}] đến từ hướng ${oppositeDir}.`
      },
      playerId
    );

    // Show new room description
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
      responses.push('Cú pháp: goto [tên phòng hoặc ID]');
      return responses;
    }

    // Find room by _id or name (case-insensitive)
    
    const room = await RoomSchema.findById(target);

    console.log('target', target, 'room found:', room);

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
    
    // Track visited room
    if (!player.visitedRooms) {
      player.visitedRooms = [];
    }
    const roomIdStr = room._id.toString();
    const alreadyVisited = player.visitedRooms.some((id: Types.ObjectId) => id.toString() === roomIdStr);
    if (!alreadyVisited) {
      player.visitedRooms.push(room._id);
    }
    
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
