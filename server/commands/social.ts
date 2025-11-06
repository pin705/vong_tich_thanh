import { gameState } from '../utils/gameState';
import { RoomSchema } from '../../models/Room';
import { broadcastService } from '../utils/broadcastService';
import { guildService } from '../utils/guildService';

export async function handleSayCommand(
  playerId: string,
  player: any,
  target: string | undefined,
  args: string[] | undefined
): Promise<string[]> {
  const responses: string[] = [];
  
  // Reconstruct full message
  const message = [target, ...(args || [])].filter(Boolean).join(' ');
  
  if (!message) {
    responses.push('Bạn muốn nói gì?');
    return responses;
  }
  
  // Broadcast to room, excluding the sender
  const room = await RoomSchema.findById(player.currentRoomId);
  if (!room) {
    responses.push('Lỗi: Không tìm thấy phòng hiện tại.');
    return responses;
  }
  
  gameState.broadcastToRoom(room._id.toString(), {
    type: 'chat',
    channel: 'chat',
    category: 'say',
    user: player.username,
    message: message
  }, playerId); // Exclude sender (playerId) to prevent receiving own message
  
  // Don't add to responses - it will be shown via chat system
  return responses;
}

export async function handleWorldCommand(
  playerId: string,
  player: any,
  target: string | undefined,
  args: string[] | undefined
): Promise<string[]> {
  const responses: string[] = [];
  
  // Reconstruct full message
  const message = [target, ...(args || [])].filter(Boolean).join(' ');
  
  if (!message) {
    responses.push('Bạn muốn nói gì với thế giới?');
    return responses;
  }
  
  // Broadcast to all players
  broadcastService.sendWorldMessage(playerId, message, player.username);
  
  // Don't add to responses - it will be shown via chat system
  return responses;
}

export async function handleGuildChatCommand(
  playerId: string,
  player: any,
  target: string | undefined,
  args: string[] | undefined
): Promise<string[]> {
  const responses: string[] = [];
  
  // Reconstruct full message
  const message = [target, ...(args || [])].filter(Boolean).join(' ');
  
  if (!message) {
    responses.push('Bạn muốn nói gì với bang hội?');
    return responses;
  }
  
  const guildResult = await guildService.sendGuildChat(playerId, message);
  
  if (!guildResult.success) {
    responses.push(guildResult.message);
  }
  
  // Don't add to responses if successful - it will be shown via chat system
  return responses;
}
