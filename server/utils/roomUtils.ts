import { ItemSchema } from '../../models/Item';
import { AgentSchema } from '../../models/Agent';
import { gameState } from './gameState';

/**
 * Format room description with all relevant information
 * Used by both command handlers and room display logic
 */
export async function formatRoomDescription(room: any, player: any): Promise<string[]> {
  const responses: string[] = [];
  
  // Room name
  responses.push(`[${room.name}]`);
  
  // Room description
  responses.push(room.description);
  responses.push('');
  
  // Exits
  const exits = [];
  if (room.exits.north) exits.push('bắc');
  if (room.exits.south) exits.push('nam');
  if (room.exits.east) exits.push('đông');
  if (room.exits.west) exits.push('tây');
  if (room.exits.up) exits.push('lên');
  if (room.exits.down) exits.push('xuống');
  
  if (exits.length > 0) {
    responses.push(`Lối ra: [${exits.join(', ')}]`);
  } else {
    responses.push('Không có lối ra rõ ràng.');
  }
  
  // Items in room
  if (room.items && room.items.length > 0) {
    const items = await ItemSchema.find({ _id: { $in: room.items } });
    if (items.length > 0) {
      responses.push('Bạn thấy:');
      items.forEach((item: any) => {
        responses.push(`  - [${item.name}]`);
      });
    }
  }
  
  // Agents in room
  if (room.agents && room.agents.length > 0) {
    const agents = await AgentSchema.find({ _id: { $in: room.agents } });
    agents.forEach((agent: any) => {
      responses.push(`Một [${agent.name}] đang đứng đây.`);
    });
  }
  
  // Other players in room
  const playersInRoom = gameState.getPlayersInRoom(room._id.toString());
  const otherPlayers = playersInRoom.filter(p => p.id !== player._id.toString());
  if (otherPlayers.length > 0) {
    otherPlayers.forEach(p => {
      responses.push(`[${p.username}] đang ở đây.`);
    });
  }
  
  return responses;
}

/**
 * Direction mappings for the MUD
 */
export const DIRECTION_MAP: Record<string, string> = {
  'n': 'north', 'bắc': 'north', 'north': 'north',
  's': 'south', 'nam': 'south', 'south': 'south',
  'e': 'east', 'đông': 'east', 'east': 'east',
  'w': 'west', 'tây': 'west', 'west': 'west',
  'u': 'up', 'lên': 'up', 'up': 'up',
  'd': 'down', 'xuống': 'down', 'down': 'down',
};

/**
 * Vietnamese names for directions
 */
export const DIRECTION_NAMES_VI: Record<string, string> = {
  'north': 'bắc',
  'south': 'nam',
  'east': 'đông',
  'west': 'tây',
  'up': 'lên',
  'down': 'xuống'
};

/**
 * Get opposite direction (in Vietnamese)
 */
export function getOppositeDirection(direction: string): string {
  // Normalize to English first
  const normalized = DIRECTION_MAP[direction] || direction;
  
  const opposites: Record<string, string> = {
    'north': 'nam',
    'south': 'bắc',
    'east': 'tây',
    'west': 'đông',
    'up': 'dưới',
    'down': 'trên'
  };
  
  return opposites[normalized] || direction;
}
