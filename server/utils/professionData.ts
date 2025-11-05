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
