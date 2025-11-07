import { defineMongooseModel } from '#nuxt/mongoose';
import { Schema } from 'mongoose';

export const PetTemplateSchema = defineMongooseModel({
  name: 'PetTemplate',
  schema: {
    petKey: {
      type: String,
      required: true,
      unique: true,
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
    baseStats: {
      hp: {
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
    statGrowth: {
      hpPerLevel: {
        type: Number,
        default: 10,
      },
      attackPerLevel: {
        type: Number,
        default: 1,
      },
      defensePerLevel: {
        type: Number,
        default: 0.5,
      },
    },
  },
});
