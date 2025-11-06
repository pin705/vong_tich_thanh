import { AgentSchema } from '~/models/Agent';

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

    const body = await readBody(event);

    const agent = await AgentSchema.findByIdAndUpdate(
      agentId,
      body,
      { new: true, runValidators: true }
    );

    if (!agent) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Agent not found'
      });
    }

    return {
      success: true,
      message: `Đã cập nhật agent: ${agent.name}`,
      agent: {
        id: agent._id,
        name: agent.name,
        type: agent.type
      }
    };
  } catch (error: any) {
    console.error('Error updating agent:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to update agent'
    });
  }
});
