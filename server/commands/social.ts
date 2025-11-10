import { gameState } from '../utils/gameState';
import { RoomSchema } from '../../models/Room';
import { broadcastService } from '../utils/broadcastService';
import { guildService } from '../utils/guildService';
import { partyService } from '../utils/partyService';

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
  
  // Broadcast to room, INCLUDING the sender so they can see their own message
  const room = await RoomSchema.findById(player.currentRoomId);
  if (!room) {
    responses.push('Lỗi: Không tìm thấy phòng hiện tại.');
    return responses;
  }
  
  // Send to everyone in the room including sender
  gameState.broadcastToRoom(room._id.toString(), {
    type: 'chat',
    channel: 'chat',
    category: 'say',
    user: player.username,
    message: message
  }); // Don't exclude sender so they see their own message
  
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

export async function handlePartyChatCommand(
  playerId: string,
  player: any,
  target: string | undefined,
  args: string[] | undefined
): Promise<string[]> {
  const responses: string[] = [];
  
  // Reconstruct full message
  const chatMessage = [target, ...(args || [])].filter(Boolean).join(' ');
  
  if (!chatMessage) {
    responses.push('Bạn muốn nói gì với nhóm?');
    return responses;
  }
  
  const playerParty = partyService.getPlayerParty(playerId);
  if (!playerParty) {
    responses.push('Bạn không ở trong nhóm nào.');
    return responses;
  }
  
  // Broadcast to all party members
  const memberIds = partyService.getPartyMemberIds(playerParty.partyId);
  const members = gameState.getPlayersByIds(memberIds);
  
  members.forEach(member => {
    if (member.ws) {
      member.ws.send(JSON.stringify({
        type: 'chat',
        channel: 'chat',
        category: 'party',
        user: player.username,
        message: chatMessage
      }));
    }
  });
  
  // Don't add to responses - it will be shown via chat system
  return responses;
}
