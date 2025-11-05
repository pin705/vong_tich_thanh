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
  },
});
