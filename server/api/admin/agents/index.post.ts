import { AgentSchema } from '~/models/Agent';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    
    // Create new agent
    const agent = await AgentSchema.create(body);

    return {
      success: true,
      message: `Đã tạo NPC/Mob: ${agent.name}`,
      agent: {
        id: agent._id,
        name: agent.name,
        type: agent.type
      }
    };
  } catch (error: any) {
    console.error('Error creating agent:', error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to create agent'
    });
  }
});
