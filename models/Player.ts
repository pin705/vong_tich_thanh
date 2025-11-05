import { defineMongooseModel } from '#nuxt/mongoose';
import { Schema } from 'mongoose';

export const PlayerSchema = defineMongooseModel({
  name: 'Player',
  schema: {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    currentRoomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    hp: {
      type: Number,
      default: 100,
    },
    maxHp: {
      type: Number,
      default: 100,
    },
    level: {
      type: Number,
      default: 1,
    },
    experience: {
      type: Number,
      default: 0,
    },
    gold: {
      type: Number,
      default: 0,
    },
    inventory: [{
      type: Schema.Types.ObjectId,
      ref: 'Item',
    }],
    inCombat: {
      type: Boolean,
      default: false,
    },
    combatTarget: {
      type: Schema.Types.ObjectId,
      ref: 'Agent',
    },
  },
});
