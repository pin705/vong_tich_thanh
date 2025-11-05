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
    // Phase 12: Class & Talent System
    class: {
      type: String,
      enum: ['mutant_warrior', 'rune_historian', 'stalker', 'scrap_engineer'],
      default: 'mutant_warrior',
    },
    // Class resources
    resource: {
      type: Number,
      default: 0,
    },
    maxResource: {
      type: Number,
      default: 100,
    },
    // Talent system
    talentPoints: {
      type: Number,
      default: 0,
    },
    talents: {
      type: Map,
      of: Number,
      default: {},
    },
    skills: [{
      type: Schema.Types.ObjectId,
      ref: 'Skill',
    }],
  },
});
