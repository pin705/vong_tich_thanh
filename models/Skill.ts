import { defineMongooseModel } from '#nuxt/mongoose';
import { Schema } from 'mongoose';

export const SkillSchema = defineMongooseModel({
  name: 'Skill',
  schema: {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    class: {
      type: String,
      enum: ['mutant_warrior', 'rune_historian', 'stalker', 'scrap_engineer'],
      required: true,
    },
    type: {
      type: String,
      enum: ['active', 'passive'],
      default: 'active',
    },
    resourceCost: {
      type: Number,
      default: 0,
    },
    cooldown: {
      type: Number,
      default: 0,
    },
    damage: {
      type: Number,
      default: 0,
    },
    healing: {
      type: Number,
      default: 0,
    },
    effects: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
    levelRequirement: {
      type: Number,
      default: 1,
    },
  },
});
