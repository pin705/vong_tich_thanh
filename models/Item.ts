import { defineMongooseModel } from '#nuxt/mongoose';

export const ItemSchema = defineMongooseModel({
  name: 'Item',
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
      enum: ['weapon', 'armor', 'consumable', 'misc'],
      required: true,
    },
    value: {
      type: Number,
      default: 0,
    },
    stats: {
      damage: Number,
      defense: Number,
      healing: Number,
    },
  },
});
