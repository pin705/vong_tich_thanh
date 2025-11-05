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
      enum: ['weapon', 'armor', 'consumable', 'misc', 'craftingMaterial', 'recipe', 'furniture'],
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
    // Phase 20: Crafting System
    craftingRecipe: {
      materials: [{
        itemName: String,
        quantity: Number,
      }],
      result: {
        itemName: String,
        quantity: Number,
      },
    },
    // For furniture items
    furnitureType: {
      type: String,
      enum: ['chair', 'table', 'bed', 'decoration', 'storage', null],
      default: null,
    },
  },
});
