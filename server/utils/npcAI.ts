import { AgentSchema } from '../../models/Agent';
import { RoomSchema } from '../../models/Room';
import { PlayerSchema } from '../../models/Player';
import { gameState } from './gameState';
import { startCombat } from './combatSystem';
import { broadcastRoomOccupants } from '../routes/ws';

// AI tick interval - process agent behaviors every 10 seconds
const AI_TICK_INTERVAL = 10000;

// Default max instances for agent spawning
const DEFAULT_MOB_MAX_INSTANCES = 3;
const DEFAULT_AGENT_MAX_INSTANCES = 1;

// Wander behavior - agent moves randomly to adjacent rooms
async function processWanderBehavior(agent: any): Promise<void> {
  try {
    // Don't wander if in combat
    if (agent.inCombat) {
      return;
    }

    const currentRoom = await RoomSchema.findById(agent.currentRoomId);
    if (!currentRoom) {
      return;
    }

    // Get available exits
    const exits = ['north', 'south', 'east', 'west', 'up', 'down']
      .filter(dir => (currentRoom.exits as any)[dir]);

    if (exits.length === 0) {
      return;
    }

    // 30% chance to move each tick
    if (Math.random() < 0.3) {
      const randomExit = exits[Math.floor(Math.random() * exits.length)];
      const nextRoomId = (currentRoom.exits as any)[randomExit];
      const nextRoom = await RoomSchema.findById(nextRoomId);

      if (!nextRoom) {
        return;
      }

      const directionNames: { [key: string]: string } = {
        'north': 'bắc', 'south': 'nam', 'east': 'đông',
        'west': 'tây', 'up': 'lên', 'down': 'xuống'
      };

      // Remove from current room
      currentRoom.agents = currentRoom.agents.filter((id: any) => id.toString() !== agent._id.toString());
      await currentRoom.save();

      // Add to next room
      nextRoom.agents.push(agent._id);
      await nextRoom.save();

      // Update agent location
      agent.currentRoomId = nextRoom._id;
      await agent.save();

      // Broadcast to both rooms
      gameState.broadcastToRoom(
        currentRoom._id.toString(),
        {
          type: 'normal',
          message: `[${agent.name}] di chuyển về phía ${directionNames[randomExit]}.`
        }
      );

      gameState.broadcastToRoom(
        nextRoom._id.toString(),
        {
          type: 'accent',
          message: `[${agent.name}] xuất hiện từ phía ${directionNames[randomExit]}.`
        }
      );
    }
  } catch (error) {
    console.error('Error in wander behavior:', error);
  }
}

// Aggressive behavior - agent attacks players in the same room
async function processAggressiveBehavior(agent: any): Promise<void> {
  try {
    // Don't attack if already in combat
    if (agent.inCombat) {
      return;
    }

    const currentRoom = await RoomSchema.findById(agent.currentRoomId);
    if (!currentRoom) {
      return;
    }

    // Get players in the same room
    const playersInRoom = gameState.getPlayersInRoom(currentRoom._id.toString());
    
    // Filter out players already in combat
    const availablePlayers = [];
    for (const playerInfo of playersInRoom) {
      const player = await PlayerSchema.findById(playerInfo.id);
      if (player && !player.inCombat) {
        availablePlayers.push({ info: playerInfo, doc: player });
      }
    }

    if (availablePlayers.length === 0) {
      return;
    }

    // Pick a random player to attack
    const target = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];

    // Broadcast attack message
    gameState.broadcastToRoom(
      currentRoom._id.toString(),
      {
        type: 'error',
        message: `[${agent.name}] lao vào tấn công [${target.info.username}]!`
      }
    );

    // Start combat
    await startCombat(target.doc._id.toString(), agent._id.toString());

  } catch (error) {
    console.error('Error in aggressive behavior:', error);
  }
}

// Patrol behavior - agent follows a predefined route
async function processPatrolBehavior(agent: any): Promise<void> {
  try {
    // Don't patrol if in combat
    if (agent.inCombat) {
      return;
    }

    if (!agent.patrolRoute || agent.patrolRoute.length < 2) {
      // No patrol route defined, fall back to passive
      return;
    }

    // Find current position in patrol route
    const currentIndex = agent.patrolRoute.findIndex((id: any) => 
      id.toString() === agent.currentRoomId.toString()
    );

    if (currentIndex === -1) {
      // Not on patrol route, return to start
      agent.currentRoomId = agent.patrolRoute[0];
      await agent.save();
      return;
    }

    // Move to next position in route (loop back to start if at end)
    const nextIndex = (currentIndex + 1) % agent.patrolRoute.length;
    const nextRoomId = agent.patrolRoute[nextIndex];
    const nextRoom = await RoomSchema.findById(nextRoomId);

    if (!nextRoom) {
      return;
    }

    const currentRoom = await RoomSchema.findById(agent.currentRoomId);
    if (!currentRoom) {
      return;
    }

    // 40% chance to move each tick (slower than wander)
    if (Math.random() < 0.4) {
      // Remove from current room
      currentRoom.agents = currentRoom.agents.filter((id: any) => id.toString() !== agent._id.toString());
      await currentRoom.save();

      // Add to next room
      nextRoom.agents.push(agent._id);
      await nextRoom.save();

      // Update agent location
      agent.currentRoomId = nextRoom._id;
      await agent.save();

      // Broadcast to both rooms
      gameState.broadcastToRoom(
        currentRoom._id.toString(),
        {
          type: 'normal',
          message: `[${agent.name}] di chuyển đi.`
        }
      );

      gameState.broadcastToRoom(
        nextRoom._id.toString(),
        {
          type: 'accent',
          message: `[${agent.name}] đi vào từ một hướng khác.`
        }
      );
    }
  } catch (error) {
    console.error('Error in patrol behavior:', error);
  }
}

// Process all agent behaviors
async function processAgentBehaviors(): Promise<void> {
  try {
    // Get all agents
    const agents = await AgentSchema.find({});

    for (const agent of agents) {
      switch (agent.behavior) {
        case 'wander':
          await processWanderBehavior(agent);
          break;
        case 'aggressive':
          await processAggressiveBehavior(agent);
          break;
        case 'patrol':
          await processPatrolBehavior(agent);
          break;
        case 'passive':
        default:
          // Passive agents don't do anything
          break;
      }
    }
  } catch (error) {
    console.error('Error processing agent behaviors:', error);
  }
}

// Respawn system for defeated agents
interface RespawnTimer {
  agentData: any;
  roomId: string;
  timer: NodeJS.Timeout;
  respawnTime: Date; // When the agent will respawn
}

const respawnTimers: Map<string, RespawnTimer> = new Map();

// Get respawn information for a room
export function getRoomRespawns(roomId: string): Array<{ name: string; respawnTime: Date; type: string }> {
  const respawns: Array<{ name: string; respawnTime: Date; type: string }> = [];
  
  for (const [agentId, timerData] of respawnTimers.entries()) {
    if (timerData.roomId === roomId) {
      respawns.push({
        name: timerData.agentData.name,
        respawnTime: timerData.respawnTime,
        type: timerData.agentData.type
      });
    }
  }
  
  return respawns;
}

// Schedule agent respawn - uses room's respawnTimeSeconds or defaults to 5 seconds
// Can spawn multiple instances based on maxInstances setting
export async function scheduleAgentRespawn(agentData: any, roomId: string): Promise<void> {
  // Get room to check respawn time
  const room = await RoomSchema.findById(roomId);
  const respawnSeconds = room?.respawnTimeSeconds || 5; // Default 5 seconds
  const RESPAWN_TIME = respawnSeconds * 1000;
  const respawnTime = new Date(Date.now() + RESPAWN_TIME);
  
  const timer = setTimeout(async () => {
    try {
      // Get max instances for this agent type (default to 3 for mobs, 1 for others)
      const maxInstances = agentData.maxInstances || (agentData.type === 'mob' ? DEFAULT_MOB_MAX_INSTANCES : DEFAULT_AGENT_MAX_INSTANCES);
      
      // Count how many instances of this agent (by name and type) already exist in the room
      const room = await RoomSchema.findById(roomId);
      if (!room) {
        console.error(`Room ${roomId} not found for respawn`);
        return;
      }
      
      const existingAgents = await AgentSchema.find({ 
        _id: { $in: room.agents },
        name: agentData.name,
        type: agentData.type
      });
      
      const currentCount = existingAgents.length;
      
      // Only spawn if below max instances
      if (currentCount >= maxInstances) {
        console.log(`Agent ${agentData.name} already at max instances (${currentCount}/${maxInstances}) in room ${roomId}`);
        respawnTimers.delete(agentData._id.toString());
        return;
      }
      
      // Create new agent with same data
      const newAgent = await AgentSchema.create({
        name: agentData.name,
        description: agentData.description,
        type: agentData.type,
        currentRoomId: roomId,
        hp: agentData.maxHp,
        maxHp: agentData.maxHp,
        level: agentData.level,
        damage: agentData.damage,
        behavior: agentData.behavior,
        patrolRoute: agentData.patrolRoute,
        dialogue: agentData.dialogue,
        shopItems: agentData.shopItems,
        loot: agentData.loot,
        lootTable: agentData.lootTable,
        experience: agentData.experience,
        agentType: agentData.agentType,
        mechanics: agentData.mechanics,
        faction: agentData.faction,
        isVendor: agentData.isVendor,
        shopInventory: agentData.shopInventory,
        shopType: agentData.shopType,
        maxInstances: agentData.maxInstances,
        inCombat: false
      });

      // Add to current room
      if (room) {
        room.agents.push(newAgent._id);
        await room.save();

        // Broadcast respawn message
        gameState.broadcastToRoom(
          room._id.toString(),
          {
            type: 'accent',
            message: `[${newAgent.name}] xuất hiện!`
          }
        );
        
        // Update room occupants for all players in the room
        await broadcastRoomOccupants(room._id.toString());
        
        // If boss, send world alert
        if (agentData.agentType === 'boss') {
          const { broadcastService } = await import('./broadcastService');
          broadcastService.sendWorldAlert(`*** [${newAgent.name}] đã xuất hiện tại [${room.name}]! ***`);
        }
      }

      // Remove from respawn timers
      respawnTimers.delete(agentData._id.toString());

      console.log(`Agent ${agentData.name} respawned in room ${roomId}`);
    } catch (error) {
      console.error('Error respawning agent:', error);
    }
  }, RESPAWN_TIME);

  respawnTimers.set(agentData._id.toString(), {
    agentData,
    roomId,
    timer,
    respawnTime
  });
}

// AI tick interval timer
let aiTickInterval: NodeJS.Timeout | null = null;

// Start AI system
export function startAISystem(): void {
  if (aiTickInterval) {
    console.log('AI system already running');
    return;
  }

  console.log('Starting AI system...');
  
  // Process immediately, then every AI_TICK_INTERVAL
  processAgentBehaviors();
  
  aiTickInterval = setInterval(() => {
    processAgentBehaviors();
  }, AI_TICK_INTERVAL);

  console.log('AI system started');
}

// Stop AI system
export function stopAISystem(): void {
  if (aiTickInterval) {
    clearInterval(aiTickInterval);
    aiTickInterval = null;
    console.log('AI system stopped');
  }

  // Clear all respawn timers
  respawnTimers.forEach(({ timer }) => clearTimeout(timer));
  respawnTimers.clear();
}

// Export for use in other modules
export { processAgentBehaviors };
