import { defineMongooseModel } from '#nuxt/mongoose';
import { Schema } from 'mongoose';

export const RoomSchema = defineMongooseModel({
  name: 'Room',
  schema: {
    name: {
      type: String,
      required: true,
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
  },
});
