import { defineMongooseModel } from '#nuxt/mongoose';
import { Schema } from 'mongoose';

export const PetSchema = defineMongooseModel({
  name: 'Pet',
  schema: {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'Player',
      required: true,
      index: true,
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'PetTemplate',
      required: true,
    },
    nickname: {
      type: String,
      required: true,
    },
    element: {
      type: String,
      enum: ['FIRE', 'WATER', 'EARTH', 'WIND', 'LIGHTNING', 'NEUTRAL'],
      default: 'NEUTRAL',
    },
    level: {
      type: Number,
      default: 1,
    },
    exp: {
      type: Number,
      default: 0,
    },
    expToNextLevel: {
      type: Number,
      default: 100,
    },
    currentStats: {
      hp: {
        type: Number,
        default: 50,
      },
      maxHp: {
        type: Number,
        default: 50,
      },
      attack: {
        type: Number,
        default: 5,
      },
      defense: {
        type: Number,
        default: 3,
      },
    },
    skills: [{
      type: String,
    }],
    quality: {
      type: String,
      enum: ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'],
      default: 'COMMON',
    },
  },
});
