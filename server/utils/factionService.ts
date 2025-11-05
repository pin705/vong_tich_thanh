import { PlayerFactionSchema } from '../../models/PlayerFaction';
import { FactionSchema } from '../../models/Faction';

// Update player's reputation with a faction
export async function updateReputation(
  playerId: string,
  factionName: string,
  amount: number
): Promise<{ success: boolean; message: string; newReputation?: number }> {
  try {
    // Find or create player faction record
    let playerFaction = await PlayerFactionSchema.findOne({
      player: playerId,
      factionName
    });

    if (!playerFaction) {
      playerFaction = await PlayerFactionSchema.create({
        player: playerId,
        factionName,
        reputation: 0
      });
    }

    // Update reputation
    const oldReputation = playerFaction.reputation;
    playerFaction.reputation += amount;
    await playerFaction.save();

    // Get faction info to check for allied/opposing factions
    const faction = await FactionSchema.findOne({ name: factionName });
    
    if (faction) {
      // Update allied factions (smaller gain)
      if (faction.alliedFactions && faction.alliedFactions.length > 0) {
        const alliedAmount = Math.floor(amount * 0.25); // 25% of the gain
        for (const alliedFaction of faction.alliedFactions) {
          await updateReputation(playerId, alliedFaction, alliedAmount);
        }
      }

      // Update opposing factions (equal loss)
      if (faction.opposingFactions && faction.opposingFactions.length > 0) {
        const opposingAmount = -Math.abs(amount); // Negative reputation
        for (const opposingFaction of faction.opposingFactions) {
          await updateReputation(playerId, opposingFaction, opposingAmount);
        }
      }
    }

    // Determine reputation level
    const getReputationLevel = (rep: number): string => {
      if (rep >= 6000) return 'Tôn Kính';
      if (rep >= 3000) return 'Danh Dự';
      if (rep >= 500) return 'Thân Thiện';
      if (rep >= 0) return 'Trung Lập';
      if (rep >= -500) return 'Không Thân Thiện';
      if (rep >= -3000) return 'Thù Địch';
      return 'Căm Ghét';
    };

    const oldLevel = getReputationLevel(oldReputation);
    const newLevel = getReputationLevel(playerFaction.reputation);

    let message = `${factionName}: ${amount > 0 ? '+' : ''}${amount} danh vọng`;
    if (oldLevel !== newLevel) {
      message += ` (${newLevel})`;
    }

    return {
      success: true,
      message,
      newReputation: playerFaction.reputation
    };
  } catch (error) {
    console.error('Error updating reputation:', error);
    return {
      success: false,
      message: 'Lỗi khi cập nhật danh vọng.'
    };
  }
}

// Get player's reputation with a faction
export async function getReputation(
  playerId: string,
  factionName: string
): Promise<number> {
  try {
    const playerFaction = await PlayerFactionSchema.findOne({
      player: playerId,
      factionName
    });

    return playerFaction ? playerFaction.reputation : 0;
  } catch (error) {
    console.error('Error getting reputation:', error);
    return 0;
  }
}

// Check if player can access NPC with reputation requirement
export async function canAccessNPC(
  playerId: string,
  factionName: string,
  minReputation: number
): Promise<{ canAccess: boolean; message?: string }> {
  const reputation = await getReputation(playerId, factionName);
  
  if (reputation >= minReputation) {
    return { canAccess: true };
  }

  return {
    canAccess: false,
    message: `Cần ít nhất ${minReputation} danh vọng với ${factionName}.`
  };
}
