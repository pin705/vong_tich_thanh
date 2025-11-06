import { defineMongooseModel } from '#nuxt/mongoose';
import { Schema } from 'mongoose';

export const AgentSchema = defineMongooseModel({
  name: 'Agent',
  schema: {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['npc', 'mob'],
      required: true,
    },
    currentRoomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    hp: {
      type: Number,
      default: 50,
    },
    maxHp: {
      type: Number,
      default: 50,
    },
    level: {
      type: Number,
      default: 1,
    },
    damage: {
      type: Number,
      default: 5,
    },
    behavior: {
      type: String,
      enum: ['passive', 'wander', 'aggressive', 'patrol'],
      default: 'passive',
    },
    patrolRoute: [{
      type: Schema.Types.ObjectId,
      ref: 'Room',
    }],
    dialogue: [String],
    shopItems: [{
      type: Schema.Types.ObjectId,
      ref: 'Item',
    }],
    loot: [{
      type: Schema.Types.ObjectId,
      ref: 'Item',
    }],
    experience: {
      type: Number,
      default: 10,
    },
    inCombat: {
      type: Boolean,
      default: false,
    },
    combatTarget: {
      type: Schema.Types.ObjectId,
      ref: 'Player',
    },
    // Phase 18: Faction System
    faction: {
      type: String,
      default: null, // Faction name this agent belongs to
    },
    // Minimum reputation required to access this NPC's shop/quests
    minReputation: {
      type: Number,
      default: 0,
    },
    // Phase 19: Boss System
    agentType: {
      type: String,
      enum: ['mob', 'elite', 'boss'],
      default: 'mob',
    },
    mechanics: {
      type: Array,
      default: [],
    },
    // Phase 21: Loot Table System
    lootTable: [{
      itemId: {
        type: Schema.Types.ObjectId,
        ref: 'Item',
      },
      dropChance: Number, // 0-1, e.g., 0.5 = 50% chance
    }],
    // Phase 25: Vendor System
    isVendor: {
      type: Boolean,
      default: false,
    },
    shopInventory: [{
      type: Schema.Types.ObjectId,
      ref: 'Item',
    }],
    shopType: {
      type: String,
      enum: ['gold', 'premium'],
      default: 'gold',
    },
    // Maximum number of instances of this agent that can spawn in the room
    maxInstances: {
      type: Number,
      default: 1,
    },
  },
});
