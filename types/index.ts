// Message types for terminal output
export interface Message {
  id: string;
  text: string;
  type: 'normal' | 'action' | 'accent' | 'error' | 'system' | 'combat_log' | 'chat_log' | 
        'damage_in' | 'damage_out' | 'heal' | 'loot' | 'xp' | 'critical' | 
        'chat_say' | 'chat_guild';
  timestamp: Date;
  user?: string; // For chat messages
  category?: 'combat' | 'chat' | 'system' | 'reward'; // Semantic category for styling
}

// Chat message type
export interface ChatMessage {
  id: string;
  user?: string;
  text: string;
  timestamp: Date;
}

// Player state for UI
export interface PlayerState {
  name: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  level: number;
  exp: number;
  nextLevelExp: number;
  gold: number;
  premiumCurrency: number;
  inCombat: boolean;
  class?: string;
  resource?: number;
  maxResource?: number;
  talentPoints?: number;
  stats: {
    damage: number;
    defense: number;
    critChance: number;
    critDamage: number;
    lifesteal: number;
    dodge: number;
  };
  inventoryItems: (InventoryItem | null)[];
}

// Inventory item for UI
export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: 'weapon' | 'armor' | 'consumable' | 'misc';
  value: number;
  stats?: {
    damage?: number;
    defense?: number;
    healing?: number;
    critChance?: number;
    critDamage?: number;
    lifesteal?: number;
    dodge?: number;
  };
  levelRequirement?: number;
  equipped?: boolean;
}

// Target state for UI
export interface TargetState {
  name: string;
  hp: number;
  maxHp: number;
}

// Exits state for map
export interface ExitsState {
  north?: boolean;
  south?: boolean;
  east?: boolean;
  west?: boolean;
  up?: boolean;
  down?: boolean;
}

// Room occupant
export interface RoomOccupant {
  id: string;
  name: string;
}

// Room occupants state
export interface RoomOccupantsState {
  players: RoomOccupant[];
  npcs: RoomOccupant[];
  mobs: RoomOccupant[];
}

// Selected target
export interface SelectedTarget {
  type: 'player' | 'npc' | 'mob';
  id: string;
  name: string;
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
  premiumCurrency: number;
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

// Skill types
export interface Skill {
  _id: string;
  name: string;
  description: string;
  class: 'mutant_warrior' | 'rune_historian' | 'stalker' | 'scrap_engineer';
  type: 'active' | 'passive';
  resourceCost: number;
  cooldown: number;
  damage?: number;
  healing?: number;
  effects?: Record<string, any>;
  levelRequirement: number;
}

// Talent types
export interface Talent {
  _id: string;
  name: string;
  description: string;
  class: 'mutant_warrior' | 'rune_historian' | 'stalker' | 'scrap_engineer';
  branch: string;
  tier: number;
  maxRank: number;
  pointsInBranchRequired: number;
  levelRequired: number;
  prerequisiteTalents?: string[];
  effects?: Record<string, any>;
  grantsSkill?: string;
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
