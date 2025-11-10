/**
 * Shared game types and constants to avoid duplication across models
 */

// Element types used across Player, Skill, Pet, and PetTemplate models
export const ELEMENT_TYPES = ['FIRE', 'WATER', 'EARTH', 'WIND', 'LIGHTNING', 'NEUTRAL'] as const;
export type ElementType = typeof ELEMENT_TYPES[number];

// Class types used across Player, Skill, and Talent models
export const CLASS_TYPES = ['mutant_warrior', 'rune_historian', 'stalker', 'scrap_engineer'] as const;
export type ClassType = typeof CLASS_TYPES[number];

// Profession types used across Player and Skill models
export const PROFESSION_TYPES = ['blacksmith', 'alchemist', 'enchanter', 'hunter', 'miner', 'herbalist'] as const;
export type ProfessionType = typeof PROFESSION_TYPES[number];

// Common stats interface used in titles, achievements, and equipment
export interface GameStats {
  attack?: number;
  hp?: number;
  defense?: number;
  critChance?: number;
  critDamage?: number;
  dodge?: number;
  lifesteal?: number;
}

// Mongoose schema definition for stats (for use in model schemas)
export const STATS_SCHEMA_DEFINITION = {
  attack: { type: Number },
  hp: { type: Number },
  defense: { type: Number },
  critChance: { type: Number },
  critDamage: { type: Number },
  dodge: { type: Number },
  lifesteal: { type: Number },
};
