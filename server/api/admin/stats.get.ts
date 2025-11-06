import { PlayerSchema } from '~/models/Player';
import { ItemSchema } from '~/models/Item';
import { RoomSchema } from '~/models/Room';
import { AgentSchema } from '~/models/Agent';
import { gameState } from '~/server/utils/gameState';

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event);
    if (!session?.user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Not authenticated'
      });
    }

    // Get counts from database
    const [totalPlayers, totalItems, totalRooms, totalAgents] = await Promise.all([
      PlayerSchema.countDocuments(),
      ItemSchema.countDocuments(),
      RoomSchema.countDocuments(),
      AgentSchema.countDocuments()
    ]);

    // Get online players from game state
    const onlinePlayers = gameState.getAllPlayers().length;

    return {
      success: true,
      stats: {
        totalPlayers,
        onlinePlayers,
        totalItems,
        totalRooms,
        totalAgents
      }
    };
  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to fetch admin stats'
    });
  }
});
