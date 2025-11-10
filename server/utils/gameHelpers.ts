/**
 * Common Game Helpers - Reduce duplication in command handlers
 */

import { RoomSchema } from '../../models/Room';
import { AgentSchema } from '../../models/Agent';
import { ItemSchema } from '../../models/Item';
import { deduplicateItemsById } from './itemDeduplication';

/**
 * Get player's current room with populated data
 */
export async function getPlayerRoom(currentRoomId: any, populateOptions?: string[]) {
  const query = RoomSchema.findById(currentRoomId);
  
  if (populateOptions) {
    populateOptions.forEach(option => query.populate(option));
  }
  
  return await query.exec();
}

/**
 * Get vendors in a room
 */
export async function getVendorsInRoom(roomId: any, populateFields?: string) {
  const room = await RoomSchema.findById(roomId);
  if (!room || !room.agents || room.agents.length === 0) {
    return null;
  }

  const vendors = await AgentSchema.find({ 
    _id: { $in: room.agents },
    isVendor: true
  })
    .populate('shopInventory', populateFields || 'name price premiumPrice dungeonCoinPrice tamerBadgePrice gloryPointsPrice braveryMedalPrice')
    .populate('shopItems', populateFields || 'name price premiumPrice dungeonCoinPrice tamerBadgePrice gloryPointsPrice braveryMedalPrice');

  if (vendors.length === 0) {
    return null;
  }

  return vendors[0]; // Return first vendor
}

/**
 * Get all items from vendor (combining shopInventory and legacy shopItems)
 */
export function getVendorItems(vendor: any): any[] {
  const shopInventory = vendor.shopInventory || [];
  const shopItems = vendor.shopItems || [];
  const allItems = [...shopInventory, ...shopItems];
  return deduplicateItemsById(allItems);
}

/**
 * Find item in vendor's shop by name
 */
export function findVendorItem(vendor: any, itemName: string): any | null {
  const items = getVendorItems(vendor);
  return items.find((i: any) => 
    i.name.toLowerCase().includes(itemName.toLowerCase())
  ) || null;
}

/**
 * Get items from room floor
 */
export async function getRoomItems(roomId: any): Promise<any[]> {
  const room = await RoomSchema.findById(roomId);
  if (!room || !room.items || room.items.length === 0) {
    return [];
  }
  
  return await ItemSchema.find({ _id: { $in: room.items } });
}

/**
 * Find item on room floor by name
 */
export async function findRoomItem(roomId: any, itemName: string): Promise<any | null> {
  const items = await getRoomItems(roomId);
  return items.find((i: any) => 
    i.name.toLowerCase().includes(itemName.toLowerCase())
  ) || null;
}

/**
 * Remove item from room floor
 */
export async function removeItemFromRoom(roomId: any, itemId: any): Promise<boolean> {
  const room = await RoomSchema.findById(roomId);
  if (!room) return false;
  
  room.items = room.items.filter((id: any) => id.toString() !== itemId.toString());
  await room.save();
  return true;
}

/**
 * Add item to room floor
 */
export async function addItemToRoom(roomId: any, itemId: any): Promise<boolean> {
  const room = await RoomSchema.findById(roomId);
  if (!room) return false;
  
  room.items.push(itemId);
  await room.save();
  return true;
}

/**
 * Check if room has vendors
 */
export async function roomHasVendors(roomId: any): Promise<boolean> {
  const room = await RoomSchema.findById(roomId);
  if (!room || !room.agents || room.agents.length === 0) {
    return false;
  }

  const vendorCount = await AgentSchema.countDocuments({ 
    _id: { $in: room.agents },
    isVendor: true
  });

  return vendorCount > 0;
}
