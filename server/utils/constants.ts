// Game constants and configuration

// Combat settings
export const COMBAT_TICK_INTERVAL = 2000; // 2 seconds per combat tick
export const FLEE_SUCCESS_CHANCE = 0.6; // 60% chance to successfully flee

// Experience and leveling
export const EXPERIENCE_PER_LEVEL = 100;
export const HP_GAIN_PER_LEVEL = 10;

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
