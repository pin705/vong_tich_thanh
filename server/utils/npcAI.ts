import { AgentSchema } from '../../models/Agent';
import { RoomSchema } from '../../models/Room';
import { PlayerSchema } from '../../models/Player';
import { gameState } from './gameState';
import { startCombat } from './combatSystem';

// AI tick interval - process agent behaviors every 10 seconds
const AI_TICK_INTERVAL = 10000;

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
          type: 'normal',
          message: `[${agent.name}] đi vào.`
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
}

const respawnTimers: Map<string, RespawnTimer> = new Map();

// Schedule agent respawn (5 minutes after death)
export function scheduleAgentRespawn(agentData: any, roomId: string): void {
  const RESPAWN_TIME = 5 * 60 * 1000; // 5 minutes
  
  const timer = setTimeout(async () => {
    try {
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
        experience: agentData.experience,
        inCombat: false
      });

      // Add to room
      const room = await RoomSchema.findById(roomId);
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
    timer
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
