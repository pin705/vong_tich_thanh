// Profession configuration data

export interface ProfessionStarterItem {
  name: string;
  type: 'weapon' | 'armor' | 'consumable' | 'misc';
  description: string;
  value: number;
  stats?: {
    damage?: number;
    defense?: number;
    healing?: number;
  };
}

// Phase 29: Advanced profession progression
export interface ProfessionTier {
  tier: number;
  name: string;
  description: string;
  requirements: {
    level?: number;
    professionLevel?: number;
    completedQuests?: string[];
    stats?: Record<string, number>;
  };
  benefits: {
    skillsGranted?: string[];
    statBonuses?: Record<string, number>;
    specialAbilities?: string[];
  };
}

export interface ProfessionProgression {
  baseName: string;
  tiers: ProfessionTier[];
}

// Multi-tier profession progressions
export const professionProgressions: Record<string, ProfessionProgression> = {
  blacksmith: {
    baseName: 'Thợ Rèn',
    tiers: [
      {
        tier: 1,
        name: 'Thợ Rèn Tập Sự',
        description: 'Người mới bắt đầu học nghề rèn',
        requirements: {
          level: 1,
        },
        benefits: {
          skillsGranted: ['basic_forge', 'repair_item'],
          statBonuses: { strength: 2 },
        },
      },
      {
        tier: 2,
        name: 'Thợ Rèn Thành Thạo',
        description: 'Thợ rèn có kinh nghiệm',
        requirements: {
          level: 20,
          professionLevel: 50,
        },
        benefits: {
          skillsGranted: ['advanced_forge', 'temper_weapon'],
          statBonuses: { strength: 5, defense: 3 },
        },
      },
      {
        tier: 3,
        name: 'Đại Thợ Rèn',
        description: 'Bậc thầy nghệ thuật rèn',
        requirements: {
          level: 40,
          professionLevel: 100,
        },
        benefits: {
          skillsGranted: ['master_forge', 'legendary_craft'],
          statBonuses: { strength: 10, defense: 5 },
        },
      },
    ],
  },
  alchemist: {
    baseName: 'Giả Kim Sư',
    tiers: [
      {
        tier: 1,
        name: 'Giả Kim Sư Tập Sự',
        description: 'Người mới học nghệ thuật giả kim',
        requirements: {
          level: 1,
        },
        benefits: {
          skillsGranted: ['basic_alchemy', 'brew_potion'],
          statBonuses: { intelligence: 2 },
        },
      },
      {
        tier: 2,
        name: 'Giả Kim Sư Thành Thạo',
        description: 'Giả kim sư có kinh nghiệm',
        requirements: {
          level: 20,
          professionLevel: 50,
        },
        benefits: {
          skillsGranted: ['advanced_alchemy', 'transmute_material'],
          statBonuses: { intelligence: 5, wisdom: 3 },
        },
      },
      {
        tier: 3,
        name: 'Đại Giả Kim Sư',
        description: 'Bậc thầy giả kim',
        requirements: {
          level: 40,
          professionLevel: 100,
        },
        benefits: {
          skillsGranted: ['master_alchemy', 'philosophers_stone'],
          statBonuses: { intelligence: 10, wisdom: 5 },
        },
      },
    ],
  },
  enchanter: {
    baseName: 'Phù Phép Sư',
    tiers: [
      {
        tier: 1,
        name: 'Phù Phép Sư Tập Sự',
        description: 'Người mới học phù phép',
        requirements: {
          level: 1,
        },
        benefits: {
          skillsGranted: ['basic_enchant', 'imbue_magic'],
          statBonuses: { wisdom: 2 },
        },
      },
      {
        tier: 2,
        name: 'Phù Phép Sư Thành Thạo',
        description: 'Phù phép sư có kinh nghiệm',
        requirements: {
          level: 20,
          professionLevel: 50,
        },
        benefits: {
          skillsGranted: ['advanced_enchant', 'mystic_infusion'],
          statBonuses: { wisdom: 5, intelligence: 3 },
        },
      },
      {
        tier: 3,
        name: 'Đại Phù Phép Sư',
        description: 'Bậc thầy phù phép',
        requirements: {
          level: 40,
          professionLevel: 100,
        },
        benefits: {
          skillsGranted: ['master_enchant', 'arcane_mastery'],
          statBonuses: { wisdom: 10, intelligence: 5 },
        },
      },
    ],
  },
  hunter: {
    baseName: 'Thợ Săn',
    tiers: [
      {
        tier: 1,
        name: 'Thợ Săn Tập Sự',
        description: 'Người mới học săn bắn',
        requirements: {
          level: 1,
        },
        benefits: {
          skillsGranted: ['track_prey', 'set_trap'],
          statBonuses: { agility: 2 },
        },
      },
      {
        tier: 2,
        name: 'Thợ Săn Thành Thạo',
        description: 'Thợ săn có kinh nghiệm',
        requirements: {
          level: 20,
          professionLevel: 50,
        },
        benefits: {
          skillsGranted: ['master_tracking', 'deadly_shot'],
          statBonuses: { agility: 5, perception: 3 },
        },
      },
      {
        tier: 3,
        name: 'Đại Thợ Săn',
        description: 'Bậc thầy săn bắn',
        requirements: {
          level: 40,
          professionLevel: 100,
        },
        benefits: {
          skillsGranted: ['beast_mastery', 'perfect_aim'],
          statBonuses: { agility: 10, perception: 5 },
        },
      },
    ],
  },
  miner: {
    baseName: 'Thợ Mỏ',
    tiers: [
      {
        tier: 1,
        name: 'Thợ Mỏ Tập Sự',
        description: 'Người mới học khai thác',
        requirements: {
          level: 1,
        },
        benefits: {
          skillsGranted: ['basic_mining', 'ore_detection'],
          statBonuses: { strength: 2 },
        },
      },
      {
        tier: 2,
        name: 'Thợ Mỏ Thành Thạo',
        description: 'Thợ mỏ có kinh nghiệm',
        requirements: {
          level: 20,
          professionLevel: 50,
        },
        benefits: {
          skillsGranted: ['advanced_mining', 'gem_extraction'],
          statBonuses: { strength: 5, endurance: 3 },
        },
      },
      {
        tier: 3,
        name: 'Đại Thợ Mỏ',
        description: 'Bậc thầy khai thác',
        requirements: {
          level: 40,
          professionLevel: 100,
        },
        benefits: {
          skillsGranted: ['master_mining', 'treasure_finder'],
          statBonuses: { strength: 10, endurance: 5 },
        },
      },
    ],
  },
  herbalist: {
    baseName: 'Dược Sư',
    tiers: [
      {
        tier: 1,
        name: 'Dược Sư Tập Sự',
        description: 'Người mới học thảo dược',
        requirements: {
          level: 1,
        },
        benefits: {
          skillsGranted: ['basic_herbalism', 'identify_herb'],
          statBonuses: { wisdom: 2 },
        },
      },
      {
        tier: 2,
        name: 'Dược Sư Thành Thạo',
        description: 'Dược sư có kinh nghiệm',
        requirements: {
          level: 20,
          professionLevel: 50,
        },
        benefits: {
          skillsGranted: ['advanced_herbalism', 'rare_herb_lore'],
          statBonuses: { wisdom: 5, intelligence: 3 },
        },
      },
      {
        tier: 3,
        name: 'Đại Dược Sư',
        description: 'Bậc thầy thảo dược',
        requirements: {
          level: 40,
          professionLevel: 100,
        },
        benefits: {
          skillsGranted: ['master_herbalism', 'elixir_creation'],
          statBonuses: { wisdom: 10, intelligence: 5 },
        },
      },
    ],
  },
};

export const professionStarterItems: Record<string, ProfessionStarterItem[]> = {
  blacksmith: [
    { 
      name: 'Búa rèn bạc', 
      type: 'weapon', 
      description: 'Búa rèn chất lượng cao', 
      value: 30, 
      stats: { damage: 8 } 
    },
    { 
      name: 'Găng tay da', 
      type: 'armor', 
      description: 'Găng tay bảo vệ tay', 
      value: 15, 
      stats: { defense: 3 } 
    }
  ],
  alchemist: [
    { 
      name: 'Bộ dụng cụ giả kim', 
      type: 'misc', 
      description: 'Dụng cụ pha chế cơ bản', 
      value: 25 
    },
    { 
      name: 'Bình máu trung', 
      type: 'consumable', 
      description: 'Hồi 30 HP', 
      value: 20, 
      stats: { healing: 30 } 
    }
  ],
  enchanter: [
    { 
      name: 'Gậy phép sư', 
      type: 'weapon', 
      description: 'Gậy tăng sức mạnh phép thuật', 
      value: 35, 
      stats: { damage: 6 } 
    },
    { 
      name: 'Đá mana', 
      type: 'misc', 
      description: 'Đá chứa năng lượng ma thuật', 
      value: 20 
    }
  ],
  hunter: [
    { 
      name: 'Dao săn', 
      type: 'weapon', 
      description: 'Dao sắc bén dùng để săn bắt', 
      value: 28, 
      stats: { damage: 9 } 
    },
    { 
      name: 'Túi da lớn', 
      type: 'misc', 
      description: 'Túi đựng chiến lợi phẩm', 
      value: 15 
    }
  ],
  miner: [
    { 
      name: 'Cuốc mỏ thép', 
      type: 'weapon', 
      description: 'Cuốc khai thác khoáng sản', 
      value: 25, 
      stats: { damage: 7 } 
    },
    { 
      name: 'Mũ mỏ', 
      type: 'armor', 
      description: 'Mũ bảo vệ đầu', 
      value: 18, 
      stats: { defense: 4 } 
    }
  ],
  herbalist: [
    { 
      name: 'Liềm thu hoạch', 
      type: 'weapon', 
      description: 'Liềm thu thập thảo mộc', 
      value: 22, 
      stats: { damage: 5 } 
    },
    { 
      name: 'Túi thảo mộc', 
      type: 'misc', 
      description: 'Túi đựng thảo mộc', 
      value: 12 
    }
  ]
};

export const validProfessions = ['blacksmith', 'alchemist', 'enchanter', 'hunter', 'miner', 'herbalist'] as const;

export type ProfessionType = typeof validProfessions[number];

// Map profession keys to Vietnamese display names
export const professionNames: Record<string, string> = {
  'blacksmith': 'Thợ Rèn',
  'alchemist': 'Giả Kim Sư',
  'enchanter': 'Phù Phép Sư',
  'hunter': 'Thợ Săn',
  'miner': 'Thợ Mỏ',
  'herbalist': 'Dược Sư'
};

// Get Vietnamese name for profession key, with fallback
export function getProfessionDisplayName(professionKey: string | null | undefined): string {
  if (!professionKey) return 'Lãng Khách';
  return professionNames[professionKey] || professionKey;
}
