import { defineMongooseModel } from '#nuxt/mongoose';
import { Schema } from 'mongoose';

export const TalentSchema = defineMongooseModel({
  name: 'Talent',
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
    branch: {
      type: String,
      required: true,
    },
    tier: {
      type: Number,
      required: true,
    },
    maxRank: {
      type: Number,
      default: 1,
    },
    pointsInBranchRequired: {
      type: Number,
      default: 0,
    },
    levelRequired: {
      type: Number,
      default: 10,
    },
    prerequisiteTalents: [{
      type: Schema.Types.ObjectId,
      ref: 'Talent',
    }],
    effects: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
    grantsSkill: {
      type: Schema.Types.ObjectId,
      ref: 'Skill',
    },
  },
});
