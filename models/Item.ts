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
      enum: ['weapon', 'armor', 'consumable', 'misc', 'craftingMaterial', 'recipe', 'furniture', 'Equipment', 'Recipe', 'Material', 'upgrade_material', 'PET_EGG', 'PET_FOOD', 'PET_UPGRADE', 'PET_SKILLBOOK', 'PET_CONSUMABLE', 'TITLE_BADGE', 'SKILL_UPGRADE_BOOK', 'ENHANCEMENT_PROTECTION', 'ENHANCE_STONE', 'LEGENDARY_MATERIAL', 'PVP_EQUIPMENT', 'QUEST_ITEM', 'GEM', 'SOCKET_PUNCH'],
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
    // Special Currency Prices
    dungeonCoinPrice: {
      type: Number,
      default: 0,
    },
    tamerBadgePrice: {
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
    // Enhancement System - Upgrade material type
    upgradeType: {
      type: String,
      enum: ['enhancement', 'star', 'refine', null],
      default: null,
    },
    itemKey: {
      type: String,
      unique: true,
      required: false, // Temporarily set to false while migrating
      sparse: true, // Allow multiple null values
      index: true,
    },
    // Pet System - Additional data for pet items
    data: {
      type: Schema.Types.Mixed,
      default: null,
    },
    // World Boss / Event System - Title badges
    grantTitle: {
      type: String,
      default: null, // Title to grant when using this item
    },
    // Arena System - Glory Points price
    gloryPointsPrice: {
      type: Number,
      default: 0,
    },
    // World Boss System - Bravery Medal price
    braveryMedalPrice: {
      type: Number,
      default: 0,
    },
    // Skill Upgrade Books - Skill to upgrade
    upgradesSkill: {
      type: String,
      default: null, // Skill key that this book upgrades
    },
    // Socketing System - Gem/Rune properties
    gemType: {
      type: String,
      enum: ['attack', 'hp', 'defense', 'critChance', 'critDamage', 'dodge', 'lifesteal', null],
      default: null, // Type of stat this gem provides
    },
    gemTier: {
      type: Number,
      default: null, // 1, 2, 3 for tier levels
    },
    gemValue: {
      type: Number,
      default: null, // Stat value provided by this gem
    },
    // Socketing System - Socket properties for equipment
    maxSockets: {
      type: Number,
      default: 0, // Maximum number of sockets this equipment can have
    },
    currentSockets: {
      type: Number,
      default: 0, // Current number of available sockets
    },
    socketedGems: [{
      type: Schema.Types.ObjectId,
      ref: 'Item',
    }],
    // Socket Punch Item
    canAddSocket: {
      type: Boolean,
      default: false, // True if this is a Socket Punch item
    },
  },
});
