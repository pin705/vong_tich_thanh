import { ref, type Ref } from 'vue';

export interface PlayerState {
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  mp?: number;
  maxMp?: number;
  resource: number;
  maxResource: number;
  exp: number;
  nextLevelExp: number;
  gold: number;
  premiumCurrency: number;
  profession: string | null;
  class?: string | null;
  inCombat?: boolean;
  guild?: any;
  stats: {
    damage: number;
    defense: number;
    critChance: number;
    critDamage: number;
    lifesteal: number;
    dodge: number;
  };
  inventoryItems: any[];
  talentPoints: number;
  skillPoints: number;
  hasUnreadMail: boolean;
}

export function usePlayerState() {
  const playerState = ref<PlayerState>({
    name: '',
    level: 1,
    hp: 100,
    maxHp: 100,
    mp: 0,
    maxMp: 100,
    resource: 0,
    maxResource: 100,
    exp: 0,
    nextLevelExp: 100,
    gold: 0,
    premiumCurrency: 0,
    profession: null,
    class: null,
    inCombat: false,
    guild: null,
    stats: {
      damage: 5,
      defense: 0,
      critChance: 5,
      critDamage: 150,
      lifesteal: 0,
      dodge: 5
    },
    inventoryItems: [],
    talentPoints: 0,
    skillPoints: 0,
    hasUnreadMail: false
  });
  
  function updatePlayerState(updates: Partial<PlayerState>) {
    playerState.value = {
      ...playerState.value,
      ...updates
    };
  }
  
  function updatePlayerStats(stats: Partial<PlayerState['stats']>) {
    playerState.value.stats = {
      ...playerState.value.stats,
      ...stats
    };
  }
  
  return {
    playerState,
    updatePlayerState,
    updatePlayerStats
  };
}
