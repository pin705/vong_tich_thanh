import { AgentSchema } from '~/models/Agent';
import { ItemSchema } from '~/models/Item';

export default defineEventHandler(async (event) => {
  try {
    const agentId = getRouterParam(event, 'id');
    
    if (!agentId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Agent ID is required'
      });
    }

    // Find agent and populate loot table
    const agent = await AgentSchema.findById(agentId)
      .populate('lootTable.itemId', 'name description value itemKey rarity')
      .populate('loot', 'name description value itemKey rarity')
      .lean();

    if (!agent) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Agent not found'
      });
    }

    // Calculate estimated gold drop based on level
    const estimatedGold = Math.floor(agent.level * 2);

    // Prepare loot information
    const lootInfo = [];
    
    // Add loot table items with drop chances
    if (agent.lootTable && agent.lootTable.length > 0) {
      for (const lootEntry of agent.lootTable) {
        if (lootEntry.itemId) {
          lootInfo.push({
            name: lootEntry.itemId.name,
            description: lootEntry.itemId.description,
            dropChance: lootEntry.dropChance,
            rarity: lootEntry.itemId.rarity,
            type: 'lootTable'
          });
        }
      }
    }
    
    // Add legacy loot items (100% drop chance for backwards compatibility)
    if (agent.loot && agent.loot.length > 0) {
      for (const item of agent.loot) {
        lootInfo.push({
          name: item.name,
          description: item.description,
          dropChance: 1.0,
          rarity: item.rarity,
          type: 'legacy'
        });
      }
    }

    return {
      success: true,
      agent: {
        id: agent._id.toString(),
        name: agent.name,
        description: agent.description,
        type: agent.type,
        agentType: agent.agentType,
        level: agent.level,
        hp: agent.hp,
        maxHp: agent.maxHp,
        damage: agent.damage,
        behavior: agent.behavior,
        experience: agent.experience,
        estimatedGold: estimatedGold,
        loot: lootInfo,
        faction: agent.faction,
        minReputation: agent.minReputation,
        isDungeonBoss: agent.isDungeonBoss,
        dungeonFloor: agent.dungeonFloor,
        isTrialMonster: agent.isTrialMonster,
        trialFloor: agent.trialFloor,
        isVendor: agent.isVendor,
        shopType: agent.shopType,
        shopCurrency: agent.shopCurrency
      }
    };
  } catch (error) {
    console.error('Error loading agent details:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load agent details'
    });
  }
});
