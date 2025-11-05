import { RoomSchema } from '~/models/Room';
import { AgentSchema } from '~/models/Agent';

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event);
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    // Get all rooms from the database
    const rooms = await RoomSchema.find().lean();
    
    // Get all agents to populate NPC/mob info
    const agents = await AgentSchema.find().lean();

    // Map rooms to the world map format
    const worldRooms = rooms.map((room: any) => {
      const roomAgents = agents.filter((agent: any) => 
        agent.currentRoomId?.toString() === room._id.toString()
      );

      const npcs = roomAgents
        .filter((agent: any) => agent.type === 'npc')
        .map((agent: any) => agent.name);

      const mobs = roomAgents
        .filter((agent: any) => agent.type === 'mob')
        .map((agent: any) => agent.name);

      // Find boss (mob with high HP or special flag)
      const boss = roomAgents.find((agent: any) => 
        agent.type === 'mob' && agent.maxHp && agent.maxHp > 80
      );

      // Check if room has shop
      const hasShop = roomAgents.some((agent: any) => 
        agent.type === 'npc' && agent.shopItems && agent.shopItems.length > 0
      );

      // Get room connections
      const connections = [];
      if (room.exits.north) connections.push('Bắc');
      if (room.exits.south) connections.push('Nam');
      if (room.exits.east) connections.push('Đông');
      if (room.exits.west) connections.push('Tây');
      if (room.exits.up) connections.push('Lên');
      if (room.exits.down) connections.push('Xuống');

      return {
        id: room._id.toString(),
        name: room.name,
        description: room.description,
        npcs,
        mobs,
        boss: boss?.name,
        shop: hasShop,
        connections,
        visited: true, // TODO: Track per player
        isCurrent: false // Will be set below
      };
    });

    // Get current player to mark current room
    const PlayerSchema = await import('~/models/Player').then(m => m.PlayerSchema);
    const player = await PlayerSchema.findById(session.user.id).lean();
    
    if (player?.currentRoomId) {
      const currentRoomId = player.currentRoomId.toString();
      const currentRoom = worldRooms.find((r: any) => r.id === currentRoomId);
      
      if (currentRoom) {
        currentRoom.isCurrent = true;
        return {
          success: true,
          rooms: worldRooms,
          currentRoomName: currentRoom.name
        };
      }
    }

    return {
      success: true,
      rooms: worldRooms,
      currentRoomName: 'Không rõ'
    };
  } catch (error) {
    console.error('Error loading world map:', error);
    return { 
      success: false, 
      message: 'Failed to load world map',
      rooms: [],
      currentRoomName: 'Không rõ'
    };
  }
});
