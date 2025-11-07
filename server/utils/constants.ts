// Game constants and configuration

// Combat settings
export const COMBAT_TICK_INTERVAL = 2000; // 2 seconds per combat tick
export const FLEE_SUCCESS_CHANCE = 0.6; // 60% chance to successfully flee

// Experience and leveling
export const EXPERIENCE_PER_LEVEL = 100;
export const HP_GAIN_PER_LEVEL = 10;
export const TALENT_POINTS_PER_LEVEL = 1; // Talent points gained per level up
export const SKILL_POINTS_PER_LEVEL = 1; // Skill points gained per level up

/**
 * Calculate experience required to level up
 * Uses formula: baseExp * level^1.5 for smooth exponential growth
 * Level 1->2: 100 EXP
 * Level 5->6: 559 EXP
 * Level 10->11: 1581 EXP
 * Level 20->21: 4472 EXP
 * Level 50->51: 17677 EXP
 */
export function getExpForLevel(level: number): number {
  return Math.floor(EXPERIENCE_PER_LEVEL * Math.pow(level, 1.5));
}

// Starting player stats
export const STARTING_HP = 100;
export const STARTING_GOLD = 50;
export const STARTING_LEVEL = 1;

// Item healing values
export const SMALL_POTION_HEALING = 15;
export const MEDIUM_POTION_HEALING = 30;
export const LARGE_POTION_HEALING = 50;

// Development mode messages
export const DEV_FEATURE_MESSAGE = '(Tính năng đang được phát triển)';

// Password security
export const MIN_PASSWORD_LENGTH = 6;
export const BCRYPT_SALT_ROUNDS = 10;

// Combat damage
export const MINIMUM_DAMAGE = 1;

// Guild system
export const GUILD_CREATION_COST = 100000; // Cost in gold to create a guild
export const GUILD_TAG_MIN_LENGTH = 3;
export const GUILD_TAG_MAX_LENGTH = 5;
export const GUILD_NAME_MAX_LENGTH = 30;

// Dungeon rewards
export const DUNGEON_BASE_GOLD_REWARD = 50; // Base gold reward for completing a dungeon floor
export const DUNGEON_GOLD_MULTIPLIER = 1.2; // Multiplier for gold based on floor number
export const DUNGEON_BASE_COIN_REWARD = 1; // Base dungeon coin reward
export const DUNGEON_COIN_FLOOR_DIVISOR = 5; // Divide floor number by this for coin calculation
