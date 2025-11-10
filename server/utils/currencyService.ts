/**
 * Currency Service - Centralized currency handling to avoid duplication
 */

export type CurrencyType = 'gold' | 'premium' | 'dungeon_coin' | 'tamer_badge' | 'glory_points' | 'bravery_medal';

export interface CurrencyInfo {
  type: CurrencyType;
  symbol: string;
  name: string;
  priceField: 'price' | 'premiumPrice' | 'dungeonCoinPrice' | 'tamerBadgePrice' | 'gloryPointsPrice' | 'braveryMedalPrice';
}

export interface CurrencyCheckResult {
  canAfford: boolean;
  playerAmount: number;
  required: number;
  currencyInfo: CurrencyInfo;
}

// Currency configuration
const CURRENCY_CONFIG: Record<CurrencyType, Omit<CurrencyInfo, 'type'>> = {
  gold: {
    symbol: '💰',
    name: 'vàng',
    priceField: 'price'
  },
  premium: {
    symbol: '💎',
    name: 'Cổ Thạch',
    priceField: 'premiumPrice'
  },
  dungeon_coin: {
    symbol: '🎫',
    name: 'Xu Hầm Ngục',
    priceField: 'dungeonCoinPrice'
  },
  tamer_badge: {
    symbol: '🏅',
    name: 'Huy Hiệu Huấn Luyện',
    priceField: 'tamerBadgePrice'
  },
  glory_points: {
    symbol: '⚔️',
    name: 'Điểm Vinh Quang',
    priceField: 'gloryPointsPrice'
  },
  bravery_medal: {
    symbol: '🎖️',
    name: 'Huy Chương Dũng Cảm',
    priceField: 'braveryMedalPrice'
  }
};

/**
 * Get currency info from vendor/shop configuration
 */
export function getCurrencyInfoFromVendor(vendor: any): CurrencyInfo {
  let currencyType: CurrencyType = 'gold';
  
  if (vendor.shopType === 'premium') {
    currencyType = 'premium';
  } else if (vendor.shopCurrency === 'dungeon_coin') {
    currencyType = 'dungeon_coin';
  } else if (vendor.shopCurrency === 'tamer_badge') {
    currencyType = 'tamer_badge';
  } else if (vendor.shopCurrency === 'glory_points') {
    currencyType = 'glory_points';
  } else if (vendor.shopCurrency === 'bravery_medal') {
    currencyType = 'bravery_medal';
  }
  
  return {
    type: currencyType,
    ...CURRENCY_CONFIG[currencyType]
  };
}

/**
 * Get player's current amount of a specific currency
 */
export function getPlayerCurrency(player: any, currencyType: CurrencyType): number {
  switch (currencyType) {
    case 'gold':
      return player.gold || 0;
    case 'premium':
      return player.premiumCurrency || 0;
    case 'dungeon_coin':
      return player.dungeonCoin || 0;
    case 'tamer_badge':
      return player.tamerBadge || 0;
    case 'glory_points':
      return player.gloryPoints || 0;
    case 'bravery_medal':
      return player.braveryMedals || 0;
    default:
      return 0;
  }
}

/**
 * Deduct currency from player
 * @returns The remaining currency amount after deduction
 */
export function deductCurrency(player: any, currencyType: CurrencyType, amount: number): number {
  const currentAmount = getPlayerCurrency(player, currencyType);
  const newAmount = currentAmount - amount;
  
  switch (currencyType) {
    case 'gold':
      player.gold = newAmount;
      break;
    case 'premium':
      player.premiumCurrency = newAmount;
      break;
    case 'dungeon_coin':
      player.dungeonCoin = newAmount;
      break;
    case 'tamer_badge':
      player.tamerBadge = newAmount;
      break;
    case 'glory_points':
      player.gloryPoints = newAmount;
      break;
    case 'bravery_medal':
      player.braveryMedals = newAmount;
      break;
  }
  
  return newAmount;
}

/**
 * Add currency to player
 * @returns The new currency amount after addition
 */
export function addCurrency(player: any, currencyType: CurrencyType, amount: number): number {
  const currentAmount = getPlayerCurrency(player, currencyType);
  const newAmount = currentAmount + amount;
  
  switch (currencyType) {
    case 'gold':
      player.gold = newAmount;
      break;
    case 'premium':
      player.premiumCurrency = newAmount;
      break;
    case 'dungeon_coin':
      player.dungeonCoin = newAmount;
      break;
    case 'tamer_badge':
      player.tamerBadge = newAmount;
      break;
    case 'glory_points':
      player.gloryPoints = newAmount;
      break;
    case 'bravery_medal':
      player.braveryMedals = newAmount;
      break;
  }
  
  return newAmount;
}

/**
 * Check if player can afford an item
 */
export function checkAffordability(
  player: any, 
  item: any, 
  currencyInfo: CurrencyInfo
): CurrencyCheckResult {
  const itemPrice = item[currencyInfo.priceField] ?? 0;
  const playerAmount = getPlayerCurrency(player, currencyInfo.type);
  
  return {
    canAfford: playerAmount >= itemPrice,
    playerAmount,
    required: itemPrice,
    currencyInfo
  };
}

/**
 * Format currency display
 */
export function formatCurrency(amount: number, currencyType: CurrencyType): string {
  const config = CURRENCY_CONFIG[currencyType];
  return `${amount} ${config.symbol}`;
}

/**
 * Get currency name (localized)
 */
export function getCurrencyName(currencyType: CurrencyType): string {
  return CURRENCY_CONFIG[currencyType].name;
}
