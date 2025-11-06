import { defineMongooseModel } from '#nuxt/mongoose';
import { Schema } from 'mongoose';

export const ItemSchema = defineMongooseModel({
  name: 'Item',
  schema: {
    name: {
      type: String,
      required: true,
      index: true, // Index for faster name lookups
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['weapon', 'armor', 'consumable', 'misc', 'craftingMaterial', 'recipe', 'furniture', 'Equipment', 'Recipe', 'Material'],
      required: true,
      index: true, // Index for filtering by type
    },
    value: {
      type: Number,
      default: 0,
    },
    // Phase 25: Vendor System - Prices
    price: {
      type: Number,
      default: 0,
    },
    sellValue: {
      type: Number,
      default: 0,
    },
    premiumPrice: {
      type: Number,
      default: 0,
    },
    stats: {
      damage: Number,
      defense: Number,
      healing: Number,
      strength: Number,
      agility: Number,
      hp: Number,
    },
    effects: {
      type: Object,
      default: null,
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
    // Phase 19: Boss System - Loot Rarity
    rarity: {
      type: String,
      enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
      default: 'common',
    },
    // Phase 21: Equipment System - Equipment slot
    slot: {
      type: String,
      enum: ['helmet', 'chest', 'legs', 'boots', 'weapon', null],
      default: null,
    },
    // Phase 21: Equipment System - Item quality
    quality: {
      type: String,
      enum: ['Thô', 'Thường', 'Tốt', 'Hiếm', 'Sử Thi'],
      default: 'Thường',
    },
    // Phase 21: Equipment System - Level requirement
    requiredLevel: {
      type: Number,
      default: 1,
    },
    // Phase 21: Crafting System - Recipe structure
    recipe: [{
      materialId: {
        type: Schema.Types.ObjectId,
        ref: 'Item',
      },
      quantity: Number,
    }],
    // Phase 21: Crafting System - Result item
    resultItem: {
      type: Schema.Types.ObjectId,
      ref: 'Item',
      default: null,
    },
    // Phase 21: Equipment System - Set key for set bonuses
    setKey: {
      type: String,
      default: null,
    },
    // Phase 21: Equipment System - Set bonuses
    setBonus: [{
      requiredPieces: Number,
      stats: {
        type: Map,
        of: Number,
      },
    }],
  },
});
