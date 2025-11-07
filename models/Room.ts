import { defineMongooseModel } from '#nuxt/mongoose';
import { Schema } from 'mongoose';

export const RoomSchema = defineMongooseModel({
  name: 'Room',
  schema: {
    roomKey: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    exits: {
      north: { type: Schema.Types.ObjectId, ref: 'Room' },
      south: { type: Schema.Types.ObjectId, ref: 'Room' },
      east: { type: Schema.Types.ObjectId, ref: 'Room' },
      west: { type: Schema.Types.ObjectId, ref: 'Room' },
      up: { type: Schema.Types.ObjectId, ref: 'Room' },
      down: { type: Schema.Types.ObjectId, ref: 'Room' },
    },
    items: [{
      type: Schema.Types.ObjectId,
      ref: 'Item',
    }],
    agents: [{
      type: Schema.Types.ObjectId,
      ref: 'Agent',
    }],
    // Phase 18: PvP System
    isSafeZone: {
      type: Boolean,
      default: true, // Most areas are safe by default
    },
    // Phase 19: Housing System
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'Player',
      default: null,
    },
    decorations: [{
      itemId: {
        type: Schema.Types.ObjectId,
        ref: 'Item',
      },
      position: String, // e.g., "north-wall", "center", "east-corner"
    }],
    // Phase 19: Boss System
    isBossLair: {
      type: Boolean,
      default: false,
    },
    respawnTimeSeconds: {
      type: Number,
      default: 5, // 5 seconds default, bosses can have 3600 (1 hour)
    },
    // Phase 27: Access Control System
    isLocked: {
      type: Boolean,
      default: false, // Whether the room is locked (has requirements)
    },
    unlockHint: {
      type: String, // Hint text to show players what they need to unlock this room
      default: null,
    },
    requirements: {
      minLevel: { type: Number }, // Minimum level to enter room
      requiredQuestKey: { type: String }, // Quest MUST be completed to enter
      blockedByQuestKey: { type: String }, // If quest is NOT completed, entry is blocked
      requiredItemKey: { type: String }, // Item required to enter (e.g., 'chia_khoa_ham_mo')
      consumeItem: { type: Boolean, default: false } // Whether to consume the item on entry
    },
  },
});
