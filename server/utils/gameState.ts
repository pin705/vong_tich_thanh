// In-memory game state for active players and real-time updates
interface ActivePlayer {
  id: string;
  username: string;
  roomId: string;
  ws?: any;
  partyId?: string | null;
  tutorialRewardData?: Array<{ itemKey: string; name: string }>;
}

// Active pet state
interface ActivePet {
  _id: string;
  name: string;
  ownerId: string;
  templateId: string;
  currentRoomId: string;
  currentStats: {
    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
  };
  level: number;
  quality: string;
}

// Player skill cooldown tracking
export interface PlayerSkillCooldown {
  skillId: string;
  readyAt: number; // Date.now() when skill is ready
}

// Player combat state
export interface PlayerState {
  inCombat: boolean;
  isAutoAttacking: boolean;
  combatTargetId: string | null;
  skillCooldowns: PlayerSkillCooldown[];
}

class GameState {
  private activePlayers: Map<string, ActivePlayer> = new Map();
  private activePets: Map<string, ActivePet> = new Map();
  private combatTicks: Map<string, NodeJS.Timeout> = new Map();
  private playerStates: Map<string, PlayerState> = new Map();

  // Player management
  addPlayer(playerId: string, username: string, roomId: string, ws?: any) {
    this.activePlayers.set(playerId, { id: playerId, username, roomId, ws });
    // Initialize player state if not exists
    if (!this.playerStates.has(playerId)) {
      this.playerStates.set(playerId, {
        inCombat: false,
        isAutoAttacking: false,
        combatTargetId: null,
        skillCooldowns: []
      });
    }
  }

  removePlayer(playerId: string) {
    this.stopCombat(playerId);
    this.activePlayers.delete(playerId);
    this.playerStates.delete(playerId);
  }

  getPlayer(playerId: string): ActivePlayer | undefined {
    return this.activePlayers.get(playerId);
  }

  getPlayersInRoom(roomId: string): ActivePlayer[] {
    return Array.from(this.activePlayers.values()).filter(p => p.roomId === roomId);
  }

  getAllPlayers(): ActivePlayer[] {
    return Array.from(this.activePlayers.values());
  }

  updatePlayerRoom(playerId: string, newRoomId: string) {
    const player = this.activePlayers.get(playerId);
    if (player) {
      player.roomId = newRoomId;
    }
  }

  updatePlayerParty(playerId: string, partyId: string | null) {
    const player = this.activePlayers.get(playerId);
    if (player) {
      player.partyId = partyId;
    }
  }

  getPlayersByIds(playerIds: string[]): ActivePlayer[] {
    return playerIds
      .map(id => this.activePlayers.get(id))
      .filter((p): p is ActivePlayer => p !== undefined);
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

  // Broadcast to all connected players
  broadcastToAll(message: any) {
    const players = this.getAllPlayers();
    players.forEach(player => {
      if (player.ws) {
        try {
          player.ws.send(JSON.stringify(message));
        } catch (error) {
          console.error('Error sending message to player:', error);
        }
      }
    });
  }

  // Player state management
  getPlayerState(playerId: string): PlayerState | undefined {
    // Initialize if not exists
    if (!this.playerStates.has(playerId)) {
      this.playerStates.set(playerId, {
        inCombat: false,
        isAutoAttacking: false,
        combatTargetId: null,
        skillCooldowns: []
      });
    }
    return this.playerStates.get(playerId);
  }

  updatePlayerState(playerId: string, updates: Partial<PlayerState>) {
    const state = this.getPlayerState(playerId);
    if (state) {
      Object.assign(state, updates);
    }
  }

  // Pet management
  addPet(pet: ActivePet) {
    this.activePets.set(pet._id, pet);
  }

  removePet(petId: string) {
    this.activePets.delete(petId);
  }

  getPet(petId: string): ActivePet | undefined {
    return this.activePets.get(petId);
  }

  getPetsInRoom(roomId: string): ActivePet[] {
    return Array.from(this.activePets.values()).filter(p => p.currentRoomId === roomId);
  }

  getPlayerPet(playerId: string): ActivePet | undefined {
    return Array.from(this.activePets.values()).find(p => p.ownerId === playerId);
  }

  updatePetRoom(petId: string, newRoomId: string) {
    const pet = this.activePets.get(petId);
    if (pet) {
      pet.currentRoomId = newRoomId;
    }
  }
}

export const gameState = new GameState();
