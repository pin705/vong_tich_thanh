/**
 * Calculate player power score based on stats
 * Similar to PoW (Power over Weight) concept but adapted for game stats
 * 
 * @param player - Player object from database (Mongoose lean object or document)
 * @returns Calculated power score as an integer
 */
export function calculatePlayerPower(player: any): number {
  let power = 0;

  // Base stats contribution
  power += player.level * 10; // Level weight: 10 points per level
  power += player.maxHp * 0.5; // HP weight: 0.5 points per max HP
  
  // Equipment stats contribution
  if (player.equipment) {
    // Each equipped item contributes based on its stats
    const equipmentSlots = ['helmet', 'chest', 'legs', 'boots', 'weapon'];
    for (const slot of equipmentSlots) {
      const item = player.equipment[slot];
      if (item && item.stats) {
        power += (item.stats.attack || 0) * 2; // Attack weight: 2 points
        power += (item.stats.defense || 0) * 1.5; // Defense weight: 1.5 points
        power += (item.stats.hp || 0) * 0.3; // HP bonus weight: 0.3 points
        power += (item.stats.critChance || 0) * 5; // Crit chance weight: 5 points per %
        power += (item.stats.critDamage || 0) * 3; // Crit damage weight: 3 points per %
      }
    }
  }
  
  // Profession contribution
  if (player.profession) {
    power += (player.professionLevel || 0) * 5; // Profession level: 5 points per level
  }
  
  // Talent points spent (assuming they're used)
  const talentPointsSpent = calculateTalentPointsSpent(player);
  power += talentPointsSpent * 3; // Talent weight: 3 points per talent point
  
  // Skill points contribution
  const skillLevel = calculateTotalSkillLevel(player);
  power += skillLevel * 4; // Skill weight: 4 points per skill level
  
  // Guild contribution (small bonus for being in a guild)
  if (player.guild) {
    power += 50; // Guild membership bonus
  }
  
  return Math.floor(power);
}

/**
 * Calculate total talent points spent by a player
 */
function calculateTalentPointsSpent(player: any): number {
  if (!player.talents || !(player.talents instanceof Map)) {
    return 0;
  }
  
  let spent = 0;
  for (const [, value] of player.talents) {
    spent += value;
  }
  
  return spent;
}

/**
 * Calculate total skill upgrade levels
 */
function calculateTotalSkillLevel(player: any): number {
  if (!player.learnedSkills || !(player.learnedSkills instanceof Map)) {
    return 0;
  }
  
  let totalLevel = 0;
  for (const [, level] of player.learnedSkills) {
    totalLevel += level;
  }
  
  return totalLevel;
}

/**
 * Calculate dungeon power score based on highest floor reached
 */
export function calculateDungeonPower(player: any): number {
  const highestFloor = player.dungeonProgress?.highestFloor || 1;
  
  // Exponential scaling for dungeon power
  // Higher floors = much more power
  return Math.floor(highestFloor * highestFloor * 0.5);
}
