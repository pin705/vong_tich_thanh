// In-memory game state for active players and real-time updates
interface ActivePlayer {
  id: string;
  username: string;
  roomId: string;
  ws?: any;
}

class GameState {
  private activePlayers: Map<string, ActivePlayer> = new Map();
  private combatTicks: Map<string, NodeJS.Timeout> = new Map();

  // Player management
  addPlayer(playerId: string, username: string, roomId: string, ws?: any) {
    this.activePlayers.set(playerId, { id: playerId, username, roomId, ws });
  }

  removePlayer(playerId: string) {
    this.stopCombat(playerId);
    this.activePlayers.delete(playerId);
  }

  getPlayer(playerId: string): ActivePlayer | undefined {
    return this.activePlayers.get(playerId);
  }

  getPlayersInRoom(roomId: string): ActivePlayer[] {
    return Array.from(this.activePlayers.values()).filter(p => p.roomId === roomId);
  }

  updatePlayerRoom(playerId: string, newRoomId: string) {
    const player = this.activePlayers.get(playerId);
    if (player) {
      player.roomId = newRoomId;
    }
  }

  // Combat management
  startCombat(playerId: string, tickInterval: number, tickFn: () => void) {
    this.stopCombat(playerId);
    const interval = setInterval(tickFn, tickInterval);
    this.combatTicks.set(playerId, interval);
  }

  stopCombat(playerId: string) {
    const interval = this.combatTicks.get(playerId);
    if (interval) {
      clearInterval(interval);
      this.combatTicks.delete(playerId);
    }
  }

  isInCombat(playerId: string): boolean {
    return this.combatTicks.has(playerId);
  }

  // Broadcast to room
  broadcastToRoom(roomId: string, message: any, excludePlayerId?: string) {
    const players = this.getPlayersInRoom(roomId);
    players.forEach(player => {
      if (player.id !== excludePlayerId && player.ws) {
        try {
          player.ws.send(JSON.stringify(message));
        } catch (error) {
          console.error('Error sending message to player:', error);
        }
      }
    });
  }
}

export const gameState = new GameState();
