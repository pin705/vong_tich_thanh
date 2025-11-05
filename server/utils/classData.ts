// Class definitions for Phase 12

export interface ClassInfo {
  id: string;
  name: string;
  nameVi: string;
  role: string;
  resourceName: string;
  resourceNameVi: string;
  description: string;
  maxResource: number;
  resourceRegen: number; // per tick
  utilitySkills: string[];
}

export const CLASSES: Record<string, ClassInfo> = {
  mutant_warrior: {
    id: 'mutant_warrior',
    name: 'Mutant Warrior',
    nameVi: 'Chiến Binh Biến Dị',
    role: 'Tank',
    resourceName: 'Rage',
    resourceNameVi: 'Nộ',
    description: 'Chịu đòn, bảo vệ đồng đội. HP và Giáp cao.',
    maxResource: 100,
    resourceRegen: 5, // Gains rage when taking/dealing damage
    utilitySkills: ['Taunt', 'Intimidate'],
  },
  rune_historian: {
    id: 'rune_historian',
    name: 'Rune Historian',
    nameVi: 'Sử Gia Cổ Ngữ',
    role: 'Healer/Support',
    resourceName: 'Mana',
    resourceNameVi: 'Mana',
    description: 'Hồi máu, Buff, Debuff.',
    maxResource: 100,
    resourceRegen: 2, // Slow regen
    utilitySkills: ['Decipher'],
  },
  stalker: {
    id: 'stalker',
    name: 'Stalker',
    nameVi: 'Kẻ Lùng Sục',
    role: 'Melee DPS',
    resourceName: 'Energy',
    resourceNameVi: 'Năng Lượng',
    description: 'Sát thương vật lý tầm gần, dồn sát thương, nhanh nhẹn.',
    maxResource: 100,
    resourceRegen: 10, // Fast regen
    utilitySkills: ['Stealth', 'Pick Lock'],
  },
  scrap_engineer: {
    id: 'scrap_engineer',
    name: 'Scrap Engineer',
    nameVi: 'Kỹ Sư Phế Liệu',
    role: 'Ranged DPS',
    resourceName: 'Scrap',
    resourceNameVi: 'Linh Kiện',
    description: 'Sát thương tầm xa, triệu hồi đệ (Robot, Trụ).',
    maxResource: 10,
    resourceRegen: 0, // No auto-regen, must salvage
    utilitySkills: ['Salvage'],
  },
};

export function getClassInfo(classId: string): ClassInfo | null {
  return CLASSES[classId] || null;
}

export function getResourceBar(current: number, max: number, width: number = 10): string {
  const filled = Math.floor((current / max) * width);
  const empty = width - filled;
  return '[' + '|'.repeat(filled) + '-'.repeat(empty) + ']';
}
