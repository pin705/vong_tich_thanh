import { AgentSchema } from '~/models/Agent';
import { PlayerSchema } from '~/models/Player';

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event);
    if (!session?.user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      });
    }

    // Get player to find their current room
    const player = await PlayerSchema.findById(session.user.id).lean();
    if (!player) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Player not found'
      });
    }

    if (!player.currentRoom) {
      return {
        success: true,
        npcs: [],
        mobs: []
      };
    }

    // Get all agents (NPCs and monsters) in the current room
    const agents = await AgentSchema.find({
      currentRoom: player.currentRoom,
      hp: { $gt: 0 } // Only alive agents
    })
    .select('name type agentType level hp maxHp description isVendor shopType')
    .lean();

    // Separate NPCs and monsters
    const npcs = agents
      .filter(agent => agent.type === 'npc')
      .map(agent => ({
        id: agent._id.toString(),
        name: agent.name,
        level: agent.level,
        description: agent.description,
        isVendor: agent.isVendor,
        shopType: agent.shopType
      }));

    const mobs = agents
      .filter(agent => agent.type === 'mob')
      .map(agent => ({
        id: agent._id.toString(),
        name: agent.name,
        level: agent.level,
        hp: agent.hp,
        maxHp: agent.maxHp,
        description: agent.description
      }));

    return {
      success: true,
      npcs,
      mobs
    };
  } catch (error) {
    console.error('Error fetching room occupants:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch room occupants'
    });
  }
});
