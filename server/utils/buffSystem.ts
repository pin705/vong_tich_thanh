import { BuffSchema } from '../../models/Buff';

/**
 * Get the active EXP multiplier for a player
 * @param playerId - The player's ID
 * @returns The EXP multiplier (1 if no buff active, >1 if buff active)
 */
export async function getExpMultiplier(playerId: string): Promise<number> {
  try {
    // Find active EXP_BOOST buff for this player
    const activeBuff = await BuffSchema.findOne({
      playerId,
      type: 'EXP_BOOST',
      expiresAt: { $gt: new Date() }
    });
    
    if (activeBuff) {
      return activeBuff.multiplier;
    }
    
    return 1; // No buff, return 1x multiplier
  } catch (error) {
    console.error('Error getting EXP multiplier:', error);
    return 1; // Return default multiplier on error
  }
}

/**
 * Apply EXP buff multiplier to experience points
 * @param playerId - The player's ID
 * @param baseExp - The base experience points
 * @returns The modified experience points after applying multiplier
 */
export async function applyExpBuff(playerId: string, baseExp: number): Promise<{ exp: number, multiplier: number }> {
  const multiplier = await getExpMultiplier(playerId);
  const finalExp = Math.floor(baseExp * multiplier);
  
  return {
    exp: finalExp,
    multiplier
  };
}

/**
 * Clean up expired buffs for a player
 * @param playerId - The player's ID
 */
export async function cleanupExpiredBuffs(playerId: string): Promise<void> {
  try {
    await BuffSchema.deleteMany({
      playerId,
      expiresAt: { $lte: new Date() }
    });
  } catch (error) {
    console.error('Error cleaning up expired buffs:', error);
  }
}

export interface ActiveBuff {
  _id: string;
  playerId: string;
  type: 'EXP_BOOST' | 'DAMAGE_BOOST' | 'DEFENSE_BOOST' | 'HEALING_BOOST';
  multiplier: number;
  expiresAt: Date;
}

/**
 * Get all active buffs for a player
 * @param playerId - The player's ID
 * @returns Array of active buffs
 */
export async function getActiveBuffs(playerId: string): Promise<ActiveBuff[]> {
  try {
    const buffs = await BuffSchema.find({
      playerId,
      expiresAt: { $gt: new Date() }
    }).lean();
    
    return buffs as ActiveBuff[];
  } catch (error) {
    console.error('Error getting active buffs:', error);
    return [];
  }
}
