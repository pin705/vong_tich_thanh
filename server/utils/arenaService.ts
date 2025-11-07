// Arena Service - Manages PvP arena queue and matchmaking

import { PlayerSchema } from '../../models/Player';
import { RoomSchema } from '../../models/Room';
import { gameState } from './gameState';

// Queue for 1v1 matches
const queue1v1: Set<string> = new Set();

// Active arena matches
interface ArenaMatch {
  player1Id: string;
  player2Id: string;
  roomId: string;
  startTime: number;
}

const activeMatches: Map<string, ArenaMatch> = new Map();

/**
 * Add player to 1v1 queue
 */
export async function joinQueue1v1(playerId: string): Promise<{ success: boolean; message: string }> {
  try {
    const player = await PlayerSchema.findById(playerId);
    if (!player) {
      return { success: false, message: 'Không tìm thấy người chơi.' };
    }

    // Check if player is already in queue
    if (queue1v1.has(playerId)) {
      return { success: false, message: 'Bạn đã ở trong hàng chờ rồi.' };
    }

    // Check if player is in combat
    if (player.inCombat) {
      return { success: false, message: 'Bạn không thể vào hàng chờ khi đang chiến đấu.' };
    }

    // Check if player is already in a match
    if (isPlayerInMatch(playerId)) {
      return { success: false, message: 'Bạn đang trong một trận đấu.' };
    }

    // Add to queue
    queue1v1.add(playerId);

    // Try to match immediately
    const matchResult = await tryMatchPlayers();
    if (matchResult) {
      return { success: true, message: 'Đã tìm thấy đối thủ! Chuẩn bị chiến đấu...' };
    }

    return { success: true, message: 'Đã vào hàng chờ. Đang tìm đối thủ...' };
  } catch (error) {
    console.error('Error joining queue:', error);
    return { success: false, message: 'Lỗi khi tham gia hàng chờ.' };
  }
}

/**
 * Remove player from queue
 */
export function leaveQueue(playerId: string): { success: boolean; message: string } {
  if (queue1v1.has(playerId)) {
    queue1v1.delete(playerId);
    return { success: true, message: 'Đã rời khỏi hàng chờ.' };
  }
  return { success: false, message: 'Bạn không có trong hàng chờ.' };
}

/**
 * Try to match two players in queue
 */
async function tryMatchPlayers(): Promise<boolean> {
  if (queue1v1.size < 2) {
    return false;
  }

  // Get first two players in queue
  const queueArray = Array.from(queue1v1);
  const player1Id = queueArray[0];
  const player2Id = queueArray[1];

  // Remove from queue
  queue1v1.delete(player1Id);
  queue1v1.delete(player2Id);

  // Find available arena room
  const arenaRoom = await findAvailableArenaRoom();
  if (!arenaRoom) {
    // No arena room available, put players back in queue
    queue1v1.add(player1Id);
    queue1v1.add(player2Id);
    return false;
  }

  // Start match
  await startMatch(player1Id, player2Id, arenaRoom._id.toString());
  return true;
}

/**
 * Find an available arena room
 */
async function findAvailableArenaRoom(): Promise<any> {
  // Find arena rooms that don't have active matches
  const arenaRooms = await RoomSchema.find({
    name: { $regex: /Đấu Trường 1v1/ }
  });

  for (const room of arenaRooms) {
    const roomId = room._id.toString();
    let isOccupied = false;
    
    // Check if room is in use
    for (const match of activeMatches.values()) {
      if (match.roomId === roomId) {
        isOccupied = true;
        break;
      }
    }

    if (!isOccupied) {
      return room;
    }
  }

  return null;
}

/**
 * Start a match between two players
 */
async function startMatch(player1Id: string, player2Id: string, roomId: string): Promise<void> {
  try {
    const player1 = await PlayerSchema.findById(player1Id);
    const player2 = await PlayerSchema.findById(player2Id);

    if (!player1 || !player2) {
      console.error('Player not found for match');
      return;
    }

    // Create match record
    const matchId = `${player1Id}-${player2Id}`;
    activeMatches.set(matchId, {
      player1Id,
      player2Id,
      roomId,
      startTime: Date.now(),
    });

    // Move players to arena room
    player1.currentRoomId = roomId;
    player2.currentRoomId = roomId;
    await player1.save();
    await player2.save();

    // Notify players
    const player1Obj = gameState.getPlayer(player1Id);
    const player2Obj = gameState.getPlayer(player2Id);

    if (player1Obj?.ws) {
      player1Obj.ws.send(JSON.stringify({
        type: 'critical',
        message: `═══════════════════════════════════`,
      }));
      player1Obj.ws.send(JSON.stringify({
        type: 'critical',
        message: `⚔️  TRẬN ĐẤU BẮT ĐẦU! ⚔️`,
      }));
      player1Obj.ws.send(JSON.stringify({
        type: 'critical',
        message: `Đối thủ: [${player2.username}]`,
      }));
      player1Obj.ws.send(JSON.stringify({
        type: 'critical',
        message: `═══════════════════════════════════`,
      }));
    }

    if (player2Obj?.ws) {
      player2Obj.ws.send(JSON.stringify({
        type: 'critical',
        message: `═══════════════════════════════════`,
      }));
      player2Obj.ws.send(JSON.stringify({
        type: 'critical',
        message: `⚔️  TRẬN ĐẤU BẮT ĐẦU! ⚔️`,
      }));
      player2Obj.ws.send(JSON.stringify({
        type: 'critical',
        message: `Đối thủ: [${player1.username}]`,
      }));
      player2Obj.ws.send(JSON.stringify({
        type: 'critical',
        message: `═══════════════════════════════════`,
      }));
    }

    // Update room state
    const room = await RoomSchema.findById(roomId);
    if (room) {
      gameState.broadcastToRoom(roomId, {
        type: 'normal',
        message: `[${player1.username}] và [${player2.username}] bắt đầu chiến đấu!`,
      });
    }
  } catch (error) {
    console.error('Error starting match:', error);
  }
}

/**
 * Check if player is in an active match
 */
export function isPlayerInMatch(playerId: string): boolean {
  for (const match of activeMatches.values()) {
    if (match.player1Id === playerId || match.player2Id === playerId) {
      return true;
    }
  }
  return false;
}

/**
 * End a match and award glory points to winner
 */
export async function endMatch(winnerId: string, loserId: string): Promise<void> {
  try {
    // Find and remove the match
    let matchId: string | null = null;
    for (const [id, match] of activeMatches.entries()) {
      if ((match.player1Id === winnerId && match.player2Id === loserId) ||
          (match.player2Id === winnerId && match.player1Id === loserId)) {
        matchId = id;
        break;
      }
    }

    if (!matchId) {
      console.error('Match not found');
      return;
    }

    activeMatches.delete(matchId);

    // Award glory points to winner
    const winner = await PlayerSchema.findById(winnerId);
    const loser = await PlayerSchema.findById(loserId);

    if (!winner || !loser) {
      console.error('Players not found');
      return;
    }

    // Award points based on level difference
    const levelDiff = Math.abs(winner.level - loser.level);
    const basePoints = 10;
    const bonusPoints = Math.max(0, levelDiff * 2);
    const totalPoints = basePoints + bonusPoints;

    winner.gloryPoints = (winner.gloryPoints || 0) + totalPoints;
    await winner.save();

    // Move both players back to arena lobby
    const arenaLobby = await RoomSchema.findOne({ name: 'Phòng Chờ Đấu Trường' });
    if (arenaLobby) {
      winner.currentRoomId = arenaLobby._id;
      loser.currentRoomId = arenaLobby._id;
      await winner.save();
      await loser.save();
    }

    // Notify players
    const winnerObj = gameState.getPlayer(winnerId);
    const loserObj = gameState.getPlayer(loserId);

    if (winnerObj?.ws) {
      winnerObj.ws.send(JSON.stringify({
        type: 'critical',
        message: `═══════════════════════════════════`,
      }));
      winnerObj.ws.send(JSON.stringify({
        type: 'critical',
        message: `🏆 CHIẾN THẮNG! 🏆`,
      }));
      winnerObj.ws.send(JSON.stringify({
        type: 'xp',
        message: `Bạn nhận được ${totalPoints} Điểm Vinh Quang!`,
      }));
      winnerObj.ws.send(JSON.stringify({
        type: 'critical',
        message: `═══════════════════════════════════`,
      }));
    }

    if (loserObj?.ws) {
      loserObj.ws.send(JSON.stringify({
        type: 'error',
        message: `═══════════════════════════════════`,
      }));
      loserObj.ws.send(JSON.stringify({
        type: 'error',
        message: `💀 THẤT BẠI! 💀`,
      }));
      loserObj.ws.send(JSON.stringify({
        type: 'error',
        message: `Hãy tập luyện và quay lại!`,
      }));
      loserObj.ws.send(JSON.stringify({
        type: 'error',
        message: `═══════════════════════════════════`,
      }));
    }

    // Broadcast result
    gameState.broadcastToAll({
      type: 'xp',
      message: `⚔️ [${winner.username}] đã chiến thắng [${loser.username}] trong đấu trường!`,
    });
  } catch (error) {
    console.error('Error ending match:', error);
  }
}

/**
 * Get queue status
 */
export function getQueueStatus(): { queue1v1Size: number } {
  return {
    queue1v1Size: queue1v1.size,
  };
}
