import { defineMongooseModel } from '#nuxt/mongoose';
import { Schema } from 'mongoose';

export const PlayerSchema = defineMongooseModel({
  name: 'Player',
  schema: {
    username: {
      type: String,
      required: true,
      unique: true,
      index: true,
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
    premiumCurrency: {
      type: Number,
      default: 0,
    },
    braveryMedals: {
      type: Number,
      default: 0,
    },
    gloryPoints: {
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
      default: 'mutant_warrior', // Default for new players; existing players can remain null
    },
    // Elemental affinity system
    elementalAffinity: {
      type: String,
      enum: ['FIRE', 'WATER', 'EARTH', 'WIND', 'LIGHTNING', 'NEUTRAL'],
      default: 'NEUTRAL',
    },
    elementalResistances: {
      FIRE: {
        type: Number,
        default: 0,
      },
      WATER: {
        type: Number,
        default: 0,
      },
      EARTH: {
        type: Number,
        default: 0,
      },
      WIND: {
        type: Number,
        default: 0,
      },
      LIGHTNING: {
        type: Number,
        default: 0,
      },
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
      default: [],
    }],
    // Phase 29: Skill system enhancements
    skillPoints: {
      type: Number,
      default: 0,
    },
    learnedSkills: {
      type: Map,
      of: Number, // Skill ID -> Upgrade Level
      default: {},
    },
    skillCooldowns: {
      type: Map,
      of: Date, // Skill ID -> Last Used Time
      default: {},
    },
    // Equipped skills hotbar (slots 1-10)
    equippedSkills: {
      type: Map,
      of: Schema.Types.ObjectId, // Slot number -> Skill ID
      default: {},
    },
    // Auto-skill configuration
    autoSkills: [{
      skillId: {
        type: Schema.Types.ObjectId,
        ref: 'Skill',
      },
      priority: {
        type: Number,
        default: 0,
      },
      conditions: {
        type: Map,
        of: Schema.Types.Mixed,
        default: {},
      },
    }],
    // Profession system
    profession: {
      type: String,
      enum: ['blacksmith', 'alchemist', 'enchanter', 'hunter', 'miner', 'herbalist', null],
      default: null,
    },
    professionLevel: {
      type: Number,
      default: 0,
    },
    professionExp: {
      type: Number,
      default: 0,
    },
    // Phase 29: Advanced profession system
    professionTier: {
      type: Number,
      default: 1,
    },
    completedProfessionQuests: [{
      type: String,
    }],
    // Phase 17: Guild System
    guild: {
      type: Schema.Types.ObjectId,
      ref: 'Guild',
      default: null,
    },
    guildInvite: {
      type: Schema.Types.ObjectId,
      ref: 'Guild',
      default: null,
    },
    // Phase 18: PvP System
    pvpEnabled: {
      type: Boolean,
      default: false,
    },
    // Phase 21: Equipment System
    equipment: {
      helmet: {
        type: Schema.Types.ObjectId,
        ref: 'Item',
        default: null,
      },
      chest: {
        type: Schema.Types.ObjectId,
        ref: 'Item',
        default: null,
      },
      legs: {
        type: Schema.Types.ObjectId,
        ref: 'Item',
        default: null,
      },
      boots: {
        type: Schema.Types.ObjectId,
        ref: 'Item',
        default: null,
      },
      weapon: {
        type: Schema.Types.ObjectId,
        ref: 'Item',
        default: null,
      },
    },
    // Phase 21: Crafting System - Known recipes
    knownRecipes: [{
      type: Schema.Types.ObjectId,
      ref: 'Item',
    }],
    // Phase 27: Mail System - Unread mail indicator
    hasUnreadMail: {
      type: Boolean,
      default: false,
    },
    // Phase 29: Admin Panel - User role
    role: {
      type: String,
      enum: ['player', 'admin'],
      default: 'player',
    },
    // Title system (legacy)
    title: {
      type: String,
      default: null,
    },
    // Achievement & Title System
    unlockedTitles: [{
      key: { type: String },
      name: { type: String },
      stats: {
        attack: { type: Number },
        hp: { type: Number },
        defense: { type: Number },
        critChance: { type: Number },
        critDamage: { type: Number },
        dodge: { type: Number },
        lifesteal: { type: Number },
      },
    }],
    activeTitleKey: {
      type: String,
      default: null,
    },
    // Phase 30: Custom Alias System
    customAliases: {
      type: Map,
      of: String, // Alias -> Full Command
      default: {},
    },
    // Phase 30: Auto-Combat Settings
    autoCombat: {
      type: Boolean,
      default: false, // Auto-attack nearest mob when available
    },
    // Phase 31: Visited Rooms Tracking
    visitedRooms: [{
      type: Schema.Types.ObjectId,
      ref: 'Room',
      default: [],
    }],
    // Tutorial System
    hasCompletedTutorial: {
      type: Boolean,
      default: false,
    },
    // Enhancement & Dungeon System
    dungeonCoin: {
      type: Number,
      default: 0,
    },
    dungeonProgress: {
      currentFloor: {
        type: Number,
        default: 1,
      },
      highestFloor: {
        type: Number,
        default: 1,
      },
      lastWeeklyReset: {
        type: Date,
        default: () => new Date(),
      },
    },
    // Pet System
    petStable: [{
      type: Schema.Types.ObjectId,
      ref: 'Pet',
    }],
    activePetId: {
      type: Schema.Types.ObjectId,
      ref: 'Pet',
      default: null,
    },
    // Pet Trial Tower
    tamerBadge: {
      type: Number,
      default: 0,
    },
    petTrialProgress: {
      currentFloor: {
        type: Number,
        default: 1,
      },
      highestFloor: {
        type: Number,
        default: 1,
      },
      lastWeeklyReset: {
        type: Date,
        default: () => new Date(),
      },
    },
  },
});
