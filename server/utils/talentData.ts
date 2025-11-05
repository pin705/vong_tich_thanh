// Talent tree definitions for Phase 12

export interface TalentNode {
  id: string;
  name: string;
  description: string;
  branch: string;
  tier: number;
  maxRank: number;
  pointsInBranchRequired: number;
  levelRequired: number;
  prerequisiteTalents?: string[];
  effects: Record<string, any>;
  grantsSkill?: string;
}

export interface TalentBranch {
  id: string;
  name: string;
  description: string;
  talents: TalentNode[];
}

export const SCRAP_ENGINEER_TALENTS: TalentBranch[] = [
  {
    id: 'gunner',
    name: 'Pháo Thủ',
    description: 'Tập trung vào sát thương súng',
    talents: [
      {
        id: 'gun_damage_1',
        name: 'Sát Thương Súng +',
        description: 'Tăng 5% sát thương súng',
        branch: 'gunner',
        tier: 1,
        maxRank: 5,
        pointsInBranchRequired: 0,
        levelRequired: 10,
        effects: { gunDamage: 5 }, // 5% per rank
      },
      {
        id: 'armor_piercing',
        name: 'Bắn Xuyên Giáp',
        description: 'Học kỹ năng Bắn Xuyên Giáp',
        branch: 'gunner',
        tier: 2,
        maxRank: 1,
        pointsInBranchRequired: 5,
        levelRequired: 20,
        prerequisiteTalents: ['gun_damage_1'],
        effects: {},
        grantsSkill: 'armor_piercing_shot',
      },
    ],
  },
  {
    id: 'mechanic',
    name: 'Thợ Máy',
    description: 'Tập trung vào Robot và Trụ',
    talents: [
      {
        id: 'turret_durability',
        name: 'Trụ Bền Hơn',
        description: 'Trụ có thêm 10% HP',
        branch: 'mechanic',
        tier: 1,
        maxRank: 3,
        pointsInBranchRequired: 0,
        levelRequired: 10,
        effects: { turretHp: 10 }, // 10% per rank
      },
      {
        id: 'guardian_robot',
        name: 'Robot Hộ Vệ',
        description: 'Triệu hồi Robot Hộ Vệ',
        branch: 'mechanic',
        tier: 2,
        maxRank: 1,
        pointsInBranchRequired: 3,
        levelRequired: 20,
        prerequisiteTalents: ['turret_durability'],
        effects: {},
        grantsSkill: 'summon_guardian',
      },
    ],
  },
  {
    id: 'demolition',
    name: 'Chuyên Gia Thuốc Nổ',
    description: 'Tập trung vào lựu đạn và bẫy',
    talents: [
      {
        id: 'grenade_damage',
        name: 'Sát Thương Lựu Đạn +',
        description: 'Tăng 10% sát thương lựu đạn',
        branch: 'demolition',
        tier: 1,
        maxRank: 5,
        pointsInBranchRequired: 0,
        levelRequired: 10,
        effects: { grenadeDamage: 10 }, // 10% per rank
      },
      {
        id: 'mine_trap',
        name: 'Đặt Bẫy Mìn',
        description: 'Học kỹ năng Đặt Bẫy Mìn',
        branch: 'demolition',
        tier: 2,
        maxRank: 1,
        pointsInBranchRequired: 5,
        levelRequired: 20,
        prerequisiteTalents: ['grenade_damage'],
        effects: {},
        grantsSkill: 'place_mine',
      },
    ],
  },
];

export const MUTANT_WARRIOR_TALENTS: TalentBranch[] = [
  {
    id: 'berserker',
    name: 'Cuồng Chiến',
    description: 'Tập trung vào sát thương và tốc độ tấn công',
    talents: [
      {
        id: 'rage_damage',
        name: 'Sát Thương Cuồng Nộ +',
        description: 'Tăng 5% sát thương khi có Nộ đầy',
        branch: 'berserker',
        tier: 1,
        maxRank: 5,
        pointsInBranchRequired: 0,
        levelRequired: 10,
        effects: { rageDamage: 5 },
      },
      {
        id: 'rampage',
        name: 'Cuồng Loạn',
        description: 'Học kỹ năng Cuồng Loạn',
        branch: 'berserker',
        tier: 2,
        maxRank: 1,
        pointsInBranchRequired: 5,
        levelRequired: 20,
        prerequisiteTalents: ['rage_damage'],
        effects: {},
        grantsSkill: 'rampage',
      },
    ],
  },
  {
    id: 'guardian',
    name: 'Vệ Binh',
    description: 'Tập trung vào phòng thủ và bảo vệ',
    talents: [
      {
        id: 'armor_boost',
        name: 'Giáp Cứng +',
        description: 'Tăng 5% giáp',
        branch: 'guardian',
        tier: 1,
        maxRank: 5,
        pointsInBranchRequired: 0,
        levelRequired: 10,
        effects: { armor: 5 },
      },
      {
        id: 'shield_wall',
        name: 'Tường Khiên',
        description: 'Học kỹ năng Tường Khiên',
        branch: 'guardian',
        tier: 2,
        maxRank: 1,
        pointsInBranchRequired: 5,
        levelRequired: 20,
        prerequisiteTalents: ['armor_boost'],
        effects: {},
        grantsSkill: 'shield_wall',
      },
    ],
  },
  {
    id: 'intimidation',
    name: 'Hù Dọa',
    description: 'Tập trung vào kiểm soát và làm suy yếu kẻ thù',
    talents: [
      {
        id: 'fear_duration',
        name: 'Hù Dọa Lâu Hơn +',
        description: 'Tăng 20% thời gian hù dọa',
        branch: 'intimidation',
        tier: 1,
        maxRank: 3,
        pointsInBranchRequired: 0,
        levelRequired: 10,
        effects: { fearDuration: 20 },
      },
      {
        id: 'terrifying_roar',
        name: 'Gầm Kinh Hồn',
        description: 'Học kỹ năng Gầm Kinh Hồn',
        branch: 'intimidation',
        tier: 2,
        maxRank: 1,
        pointsInBranchRequired: 3,
        levelRequired: 20,
        prerequisiteTalents: ['fear_duration'],
        effects: {},
        grantsSkill: 'terrifying_roar',
      },
    ],
  },
];

export function getTalentsByClass(classId: string): TalentBranch[] {
  switch (classId) {
    case 'scrap_engineer':
      return SCRAP_ENGINEER_TALENTS;
    case 'mutant_warrior':
      return MUTANT_WARRIOR_TALENTS;
    // Add other classes later
    default:
      return [];
  }
}

export function getTalentById(classId: string, talentId: string): TalentNode | null {
  const branches = getTalentsByClass(classId);
  for (const branch of branches) {
    const talent = branch.talents.find(t => t.id === talentId);
    if (talent) return talent;
  }
  return null;
}
