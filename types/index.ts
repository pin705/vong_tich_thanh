// Message types for terminal output
export interface Message {
  id: string;
  text: string;
  type: 'normal' | 'action' | 'accent' | 'error' | 'system';
  timestamp: Date;
}

// Player/User types
export interface Player {
  _id: string;
  username: string;
  currentRoomId: string;
  hp: number;
  maxHp: number;
  level: number;
  experience: number;
  gold: number;
  inventory: Item[];
  inCombat: boolean;
  combatTarget?: string;
}

// Room types
export interface Room {
  _id: string;
  name: string;
  description: string;
  exits: {
    north?: string;
    south?: string;
    east?: string;
    west?: string;
    up?: string;
    down?: string;
  };
  items: Item[];
  agents: string[]; // Agent IDs
}

// Item types
export interface Item {
  _id: string;
  name: string;
  description: string;
  type: 'weapon' | 'armor' | 'consumable' | 'misc';
  value: number;
  stats?: {
    damage?: number;
    defense?: number;
    healing?: number;
  };
}

// Agent/NPC/Mob types
export interface Agent {
  _id: string;
  name: string;
  description: string;
  type: 'npc' | 'mob';
  currentRoomId: string;
  hp: number;
  maxHp: number;
  level: number;
  damage: number;
  behavior: 'passive' | 'wander' | 'aggressive' | 'patrol';
  patrolRoute?: string[];
  dialogue?: string[];
  shopItems?: Item[];
  loot?: Item[];
  experience: number;
  inCombat: boolean;
  combatTarget?: string;
}

// Command types
export interface Command {
  action: string;
  target?: string;
  args?: string[];
}

// WebSocket message types
export interface WSMessage {
  type: 'connect' | 'disconnect' | 'command' | 'update' | 'combat' | 'chat';
  payload: any;
  playerId?: string;
  roomId?: string;
}
