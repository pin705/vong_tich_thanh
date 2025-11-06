// Broadcast Service - Handle world-wide and guild-wide broadcasts
import { gameState } from './gameState';
import { PlayerSchema } from '../../models/Player';

interface BroadcastOptions {
  channel?: 'main' | 'combat' | 'chat';
  category?: string;
  excludePlayerId?: string;
}

class BroadcastService {
  /**
   * Send a message to all connected players
   */
  sendWorldMessage(senderId: string, message: string, senderName: string): void {
    const allPlayers = gameState.getAllPlayers();
    
    allPlayers.forEach(player => {
      if (player.ws && player.id !== senderId) {
        player.ws.send(JSON.stringify({
          type: 'chat',
          channel: 'chat',
          category: 'world',
          user: senderName,
          message: message
        }));
      }
    });
  }

  /**
   * Send a world alert (like boss spawn/defeat) to all players
   */
  sendWorldAlert(alertMessage: string): void {
    const allPlayers = gameState.getAllPlayers();
    
    allPlayers.forEach(player => {
      if (player.ws) {
        player.ws.send(JSON.stringify({
          type: 'chat',
          channel: 'chat',
          category: 'world_alert',
          message: alertMessage
        }));
      }
    });
  }

  /**
   * Send a message to all guild members
   */
  async sendGuildMessage(senderId: string, guildId: string, message: string): Promise<void> {
    // Get sender info
    const sender = await PlayerSchema.findById(senderId);
    if (!sender) return;

    // Get all players in the guild
    const guildMembers = await PlayerSchema.find({ guild: guildId });
    
    guildMembers.forEach(member => {
      const playerState = gameState.getPlayer(member._id.toString());
      if (playerState?.ws) {
        playerState.ws.send(JSON.stringify({
          type: 'chat',
          channel: 'chat',
          category: 'guild',
          user: sender.username,
          message: message
        }));
      }
    });
  }

  /**
   * Broadcast a general message to a specific channel
   */
  broadcast(message: string, options: BroadcastOptions = {}): void {
    const {
      channel = 'main',
      category = 'system',
      excludePlayerId
    } = options;

    const allPlayers = gameState.getAllPlayers();
    
    allPlayers.forEach(player => {
      if (player.ws && player.id !== excludePlayerId) {
        player.ws.send(JSON.stringify({
          type: 'system',
          channel,
          category,
          message
        }));
      }
    });
  }
}

export const broadcastService = new BroadcastService();
