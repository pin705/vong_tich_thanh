/**
 * Shared utility functions for gem system
 */

export interface GemData {
  gemType?: string;
  gemTier?: number;
  gemValue?: number;
}

/**
 * Check if an item is a gem item
 * Validates that all required gem properties exist and have valid values
 */
export function isGemItem(item: any): boolean {
  return item && 
    typeof item.gemType === 'string' && 
    item.gemType.length > 0 &&  // Ensure gemType is not empty
    typeof item.gemTier === 'number' && 
    item.gemTier > 0 &&  // Ensure positive tier
    typeof item.gemValue === 'number';
}

/**
 * Get CSS class for gem type
 */
export function getGemTypeClass(gemType: string): string {
  const typeClasses: Record<string, string> = {
    'attack': 'gem-attack',
    'hp': 'gem-hp',
    'defense': 'gem-defense',
    'critChance': 'gem-crit-chance',
    'critDamage': 'gem-crit-damage',
    'dodge': 'gem-dodge',
    'lifesteal': 'gem-lifesteal'
  };
  return typeClasses[gemType] || '';
}

/**
 * Get localized name for gem type
 */
export function getGemTypeName(gemType: string): string {
  const typeNames: Record<string, string> = {
    'attack': 'Sát Thương',
    'hp': 'HP',
    'defense': 'Phòng Thủ',
    'critChance': 'Tỷ Lệ Chí Mạng',
    'critDamage': 'Sát Thương Chí Mạng',
    'dodge': 'Né Tránh',
    'lifesteal': 'Hút Máu'
  };
  return typeNames[gemType] || gemType;
}

/**
 * Format gem bonus value display with appropriate unit
 */
export function getGemBonusDisplay(gemData: GemData): string {
  if (!gemData || typeof gemData.gemValue !== 'number') return '';
  
  const percentageTypes = ['critChance', 'dodge', 'lifesteal'];
  const isPercentage = gemData.gemType && percentageTypes.includes(gemData.gemType);
  const value = gemData.gemValue;
  
  return isPercentage ? `+${value}%` : `+${value}`;
}

/**
 * Gem type color definitions for consistent styling
 * These are the CSS custom properties that should be defined in your global styles
 */
export const GEM_TYPE_COLORS = {
  attack: '#ff4444',
  hp: '#44ff44',
  defense: '#4444ff',
  critChance: '#ff8800',
  critDamage: '#ff00ff',
  dodge: '#00ffff',
  lifesteal: '#ff0088'
} as const;
