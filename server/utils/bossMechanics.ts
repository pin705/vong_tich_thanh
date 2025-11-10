// Boss Mechanics System - Handles scripted boss abilities and mechanics
import { AgentSchema } from '../../models/Agent';
import { PlayerSchema } from '../../models/Player';
import { RoomSchema } from '../../models/Room';
import { gameState } from './gameState';

// Constants for boss mechanics
const STOMP_BASE_DAMAGE = 150;
const HEAL_PERCENTAGE = 0.2; // 20% of max HP
const STARTING_ROOM_NAME = 'Cổng Thành Cũ';

// Interface for mechanic definitions
export interface BossMechanic {
  trigger: 'health_below_50' | 'health_below_25' | 'timer_30s' | 'timer_45s' | 'timer_60s';
  action: 'enrage' | 'summon_minions' | 'cast_stomp' | 'heal_self';
  cooldown?: number; // Cooldown in seconds
}

// Interface for boss state tracking
interface BossState {
  agentId: string;
  lastMechanicTime: Map<string, number>; // mechanic action -> timestamp
  mechanicsTriggered: Set<string>; // one-time mechanics that have been triggered
  enraged: boolean;
  castingState?: {
    spellName: string;
    startTime: number;
    castTime: number;
    action: () => Promise<void>;
  };
}

// Map to track boss states
const bossStates: Map<string, BossState> = new Map();

// Get or create boss state
function getBossState(agentId: string): BossState {
  if (!bossStates.has(agentId)) {
    bossStates.set(agentId, {
      agentId,
      lastMechanicTime: new Map(),
      mechanicsTriggered: new Set(),
      enraged: false,
    });
  }
  return bossStates.get(agentId)!;
}

// Clear boss state (when boss dies)
export function clearBossState(agentId: string): void {
  bossStates.delete(agentId);
}

// Check if mechanic is on cooldown
function isOnCooldown(bossState: BossState, action: string, cooldownSeconds: number): boolean {
  const lastTime = bossState.lastMechanicTime.get(action) || 0;
  const now = Date.now();
  return (now - lastTime) < (cooldownSeconds * 1000);
}

// Update mechanic cooldown
function updateCooldown(bossState: BossState, action: string): void {
  bossState.lastMechanicTime.set(action, Date.now());
}

// Enrage mechanic - increases boss damage by 50%
async function executeEnrage(agent: any, roomId: string): Promise<void> {
  const bossState = getBossState(agent._id.toString());
  
  if (bossState.enraged) {
    return; // Already enraged
  }
  
  bossState.enraged = true;
  agent.damage = Math.floor(agent.damage * 1.5);
  await agent.save();
  
  // Broadcast warning to room
  gameState.broadcastToRoom(
    roomId,
    {
      type: 'error',
      message: `[${agent.name}] gầm lên giận dữ, sát thương của nó tăng vọt!`
    }
  );
}

// Summon Minions mechanic
async function executeSummonMinions(agent: any, roomId: string): Promise<void> {
  const room = await RoomSchema.findById(roomId);
  if (!room) return;
  
  // Create 2 minion agents
  const minionCount = 2;
  for (let i = 0; i < minionCount; i++) {
    const minion = await AgentSchema.create({
      name: `Lính Canh ${agent.name}`,
      description: `Một lính canh được triệu hồi bởi ${agent.name}`,
      type: 'mob',
      currentRoomId: roomId,
      hp: Math.floor(agent.maxHp * 0.3),
      maxHp: Math.floor(agent.maxHp * 0.3),
      level: Math.max(1, agent.level - 2),
      damage: Math.floor(agent.damage * 0.4),
      behavior: 'aggressive',
      loot: [],
      experience: Math.floor(agent.experience * 0.2),
      agentType: 'mob',
    });
    
    room.agents.push(minion._id);
  }
  
  await room.save();
  
  // Broadcast summon message
  gameState.broadcastToRoom(
    roomId,
    {
      type: 'error',
      message: `[${agent.name}] triệu hồi thêm lính canh!`
    }
  );
}

// Start casting AoE Stomp
async function startCastStomp(agent: any, roomId: string): Promise<void> {
  const bossState = getBossState(agent._id.toString());
  const castTime = 3000; // 3 seconds
  const spellName = 'Dậm Đất Hủy Diệt';
  
  // Notify all players in the room about the cast
  const playersInRoom = gameState.getPlayersInRoom(roomId);
  playersInRoom.forEach(player => {
    if (player.ws) {
      player.ws.send(JSON.stringify({
        type: 'boss_cast_start',
        targetId: agent._id.toString(),
        targetName: agent.name,
        spellName,
        castTime
      }));
    }
  });
  
  // Broadcast warning message
  gameState.broadcastToRoom(
    roomId,
    {
      type: 'accent',
      message: `[${agent.name}] bắt đầu niệm chú [${spellName}]!`
    }
  );
  
  // Store casting state
  bossState.castingState = {
    spellName,
    startTime: Date.now(),
    castTime,
    action: async () => {
      await executeStomp(agent, roomId);
    }
  };
}

// Execute AoE Stomp damage
async function executeStomp(agent: any, roomId: string): Promise<void> {
  // Calculate damage based on boss stats
  const damage = Math.floor(STOMP_BASE_DAMAGE + (agent.level * 10));
  const playersInRoom = gameState.getPlayersInRoom(roomId);
  
  // Broadcast execution message
  gameState.broadcastToRoom(
    roomId,
    {
      type: 'error',
      message: `[${agent.name}] DẬM XUỐNG! Tất cả mọi người mất ${damage} sát thương!`
    }
  );
  
  // Apply damage to all players in room
  for (const playerInfo of playersInRoom) {
    const player = await PlayerSchema.findById(playerInfo.id);
    if (!player) continue;
    
    player.hp = Math.max(0, player.hp - damage);
    await player.save();
    
    // Notify player
    if (playerInfo.ws) {
      playerInfo.ws.send(JSON.stringify({
        type: 'damage_in',
        message: `Bạn mất ${damage} sát thương từ [${agent.name}]!`
      }));
      
      // Send updated player state
      playerInfo.ws.send(JSON.stringify({
        type: 'player_state',
        payload: {
          name: player.username,
          hp: player.hp,
          maxHp: player.maxHp,
          level: player.level,
          inCombat: player.inCombat
        }
      }));
    }
    
    // Check if player died
    if (player.hp <= 0) {
      player.inCombat = false;
      player.combatTarget = undefined;
      
      // Respawn at starting location
      const startingRoom = await RoomSchema.findOne({ name: STARTING_ROOM_NAME });
      if (startingRoom) {
        player.currentRoomId = startingRoom._id;
        gameState.updatePlayerRoom(player._id.toString(), startingRoom._id.toString());
      } else {
        // Fallback: If starting room not found, find any room to respawn in
        console.error(`Starting room '${STARTING_ROOM_NAME}' not found, using fallback`);
        const fallbackRoom = await RoomSchema.findOne({});
        if (fallbackRoom) {
          player.currentRoomId = fallbackRoom._id;
          gameState.updatePlayerRoom(player._id.toString(), fallbackRoom._id.toString());
        } else {
          console.error('No rooms found in database for player respawn!');
        }
      }
      
      // Restore some HP
      player.hp = Math.floor(player.maxHp * 0.5);
      await player.save();
      
      if (playerInfo.ws) {
        playerInfo.ws.send(JSON.stringify({
          type: 'error',
          message: 'Bạn đã bị đánh bại! Bạn tỉnh dậy tại Cổng Thành Cũ...'
        }));
      }
      
      gameState.broadcastToRoom(
        roomId,
        {
          type: 'normal',
          message: `[${player.username}] đã bị đánh bại bởi [${agent.name}]!`
        },
        player._id.toString()
      );
    }
  }
  
  // Clear casting state
  const bossState = getBossState(agent._id.toString());
  bossState.castingState = undefined;
}

// Check and execute casting completion
async function processCasting(agent: any, roomId: string): Promise<void> {
  const bossState = getBossState(agent._id.toString());
  
  if (!bossState.castingState) return;
  
  const now = Date.now();
  const elapsed = now - bossState.castingState.startTime;
  
  // Check if cast is complete
  if (elapsed >= bossState.castingState.castTime) {
    await bossState.castingState.action();
  }
}

// Check if trigger condition is met
function checkTrigger(agent: any, mechanic: BossMechanic, bossState: BossState): boolean {
  const trigger = mechanic.trigger;
  
  // Guard against undefined trigger
  if (!trigger) {
    console.error('Boss mechanic has undefined trigger:', mechanic);
    return false;
  }
  
  // Health-based triggers (one-time)
  if (trigger === 'health_below_50') {
    const hpPercent = agent.hp / agent.maxHp;
    return hpPercent < 0.5 && !bossState.mechanicsTriggered.has(trigger);
  }
  
  if (trigger === 'health_below_25') {
    const hpPercent = agent.hp / agent.maxHp;
    return hpPercent < 0.25 && !bossState.mechanicsTriggered.has(trigger);
  }
  
  // Timer-based triggers (repeating with cooldown)
  if (trigger.startsWith('timer_')) {
    const cooldown = mechanic.cooldown || 30; // Default 30s cooldown
    const lastTime = bossState.lastMechanicTime.get(mechanic.action) || 0;
    
    // If never executed, execute immediately on first combat tick
    if (lastTime === 0) {
      return true;
    }
    
    // Otherwise check if cooldown has elapsed
    return !isOnCooldown(bossState, mechanic.action, cooldown);
  }
  
  return false;
}

// Execute mechanic action
async function executeMechanic(agent: any, mechanic: BossMechanic, roomId: string): Promise<void> {
  const bossState = getBossState(agent._id.toString());
  
  switch (mechanic.action) {
    case 'enrage':
      await executeEnrage(agent, roomId);
      bossState.mechanicsTriggered.add(mechanic.trigger); // One-time trigger
      break;
      
    case 'summon_minions':
      await executeSummonMinions(agent, roomId);
      updateCooldown(bossState, mechanic.action);
      break;
      
    case 'cast_stomp':
      await startCastStomp(agent, roomId);
      updateCooldown(bossState, mechanic.action);
      break;
      
    case 'heal_self':
      // Heal based on percentage constant
      const healAmount = Math.floor(agent.maxHp * HEAL_PERCENTAGE);
      agent.hp = Math.min(agent.maxHp, agent.hp + healAmount);
      await agent.save();
      
      gameState.broadcastToRoom(
        roomId,
        {
          type: 'accent',
          message: `[${agent.name}] hồi phục ${healAmount} HP!`
        }
      );
      updateCooldown(bossState, mechanic.action);
      break;
  }
}

// Main function to process all boss mechanics
export async function processBossMechanics(): Promise<void> {
  try {
    // Get all boss agents in combat
    const bosses = await AgentSchema.find({ 
      agentType: 'boss',
      inCombat: true 
    });
    
    for (const boss of bosses) {
      const bossState = getBossState(boss._id.toString());
      
      // Process any ongoing casting
      await processCasting(boss, boss.currentRoomId.toString());
      
      // Check mechanics if not currently casting
      if (!bossState.castingState && boss.mechanics && Array.isArray(boss.mechanics)) {
        for (const mechanic of boss.mechanics as BossMechanic[]) {
          if (checkTrigger(boss, mechanic, bossState)) {
            await executeMechanic(boss, mechanic, boss.currentRoomId.toString());
            // Only execute one mechanic per tick to avoid spam
            break;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error processing boss mechanics:', error);
  }
}

// Export for use in other modules
export { getBossState };
