import { AgentSchema } from '~/models/Agent';
import { RoomSchema } from '~/models/Room';

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event);
    if (!session?.user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Not authenticated'
      });
    }

    const agentId = getRouterParam(event, 'id');
    if (!agentId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Agent ID is required'
      });
    }

    const agent = await AgentSchema.findById(agentId);

    if (!agent) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Agent not found'
      });
    }

    // Remove agent from room
    if (agent.currentRoomId) {
      await RoomSchema.findByIdAndUpdate(agent.currentRoomId, {
        $pull: { agents: agent._id }
      });
    }

    await AgentSchema.findByIdAndDelete(agentId);

    return {
      success: true,
      message: `Đã xóa agent: ${agent.name}`
    };
  } catch (error: any) {
    console.error('Error deleting agent:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to delete agent'
    });
  }
});
