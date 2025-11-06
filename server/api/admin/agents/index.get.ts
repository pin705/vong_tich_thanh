import { AgentSchema } from '~/models/Agent';

export default defineEventHandler(async (event) => {
  try {
    // Get all agents
    const agents = await AgentSchema.find({}).lean();

    return {
      success: true,
      agents: agents.map((agent: any) => ({
        id: agent._id.toString(),
        name: agent.name,
        type: agent.type,
        level: agent.level,
        hp: agent.hp,
        maxHp: agent.maxHp
      }))
    };
  } catch (error) {
    console.error('Error loading agents:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load agents'
    });
  }
});
