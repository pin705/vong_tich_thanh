// Phase 21: Player Stats Calculation Service
// Handles stat calculation including equipment bonuses and set bonuses

import { PlayerSchema } from '../../models/Player';
import { ItemSchema } from '../../models/Item';
import { TalentSchema } from '../../models/Talent';
import { PetSchema } from '../../models/Pet';

interface PlayerStats {
  baseHp: number;
  baseMaxHp: number;
  baseDamage: number;
  baseDefense: number;
  // Equipment bonuses
  strength: number;
  agility: number;
  hp: number;
  // Total stats
  totalHp: number;
  totalMaxHp: number;
  totalDamage: number;
  totalDefense: number;
  // Set bonuses info
  setBonus: {
    setKey: string;
    setName: string;
    equippedCount: number;
    activeBonus: any[];
  }[];
}

/**
 * Calculate player stats including equipment and set bonuses
 */
export async function calculateStats(playerId: string): Promise<PlayerStats> {
  const player = await PlayerSchema.findById(playerId)
    .populate('equipment.helmet')
    .populate('equipment.chest')
    .populate('equipment.legs')
    .populate('equipment.boots')
    .populate('equipment.weapon');

  if (!player) {
    throw new Error('Player not found');
  }

  // Base stats from player level and class
  const baseHp = player.hp || 100;
  const baseMaxHp = player.maxHp || 100;
  const baseDamage = 5 + player.level;
  const baseDefense = 0;

  // Equipment bonuses
  let equipmentStats = {
    strength: 0,
    agility: 0,
    hp: 0,
    damage: 0,
    defense: 0
  };

  // Track set pieces
  const setCounts = new Map<string, { count: number; items: any[] }>();

  // Collect all equipment item IDs that need gem population
  const equipmentItemIds: any[] = [];
  const equipmentSlots = ['helmet', 'chest', 'legs', 'boots', 'weapon'];
  
  for (const slot of equipmentSlots) {
    const item = (player.equipment as any)?.[slot];
    if (item && item._id) {
      equipmentItemIds.push(item._id);
    }
  }

  // Populate all socketed gems in a single query to avoid N+1 problem
  const populatedEquipment = await ItemSchema.find({ _id: { $in: equipmentItemIds } })
    .populate('socketedGems');
  const equipmentMap = new Map(populatedEquipment.map(item => [item._id.toString(), item]));

  // Collect stats from all equipment slots
  for (const slot of equipmentSlots) {
    const item = (player.equipment as any)?.[slot];
    if (item) {
      // Add item stats
      if (item.stats) {
        equipmentStats.strength += item.stats.strength || 0;
        equipmentStats.agility += item.stats.agility || 0;
        equipmentStats.hp += item.stats.hp || 0;
        equipmentStats.damage += item.stats.damage || 0;
        equipmentStats.defense += item.stats.defense || 0;
      }

      // Add socketed gems bonuses (use pre-populated data)
      const populatedItem = equipmentMap.get(item._id.toString());
      if (populatedItem && populatedItem.socketedGems && populatedItem.socketedGems.length > 0) {
        for (const gem of populatedItem.socketedGems) {
          if (!gem) continue;
          
          const gemValue = (gem as any).gemValue || 0;
          const gemType = (gem as any).gemType;
          
          switch (gemType) {
            case 'attack':
              equipmentStats.damage += gemValue;
              break;
            case 'hp':
              equipmentStats.hp += gemValue;
              break;
            case 'defense':
              equipmentStats.defense += gemValue;
              break;
            case 'critChance':
            case 'critDamage':
            case 'dodge':
            case 'lifesteal':
              // These stats would need additional tracking in equipmentStats
              // For now, they are not applied but could be added in future
              break;
          }
        }
      }

      // Track set pieces
      if (item.setKey) {
        if (!setCounts.has(item.setKey)) {
          setCounts.set(item.setKey, { count: 0, items: [] });
        }
        const setData = setCounts.get(item.setKey)!;
        setData.count++;
        setData.items.push(item);
      }
    }
  }

  // Apply set bonuses
  const activeSets: any[] = [];
  for (const [setKey, setData] of setCounts.entries()) {
    const { count, items } = setData;
    
    // Find an item with setBonus definition (usually on chest piece)
    const itemWithBonus = items.find((item: any) => item.setBonus && item.setBonus.length > 0);
    if (!itemWithBonus) continue;

    const setName = getSetName(setKey);
    const activeBonus: any[] = [];

    // Check each set bonus tier
    for (const bonus of itemWithBonus.setBonus) {
      if (count >= bonus.requiredPieces) {
        activeBonus.push({
          requiredPieces: bonus.requiredPieces,
          stats: bonus.stats
        });

        // Apply bonus stats (Map from MongoDB)
        const bonusStats = bonus.stats;
        for (const [stat, value] of bonusStats.entries()) {
          if (stat in equipmentStats) {
            (equipmentStats as any)[stat] += value;
          }
        }
      }
    }

    if (activeBonus.length > 0) {
      activeSets.push({
        setKey,
        setName,
        equippedCount: count,
        activeBonus
      });
    }
  }

  // Apply talent bonuses
  let talentStats = {
    hp: 0,
    damage: 0,
    defense: 0,
    critChance: 0,
    critDamage: 0,
    dodge: 0,
    lifesteal: 0
  };

  if (player.allocatedTalents && player.allocatedTalents.size > 0) {
    // Get all talent IDs
    const talentIds = Array.from(player.allocatedTalents.keys());
    const talents = await TalentSchema.find({ _id: { $in: talentIds } });
    
    // Apply talent effects
    for (const talent of talents) {
      const rank = player.allocatedTalents.get(talent._id.toString()) || 0;
      if (rank > 0 && talent.effects) {
        // Apply each effect multiplied by rank
        for (const [effectKey, effectValue] of talent.effects.entries()) {
          const totalValue = effectValue * rank;
          
          switch (effectKey) {
            case 'hp':
            case 'maxHp':
              talentStats.hp += totalValue;
              break;
            case 'damage':
            case 'attack':
              talentStats.damage += totalValue;
              break;
            case 'defense':
              talentStats.defense += totalValue;
              break;
            case 'critChance':
              talentStats.critChance += totalValue;
              break;
            case 'critDamage':
              talentStats.critDamage += totalValue;
              break;
            case 'dodge':
              talentStats.dodge += totalValue;
              break;
            case 'lifesteal':
              talentStats.lifesteal += totalValue;
              break;
          }
        }
      }
    }
  }

  // Calculate total stats (before title and pet bonuses)
  let totalHp = baseHp + equipmentStats.hp + talentStats.hp;
  let totalMaxHp = baseMaxHp + equipmentStats.hp + talentStats.hp;
  let totalDamage = baseDamage + equipmentStats.damage + equipmentStats.strength + talentStats.damage;
  let totalDefense = baseDefense + equipmentStats.defense + Math.floor(equipmentStats.agility * 0.5) + talentStats.defense;

  // Apply pet bonuses if player has an active pet
  if (player.activePetId) {
    const activePet = await PetSchema.findById(player.activePetId);
    if (activePet && activePet.currentStats) {
      // Pets contribute a portion of their stats to the player
      // 20% of pet HP, 30% of pet attack, 25% of pet defense
      const petHpBonus = Math.floor(activePet.currentStats.maxHp * 0.2);
      const petAttackBonus = Math.floor(activePet.currentStats.attack * 0.3);
      const petDefenseBonus = Math.floor(activePet.currentStats.defense * 0.25);
      
      totalHp += petHpBonus;
      totalMaxHp += petHpBonus;
      totalDamage += petAttackBonus;
      totalDefense += petDefenseBonus;
    }
  }

  // Apply title bonuses if player has an active title
  if (player.activeTitleKey && player.unlockedTitles) {
    const activeTitle = player.unlockedTitles.find((t: any) => t.key === player.activeTitleKey);
    if (activeTitle && activeTitle.stats) {
      // Apply title stat bonuses
      if (activeTitle.stats.hp) {
        totalHp += activeTitle.stats.hp;
        totalMaxHp += activeTitle.stats.hp;
      }
      if (activeTitle.stats.attack) {
        totalDamage += activeTitle.stats.attack;
      }
      if (activeTitle.stats.defense) {
        totalDefense += activeTitle.stats.defense;
      }
      // Note: Other title stats (critChance, critDamage, dodge, lifesteal) 
      // would need to be added to the PlayerStats interface if we want to track them
    }
  }

  return {
    baseHp,
    baseMaxHp,
    baseDamage,
    baseDefense,
    strength: equipmentStats.strength,
    agility: equipmentStats.agility,
    hp: equipmentStats.hp,
    totalHp,
    totalMaxHp,
    totalDamage,
    totalDefense,
    setBonus: activeSets
  };
}

/**
 * Get human-readable set name
 */
function getSetName(setKey: string): string {
  const setNames: { [key: string]: string } = {
    'set_lang_khach_cap_10': 'Set Lãng Khách',
    // Add more sets as needed
  };
  return setNames[setKey] || setKey;
}

/**
 * Apply calculated stats to player and send notification about set bonuses
 */
export async function applyStatsToPlayer(playerId: string): Promise<{ success: boolean; messages: string[] }> {
  const stats = await calculateStats(playerId);
  const player = await PlayerSchema.findById(playerId);
  
  if (!player) {
    return { success: false, messages: ['Player not found'] };
  }

  const messages: string[] = [];

  // Update player stats
  const hpPercentage = player.hp / player.maxHp;
  player.maxHp = stats.totalMaxHp;
  player.hp = Math.floor(player.maxHp * hpPercentage); // Maintain HP percentage

  await player.save();

  // Generate set bonus messages
  for (const set of stats.setBonus) {
    const bonusDescriptions = set.activeBonus.map((bonus: any) => {
      const statDescriptions: string[] = [];
      
      for (const [stat, value] of bonus.stats.entries()) {
        statDescriptions.push(`+${value} ${stat}`);
      }
      return `(${bonus.requiredPieces}/${set.equippedCount}): ${statDescriptions.join(', ')}`;
    }).join(' ');

    messages.push(`[!] Kích hoạt Set Bonus: [${set.setName}] ${bonusDescriptions}`);
  }

  return { success: true, messages };
}

/**
 * Recalculate and apply player stats (alias for applyStatsToPlayer)
 * Used after equipping/unequipping items or titles
 */
export async function recalculateStats(playerId: string): Promise<{ success: boolean; messages: string[] }> {
  return await applyStatsToPlayer(playerId);
}
