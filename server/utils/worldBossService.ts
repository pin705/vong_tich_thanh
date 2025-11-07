// World Boss Service - Manages world boss events, spawning, and contribution tracking

import { AgentSchema } from '../../models/Agent';
import { PlayerSchema } from '../../models/Player';
import { RoomSchema } from '../../models/Room';
import { ItemSchema } from '../../models/Item';
import { gameState } from './gameState';

// World boss contribution tracking
interface BossContribution {
  playerId: string;
  playerName: string;
  damageDealt: number;
}

interface WorldBossState {
  agentId: string;
  roomId: string;
  contributions: Map<string, BossContribution>;
  startTime: number;
  active: boolean;
}

// Active world boss states
const activeWorldBosses: Map<string, WorldBossState> = new Map();

/**
 * Track damage contribution to a world boss
 */
export function trackBossContribution(
  agentId: string,
  playerId: string,
  playerName: string,
  damage: number
): void {
  const bossState = activeWorldBosses.get(agentId);
  if (!bossState) return;

  const existing = bossState.contributions.get(playerId);
  if (existing) {
    existing.damageDealt += damage;
  } else {
    bossState.contributions.set(playerId, {
      playerId,
      playerName,
      damageDealt: damage,
    });
  }
}

/**
 * Initialize a world boss for contribution tracking
 */
export function initializeWorldBoss(agentId: string, roomId: string): void {
  activeWorldBosses.set(agentId, {
    agentId,
    roomId,
    contributions: new Map(),
    startTime: Date.now(),
    active: true,
  });
}

/**
 * Check if an agent is a world boss
 */
export function isWorldBoss(agentId: string): boolean {
  return activeWorldBosses.has(agentId);
}

/**
 * Distribute rewards to all contributors when world boss dies
 */
export async function distributeWorldBossRewards(agentId: string): Promise<void> {
  const bossState = activeWorldBosses.get(agentId);
  if (!bossState || !bossState.active) return;

  bossState.active = false;

  const agent = await AgentSchema.findById(agentId);
  if (!agent) return;

  // Sort contributors by damage
  const contributors = Array.from(bossState.contributions.values())
    .sort((a, b) => b.damageDealt - a.damageDealt);

  if (contributors.length === 0) {
    // Clean up
    activeWorldBosses.delete(agentId);
    return;
  }

  // Announce results
  gameState.broadcastToAll({
    type: 'critical',
    message: `╔═══════════════════════════════════════════╗`,
  });
  gameState.broadcastToAll({
    type: 'critical',
    message: `║   [${agent.name}] ĐÃ BỊ HẠ GỤC!          ║`,
  });
  gameState.broadcastToAll({
    type: 'critical',
    message: `╚═══════════════════════════════════════════╝`,
  });

  // Top 3 contributors get special recognition
  const topCount = Math.min(3, contributors.length);
  for (let i = 0; i < topCount; i++) {
    const contributor = contributors[i];
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
    gameState.broadcastToAll({
      type: 'xp',
      message: `${medal} Top ${i + 1}: [${contributor.playerName}] - ${contributor.damageDealt.toLocaleString()} sát thương`,
    });
  }

  // Distribute rewards to all contributors
  for (const contributor of contributors) {
    try {
      const player = await PlayerSchema.findById(contributor.playerId);
      if (!player) continue;

      // Calculate rewards based on contribution
      const contributionPercent = contributor.damageDealt / 
        contributors.reduce((sum, c) => sum + c.damageDealt, 0);
      
      // Base rewards
      const baseGold = 500;
      const baseMedals = 5;
      
      // Top 3 get bonus
      const topBonus = contributor === contributors[0] ? 2.0 : 
                       contributor === contributors[1] ? 1.5 : 
                       contributor === contributors[2] ? 1.2 : 1.0;

      const goldReward = Math.floor(baseGold * contributionPercent * topBonus);
      const medalReward = Math.floor(baseMedals * contributionPercent * topBonus);

      // Grant rewards
      player.gold = (player.gold || 0) + goldReward;
      player.braveryMedals = (player.braveryMedals || 0) + medalReward;

      // Top contributor gets legendary crafting material
      if (contributor === contributors[0]) {
        const legendaryCore = await ItemSchema.findOne({ itemKey: 'ancient_robot_core' });
        if (legendaryCore) {
          player.inventory.push(legendaryCore._id);
        }
      }

      await player.save();

      // Notify player
      const playerObj = gameState.getPlayer(contributor.playerId);
      if (playerObj?.ws) {
        playerObj.ws.send(JSON.stringify({
          type: 'xp',
          message: `Bạn nhận được: ${goldReward} vàng, ${medalReward} [Huy Chương Dũng Cảm]`,
        }));
        
        if (contributor === contributors[0]) {
          playerObj.ws.send(JSON.stringify({
            type: 'critical',
            message: `Bạn nhận được [Lõi Robot Cổ Đại] - Nguyên liệu chế tạo huyền thoại!`,
          }));
        }
      }
    } catch (error) {
      console.error('Error distributing world boss reward:', error);
    }
  }

  // Clean up
  activeWorldBosses.delete(agentId);
}

/**
 * Spawn a world boss at a specific location
 */
export async function spawnWorldBoss(roomName: string, bossKey: string): Promise<string | null> {
  try {
    const room = await RoomSchema.findOne({ name: roomName });
    if (!room) {
      console.error(`Room not found: ${roomName}`);
      return null;
    }

    // Check if a boss already exists in this room
    const existingBoss = await AgentSchema.findOne({
      currentRoomId: room._id,
      agentType: 'boss',
    });
    if (existingBoss) {
      return null; // Boss already exists
    }

    // Create world boss based on key
    let bossData: any;
    if (bossKey === 'colossal_warmech') {
      bossData = {
        name: 'Cỗ Máy Chiến Tranh Khổng Lồ',
        description: 'Một cỗ máy chiến tranh khổng lồ từ thời cổ đại, tràn đầy sức mạnh hủy diệt.',
        type: 'mob',
        agentType: 'boss',
        currentRoomId: room._id,
        hp: 100000,
        maxHp: 100000,
        level: 50,
        damage: 200,
        experience: 10000,
        behavior: 'aggressive',
        mechanics: [
          { trigger: 'health_below_50', action: 'enrage', cooldown: 0 },
          { trigger: 'timer_30s', action: 'cast_stomp', cooldown: 30 },
        ],
      };
    } else {
      // Default boss template
      bossData = {
        name: 'Boss Thế Giới',
        description: 'Một kẻ địch mạnh mẽ đe dọa thế giới.',
        type: 'mob',
        agentType: 'boss',
        currentRoomId: room._id,
        hp: 50000,
        maxHp: 50000,
        level: 40,
        damage: 150,
        experience: 5000,
        behavior: 'aggressive',
      };
    }

    const boss = await AgentSchema.create(bossData);
    room.agents.push(boss._id);
    await room.save();

    // Initialize world boss tracking
    initializeWorldBoss(boss._id.toString(), room._id.toString());

    // Broadcast announcement
    gameState.broadcastToAll({
      type: 'critical',
      message: `╔═══════════════════════════════════════════╗`,
    });
    gameState.broadcastToAll({
      type: 'critical',
      message: `║  ⚠️  WORLD BOSS ĐÃ XUẤT HIỆN! ⚠️         ║`,
    });
    gameState.broadcastToAll({
      type: 'critical',
      message: `║  [${bossData.name}]`,
    });
    gameState.broadcastToAll({
      type: 'critical',
      message: `║  Địa điểm: [${room.name}]`,
    });
    gameState.broadcastToAll({
      type: 'critical',
      message: `╚═══════════════════════════════════════════╝`,
    });

    return boss._id.toString();
  } catch (error) {
    console.error('Error spawning world boss:', error);
    return null;
  }
}

/**
 * Get contribution statistics for a world boss
 */
export function getBossContributions(agentId: string): BossContribution[] {
  const bossState = activeWorldBosses.get(agentId);
  if (!bossState) return [];
  
  return Array.from(bossState.contributions.values())
    .sort((a, b) => b.damageDealt - a.damageDealt);
}
