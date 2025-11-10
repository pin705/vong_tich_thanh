import { RoomSchema } from '~/models/Room';
import { AgentSchema } from '~/models/Agent';
import { PlayerSchema } from '~/models/Player';
import { QuestSchema } from '~/models/Quest';
import { PlayerQuestSchema } from '~/models/PlayerQuest';

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
    
    // Get all quests to determine which NPCs have quests
    const allQuests = await QuestSchema.find().lean();
    
    // Get player's quest status
    const playerQuests = await PlayerQuestSchema.find({ playerId: session.user.id }).lean();
    const activeQuestIds = new Set(
      playerQuests
        .filter((pq: any) => pq.status === 'active' || pq.status === 'completed')
        .map((pq: any) => pq.questId.toString())
    );
    
    // Create a map of quest givers to their quest status
    const questGiverMap = new Map<string, { hasNewQuest: boolean; hasActiveQuest: boolean }>();
    allQuests.forEach((quest: any) => {
      const questId = quest._id.toString();
      const isActive = activeQuestIds.has(questId);
      const currentStatus = questGiverMap.get(quest.questGiver) || { hasNewQuest: false, hasActiveQuest: false };
      
      if (isActive) {
        currentStatus.hasActiveQuest = true;
      } else {
        // Check if player can accept this quest (level requirement, etc.)
        currentStatus.hasNewQuest = true;
      }
      
      questGiverMap.set(quest.questGiver, currentStatus);
    });

    // Map rooms to the world map format
    const worldRooms = rooms.map((room: any) => {
      const roomAgents = agents.filter((agent: any) => 
        agent.currentRoomId?.toString() === room._id.toString()
      );

      const npcs = roomAgents
        .filter((agent: any) => agent.type === 'npc')
        .map((agent: any) => {
          const questInfo = questGiverMap.get(agent.name);
          return {
            name: agent.name,
            hasNewQuest: questInfo?.hasNewQuest || false,
            hasActiveQuest: questInfo?.hasActiveQuest || false
          };
        });

      const mobs = roomAgents
        .filter((agent: any) => agent.type === 'mob')
        .map((agent: any) => agent.name);

      // Find boss (mob with high HP or special flag)
      const boss = roomAgents.find((agent: any) => 
        agent.type === 'mob' && agent.maxHp && agent.maxHp > 80
      );

      // Check if room has shop
      const hasShop = roomAgents.some((agent: any) => 
        agent.type === 'npc' && (
          agent.isVendor || 
          (agent.shopItems && agent.shopItems.length > 0) ||
          (agent.shopInventory && agent.shopInventory.length > 0)
        )
      );

      // Get room connections
      const connections = [];
      if (room.exits?.north) connections.push('Bắc');
      if (room.exits?.south) connections.push('Nam');
      if (room.exits?.east) connections.push('Đông');
      if (room.exits?.west) connections.push('Tây');
      if (room.exits?.up) connections.push('Lên');
      if (room.exits?.down) connections.push('Xuống');

      // Count quest indicators
      const hasNewQuests = npcs.some((npc: any) => npc.hasNewQuest);
      const hasActiveQuests = npcs.some((npc: any) => npc.hasActiveQuest);
      
      return {
        id: room._id.toString(),
        name: room.name,
        description: room.description,
        npcs,
        mobs,
        boss: boss?.name,
        shop: hasShop,
        hasNewQuests,
        hasActiveQuests,
        connections,
        isLocked: room.isLocked || false,
        unlockHint: room.unlockHint,
        requirements: room.requirements,
        visited: false, // Will be set based on player's visitedRooms
        isCurrent: false // Will be set below
      };
    });

    // Get current player to mark current room and visited rooms
    const player = await PlayerSchema.findById(session.user.id).lean();
    
    // Create a set of visited room IDs for faster lookup
    const visitedRoomIds = new Set(
      (player?.visitedRooms || []).map((id: any) => id.toString())
    );
    
    // Mark visited rooms
    worldRooms.forEach((room: any) => {
      room.visited = visitedRoomIds.has(room.id);
    });
    
    if (player?.currentRoomId) {
      const currentRoomId = player.currentRoomId.toString();
      const currentRoom = worldRooms.find((r: any) => r.id === currentRoomId);
      
      if (currentRoom) {
        currentRoom.isCurrent = true;
        // Current room should always be marked as visited
        currentRoom.visited = true;
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
