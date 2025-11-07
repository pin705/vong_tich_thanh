import type { Command } from '~/types';
import { PlayerSchema } from '../../models/Player';
import { RoomSchema } from '../../models/Room';
import { ItemSchema } from '../../models/Item';
import { AgentSchema } from '../../models/Agent';
import { BuffSchema } from '../../models/Buff';
import { PetSchema } from '../../models/Pet';
import { PetTemplateSchema } from '../../models/PetTemplate';
import { gameState } from './gameState';
import { DEV_FEATURE_MESSAGE, SMALL_POTION_HEALING } from './constants';
import { startCombat, fleeCombat, updateQuestProgress } from './combatSystem';
import { partyService } from './partyService';
import { tradeService } from './tradeService';
import { handleMovementCommand, handleGotoCommand } from '../commands/movement';
import { handleCombatCommand } from '../commands/combat';
import { handleItemCommand } from '../commands/item';
import { handlePartyCommand } from '../commands/party';
import { handleSayCommand, handleWorldCommand, handleGuildChatCommand } from '../commands/social';
import { formatRoomDescription } from './roomUtils';
import { deduplicateItemsById } from './itemDeduplication';
import { BUILT_IN_COMMANDS } from './commandParser';
import { transferItem, transferGold, addItemToPlayer, removeItemFromPlayer } from './inventoryService';
import { findItemOnGround, findItemInInventory, findTargetInRoom } from './entityFinder';
import { getHelpText } from './helpSystem';
import { determinePetQuality, summonPet, unsummonPet, addExp } from './petService';

// Command routing configuration
const MOVEMENT_COMMANDS = ['go', 'n', 's', 'e', 'w', 'u', 'd', 
                           'north', 'south', 'east', 'west', 'up', 'down',
                           'bắc', 'nam', 'đông', 'tây', 'lên', 'xuống'];

const COMBAT_COMMANDS = ['attack', 'a', 'kill', 'flee', 'run', 'auto'];

const ITEM_COMMANDS = ['inventory', 'i', 'get', 'g', 'drop', 'use', 
                       'list', 'buy', 'sell'];

// Helper function to get currency info for shop transactions
function getCurrencyInfo(vendor: any, player: any) {
  const isPremiumShop = vendor.shopType === 'premium';
  const isDungeonShop = vendor.shopCurrency === 'dungeon_coin';
  const isTamerShop = vendor.shopCurrency === 'tamer_badge';
  const isGloryShop = vendor.shopCurrency === 'glory_points';
  const isBraveryShop = vendor.shopCurrency === 'bravery_medal';
  
  let currencySymbol = '💰';
  let playerCurrency = player.gold;
  let currencyName = 'vàng';
  let priceField = 'price';
  
  if (isPremiumShop) {
    currencySymbol = '💎';
    playerCurrency = player.premiumCurrency;
    currencyName = 'Cổ Thạch';
    priceField = 'premiumPrice';
  } else if (isDungeonShop) {
    currencySymbol = '🎫';
    playerCurrency = player.dungeonCoin || 0;
    currencyName = 'Xu Hầm Ngục';
    priceField = 'dungeonCoinPrice';
  } else if (isTamerShop) {
    currencySymbol = '🏅';
    playerCurrency = player.tamerBadge || 0;
    currencyName = 'Huy Hiệu Huấn Luyện';
    priceField = 'tamerBadgePrice';
  } else if (isGloryShop) {
    currencySymbol = '⚔️';
    playerCurrency = player.gloryPoints || 0;
    currencyName = 'Điểm Vinh Quang';
    priceField = 'gloryPointsPrice';
  } else if (isBraveryShop) {
    currencySymbol = '🎖️';
    playerCurrency = player.braveryMedals || 0;
    currencyName = 'Huy Chương Dũng Cảm';
    priceField = 'braveryMedalPrice';
  }
  
  return { 
    isPremiumShop, 
    isDungeonShop, 
    isTamerShop,
    isGloryShop,
    isBraveryShop,
    currencySymbol, 
    playerCurrency, 
    currencyName,
    priceField
  };
}

// Helper function to format trade status display
async function formatTradeStatus(
  playerTrade: { tradeId: string; trade: any; isInitiator: boolean },
  playerId: string
): Promise<string[]> {
  const responses: string[] = [];
  const { trade, isInitiator } = playerTrade;
  const otherPlayerId = isInitiator ? trade.targetId : trade.initiatorId;
  const otherPlayer = await PlayerSchema.findById(otherPlayerId).select('username').lean();
  
  responses.push('═══════════════════════════════════════════════════');
  responses.push('            GIAO DỊCH ĐANG HOẠT ĐỘNG              ');
  responses.push('═══════════════════════════════════════════════════');
  responses.push(`Đối tác: [${otherPlayer?.username || 'Unknown'}]`);
  responses.push('');
  
  // Show initiator's offer
  const initiatorItems = await ItemSchema.find({ _id: { $in: trade.initiatorItems } }).select('name').lean();
  responses.push(`${isInitiator ? 'Bạn' : otherPlayer?.username || 'Đối tác'} đưa ra:`);
  if (initiatorItems.length > 0) {
    initiatorItems.forEach((item: any) => {
      responses.push(`  - [${item.name}]`);
    });
  }
  if (trade.initiatorGold > 0) {
    responses.push(`  - ${trade.initiatorGold} vàng`);
  }
  if (initiatorItems.length === 0 && trade.initiatorGold === 0) {
    responses.push('  (Chưa có gì)');
  }
  responses.push('');
  
  // Show target's offer
  const targetItems = await ItemSchema.find({ _id: { $in: trade.targetItems } }).select('name').lean();
  responses.push(`${!isInitiator ? 'Bạn' : otherPlayer?.username || 'Đối tác'} đưa ra:`);
  if (targetItems.length > 0) {
    targetItems.forEach((item: any) => {
      responses.push(`  - [${item.name}]`);
    });
  }
  if (trade.targetGold > 0) {
    responses.push(`  - ${trade.targetGold} vàng`);
  }
  if (targetItems.length === 0 && trade.targetGold === 0) {
    responses.push('  (Chưa có gì)');
  }
  responses.push('');
  
  responses.push(`Trạng thái bạn: ${(isInitiator ? trade.initiatorLocked : trade.targetLocked) ? 'ĐÃ KHÓA' : 'Chưa khóa'}`);
  responses.push(`Trạng thái đối tác: ${(isInitiator ? trade.targetLocked : trade.initiatorLocked) ? 'ĐÃ KHÓA' : 'Chưa khóa'}`);
  
  return responses;
}

// Main command handler with database integration
export async function handleCommandDb(command: Command, playerId: string): Promise<string[]> {
  const { action, target, args } = command;
  const responses: string[] = [];

  try {
    // Route to specialized command handlers first
    
    // Movement commands
    if (MOVEMENT_COMMANDS.includes(action)) {
      return await handleMovementCommand(command, playerId);
    }

    // Goto command
    if (action === 'goto') {
      return await handleGotoCommand(command, playerId);
    }

    // Combat commands
    if (COMBAT_COMMANDS.includes(action)) {
      return await handleCombatCommand(command, playerId);
    }

    // Item commands
    if (ITEM_COMMANDS.includes(action)) {
      return await handleItemCommand(command, playerId);
    }

    // Get player from database for remaining commands
    const player = await PlayerSchema.findById(playerId).populate('inventory');
    if (!player) {
      responses.push('Lỗi: Không tìm thấy thông tin người chơi.');
      return responses;
    }

    switch (action) {
      case 'help': {
        // Use the new help system with topic support
        const helpResponses = getHelpText(target);
        responses.push(...helpResponses);
        break;
      }

      case 'look':
      case 'l':
        const room = await RoomSchema.findById(player.currentRoomId);
        if (!room) {
          responses.push('Lỗi: Không tìm thấy phòng hiện tại.');
          break;
        }

        if (!target) {
          // Look at room
          const roomDesc = await formatRoomDescription(room, player);
          responses.push(...roomDesc);
        } else {
          // Look at specific target using entity finder
          const foundTarget = await findTargetInRoom(room, target);
          
          if (foundTarget && foundTarget.type === 'agent') {
            const agent = foundTarget.entity;
            responses.push(agent.description);
            responses.push('');
            
            // Show rewards for mobs
            if (agent.type === 'mob') {
              responses.push('--- Phần Thưởng (Dự Kiến) ---');
              responses.push(`EXP: ${agent.experience}`);
              
              // Gold is not directly stored, but can be assumed from level
              const estimatedGold = Math.floor(agent.level * 2);
              responses.push(`Vàng: ~${estimatedGold}`);
              
              // Show loot items
              if (agent.loot && agent.loot.length > 0) {
                // Populate loot items if not already populated (optimized: only select name field)
                const populatedAgent = await AgentSchema.findById(agent._id).populate('loot', 'name').lean();
                if (populatedAgent && populatedAgent.loot) {
                  const lootNames = populatedAgent.loot.map((item: any) => `[${item.name}]`).join(', ');
                  responses.push(`Vật phẩm: ${lootNames}`);
                }
              }
              responses.push('');
            }
            
            // Phase 25: Show vendor info
            if (agent.isVendor) {
              responses.push('💰 CỬA HÀNG AVAILABLE - Gõ \'list\' để xem hàng hóa.');
              responses.push('');
            }
            
            break;
          }
          
          if (foundTarget && foundTarget.type === 'player') {
            const otherPlayer = foundTarget.entity;
            responses.push(`[${otherPlayer.username}] đang đứng ở đây, trông có vẻ đang suy nghĩ về điều gì đó.`);
            break;
          }
          
          // Check items on ground
          const foundItem = await findItemOnGround(room, target);
          if (foundItem) {
            responses.push(foundItem.description);
            break;
          }
          
          responses.push(`Bạn không thấy "${target}" ở đây.`);
        }
        break;

      case 'talk':
      case 't':
        if (!target) {
          responses.push('Bạn muốn nói chuyện với ai?');
          break;
        }

        const talkRoom = await RoomSchema.findById(player.currentRoomId);
        if (!talkRoom) {
          responses.push(`Bạn không thấy "${target}" ở đây để nói chuyện.`);
          break;
        }

        // Use entity finder to find the target agent
        const talkTarget = await findTargetInRoom(talkRoom, target);
        
        if (!talkTarget || talkTarget.type !== 'agent') {
          responses.push(`Bạn không thấy "${target}" ở đây để nói chuyện.`);
          break;
        }

        const talkAgent = talkTarget.entity;
        if (talkAgent.dialogue && talkAgent.dialogue.length > 0) {
          const randomDialogue = talkAgent.dialogue[Math.floor(Math.random() * talkAgent.dialogue.length)];
          responses.push(`[${talkAgent.name}] nói: "${randomDialogue}"`);
        } else {
          responses.push(`[${talkAgent.name}] không có gì để nói với bạn.`);
        }
        
        // Update quest progress for talk objectives
        const questMessages = await updateQuestProgress(playerId, 'talk', talkAgent.name);
        responses.push(...questMessages);

        // Tutorial completion logic: When player talks to "Già Làng" and hasn't completed tutorial
        if (talkAgent.agentKey === 'gia_lang' && !player.hasCompletedTutorial) {
          // Mark tutorial as completed
          player.hasCompletedTutorial = true;
          
          // Get starter items by itemKey
          const starterItems = await ItemSchema.find({
            itemKey: { $in: ['starter_sword', 'starter_chest', 'starter_legs', 'starter_boots'] }
          }).lean();
          
          // Add items to player inventory concurrently for better performance
          await Promise.all(starterItems.map(item => addItemToPlayer(playerId, item._id.toString())));
          
          // Reload player to get updated inventory
          await player.reload();
          
          // Prepare reward data to be stored in gameState for WebSocket to pick up
          const itemsAwarded = starterItems.map(item => ({
            name: item.name,
            itemKey: item.itemKey
          }));
          
          // Store the tutorial completion event in player's session
          // The WebSocket handler will check for this and send the custom event
          const playerState = gameState.getPlayer(playerId);
          if (playerState) {
            playerState.tutorialRewardData = itemsAwarded;
          } else {
            // Player state not in memory yet - log warning but continue
            console.warn(`[Tutorial] Player state not found for ${playerId}, reward popup may not display`);
          }
          
          responses.push('');
          responses.push('════════════════════════════════════');
          responses.push('[Hướng dẫn hoàn tất!]');
          responses.push('Bạn đã nhận được trang bị tân thủ.');
          responses.push('════════════════════════════════════');
        }
        break;

      case 'say':
        responses.push(...await handleSayCommand(playerId, player, target, args));
        break;


      case 'inventory':
      case 'i':
        responses.push('════════════ TÚI ĐỒ ════════════');
        responses.push(`Vàng: ${player.gold}`);
        responses.push(`HP: ${player.hp}/${player.maxHp}`);
        responses.push(`Level: ${player.level} (XP: ${player.experience})`);
        responses.push('');
        
        // Show equipped items
        if (player.equipment) {
          const equippedItems = [];
          const slots = ['weapon', 'helmet', 'chest', 'legs', 'boots'];
          
          for (const slot of slots) {
            if (player.equipment[slot]) {
              equippedItems.push({ slot, itemId: player.equipment[slot] });
            }
          }
          
          if (equippedItems.length > 0) {
            responses.push('Trang bị:');
            const equippedItemsData = await ItemSchema.find({ 
              _id: { $in: equippedItems.map(e => e.itemId) } 
            }).select('name value slot').lean();
            
            // Map items to slots
            const itemMap = new Map();
            equippedItemsData.forEach((item: any) => {
              itemMap.set(item._id.toString(), item);
            });
            
            equippedItems.forEach(({ slot, itemId }) => {
              const item = itemMap.get(itemId.toString());
              if (item) {
                const slotName = {
                  weapon: 'Vũ khí',
                  helmet: 'Mũ',
                  chest: 'Áo',
                  legs: 'Quần',
                  boots: 'Giày'
                }[slot] || slot;
                responses.push(`  [${slotName}] ${item.name}`);
              }
            });
            responses.push('');
          }
        }
        
        if (player.inventory && player.inventory.length > 0) {
          responses.push('Vật phẩm:');
          const inventory = await ItemSchema.find({ _id: { $in: player.inventory } }).select('name value').lean();
          inventory.forEach((item: any) => {
            responses.push(`  - [${item.name}] (${item.value} vàng)`);
          });
        } else {
          responses.push('Không có vật phẩm nào.');
        }
        responses.push('═════════════════════════════════');
        break;

      case 'get':
      case 'g':
        if (!target) {
          responses.push('Bạn muốn nhặt gì?');
          break;
        }

        // Check party loot rules
        const lootCheck = partyService.canLoot(playerId);
        if (!lootCheck.canLoot) {
          responses.push(lootCheck.reason || 'Bạn không thể nhặt đồ lúc này.');
          break;
        }

        const getRoom = await RoomSchema.findById(player.currentRoomId);
        if (!getRoom || !getRoom.items || getRoom.items.length === 0) {
          responses.push(`Không có "${target}" ở đây để nhặt.`);
          break;
        }

        // Use entity finder to find item on ground
        const getItem = await findItemOnGround(getRoom, target);

        if (!getItem) {
          responses.push(`Không có "${target}" ở đây để nhặt.`);
          break;
        }

        // Remove from room
        getRoom.items = getRoom.items.filter((id: any) => id.toString() !== getItem._id.toString());
        await getRoom.save();

        // Add to player inventory using inventory service
        const pickupResult = await addItemToPlayer(playerId, getItem._id.toString());
        if (!pickupResult.success) {
          // Rollback: add item back to room
          getRoom.items.push(getItem._id);
          await getRoom.save();
          responses.push(pickupResult.message);
          break;
        }

        responses.push(`Bạn nhặt [${getItem.name}].`);
        
        // Advance loot turn if in party with round-robin
        const getPlayerParty = partyService.getPlayerParty(playerId);
        if (getPlayerParty && getPlayerParty.party.lootRule === 'round-robin') {
          partyService.advanceLootTurn(getPlayerParty.partyId);
          
          // Notify next looter
          const nextLooter = partyService.getNextLooter(getPlayerParty.partyId);
          if (nextLooter) {
            const nextLooterPlayer = gameState.getPlayer(nextLooter);
            if (nextLooterPlayer?.ws) {
              nextLooterPlayer.ws.send(JSON.stringify({
                type: 'system',
                category: 'loot',
                message: 'Đến lượt bạn nhặt đồ.'
              }));
            }
          }
        }
        
        // Broadcast to room
        gameState.broadcastToRoom(
          getRoom._id.toString(),
          {
            type: 'normal',
            message: `[${player.username}] nhặt [${getItem.name}].`
          },
          playerId
        );
        break;

      case 'drop':
        if (!target) {
          responses.push('Bạn muốn thả gì?');
          break;
        }

        // Use entity finder to find item in inventory
        const dropItem = await findItemInInventory(player.inventory, target);

        if (!dropItem) {
          responses.push(`Bạn không có "${target}" trong túi đồ.`);
          break;
        }

        const dropRoom = await RoomSchema.findById(player.currentRoomId);
        if (!dropRoom) {
          responses.push('Lỗi: Không tìm thấy phòng hiện tại.');
          break;
        }

        // Remove from player using inventory service
        const dropResult = await removeItemFromPlayer(playerId, dropItem._id.toString());
        if (!dropResult.success) {
          responses.push(dropResult.message);
          break;
        }

        // Add to room
        dropRoom.items.push(dropItem._id);
        await dropRoom.save();

        responses.push(`Bạn thả [${dropItem.name}] xuống đất.`);
        
        // Broadcast to room
        gameState.broadcastToRoom(
          dropRoom._id.toString(),
          {
            type: 'normal',
            message: `[${player.username}] thả [${dropItem.name}] xuống đất.`
          },
          playerId
        );
        break;

      case 'list': {
        const listRoom = await RoomSchema.findById(player.currentRoomId);
        if (!listRoom || !listRoom.agents || listRoom.agents.length === 0) {
          responses.push('Không có ai ở đây để bán hàng.');
          break;
        }

        // Phase 25: Use new vendor system (optimized: only populate needed fields)
        const vendors = await AgentSchema.find({ 
          _id: { $in: listRoom.agents },
          isVendor: true
        }).populate('shopInventory', 'name price premiumPrice dungeonCoinPrice tamerBadgePrice gloryPointsPrice braveryMedalPrice').populate('shopItems', 'name price premiumPrice dungeonCoinPrice tamerBadgePrice gloryPointsPrice braveryMedalPrice');

        if (vendors.length === 0) {
          responses.push('Không có ai ở đây để bán hàng.');
          break;
        }

        const vendor = vendors[0];
        // Combine items from both shopInventory and shopItems (legacy field)
        const shopInventory = vendor.shopInventory || [];
        const shopItems = vendor.shopItems || [];
        const allItems = [...shopInventory, ...shopItems];
        const uniqueItems = deduplicateItemsById(allItems);

        if (uniqueItems.length === 0) {
          responses.push(`[${vendor.name}] không có gì để bán.`);
          break;
        }

        const currencyInfo = getCurrencyInfo(vendor, player);
        responses.push(`════════ HÀNG CỦA ${vendor.name.toUpperCase()} ════════`);
        uniqueItems.forEach((item: any, index: number) => {
          const itemPrice = item[currencyInfo.priceField] ?? 0;
          const spaces = ' '.repeat(Math.max(20 - item.name.length, 1));
          responses.push(`${index + 1}. [${item.name}]${spaces}- ${itemPrice} ${currencyInfo.currencySymbol}`);
        });
        responses.push('═══════════════════════════════════════');
        responses.push('Gõ \'buy [tên vật phẩm]\' để mua.');
        break;
      }

      case 'buy': {
        if (!target) {
          responses.push('Bạn muốn mua gì?');
          break;
        }

        const buyRoom = await RoomSchema.findById(player.currentRoomId);
        if (!buyRoom || !buyRoom.agents || buyRoom.agents.length === 0) {
          responses.push('Không có ai ở đây để bán hàng.');
          break;
        }

        // Phase 25: Use new vendor system (optimized: only populate needed fields)
        const buyVendors = await AgentSchema.find({ 
          _id: { $in: buyRoom.agents },
          isVendor: true
        }).populate('shopInventory', 'name price premiumPrice dungeonCoinPrice tamerBadgePrice gloryPointsPrice braveryMedalPrice type').populate('shopItems', 'name price premiumPrice dungeonCoinPrice tamerBadgePrice gloryPointsPrice braveryMedalPrice type');

        if (buyVendors.length === 0) {
          responses.push('Không có ai ở đây để bán hàng.');
          break;
        }

        const buyVendor = buyVendors[0];
        // Combine items from both shopInventory and shopItems (legacy field)
        const buyShopInventory = buyVendor.shopInventory || [];
        const buyShopItems = buyVendor.shopItems || [];
        const buyAllItems = [...buyShopInventory, ...buyShopItems];
        const buyUniqueItems = deduplicateItemsById(buyAllItems);
        const buyItem = buyUniqueItems.find((i: any) => 
          i.name.toLowerCase().includes(target.toLowerCase())
        );

        if (!buyItem) {
          responses.push(`[${buyVendor.name}] không bán "${target}".`);
          break;
        }

        // Check price based on shop type and currency
        const currencyInfo = getCurrencyInfo(buyVendor, player);
        const itemPrice = buyItem[currencyInfo.priceField] ?? 0;

        // Validate that item has a valid price
        if (itemPrice <= 0) {
          responses.push(`[${buyItem.name}] không có giá bán.`);
          break;
        }

        if (currencyInfo.playerCurrency < itemPrice) {
          responses.push(`Bạn không có đủ ${currencyInfo.currencyName} để mua [${buyItem.name}]. Cần ${itemPrice} ${currencyInfo.currencySymbol}, bạn chỉ có ${currencyInfo.playerCurrency} ${currencyInfo.currencySymbol}.`);
          break;
        }

        // Create a new item instance for the player
        const newBuyItem = await ItemSchema.create({
          name: buyItem.name,
          description: buyItem.description,
          type: buyItem.type,
          value: buyItem.value,
          price: buyItem.price,
          sellValue: buyItem.sellValue,
          premiumPrice: buyItem.premiumPrice,
          stats: buyItem.stats,
          effects: buyItem.effects,
          quality: buyItem.quality,
          rarity: buyItem.rarity,
          slot: buyItem.slot,
          requiredLevel: buyItem.requiredLevel,
          recipe: buyItem.recipe,
          resultItem: buyItem.resultItem,
          upgradeType: buyItem.upgradeType,
          itemKey: buyItem.itemKey
        });

        // Deduct currency
        let remainingCurrency = 0;
        if (currencyInfo.isPremiumShop) {
          player.premiumCurrency -= itemPrice;
          remainingCurrency = player.premiumCurrency;
        } else if (currencyInfo.isDungeonShop) {
          player.dungeonCoin = (player.dungeonCoin || 0) - itemPrice;
          remainingCurrency = player.dungeonCoin;
        } else if (currencyInfo.isTamerShop) {
          player.tamerBadge = (player.tamerBadge || 0) - itemPrice;
          remainingCurrency = player.tamerBadge;
        } else if (currencyInfo.isGloryShop) {
          player.gloryPoints = (player.gloryPoints || 0) - itemPrice;
          remainingCurrency = player.gloryPoints;
        } else if (currencyInfo.isBraveryShop) {
          player.braveryMedals = (player.braveryMedals || 0) - itemPrice;
          remainingCurrency = player.braveryMedals;
        } else {
          player.gold -= itemPrice;
          remainingCurrency = player.gold;
        }
        
        player.inventory.push(newBuyItem._id);
        await player.save();

        responses.push(`Bạn đã mua [${buyItem.name}] với giá ${itemPrice} ${currencyInfo.currencySymbol}!`);
        responses.push(`${currencyInfo.currencyName} còn lại: ${remainingCurrency} ${currencyInfo.currencySymbol}`);
        break;
      }

      case 'sell':
        if (!target) {
          responses.push('Bạn muốn bán gì?');
          break;
        }

        const sellRoom = await RoomSchema.findById(player.currentRoomId);
        if (!sellRoom || !sellRoom.agents || sellRoom.agents.length === 0) {
          responses.push('Không có ai ở đây để mua hàng.');
          break;
        }

        // Phase 25: Check for vendors (only gold shops buy items)
        const sellVendors = await AgentSchema.find({ 
          _id: { $in: sellRoom.agents },
          isVendor: true,
          shopType: 'gold'
        });

        if (sellVendors.length === 0) {
          responses.push('Không có ai ở đây để mua hàng.');
          break;
        }

        const sellItems = await ItemSchema.find({ _id: { $in: player.inventory } }).select('name value sellValue').lean();
        const sellItem = sellItems.find((i: any) => 
          i.name.toLowerCase().includes(target.toLowerCase())
        );

        if (!sellItem) {
          responses.push(`Bạn không có "${target}" trong túi đồ.`);
          break;
        }

        // Phase 25: Use sellValue field or fallback to 50% of value
        const sellValue = (sellItem.sellValue ?? 0) > 0 ? sellItem.sellValue : Math.floor((sellItem.value ?? 0) * 0.5);

        if (sellValue <= 0) {
          responses.push(`Không thể bán [${sellItem.name}]. Vật phẩm này không có giá trị bán.`);
          break;
        }

        player.gold += sellValue;
        player.inventory = player.inventory.filter((id: any) => id.toString() !== sellItem._id.toString());
        await player.save();

        // Delete the sold item
        await ItemSchema.findByIdAndDelete(sellItem._id);

        responses.push(`Bạn đã bán [${sellItem.name}] nhận được ${sellValue} 💰 Vàng.`);
        responses.push(`Vàng hiện có: ${player.gold}`);
        break;

      case 'attack':
      case 'a':
      case 'kill':
        if (!target) {
          responses.push('Bạn muốn tấn công ai?');
          break;
        }
        
        // Check if already in combat
        if (player.inCombat) {
          responses.push('Bạn đã đang trong chiến đấu!');
          break;
        }
        
        const attackRoom = await RoomSchema.findById(player.currentRoomId);
        if (!attackRoom) {
          responses.push('Lỗi: Không tìm thấy phòng hiện tại.');
          break;
        }

        // First, try to find a player with matching name
        const playersInRoom = gameState.getPlayersInRoom(attackRoom._id.toString());
        const targetPlayer = playersInRoom.find(p => 
          p.username.toLowerCase().includes(target.toLowerCase()) && p.id !== playerId
        );

        if (targetPlayer) {
          // Attack player (PvP)
          const { startPvPCombat } = await import('./combatSystem');
          const pvpMessages = await startPvPCombat(player._id.toString(), targetPlayer.id);
          responses.push(...pvpMessages);
          break;
        }

        // If no player found, try to find an agent
        if (!attackRoom.agents || attackRoom.agents.length === 0) {
          responses.push(`Bạn không thể tấn công "${target}" ở đây.`);
          break;
        }

        const attackAgents = await AgentSchema.find({ _id: { $in: attackRoom.agents } });
        const attackAgent = attackAgents.find((a: any) => 
          a.name.toLowerCase().includes(target.toLowerCase())
        );

        if (!attackAgent) {
          responses.push(`Bạn không thể tấn công "${target}" ở đây.`);
          break;
        }

        // Start combat with agent
        const combatMessages = await startCombat(player._id.toString(), attackAgent._id.toString());
        responses.push(...combatMessages);
        break;

      case 'use':
        if (!target) {
          responses.push('Bạn muốn sử dụng gì?');
          break;
        }
        
        const useItems = await ItemSchema.find({ _id: { $in: player.inventory } });
        const useItem = useItems.find((i: any) => 
          i.name.toLowerCase().includes(target.toLowerCase())
        );

        if (!useItem) {
          responses.push(`Bạn không có "${target}" trong túi đồ.`);
          break;
        }

        // Phase 21: Handle Recipe items - learn the recipe
        if (useItem.type === 'Recipe') {
          // Check if player already knows this recipe
          if (player.knownRecipes && player.knownRecipes.some((r: any) => r.toString() === useItem._id.toString())) {
            responses.push(`Bạn đã biết công thức [${useItem.name}] rồi!`);
            break;
          }
          
          // Add recipe to known recipes
          if (!player.knownRecipes) {
            player.knownRecipes = [];
          }
          player.knownRecipes.push(useItem._id);
          
          // Remove recipe item from inventory
          player.inventory = player.inventory.filter((id: any) => id.toString() !== useItem._id.toString());
          await player.save();
          
          responses.push(`[+] Bạn đã học công thức [${useItem.name}]!`);
          responses.push('Bạn có thể chế tạo vật phẩm này từ menu [Chế Tạo].');
          
          // Don't delete the recipe item - keep it in the database as reference
          break;
        }
        // Handle consumable items
        else if (useItem.type === 'consumable') {
          // Handle healing items
          if (useItem.stats?.healing) {
            const healAmount = useItem.stats.healing;
            const oldHp = player.hp;
            player.hp = Math.min(player.maxHp, player.hp + healAmount);
            const actualHeal = player.hp - oldHp;
            
            // Remove item from inventory
            player.inventory = player.inventory.filter((id: any) => id.toString() !== useItem._id.toString());
            await player.save();
            
            // Delete the consumed item
            await ItemSchema.findByIdAndDelete(useItem._id);
            
            responses.push(`Bạn sử dụng [${useItem.name}], hồi phục ${actualHeal} HP.`);
            responses.push(`HP hiện tại: ${player.hp}/${player.maxHp}`);
            
            // Broadcast to room
            const useRoom = await RoomSchema.findById(player.currentRoomId);
            if (useRoom) {
              gameState.broadcastToRoom(
                useRoom._id.toString(),
                {
                  type: 'normal',
                  message: `[${player.username}] sử dụng [${useItem.name}].`
                },
                player._id.toString()
              );
            }
          } 
          // Handle buff items (like EXP boost)
          else if (useItem.effects && useItem.effects.buff) {
            const buffType = useItem.effects.buff;
            const multiplier = useItem.effects.multiplier || 1;
            const durationMinutes = useItem.effects.duration_minutes || 60;
            
            // Calculate expiration time
            const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
            
            // Check if player already has this buff active
            const existingBuff = await BuffSchema.findOne({
              playerId: player._id,
              type: buffType,
              expiresAt: { $gt: new Date() }
            });
            
            if (existingBuff) {
              responses.push(`Bạn đã có buff [${buffType}] đang hoạt động!`);
              responses.push(`Thời gian còn lại: ${Math.ceil((existingBuff.expiresAt.getTime() - Date.now()) / 60000)} phút.`);
              break;
            }
            
            // Create buff
            await BuffSchema.create({
              playerId: player._id,
              type: buffType,
              multiplier,
              expiresAt
            });
            
            // Remove item from inventory
            player.inventory = player.inventory.filter((id: any) => id.toString() !== useItem._id.toString());
            await player.save();
            
            // Delete the consumed item
            await ItemSchema.findByIdAndDelete(useItem._id);
            
            responses.push(`[+] Bạn đã kích hoạt [${useItem.name}]!`);
            responses.push(`[+] Bạn sẽ nhận được ${multiplier}x EXP trong ${durationMinutes} phút!`);
            
            // Broadcast to room
            const useRoom = await RoomSchema.findById(player.currentRoomId);
            if (useRoom) {
              gameState.broadcastToRoom(
                useRoom._id.toString(),
                {
                  type: 'normal',
                  message: `[+] [${player.username}] đã kích hoạt [${useItem.name}]!`
                },
                player._id.toString()
              );
            }
          } else {
            responses.push(`Bạn không thể sử dụng [${useItem.name}] ngay bây giờ.`);
          }
        }
        // Handle pet egg items
        else if (useItem.type === 'PET_EGG') {
          if (!useItem.data || !useItem.data.grantsPetKey) {
            responses.push('Trứng này có vẻ bị hỏng...');
            break;
          }

          // Find pet template
          const petTemplate = await PetTemplateSchema.findOne({ petKey: useItem.data.grantsPetKey });
          if (!petTemplate) {
            responses.push('Không tìm thấy thông tin loài thú cưng.');
            break;
          }

          // Determine pet quality
          const quality = determinePetQuality();
          
          // Create new pet
          const newPet = await PetSchema.create({
            ownerId: player._id,
            templateId: petTemplate._id,
            nickname: petTemplate.name,
            level: 1,
            exp: 0,
            expToNextLevel: 100,
            currentStats: {
              hp: petTemplate.baseStats.hp,
              maxHp: petTemplate.baseStats.hp,
              attack: petTemplate.baseStats.attack,
              defense: petTemplate.baseStats.defense
            },
            skills: [],
            quality
          });

          // Add pet to player's stable
          if (!player.petStable) {
            player.petStable = [];
          }
          player.petStable.push(newPet._id);
          
          // Remove egg from inventory
          player.inventory = player.inventory.filter((id: any) => id.toString() !== useItem._id.toString());
          await player.save();
          
          // Delete the consumed egg
          await ItemSchema.findByIdAndDelete(useItem._id);

          // Quality names in Vietnamese
          const qualityNames: { [key: string]: string } = {
            COMMON: 'Thường',
            UNCOMMON: 'Không Phổ Biến',
            RARE: 'Hiếm',
            EPIC: 'Sử Thi',
            LEGENDARY: 'Huyền Thoại'
          };

          responses.push('═══════════════════════════════════════════════════');
          responses.push(`Trứng nở! Bạn nhận được [${newPet.nickname}]!`);
          responses.push(`Phẩm chất: ${qualityNames[quality] || quality}`);
          responses.push(`HP: ${newPet.currentStats.maxHp} | Tấn Công: ${newPet.currentStats.attack} | Phòng Thủ: ${newPet.currentStats.defense}`);
          responses.push('═══════════════════════════════════════════════════');
          responses.push(`Sử dụng lệnh "summon ${newPet.nickname}" để triệu hồi thú cưng!`);

          // Broadcast to room
          const eggRoom = await RoomSchema.findById(player.currentRoomId);
          if (eggRoom) {
            gameState.broadcastToRoom(
              eggRoom._id.toString(),
              {
                type: 'message',
                payload: {
                  text: `[${player.username}] đã nở một quả trứng và nhận được [${newPet.nickname}]!`,
                  messageType: 'action'
                }
              },
              player._id.toString()
            );
          }
        }
        // Handle pet food items
        else if (useItem.type === 'PET_FOOD') {
          if (!player.activePetId) {
            responses.push('Bạn cần triệu hồi thú cưng trước khi cho ăn!');
            break;
          }

          if (!useItem.data || !useItem.data.expValue) {
            responses.push('Vật phẩm này không thể cho thú cưng ăn.');
            break;
          }

          const pet = await PetSchema.findById(player.activePetId);
          if (!pet) {
            responses.push('Không tìm thấy thú cưng.');
            break;
          }

          // Add exp to pet
          const expValue = useItem.data.expValue;
          const result = await addExp(pet._id.toString(), expValue);

          // Remove food from inventory
          player.inventory = player.inventory.filter((id: any) => id.toString() !== useItem._id.toString());
          await player.save();
          
          // Delete the consumed food
          await ItemSchema.findByIdAndDelete(useItem._id);

          responses.push(`[${pet.nickname}] đã ăn [${useItem.name}] và nhận được ${expValue} EXP!`);
          
          if (result.leveledUp && result.leveledUp.length > 0) {
            for (const level of result.leveledUp) {
              responses.push('═══════════════════════════════════════════════════');
              responses.push(`[${pet.nickname}] ĐÃ LÊN CẤP ${level}!`);
              responses.push(`HP: ${result.pet.currentStats.maxHp} | Tấn Công: ${result.pet.currentStats.attack} | Phòng Thủ: ${result.pet.currentStats.defense}`);
              responses.push('═══════════════════════════════════════════════════');
            }
          } else {
            responses.push(`EXP: ${result.pet.exp}/${result.pet.expToNextLevel}`);
          }

          // Broadcast to room
          const foodRoom = await RoomSchema.findById(player.currentRoomId);
          if (foodRoom) {
            gameState.broadcastToRoom(
              foodRoom._id.toString(),
              {
                type: 'message',
                payload: {
                  text: `[${player.username}] cho [${pet.nickname}] ăn [${useItem.name}].`,
                  messageType: 'action'
                }
              },
              player._id.toString()
            );
          }
        }
        // Handle pet consumables (healing potions, buff potions)
        else if (useItem.type === 'PET_CONSUMABLE') {
          if (!player.activePetId) {
            responses.push('Bạn cần triệu hồi thú cưng trước khi sử dụng vật phẩm này!');
            break;
          }

          const pet = await PetSchema.findById(player.activePetId);
          if (!pet) {
            responses.push('Không tìm thấy thú cưng.');
            break;
          }

          const petState = gameState.getPet(player.activePetId.toString());
          if (!petState) {
            responses.push('Thú cưng chưa được khởi tạo.');
            break;
          }

          // Handle pet healing potions
          if (useItem.data && useItem.data.healAmount) {
            const healAmount = useItem.data.healAmount;
            const oldHp = petState.currentStats.hp;
            petState.currentStats.hp = Math.min(petState.currentStats.maxHp, petState.currentStats.hp + healAmount);
            const actualHeal = petState.currentStats.hp - oldHp;

            // Update pet HP in database
            pet.currentStats.hp = petState.currentStats.hp;
            await pet.save();

            // Remove item from inventory
            player.inventory = player.inventory.filter((id: any) => id.toString() !== useItem._id.toString());
            await player.save();

            // Delete the consumed item
            await ItemSchema.findByIdAndDelete(useItem._id);

            responses.push(`Bạn sử dụng [${useItem.name}] cho [${pet.nickname}], hồi phục ${actualHeal} HP.`);
            responses.push(`HP thú cưng: ${petState.currentStats.hp}/${petState.currentStats.maxHp}`);

            // Broadcast to room
            const healRoom = await RoomSchema.findById(player.currentRoomId);
            if (healRoom) {
              gameState.broadcastToRoom(
                healRoom._id.toString(),
                {
                  type: 'normal',
                  message: `[${player.username}] cho [${pet.nickname}] uống [${useItem.name}].`
                },
                player._id.toString()
              );
            }
          }
          // Handle pet buff potions
          else if (useItem.data && useItem.data.buffKey) {
            const buffKey = useItem.data.buffKey;
            const duration = useItem.data.duration || 30000; // Default 30 seconds

            // Check if pet already has this buff
            const existingBuff = await BuffSchema.findOne({
              playerId: pet._id, // Use pet ID as playerId for pet buffs
              buffKey: buffKey,
              active: true,
            });

            if (existingBuff) {
              responses.push(`[${pet.nickname}] đã có buff này đang hoạt động!`);
              break;
            }

            // Create buff for pet
            await BuffSchema.create({
              playerId: pet._id, // Use pet ID as playerId for pet buffs
              buffKey: buffKey,
              duration: duration,
              active: true,
              startTime: new Date(),
              metadata: {
                description: `Buff từ ${useItem.name}`,
              },
            });

            // Remove item from inventory
            player.inventory = player.inventory.filter((id: any) => id.toString() !== useItem._id.toString());
            await player.save();

            // Delete the consumed item
            await ItemSchema.findByIdAndDelete(useItem._id);

            responses.push(`[+] [${pet.nickname}] đã nhận buff từ [${useItem.name}]!`);
            responses.push(`Hiệu ứng kéo dài ${duration / 1000} giây.`);

            // Broadcast to room
            const buffRoom = await RoomSchema.findById(player.currentRoomId);
            if (buffRoom) {
              gameState.broadcastToRoom(
                buffRoom._id.toString(),
                {
                  type: 'normal',
                  message: `[${player.username}] sử dụng [${useItem.name}] cho [${pet.nickname}]!`
                },
                player._id.toString()
              );
            }
          } else {
            responses.push(`Không thể sử dụng [${useItem.name}] cho thú cưng.`);
          }
        }
        else {
          responses.push(`[${useItem.name}] không phải là vật phẩm có thể sử dụng.`);
        }
        break;

      case 'flee':
      case 'run':
        if (!player.inCombat) {
          responses.push('Bạn không đang trong chiến đấu.');
          break;
        }
        
        const fleeMessages = await fleeCombat(player._id.toString());
        responses.push(...fleeMessages);
        break;

      case '':
        // Empty command - do nothing
        break;

      case 'skills':
      case 'sk':
        responses.push(DEV_FEATURE_MESSAGE);
        responses.push('Sử dụng nút "Skills" ở thanh tab dưới để xem sổ kỹ năng.');
        break;

      case 'talents':
      case 't':
      case 'thienphu':
        responses.push(DEV_FEATURE_MESSAGE);
        responses.push('Sử dụng nút "Talents" ở thanh tab dưới để xem bảng thiên phú.');
        break;

      case 'goto':
        // Teleport to a specific room by ID (from world map)
        console.log('target', target)
        if (!target) {
          responses.push('Cần chỉ định phòng đích.');
          break;
        }

        // Check if player is in combat
        if (player.inCombat) {
          responses.push('Bạn không thể di chuyển khi đang trong chiến đấu!');
          break;
        }

        // Find target room
        const gotoRoom = await RoomSchema.findById(target);
        console.log('Goto room:', gotoRoom, target);
        if (!gotoRoom) {
          responses.push('Không tìm thấy phòng đích.');
          break;
        }

        // Broadcast to old room
        const gotoOldRoom = await RoomSchema.findById(player.currentRoomId);
        if (gotoOldRoom) {
          gameState.broadcastToRoom(
            player.currentRoomId.toString(),
            {
              type: 'normal',
              message: `[${player.username}] đã rời khỏi phòng.`
            },
            playerId
          );
        }

        // Update player location
        player.currentRoomId = gotoRoom._id;
        await player.save();
        gameState.updatePlayerRoom(playerId, gotoRoom._id.toString());

        // Broadcast to new room
        gameState.broadcastToRoom(
          gotoRoom._id.toString(),
          {
            type: 'normal',
            message: `[${player.username}] đã xuất hiện.`
          },
          playerId
        );

        // Show new room
        responses.push('Bạn di chuyển đến vị trí mới...');
        responses.push('');
        const gotoRoomDesc = await formatRoomDescription(gotoRoom, player);
        responses.push(...gotoRoomDesc);
        break;

      case 'party':
      case 'p':
      case 'moi':
      case 'roi':
        responses.push(...await handlePartyCommand(playerId, player, action, target, args));
        break;

      case 'g': {
        // Guild chat
        const chatMessage = [target, ...(args || [])].filter(Boolean).join(' ');
        
        if (!chatMessage) {
          responses.push('Bạn muốn nói gì với bang?');
          break;
        }
        
        if (!player.guild) {
          responses.push('Bạn không có bang hội.');
          break;
        }
        
        // Import GuildSchema at the top of file if not already imported
        const { GuildSchema } = await import('../../models/Guild');
        const guild = await GuildSchema.findById(player.guild).populate('members', '_id');
        
        if (!guild) {
          responses.push('Không tìm thấy bang hội.');
          break;
        }
        
        // Broadcast to all online guild members
        const memberIds = guild.members.map((m: any) => m._id.toString());
        const members = gameState.getPlayersByIds(memberIds);
        
        members.forEach(member => {
          if (member.ws) {
            member.ws.send(JSON.stringify({
              type: 'chat',
              category: 'guild',
              user: player.username,
              guildTag: guild.tag,
              message: chatMessage
            }));
          }
        });
        
        // Don't add to responses - it will be shown via chat system
        break;
      }

      case 'guild': {
        // Guild management commands
        const subCommand = target?.toLowerCase();
        const subTarget = args?.[0];
        const amount = args?.[1];

        if (!subCommand) {
          responses.push('═══════════════════════════════════════════════════');
          responses.push('            LỆNH BANG HỘI                          ');
          responses.push('═══════════════════════════════════════════════════');
          responses.push('guild create [tên] [tag]  - Tạo bang mới');
          responses.push('guild invite [tên]        - Mời người chơi');
          responses.push('guild leave               - Rời bang');
          responses.push('guild kick [tên]          - Đuổi thành viên');
          responses.push('guild promote [tên]       - Thăng chức thành viên');
          responses.push('guild demote [tên]        - Giáng chức sĩ quan');
          responses.push('guild deposit gold [số]   - Gửi vàng vào kho');
          responses.push('guild withdraw gold [số]  - Rút vàng từ kho');
          responses.push('g [message]               - Chat trong bang');
          break;
        }

        switch (subCommand) {
          case 'deposit': {
            if (!player.guild) {
              responses.push('Bạn không có bang hội.');
              break;
            }

            const depositType = subTarget?.toLowerCase();
            
            if (depositType === 'gold') {
              const goldAmount = parseInt(amount || '0');
              
              if (!goldAmount || goldAmount <= 0) {
                responses.push('Cú pháp: guild deposit gold [số lượng]');
                break;
              }
              
              if (player.gold < goldAmount) {
                responses.push(`Bạn không đủ vàng. Hiện có: ${player.gold} vàng.`);
                break;
              }
              
              const { GuildSchema } = await import('../../models/Guild');
              const guild = await GuildSchema.findById(player.guild);
              
              if (!guild) {
                responses.push('Không tìm thấy bang hội.');
                break;
              }
              
              // Transfer gold
              player.gold -= goldAmount;
              guild.currency = (guild.currency || 0) + goldAmount;
              
              await player.save();
              await guild.save();
              
              responses.push(`Đã gửi ${goldAmount} vàng vào kho bang hội.`);
              responses.push(`Kho bang hiện có: ${guild.currency} vàng.`);
            } else {
              responses.push('Hiện tại chỉ hỗ trợ: guild deposit gold [số lượng]');
            }
            break;
          }

          case 'withdraw': {
            if (!player.guild) {
              responses.push('Bạn không có bang hội.');
              break;
            }

            const { GuildSchema } = await import('../../models/Guild');
            const guild = await GuildSchema.findById(player.guild);
            
            if (!guild) {
              responses.push('Không tìm thấy bang hội.');
              break;
            }

            // Check if player is leader or officer
            const isLeader = guild.leader.toString() === player._id.toString();
            const isOfficer = guild.officers.some((o: any) => o.toString() === player._id.toString());
            
            if (!isLeader && !isOfficer) {
              responses.push('Chỉ bang chủ và sĩ quan mới có thể rút từ kho.');
              break;
            }

            const withdrawType = subTarget?.toLowerCase();
            
            if (withdrawType === 'gold') {
              const goldAmount = parseInt(amount || '0');
              
              if (!goldAmount || goldAmount <= 0) {
                responses.push('Cú pháp: guild withdraw gold [số lượng]');
                break;
              }
              
              if ((guild.currency || 0) < goldAmount) {
                responses.push(`Kho bang không đủ vàng. Hiện có: ${guild.currency || 0} vàng.`);
                break;
              }
              
              // Transfer gold
              guild.currency = (guild.currency || 0) - goldAmount;
              player.gold += goldAmount;
              
              await guild.save();
              await player.save();
              
              responses.push(`Đã rút ${goldAmount} vàng từ kho bang hội.`);
              responses.push(`Kho bang còn lại: ${guild.currency} vàng.`);
            } else {
              responses.push('Hiện tại chỉ hỗ trợ: guild withdraw gold [số lượng]');
            }
            break;
          }

          default:
            responses.push('Lệnh không hợp lệ. Gõ "guild" để xem danh sách lệnh.');
            break;
        }
        break;
      }

      case 'pvp': {
        // Toggle PvP flag
        const mode = target?.toLowerCase();
        
        if (!mode || (mode !== 'on' && mode !== 'off')) {
          responses.push('Cú pháp: pvp [on/off]');
          responses.push(`Trạng thái PvP hiện tại: ${player.pvpEnabled ? 'BẬT' : 'TẮT'}`);
          break;
        }
        
        const newPvpState = mode === 'on';
        
        if (player.pvpEnabled === newPvpState) {
          responses.push(`PvP đã ${newPvpState ? 'bật' : 'tắt'} rồi.`);
          break;
        }
        
        // Can't toggle PvP while in combat
        if (player.inCombat) {
          responses.push('Không thể thay đổi trạng thái PvP khi đang chiến đấu.');
          break;
        }
        
        player.pvpEnabled = newPvpState;
        await player.save();
        
        responses.push(`Đã ${newPvpState ? 'BẬT' : 'TẮT'} chế độ PvP.`);
        if (newPvpState) {
          responses.push('Cảnh báo: Bạn có thể bị tấn công bởi người chơi khác ở khu vực không an toàn!');
        }
        break;
      }

      case 'trade': {
        // Player-to-player trading system
        const subCommand = target?.toLowerCase();
        const subTarget = args?.[0];

        if (!subCommand) {
          // Show trade status if player is in an active trade
          const playerTrade = tradeService.getPlayerTrade(playerId);
          if (playerTrade) {
            const statusLines = await formatTradeStatus(playerTrade, playerId);
            responses.push(...statusLines);
            responses.push('');
            responses.push('Lệnh: trade add/gold/lock/confirm/cancel');
          } else {
            responses.push('Sử dụng: trade [invite/accept/decline/add/gold/lock/confirm/cancel/status]');
          }
          break;
        }

        switch (subCommand) {
          case 'status': {
            // Show current trade status
            const playerTrade = tradeService.getPlayerTrade(playerId);
            if (!playerTrade) {
              responses.push('Bạn không đang trong giao dịch nào.');
              break;
            }
            
            const statusLines = await formatTradeStatus(playerTrade, playerId);
            responses.push(...statusLines);
            break;
          }

          case 'invite': {
            if (!subTarget) {
              responses.push('Mời ai giao dịch? Cú pháp: trade invite [tên người chơi]');
              break;
            }

            // Find target player
            const tradeRoom = await RoomSchema.findById(player.currentRoomId);
            if (!tradeRoom) break;

            const playersInRoom = gameState.getPlayersInRoom(tradeRoom._id.toString());
            const targetPlayer = playersInRoom.find(p =>
              p.username.toLowerCase().includes(subTarget.toLowerCase()) && p.id !== playerId
            );

            if (!targetPlayer) {
              responses.push(`Không tìm thấy người chơi "${subTarget}" ở đây.`);
              break;
            }

            const inviteResult = tradeService.inviteTrade(playerId, targetPlayer.id);
            responses.push(inviteResult.message);

            if (inviteResult.success) {
              // Send invitation to target player
              const targetPlayerObj = gameState.getPlayer(targetPlayer.id);
              if (targetPlayerObj?.ws) {
                targetPlayerObj.ws.send(JSON.stringify({
                  type: 'system',
                  category: 'trade',
                  message: `[${player.username}] muốn giao dịch với bạn. Gõ "trade accept" để chấp nhận.`
                }));
              }
            }
            break;
          }

          case 'accept': {
            // Get pending invitation
            const invitation = tradeService.getPendingInvitation(playerId);
            if (!invitation) {
              responses.push('Không có lời mời giao dịch nào.');
              break;
            }

            const acceptResult = tradeService.acceptTrade(playerId, invitation.inviterId);
            responses.push(acceptResult.message);

            if (acceptResult.success) {
              // Notify both players
              const inviterPlayer = gameState.getPlayer(invitation.inviterId);
              if (inviterPlayer?.ws) {
                inviterPlayer.ws.send(JSON.stringify({
                  type: 'system',
                  category: 'trade',
                  message: `[${player.username}] đã chấp nhận giao dịch!`
                }));
              }
            }
            break;
          }

          case 'decline': {
            // Get pending invitation
            const invitation = tradeService.getPendingInvitation(playerId);
            if (!invitation) {
              responses.push('Không có lời mời giao dịch nào.');
              break;
            }

            const declineResult = tradeService.declineTrade(playerId, invitation.inviterId);
            responses.push(declineResult.message);

            if (declineResult.success) {
              // Notify inviter
              const inviterPlayer = gameState.getPlayer(invitation.inviterId);
              if (inviterPlayer?.ws) {
                inviterPlayer.ws.send(JSON.stringify({
                  type: 'system',
                  category: 'trade',
                  message: `[${player.username}] đã từ chối giao dịch.`
                }));
              }
            }
            break;
          }

          case 'add': {
            // Add item to trade
            if (!subTarget) {
              responses.push('Thêm vật phẩm nào? Cú pháp: trade add [tên vật phẩm]');
              break;
            }

            // Find item in inventory
            const items = await ItemSchema.find({ _id: { $in: player.inventory } });
            const item = items.find((i: any) =>
              i.name.toLowerCase().includes(subTarget.toLowerCase())
            );

            if (!item) {
              responses.push(`Bạn không có "${subTarget}" trong túi đồ.`);
              break;
            }

            const addResult = tradeService.addItem(playerId, item._id.toString());
            responses.push(addResult.message);

            if (addResult.success) {
              // Notify other player
              const playerTrade = tradeService.getPlayerTrade(playerId);
              if (playerTrade) {
                const otherPlayerId = playerTrade.isInitiator
                  ? playerTrade.trade.targetId
                  : playerTrade.trade.initiatorId;
                const otherPlayer = gameState.getPlayer(otherPlayerId);
                if (otherPlayer?.ws) {
                  otherPlayer.ws.send(JSON.stringify({
                    type: 'system',
                    category: 'trade',
                    message: `[${player.username}] đã thêm [${item.name}] vào giao dịch.`
                  }));
                }
              }
            }
            break;
          }

          case 'gold': {
            // Add gold to trade
            if (!subTarget) {
              responses.push('Thêm bao nhiêu vàng? Cú pháp: trade gold [số lượng]');
              break;
            }

            const amount = parseInt(subTarget);
            if (isNaN(amount) || amount <= 0) {
              responses.push('Số lượng vàng không hợp lệ.');
              break;
            }

            if (amount > player.gold) {
              responses.push('Bạn không có đủ vàng.');
              break;
            }

            const goldResult = tradeService.addGold(playerId, amount);
            responses.push(goldResult.message);

            if (goldResult.success) {
              // Notify other player
              const playerTrade = tradeService.getPlayerTrade(playerId);
              if (playerTrade) {
                const otherPlayerId = playerTrade.isInitiator
                  ? playerTrade.trade.targetId
                  : playerTrade.trade.initiatorId;
                const otherPlayer = gameState.getPlayer(otherPlayerId);
                if (otherPlayer?.ws) {
                  otherPlayer.ws.send(JSON.stringify({
                    type: 'system',
                    category: 'trade',
                    message: `[${player.username}] đã thêm ${amount} vàng vào giao dịch.`
                  }));
                }
              }
            }
            break;
          }

          case 'lock': {
            // Lock trade
            const lockResult = tradeService.lockTrade(playerId);
            responses.push(lockResult.message);

            if (lockResult.success) {
              // Notify other player
              const playerTrade = tradeService.getPlayerTrade(playerId);
              if (playerTrade) {
                const otherPlayerId = playerTrade.isInitiator
                  ? playerTrade.trade.targetId
                  : playerTrade.trade.initiatorId;
                const otherPlayer = gameState.getPlayer(otherPlayerId);
                if (otherPlayer?.ws) {
                  otherPlayer.ws.send(JSON.stringify({
                    type: 'system',
                    category: 'trade',
                    message: `[${player.username}] đã khóa giao dịch của họ.`
                  }));
                }
              }
            }
            break;
          }

          case 'confirm': {
            // Confirm trade
            const confirmResult = tradeService.confirmTrade(playerId);
            responses.push(confirmResult.message);

            if (confirmResult.success) {
              const playerTrade = tradeService.getPlayerTrade(playerId);
              if (!playerTrade) break;

              const otherPlayerId = playerTrade.isInitiator
                ? playerTrade.trade.targetId
                : playerTrade.trade.initiatorId;
              const otherPlayer = gameState.getPlayer(otherPlayerId);

              if (confirmResult.bothConfirmed) {
                // Execute trade
                const trade = tradeService.completeTrade(playerTrade.tradeId);
                if (!trade) break;

                // Get both players
                const initiator = await PlayerSchema.findById(trade.initiatorId);
                const target = await PlayerSchema.findById(trade.targetId);

                if (!initiator || !target) {
                  responses.push('Lỗi: Không tìm thấy người chơi.');
                  break;
                }

                // Validate gold amounts
                if (initiator.gold < trade.initiatorGold) {
                  responses.push('Lỗi: Người khởi tạo không có đủ vàng để hoàn tất giao dịch.');
                  if (otherPlayer?.ws) {
                    otherPlayer.ws.send(JSON.stringify({
                      type: 'system',
                      category: 'trade',
                      message: 'Giao dịch thất bại: Người kia không có đủ vàng.'
                    }));
                  }
                  break;
                }
                if (target.gold < trade.targetGold) {
                  responses.push('Lỗi: Người đối tác không có đủ vàng để hoàn tất giao dịch.');
                  if (otherPlayer?.ws) {
                    otherPlayer.ws.send(JSON.stringify({
                      type: 'system',
                      category: 'trade',
                      message: 'Giao dịch thất bại: Bạn không có đủ vàng.'
                    }));
                  }
                  break;
                }

                // Validate items still exist in inventories
                let validationFailed = false;
                for (const itemId of trade.initiatorItems) {
                  if (!initiator.inventory.some((id: any) => id.toString() === itemId)) {
                    responses.push('Lỗi: Một số vật phẩm của bạn không còn tồn tại.');
                    if (otherPlayer?.ws) {
                      otherPlayer.ws.send(JSON.stringify({
                        type: 'system',
                        category: 'trade',
                        message: 'Giao dịch thất bại: Người kia không còn vật phẩm đã đưa ra.'
                      }));
                    }
                    validationFailed = true;
                    break;
                  }
                }
                if (validationFailed) break;
                
                for (const itemId of trade.targetItems) {
                  if (!target.inventory.some((id: any) => id.toString() === itemId)) {
                    responses.push('Lỗi: Một số vật phẩm của đối tác không còn tồn tại.');
                    if (otherPlayer?.ws) {
                      otherPlayer.ws.send(JSON.stringify({
                        type: 'system',
                        category: 'trade',
                        message: 'Giao dịch thất bại: Bạn không còn vật phẩm đã đưa ra.'
                      }));
                    }
                    validationFailed = true;
                    break;
                  }
                }
                if (validationFailed) break;

                // Exchange items using inventory service
                for (const itemId of trade.initiatorItems) {
                  const transferResult = await transferItem(trade.initiatorId, trade.targetId, itemId);
                  if (!transferResult.success) {
                    responses.push(`Lỗi khi chuyển vật phẩm: ${transferResult.message}`);
                    validationFailed = true;
                    break;
                  }
                }
                if (validationFailed) break;
                
                for (const itemId of trade.targetItems) {
                  const transferResult = await transferItem(trade.targetId, trade.initiatorId, itemId);
                  if (!transferResult.success) {
                    responses.push(`Lỗi khi chuyển vật phẩm: ${transferResult.message}`);
                    validationFailed = true;
                    break;
                  }
                }
                if (validationFailed) break;

                // Exchange gold using inventory service
                if (trade.initiatorGold > 0) {
                  const goldTransferResult = await transferGold(trade.initiatorId, trade.targetId, trade.initiatorGold);
                  if (!goldTransferResult.success) {
                    responses.push(`Lỗi khi chuyển vàng: ${goldTransferResult.message}`);
                    break;
                  }
                }
                
                if (trade.targetGold > 0) {
                  const goldTransferResult = await transferGold(trade.targetId, trade.initiatorId, trade.targetGold);
                  if (!goldTransferResult.success) {
                    responses.push(`Lỗi khi chuyển vàng: ${goldTransferResult.message}`);
                    break;
                  }
                }

                responses.push('[OK] Giao dịch thành công!');

                // Notify other player
                if (otherPlayer?.ws) {
                  otherPlayer.ws.send(JSON.stringify({
                    type: 'system',
                    category: 'trade',
                    message: '[OK] Giao dịch thành công!'
                  }));
                }
              } else {
                // Notify other player that this player confirmed
                if (otherPlayer?.ws) {
                  otherPlayer.ws.send(JSON.stringify({
                    type: 'system',
                    category: 'trade',
                    message: `[${player.username}] đã xác nhận giao dịch. Gõ "trade confirm" để hoàn tất.`
                  }));
                }
              }
            }
            break;
          }

          case 'cancel': {
            // Get trade info BEFORE canceling
            const playerTrade = tradeService.getPlayerTrade(playerId);
            
            // Cancel trade
            const cancelResult = tradeService.cancelTrade(playerId);
            responses.push(cancelResult.message);

            if (cancelResult.success && playerTrade) {
              const otherPlayerId = playerTrade.isInitiator
                ? playerTrade.trade.targetId
                : playerTrade.trade.initiatorId;
              const otherPlayer = gameState.getPlayer(otherPlayerId);
              if (otherPlayer?.ws) {
                otherPlayer.ws.send(JSON.stringify({
                  type: 'system',
                  category: 'trade',
                  message: `[${player.username}] đã hủy giao dịch.`
                }));
              }
            }
            break;
          }

          default:
            responses.push('Lệnh giao dịch không hợp lệ.');
            responses.push('Sử dụng: trade [invite/accept/decline/add/gold/lock/confirm/cancel]');
            break;
        }
        break;
      }

      case 'world':
      case 'w':
        responses.push(...await handleWorldCommand(playerId, player, target, args));
        break;

      case 'guild':
      case 'g':
        responses.push(...await handleGuildChatCommand(playerId, player, target, args));
        break;

      case 'auto': {
        // Toggle auto-attack mode
        const playerState = gameState.getPlayerState(playerId);
        
        // Check if player is in combat
        if (!player.inCombat) {
          // Toggle global autoCombat setting when not in combat
          player.autoCombat = !player.autoCombat;
          await player.save();
          
          if (player.autoCombat) {
            responses.push('✓ Tự động tấn công đã được BẬT. Bạn sẽ tự động tấn công quái khi bắt đầu chiến đấu.');
          } else {
            responses.push('✗ Tự động tấn công đã được TẮT. Bạn sẽ phải đánh thủ công khi trong chiến đấu.');
          }
        } else {
          // Toggle auto-attack for current combat
          if (!playerState) {
            responses.push('Lỗi: Không tìm thấy trạng thái người chơi.');
            break;
          }
          
          playerState.isAutoAttacking = !playerState.isAutoAttacking;
          
          if (playerState.isAutoAttacking) {
            responses.push('[AUTO] Đã BẬT tự động tấn công cho trận chiến này.');
          } else {
            responses.push('[AUTO] Đã TẮT tự động tấn công. Sử dụng lệnh "attack" hoặc kỹ năng để tấn công.');
          }
        }
        break;
      }

      case 'quit':
        responses.push('Tạm biệt! Hẹn gặp lại.');
        break;

      case 'alias': {
        // Custom alias management
        const subCommand = target?.toLowerCase();
        const aliasName = args?.[0];
        const aliasCommand = args?.slice(1).join(' ');

        if (!subCommand) {
          responses.push('═══════════════════════════════════════════════════');
          responses.push('            HỆ THỐNG LỆNH TẮT TÙY CHỈNH           ');
          responses.push('═══════════════════════════════════════════════════');
          responses.push('alias add [tên] [lệnh]   - Tạo lệnh tắt mới');
          responses.push('alias remove [tên]       - Xóa lệnh tắt');
          responses.push('alias list               - Xem danh sách lệnh tắt');
          responses.push('');
          responses.push('Ví dụ: alias add dn go north');
          responses.push('       Sau đó gõ "dn" để thực hiện "go north"');
          break;
        }

        switch (subCommand) {
          case 'add': {
            if (!aliasName || !aliasCommand) {
              responses.push('Cú pháp: alias add [tên] [lệnh]');
              responses.push('Ví dụ: alias add dn go north');
              break;
            }

            // Validate alias name (no spaces, no special chars)
            if (!/^[a-zA-Z0-9_]+$/.test(aliasName)) {
              responses.push('Tên lệnh tắt chỉ được chứa chữ cái, số và dấu gạch dưới.');
              break;
            }

            // Prevent overriding built-in commands
            if (BUILT_IN_COMMANDS.includes(aliasName.toLowerCase())) {
              responses.push(`Không thể đặt lệnh tắt trùng với lệnh hệ thống: "${aliasName}"`);
              break;
            }

            // Initialize customAliases if not exists
            if (!player.customAliases) {
              player.customAliases = new Map();
            }

            // Check if alias already exists
            if (player.customAliases.has(aliasName)) {
              responses.push(`Lệnh tắt "${aliasName}" đã tồn tại. Sử dụng "alias remove ${aliasName}" để xóa trước.`);
              break;
            }

            // Add the alias
            player.customAliases.set(aliasName, aliasCommand);
            await player.save();

            responses.push(`[OK] Đã tạo lệnh tắt: "${aliasName}" -> "${aliasCommand}"`);
            responses.push(`Gõ "${aliasName}" để thực hiện lệnh.`);
            break;
          }

          case 'remove': {
            if (!aliasName) {
              responses.push('Cú pháp: alias remove [tên]');
              break;
            }

            if (!player.customAliases || !player.customAliases.has(aliasName)) {
              responses.push(`Lệnh tắt "${aliasName}" không tồn tại.`);
              break;
            }

            player.customAliases.delete(aliasName);
            await player.save();

            responses.push(`[OK] Đã xóa lệnh tắt: "${aliasName}"`);
            break;
          }

          case 'list': {
            if (!player.customAliases || player.customAliases.size === 0) {
              responses.push('Bạn chưa có lệnh tắt nào.');
              responses.push('Sử dụng "alias add [tên] [lệnh]" để tạo lệnh tắt mới.');
              break;
            }

            responses.push('═══════════════════════════════════════════════════');
            responses.push('            DANH SÁCH LỆNH TẮT CỦA BẠN           ');
            responses.push('═══════════════════════════════════════════════════');
            
            for (const [alias, command] of player.customAliases.entries()) {
              responses.push(`  ${alias} -> ${command}`);
            }
            
            responses.push('');
            responses.push(`Tổng: ${player.customAliases.size} lệnh tắt`);
            break;
          }

          default:
            responses.push('Lệnh không hợp lệ. Sử dụng: alias [add/remove/list]');
            break;
        }
        break;
      }

      case 'dungeon': {
        // Dungeon system commands
        const subCommand = target?.toLowerCase();
        const { getDungeonStatus, startChallenge } = await import('./dungeonService');

        if (!subCommand || subCommand === 'status') {
          // Show dungeon status
          const statusResult = await getDungeonStatus(playerId);
          if (statusResult.success) {
            const { currentFloor, highestFloor, dungeonCoin, lastWeeklyReset } = statusResult.data;
            responses.push('═══════════════════════════════════════════════════');
            responses.push('            HẦM NGỤC                               ');
            responses.push('═══════════════════════════════════════════════════');
            responses.push(`Tầng hiện tại: ${currentFloor}`);
            responses.push(`Tầng cao nhất: ${highestFloor}`);
            responses.push(`Xu Hầm Ngục: ${dungeonCoin}`);
            responses.push('');
            responses.push('Lệnh:');
            responses.push('  dungeon enter    - Bắt đầu thử thách');
            responses.push('  dungeon status   - Xem trạng thái');
          } else {
            responses.push(statusResult.message);
          }
          break;
        }

        if (subCommand === 'enter') {
          // Start dungeon challenge
          const statusResult = await getDungeonStatus(playerId);
          if (!statusResult.success) {
            responses.push(statusResult.message);
            break;
          }

          const currentFloor = statusResult.data.currentFloor;
          const challengeResult = await startChallenge(playerId, currentFloor);
          
          if (challengeResult.success) {
            responses.push(challengeResult.message);
            responses.push('Sử dụng lệnh "attack" hoặc "a" để chiến đấu!');
          } else {
            responses.push(challengeResult.message);
          }
          break;
        }

        responses.push('Lệnh không hợp lệ. Sử dụng: dungeon [enter/status]');
        break;
      }

      case 'trial':
      case 'thử luyện':
      case 'thu luyen': {
        // Pet Trial Tower commands
        const subCommand = target?.toLowerCase();
        const { getPetTrialStatus, startTrial } = await import('./petTrialService');

        if (!subCommand || subCommand === 'status') {
          // Show pet trial status
          const statusResult = await getPetTrialStatus(playerId);
          if (statusResult.success) {
            const { currentFloor, highestFloor, tamerBadge, lastWeeklyReset } = statusResult.data;
            responses.push('═══════════════════════════════════════════════════');
            responses.push('         THÁP THỬ LUYỆN THÚ CƯNG                  ');
            responses.push('═══════════════════════════════════════════════════');
            responses.push(`Tầng hiện tại: ${currentFloor}`);
            responses.push(`Tầng cao nhất: ${highestFloor}`);
            responses.push(`Huy Hiệu Huấn Luyện: ${tamerBadge} 🎖️`);
            responses.push('');
            responses.push('Lưu ý:');
            responses.push('  - Chỉ thú cưng mới có thể chiến đấu');
            responses.push('  - Bạn sẽ bị PACIFIED (không thể tấn công)');
            responses.push('  - Dùng vật phẩm để hỗ trợ thú cưng');
            responses.push('');
            responses.push('Lệnh:');
            responses.push('  trial enter      - Bắt đầu thử luyện');
            responses.push('  trial status     - Xem trạng thái');
          } else {
            responses.push(statusResult.message);
          }
          break;
        }

        if (subCommand === 'enter') {
          // Start pet trial challenge
          const trialResult = await startTrial(playerId);
          
          if (trialResult.success) {
            responses.push(trialResult.message);
          } else {
            responses.push(trialResult.message);
          }
          break;
        }

        responses.push('Lệnh không hợp lệ. Sử dụng: trial [enter/status]');
        break;
      }

      case 'tiếp':
      case 'tiep':
      case 'next': {
        // Continue to next floor (dungeon or pet trial)
        // Check which system the player is in based on room
        const room = await RoomSchema.findById(player.currentRoomId);
        
        if (room && room.name === 'Tháp Thử Luyện - Đấu Trường') {
          // In Pet Trial Tower
          const { startTrial } = await import('./petTrialService');
          const trialResult = await startTrial(playerId);
          
          if (trialResult.success) {
            responses.push(trialResult.message);
          } else {
            responses.push(trialResult.message);
          }
        } else {
          // In Dungeon
          const { getDungeonStatus, startChallenge } = await import('./dungeonService');
          
          const statusResult = await getDungeonStatus(playerId);
          if (!statusResult.success) {
            responses.push(statusResult.message);
            break;
          }

          const currentFloor = statusResult.data.currentFloor;
          const challengeResult = await startChallenge(playerId, currentFloor);
          
          if (challengeResult.success) {
            responses.push(challengeResult.message);
            responses.push('Sử dụng lệnh "attack" hoặc "a" để chiến đấu!');
          } else {
            responses.push(challengeResult.message);
          }
        }
        break;
      }

      case 'pet': {
        // Pet management commands
        responses.push('═══════════════════════════════════════════════════');
        responses.push('            HỆ THỐNG THÚ CƯNG                      ');
        responses.push('═══════════════════════════════════════════════════');
        responses.push('summon [tên]       - Triệu hồi thú cưng');
        responses.push('unsummon           - Thu hồi thú cưng');
        responses.push('pet attack [tên]   - Ra lệnh pet tấn công');
        responses.push('pet follow         - Ra lệnh pet theo sau');
        responses.push('hatch              - Mở UI ấp trứng thú cưng');
        responses.push('use [trứng]        - Nở trứng thú cưng (cách cũ)');
        responses.push('use [thức ăn]      - Cho pet ăn để lên cấp');
        responses.push('');
        responses.push('Mở menu Pet từ UI để xem chi tiết chuồng thú cưng!');
        responses.push('═══════════════════════════════════════════════════');
        break;
      }

      case 'summon': {
        if (!target) {
          responses.push('Bạn muốn triệu hồi thú cưng nào?');
          responses.push('Cú pháp: summon [tên pet]');
          break;
        }

        // Find pet in player's stable
        const pets = await PetSchema.find({ _id: { $in: player.petStable || [] } });
        const pet = pets.find((p: any) => 
          p.nickname.toLowerCase().includes(target.toLowerCase())
        );

        if (!pet) {
          responses.push(`Bạn không có thú cưng nào tên "${target}" trong chuồng.`);
          break;
        }

        const summonResult = await summonPet(player._id.toString(), pet._id.toString());
        responses.push(summonResult.message);
        
        if (summonResult.success) {
          responses.push(`[${pet.nickname}] (Cấp ${pet.level}) đã xuất hiện bên cạnh bạn!`);
        }
        break;
      }

      case 'unsummon': {
        if (!player.activePetId) {
          responses.push('Bạn không có thú cưng nào được triệu hồi.');
          break;
        }

        const unsummonResult = await unsummonPet(player._id.toString());
        responses.push(unsummonResult.message);
        break;
      }

      // Socketing System Commands
      case 'socket': {
        // Socket a gem into equipment
        // Usage: socket <gem_name> <equipment_name>
        if (!target || !args || args.length === 0) {
          responses.push('Sử dụng: socket <tên ngọc> <tên trang bị>');
          responses.push('Ví dụ: socket "ngọc tấn công cấp 1" "kiếm hầm ngục"');
          break;
        }

        const gemName = target.toLowerCase();
        const equipName = args.join(' ').toLowerCase();

        // Get all items from inventory
        const inventoryItems = await ItemSchema.find({ _id: { $in: player.inventory } });

        // Find gem in inventory
        const gemItem = await findItemInInventory(inventoryItems, gemName);
        if (!gemItem) {
          responses.push(`Không tìm thấy ngọc "${target}" trong túi đồ.`);
          break;
        }

        if (gemItem.type !== 'GEM') {
          responses.push(`[${gemItem.name}] không phải là ngọc.`);
          break;
        }

        // Find equipment in inventory or equipped items
        const equipItem = await findItemInInventory(inventoryItems, equipName);
        if (!equipItem) {
          responses.push(`Không tìm thấy trang bị "${args.join(' ')}" trong túi đồ.`);
          break;
        }

        // Check if item is equipment
        if (!equipItem.slot) {
          responses.push(`[${equipItem.name}] không phải là trang bị.`);
          break;
        }

        // Check if equipment has sockets
        if (!equipItem.maxSockets || equipItem.maxSockets === 0) {
          responses.push(`[${equipItem.name}] không có lỗ khảm nào.`);
          responses.push('Sử dụng [Đục Khảm] để thêm lỗ khảm vào trang bị.');
          break;
        }

        // Check current socketed gems
        const currentGems = equipItem.socketedGems || [];
        const currentSocketsCount = equipItem.currentSockets || 0;
        if (currentSocketsCount === 0) {
          responses.push(`[${equipItem.name}] chưa được đục lỗ. Sử dụng [Đục Khảm] để thêm lỗ.`);
          break;
        }
        if (currentGems.length >= currentSocketsCount) {
          responses.push(`[${equipItem.name}] đã đầy lỗ khảm (${currentGems.length}/${currentSocketsCount}).`);
          break;
        }

        // Socket the gem (remove from inventory, add to equipment)
        player.inventory = player.inventory.filter((id: any) => id.toString() !== gemItem._id.toString());
        equipItem.socketedGems = [...currentGems, gemItem._id];
        await equipItem.save();
        await player.save();

        responses.push(`✨ Đã khảm [${gemItem.name}] vào [${equipItem.name}]!`);
        responses.push(`Lỗ khảm: ${equipItem.socketedGems.length}/${currentSocketsCount}`);
        
        // Show bonus stats
        const gemTypeName = gemItem.gemType === 'attack' ? 'Sát Thương' :
                           gemItem.gemType === 'hp' ? 'HP' :
                           gemItem.gemType === 'defense' ? 'Phòng Thủ' :
                           gemItem.gemType === 'critChance' ? 'Tỷ Lệ Chí Mạng' :
                           gemItem.gemType === 'critDamage' ? 'Sát Thương Chí Mạng' :
                           gemItem.gemType === 'dodge' ? 'Né Tránh' :
                           gemItem.gemType === 'lifesteal' ? 'Hút Máu' : 'Unknown';
        const valueStr = gemItem.gemType === 'critChance' || gemItem.gemType === 'dodge' || gemItem.gemType === 'lifesteal'
                        ? `+${gemItem.gemValue}%`
                        : `+${gemItem.gemValue}`;
        responses.push(`Bonus: ${gemTypeName} ${valueStr}`);
        break;
      }

      case 'unsocket': {
        // Remove gems from equipment
        // Usage: unsocket <equipment_name>
        if (!target) {
          responses.push('Sử dụng: unsocket <tên trang bị>');
          responses.push('Ví dụ: unsocket "kiếm hầm ngục"');
          break;
        }

        const equipName = target.toLowerCase();

        // Get all items from inventory
        const inventoryItems = await ItemSchema.find({ _id: { $in: player.inventory } });

        // Find equipment in inventory
        const equipItem = await findItemInInventory(inventoryItems, equipName);
        if (!equipItem) {
          responses.push(`Không tìm thấy trang bị "${target}" trong túi đồ.`);
          break;
        }

        // Check if item has socketed gems
        const currentGems = equipItem.socketedGems || [];
        if (currentGems.length === 0) {
          responses.push(`[${equipItem.name}] không có ngọc nào được khảm.`);
          break;
        }

        // Get gem details
        const gems = await ItemSchema.find({ _id: { $in: currentGems } });

        // Remove all gems from equipment, add back to inventory
        equipItem.socketedGems = [];
        player.inventory.push(...currentGems);
        await equipItem.save();
        await player.save();

        responses.push(`✨ Đã tháo ${gems.length} viên ngọc khỏi [${equipItem.name}]!`);
        gems.forEach((gem: any) => {
          responses.push(`  - [${gem.name}]`);
        });
        break;
      }

      case 'combine': {
        // Combine gems at Jeweler NPC
        // Usage: combine gem <type>
        // Example: combine gem attack
        if (!target || target.toLowerCase() !== 'gem') {
          responses.push('Sử dụng: combine gem <loại>');
          responses.push('Loại: attack, hp, defense, critchance');
          responses.push('Ví dụ: combine gem attack');
          break;
        }

        if (!args || args.length === 0) {
          responses.push('Bạn muốn kết hợp ngọc loại gì?');
          responses.push('Loại: attack, hp, defense, critchance');
          break;
        }

        const gemType = args[0].toLowerCase();
        const validTypes = ['attack', 'hp', 'defense', 'critchance'];
        if (!validTypes.includes(gemType)) {
          responses.push(`Loại ngọc không hợp lệ: "${gemType}"`);
          responses.push('Loại hợp lệ: attack, hp, defense, critchance');
          break;
        }

        // Check if player is at Jeweler
        const combineRoom = await RoomSchema.findById(player.currentRoomId);
        if (!combineRoom) {
          responses.push('Lỗi: Không tìm thấy phòng hiện tại.');
          break;
        }

        const jeweler = await AgentSchema.findOne({
          _id: { $in: combineRoom.agents || [] },
          agentKey: 'jeweler'
        });

        if (!jeweler) {
          responses.push('Bạn cần đến gặp [Thợ Kim Hoàn] để kết hợp ngọc!');
          break;
        }

        // Find 3 gems of the same type and tier in inventory
        const allItems = await ItemSchema.find({ _id: { $in: player.inventory } });
        const gems = allItems.filter((item: any) => 
          item.type === 'GEM' && 
          item.gemType === gemType
        );

        // Group by tier
        const tier1Gems = gems.filter((g: any) => g.gemTier === 1);
        const tier2Gems = gems.filter((g: any) => g.gemTier === 2);

        let sourceTier = 0;
        let targetTier = 0;
        let sourceGems: any[] = [];
        let resultGemKey = '';

        if (tier1Gems.length >= 3) {
          sourceTier = 1;
          targetTier = 2;
          sourceGems = tier1Gems.slice(0, 3);
          resultGemKey = `gem_${gemType}_t2`;
        } else if (tier2Gems.length >= 3) {
          sourceTier = 2;
          targetTier = 3;
          sourceGems = tier2Gems.slice(0, 3);
          resultGemKey = `gem_${gemType}_t3`;
        } else {
          responses.push(`Bạn cần ít nhất 3 viên [Ngọc Cấp 1] hoặc [Ngọc Cấp 2] cùng loại.`);
          responses.push(`Hiện tại có: Cấp 1: ${tier1Gems.length}, Cấp 2: ${tier2Gems.length}`);
          break;
        }

        // Check gold cost
        const goldCost = 50 * targetTier; // 100 for T2, 150 for T3
        if (player.gold < goldCost) {
          responses.push(`Không đủ vàng! Cần ${goldCost} vàng để kết hợp.`);
          break;
        }

        // Find result gem template
        const resultTemplate = await ItemSchema.findOne({ itemKey: resultGemKey });
        if (!resultTemplate) {
          responses.push(`Lỗi: Không tìm thấy công thức kết hợp.`);
          break;
        }

        // Create result gem
        const resultGem = await ItemSchema.create({
          name: resultTemplate.name,
          description: resultTemplate.description,
          type: resultTemplate.type,
          value: resultTemplate.value,
          sellValue: resultTemplate.sellValue,
          gemType: resultTemplate.gemType,
          gemTier: resultTemplate.gemTier,
          gemValue: resultTemplate.gemValue,
          quality: resultTemplate.quality
        });

        // Remove source gems from inventory
        player.inventory = player.inventory.filter((id: any) => 
          !sourceGems.some(gem => gem._id.toString() === id.toString())
        );

        // Add result gem to inventory
        player.inventory.push(resultGem._id);

        // Deduct gold
        player.gold -= goldCost;

        await player.save();

        // Delete consumed gems from database to prevent orphaned documents
        await ItemSchema.deleteMany({
          _id: { $in: sourceGems.map(gem => gem._id) }
        });

        responses.push('═══════════════════════════════════════');
        responses.push(`✨ [Thợ Kim Hoàn] đã kết hợp thành công!`);
        responses.push('─────────────────────────────────────');
        responses.push(`3x [${sourceGems[0].name}] → 1x [${resultGem.name}]`);
        responses.push(`Chi phí: ${goldCost} vàng`);
        responses.push('═══════════════════════════════════════');
        break;
      }

      case 'addsocket': {
        // Add a socket to equipment using Socket Punch item
        // Usage: addsocket <equipment_name>
        if (!target) {
          responses.push('Sử dụng: addsocket <tên trang bị>');
          responses.push('Ví dụ: addsocket "kiếm hầm ngục"');
          break;
        }

        const equipName = target.toLowerCase();

        // Find Socket Punch item in inventory
        const punchItem = await ItemSchema.findOne({
          _id: { $in: player.inventory },
          type: 'SOCKET_PUNCH',
          canAddSocket: true
        });

        if (!punchItem) {
          responses.push('Bạn cần có [Đục Khảm] để thêm lỗ khảm vào trang bị!');
          break;
        }

        // Get all items from inventory
        const inventoryItems = await ItemSchema.find({ _id: { $in: player.inventory } });

        // Find equipment in inventory
        const equipItem = await findItemInInventory(inventoryItems, equipName);
        if (!equipItem) {
          responses.push(`Không tìm thấy trang bị "${target}" trong túi đồ.`);
          break;
        }

        // Check if item is equipment
        if (!equipItem.slot) {
          responses.push(`[${equipItem.name}] không phải là trang bị.`);
          break;
        }

        // Initialize currentSockets if not set
        const currentSocketsCount = equipItem.currentSockets || 0;
        const maxSocketsCount = equipItem.maxSockets || 0;

        // Check if equipment can have sockets
        if (maxSocketsCount === 0) {
          responses.push(`[${equipItem.name}] không thể đục lỗ khảm.`);
          break;
        }

        // Check if equipment has reached max sockets
        if (currentSocketsCount >= maxSocketsCount) {
          responses.push(`[${equipItem.name}] đã đạt số lỗ khảm tối đa (${maxSocketsCount}).`);
          break;
        }

        // Add a socket
        equipItem.currentSockets = currentSocketsCount + 1;

        // Remove Socket Punch from inventory
        player.inventory = player.inventory.filter((id: any) => id.toString() !== punchItem._id.toString());

        await equipItem.save();
        await player.save();

        // Delete consumed Socket Punch from database
        await ItemSchema.findByIdAndDelete(punchItem._id);

        responses.push('═══════════════════════════════════════');
        responses.push(`✨ Đã thêm lỗ khảm vào [${equipItem.name}]!`);
        responses.push(`Lỗ khảm: ${equipItem.currentSockets}/${equipItem.maxSockets}`);
        responses.push('═══════════════════════════════════════');
        break;
      }

      default:
        responses.push(`Lệnh không hợp lệ: "${action}"`);
        responses.push('Gõ "help" để xem danh sách lệnh.');
        break;
    }

    return responses;

  } catch (error) {
    console.error('Error handling command:', error);
    return ['Lỗi khi xử lý lệnh. Vui lòng thử lại.'];
  }
}
