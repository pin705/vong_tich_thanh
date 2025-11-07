// ============================================================================
// KEY-BASED LOOKUP UTILITIES
// ============================================================================
//
// These utilities help with looking up entities by their natural keys
// instead of hardcoded _id values. This is part of the initWorld refactoring.
//
// USAGE EXAMPLES:
//
// // Instead of:
// const starterSword = await ItemSchema.findById('60b1234...'); // BAD: hardcoded _id
//
// // Use:
// const starterSword = await getItemByKey('starter_sword'); // GOOD: uses natural key
//
// ============================================================================

import type { Types } from 'mongoose';
import { ItemSchema } from '../../models/Item';
import { RoomSchema } from '../../models/Room';
import { AgentSchema } from '../../models/Agent';
import { QuestSchema } from '../../models/Quest';

/**
 * Get an item by its natural key (itemKey)
 * @param itemKey The unique item key
 * @returns The item document or null if not found
 */
export async function getItemByKey(itemKey: string) {
  return await ItemSchema.findOne({ itemKey });
}

/**
 * Get multiple items by their natural keys
 * @param itemKeys Array of item keys
 * @returns Array of item documents
 */
export async function getItemsByKeys(itemKeys: string[]) {
  return await ItemSchema.find({ itemKey: { $in: itemKeys } });
}

/**
 * Get an item's _id by its natural key
 * @param itemKey The unique item key
 * @returns The ObjectId or null if not found
 */
export async function getItemIdByKey(itemKey: string): Promise<Types.ObjectId | null> {
  const item = await ItemSchema.findOne({ itemKey }, '_id');
  return item?._id || null;
}

/**
 * Get a room by its natural key (roomKey)
 * @param roomKey The unique room key
 * @returns The room document or null if not found
 */
export async function getRoomByKey(roomKey: string) {
  return await RoomSchema.findOne({ roomKey });
}

/**
 * Get a room's _id by its natural key
 * @param roomKey The unique room key
 * @returns The ObjectId or null if not found
 */
export async function getRoomIdByKey(roomKey: string): Promise<Types.ObjectId | null> {
  const room = await RoomSchema.findOne({ roomKey }, '_id');
  return room?._id || null;
}

/**
 * Get an agent by its natural key (agentKey)
 * @param agentKey The unique agent key
 * @returns The agent document or null if not found
 */
export async function getAgentByKey(agentKey: string) {
  return await AgentSchema.findOne({ agentKey });
}

/**
 * Get an agent's _id by its natural key
 * @param agentKey The unique agent key
 * @returns The ObjectId or null if not found
 */
export async function getAgentIdByKey(agentKey: string): Promise<Types.ObjectId | null> {
  const agent = await AgentSchema.findOne({ agentKey }, '_id');
  return agent?._id || null;
}

/**
 * Get a quest by its natural key (questKey)
 * @param questKey The unique quest key
 * @returns The quest document or null if not found
 */
export async function getQuestByKey(questKey: string) {
  return await QuestSchema.findOne({ questKey });
}

/**
 * Get a quest's _id by its natural key
 * @param questKey The unique quest key
 * @returns The ObjectId or null if not found
 */
export async function getQuestIdByKey(questKey: string): Promise<Types.ObjectId | null> {
  const quest = await QuestSchema.findOne({ questKey }, '_id');
  return quest?._id || null;
}

// ============================================================================
// EXAMPLE USAGE IN COMMANDS
// ============================================================================
//
// Example 1: Check if player has a specific quest item
// 
// // OLD WAY (with hardcoded ID):
// // const questItemId = new Types.ObjectId('60b1234abcd...');
// // const hasItem = player.inventory.some(id => id.equals(questItemId));
//
// // NEW WAY (with key lookup):
// const questItem = await getItemByKey('ancient_key');
// if (questItem) {
//   const hasItem = player.inventory.some(id => id.equals(questItem._id));
// }
//
// Example 2: Teleport player to a specific room
//
// // OLD WAY:
// // player.currentRoomId = new Types.ObjectId('60b5678efgh...');
//
// // NEW WAY:
// const targetRoom = await getRoomByKey('town_square');
// if (targetRoom) {
//   player.currentRoomId = targetRoom._id;
// }
//
// Example 3: Spawn a specific NPC
//
// // OLD WAY:
// // const templateId = new Types.ObjectId('60b9012ijkl...');
// // const template = await AgentSchema.findById(templateId);
//
// // NEW WAY:
// const template = await getAgentByKey('quest_npc_elder');
// if (template) {
//   // Clone the template to create a new instance
//   const npc = await AgentSchema.create({
//     ...template.toObject(),
//     _id: undefined, // Let MongoDB generate new _id
//   });
// }
//
// ============================================================================
