import { defineMongooseModel } from '#nuxt/mongoose';
import { Schema } from 'mongoose';

export const SkillSchema = defineMongooseModel({
  name: 'Skill',
  schema: {
    skillKey: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
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
    element: {
      type: String,
      enum: ['FIRE', 'WATER', 'EARTH', 'WIND', 'LIGHTNING', 'NEUTRAL'],
      default: 'NEUTRAL',
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
    // Phase 29: Advanced skill properties
    targetType: {
      type: String,
      enum: ['self', 'single', 'area', 'cone', 'line'],
      default: 'single',
    },
    range: {
      type: Number,
      default: 1,
    },
    animationEffect: {
      type: String,
      default: '',
    },
    maxUpgradeLevel: {
      type: Number,
      default: 1,
    },
    prerequisiteSkills: [{
      type: Schema.Types.ObjectId,
      ref: 'Skill',
    }],
    skillPointCost: {
      type: Number,
      default: 1,
    },
    professionRequirement: {
      type: String,
      enum: ['blacksmith', 'alchemist', 'enchanter', 'hunter', 'miner', 'herbalist', null],
      default: null,
    },
    tier: {
      type: Number,
      default: 1,
    },
  },
});
