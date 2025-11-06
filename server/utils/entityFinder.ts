import { AgentSchema } from '../../models/Agent';
import { ItemSchema } from '../../models/Item';
import { gameState } from './gameState';

/**
 * Entity Finder Service - Centralized entity and item finding logic
 * Handles all operations for finding targets, items, and occupants in rooms
 */

/**
 * Find a target (Agent or Player) in a room by name
 * Supports numbered targeting like "chuột 1", "chuột 2"
 * @param room - The room object with agents array
 * @param targetName - The target name to search for
 * @returns The found agent or player ID, or null if not found
 */
export async function findTargetInRoom(
  room: any,
  targetName: string
): Promise<{ type: 'agent' | 'player'; entity: any } | null> {
  try {
    if (!targetName) {
      return null;
    }

    const lowerTarget = targetName.toLowerCase().trim();
    
    // Check if it's a numbered target (e.g., "chuột 1", "chuột 2")
    const numberMatch = lowerTarget.match(/^(.+?)\s+(\d+)$/);
    
    if (numberMatch) {
      const baseName = numberMatch[1];
      const targetNumber = parseInt(numberMatch[2], 10);
      
      // Find all agents matching the base name
      if (room.agents && room.agents.length > 0) {
        const agents = await AgentSchema.find({ _id: { $in: room.agents } });
        const matchingAgents = agents.filter((agent: any) => 
          agent.name.toLowerCase().includes(baseName)
        );
        
        if (matchingAgents.length >= targetNumber && targetNumber > 0) {
          return { type: 'agent', entity: matchingAgents[targetNumber - 1] };
        }
      }
      
      // Find all players matching the base name
      const playersInRoom = gameState.getPlayersInRoom(room._id.toString());
      const matchingPlayers = playersInRoom.filter((playerData: any) => 
        playerData.username?.toLowerCase().includes(baseName)
      );
      
      if (matchingPlayers.length >= targetNumber && targetNumber > 0) {
        return { type: 'player', entity: matchingPlayers[targetNumber - 1] };
      }
      
      return null;
    }
    
    // Regular search (first match)
    // Check agents first
    if (room.agents && room.agents.length > 0) {
      const agents = await AgentSchema.find({ _id: { $in: room.agents } });
      const foundAgent = agents.find((agent: any) => 
        agent.name.toLowerCase().includes(lowerTarget)
      );
      
      if (foundAgent) {
        return { type: 'agent', entity: foundAgent };
      }
    }
    
    // Check players
    const playersInRoom = gameState.getPlayersInRoom(room._id.toString());
    const foundPlayer = playersInRoom.find((playerData: any) => 
      playerData.username?.toLowerCase().includes(lowerTarget)
    );
    
    if (foundPlayer) {
      return { type: 'player', entity: foundPlayer };
    }
    
    return null;
  } catch (error) {
    console.error('Error finding target in room:', error);
    return null;
  }
}

/**
 * Find an item on the ground in a room
 * Supports numbered targeting like "kiếm 1", "kiếm 2"
 * @param room - The room object with items array
 * @param itemName - The item name to search for
 * @returns The found item or null if not found
 */
export async function findItemOnGround(
  room: any,
  itemName: string
): Promise<any | null> {
  try {
    if (!room || !room.items || room.items.length === 0 || !itemName) {
      return null;
    }

    const lowerItemName = itemName.toLowerCase().trim();
    
    // Check if it's a numbered target (e.g., "kiếm 1", "kiếm 2")
    const numberMatch = lowerItemName.match(/^(.+?)\s+(\d+)$/);
    
    if (numberMatch) {
      const baseName = numberMatch[1];
      const targetNumber = parseInt(numberMatch[2], 10);
      
      // Find all items matching the base name
      const items = await ItemSchema.find({ _id: { $in: room.items } });
      const matchingItems = items.filter((item: any) => 
        item.name.toLowerCase().includes(baseName)
      );
      
      if (matchingItems.length >= targetNumber && targetNumber > 0) {
        return matchingItems[targetNumber - 1];
      }
      
      return null;
    }
    
    // Regular search (first match)
    const items = await ItemSchema.find({ _id: { $in: room.items } });
    const foundItem = items.find((item: any) => 
      item.name.toLowerCase().includes(lowerItemName)
    );
    
    return foundItem || null;
  } catch (error) {
    console.error('Error finding item on ground:', error);
    return null;
  }
}

/**
 * Find an item in a player's inventory
 * Supports numbered targeting like "thuốc 1", "thuốc 2"
 * @param inventory - Array of item IDs in player's inventory
 * @param itemName - The item name to search for
 * @returns The found item or null if not found
 */
export async function findItemInInventory(
  inventory: any[],
  itemName: string
): Promise<any | null> {
  try {
    if (!inventory || inventory.length === 0 || !itemName) {
      return null;
    }

    const lowerItemName = itemName.toLowerCase().trim();
    
    // Check if it's a numbered target (e.g., "thuốc 1", "thuốc 2")
    const numberMatch = lowerItemName.match(/^(.+?)\s+(\d+)$/);
    
    if (numberMatch) {
      const baseName = numberMatch[1];
      const targetNumber = parseInt(numberMatch[2], 10);
      
      // Find all items matching the base name
      const items = await ItemSchema.find({ _id: { $in: inventory } });
      const matchingItems = items.filter((item: any) => 
        item.name.toLowerCase().includes(baseName)
      );
      
      if (matchingItems.length >= targetNumber && targetNumber > 0) {
        return matchingItems[targetNumber - 1];
      }
      
      return null;
    }
    
    // Regular search (first match)
    const items = await ItemSchema.find({ _id: { $in: inventory } });
    const foundItem = items.find((item: any) => 
      item.name.toLowerCase().includes(lowerItemName)
    );
    
    return foundItem || null;
  } catch (error) {
    console.error('Error finding item in inventory:', error);
    return null;
  }
}

/**
 * Get all occupants (agents and players) in a room
 * @param room - The room object
 * @returns Object containing arrays of agents and players
 */
export async function getOccupants(
  room: any
): Promise<{ agents: any[]; players: any[] }> {
  try {
    const agents = room.agents && room.agents.length > 0
      ? await AgentSchema.find({ _id: { $in: room.agents } })
      : [];
    
    const players = gameState.getPlayersInRoom(room._id.toString());
    
    return { agents, players };
  } catch (error) {
    console.error('Error getting room occupants:', error);
    return { agents: [], players: [] };
  }
}

/**
 * Get a formatted list of all occupants in a room
 * @param room - The room object
 * @returns Array of formatted strings
 */
export async function getFormattedOccupants(
  room: any
): Promise<string[]> {
  try {
    const { agents, players } = await getOccupants(room);
    const result: string[] = [];
    
    if (agents.length > 0) {
      result.push('Sinh vật:');
      agents.forEach((agent: any) => {
        const status = agent.inCombat ? ' [COMBAT]' : '';
        result.push(`  - [${agent.name}]${status}`);
      });
    }
    
    if (players.length > 0) {
      result.push('Người chơi:');
      players.forEach((player: any) => {
        const status = player.inCombat ? ' [COMBAT]' : '';
        result.push(`  - ${player.username}${status}`);
      });
    }
    
    if (agents.length === 0 && players.length === 0) {
      result.push('(Không có ai ở đây)');
    }
    
    return result;
  } catch (error) {
    console.error('Error formatting occupants:', error);
    return ['(Lỗi khi tải thông tin)'];
  }
}

/**
 * Count entities by name in a room (useful for numbered targeting)
 * @param room - The room object
 * @param entityName - The entity name to count
 * @returns Number of matching entities
 */
export async function countEntitiesByName(
  room: any,
  entityName: string
): Promise<number> {
  try {
    const lowerName = entityName.toLowerCase().trim();
    let count = 0;
    
    // Count agents
    if (room.agents && room.agents.length > 0) {
      const agents = await AgentSchema.find({ _id: { $in: room.agents } });
      count += agents.filter((agent: any) => 
        agent.name.toLowerCase().includes(lowerName)
      ).length;
    }
    
    // Count players
    const playersInRoom = gameState.getPlayersInRoom(room._id.toString());
    count += playersInRoom.filter((playerData: any) => 
      playerData.username?.toLowerCase().includes(lowerName)
    ).length;
    
    return count;
  } catch (error) {
    console.error('Error counting entities by name:', error);
    return 0;
  }
}
