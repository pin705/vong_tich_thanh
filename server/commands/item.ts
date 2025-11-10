import type { Command } from '~/types';
import { PlayerSchema } from '../../models/Player';
import { RoomSchema } from '../../models/Room';
import { ItemSchema } from '../../models/Item';
import { AgentSchema } from '../../models/Agent';
import { BuffSchema } from '../../models/Buff';
import { gameState } from '../utils/gameState';
import { partyService } from '../utils/partyService';
import { deduplicateItemsById } from '../utils/itemDeduplication';
import { postEvent as postAchievementEvent } from '../utils/achievementService';

/**
 * Handle item-related commands (get, drop, use, inventory, list, buy, sell)
 */
export async function handleItemCommand(command: Command, playerId: string): Promise<string[]> {
  const { action, target } = command;
  const responses: string[] = [];

  try {
    const player = await PlayerSchema.findById(playerId).populate('inventory');
    if (!player) {
      responses.push('Lỗi: Không tìm thấy thông tin người chơi.');
      return responses;
    }

    switch (action) {
      case 'inventory':
      case 'i': {
        if (!player.inventory || player.inventory.length === 0) {
          responses.push('Túi đồ của bạn trống.');
          break;
        }

        responses.push('═══════════════════════════════════');
        responses.push('           TÚI ĐỒ                  ');
        responses.push('═══════════════════════════════════');
        const items = await ItemSchema.find({ _id: { $in: player.inventory } });
        items.forEach((item: any, index: number) => {
          responses.push(`${index + 1}. [${item.name}]`);
          if (item.description) {
            responses.push(`   ${item.description}`);
          }
        });
        responses.push('═══════════════════════════════════');
        break;
      }

      case 'get':
      case 'g': {
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

        const room = await RoomSchema.findById(player.currentRoomId);
        if (!room || !room.items || room.items.length === 0) {
          responses.push(`Không có "${target}" ở đây để nhặt.`);
          break;
        }

        const items = await ItemSchema.find({ _id: { $in: room.items } });
        const item = items.find((i: any) => 
          i.name.toLowerCase().includes(target.toLowerCase())
        );

        if (!item) {
          responses.push(`Không có "${target}" ở đây để nhặt.`);
          break;
        }

        // Remove from room, add to player inventory
        room.items = room.items.filter((id: any) => id.toString() !== item._id.toString());
        await room.save();

        player.inventory.push(item._id);
        await player.save();

        responses.push(`Bạn nhặt [${item.name}].`);
        
        // Achievement system - post GET_ITEM event
        if (item.itemKey) {
          await postAchievementEvent(playerId, 'GET_ITEM', { key: item.itemKey });
        }
        
        // Advance loot turn if in party with round-robin
        const playerParty = partyService.getPlayerParty(playerId);
        if (playerParty && playerParty.party.lootRule === 'round-robin') {
          partyService.advanceLootTurn(playerParty.partyId);
          
          // Notify next looter
          const nextLooter = partyService.getNextLooter(playerParty.partyId);
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
          room._id.toString(),
          {
            type: 'normal',
            message: `[${player.username}] nhặt [${item.name}].`
          },
          playerId
        );
        break;
      }

      case 'drop': {
        if (!target) {
          responses.push('Bạn muốn thả gì?');
          break;
        }

        const items = await ItemSchema.find({ _id: { $in: player.inventory } });
        const item = items.find((i: any) => 
          i.name.toLowerCase().includes(target.toLowerCase())
        );

        if (!item) {
          responses.push(`Bạn không có "${target}" trong túi đồ.`);
          break;
        }

        const room = await RoomSchema.findById(player.currentRoomId);
        if (!room) {
          responses.push('Lỗi: Không tìm thấy phòng hiện tại.');
          break;
        }

        // Remove from player, add to room
        player.inventory = player.inventory.filter((id: any) => id.toString() !== item._id.toString());
        await player.save();

        room.items.push(item._id);
        await room.save();

        responses.push(`Bạn thả [${item.name}] xuống đất.`);
        
        // Broadcast to room
        gameState.broadcastToRoom(
          room._id.toString(),
          {
            type: 'normal',
            message: `[${player.username}] thả [${item.name}] xuống đất.`
          },
          playerId
        );
        break;
      }

      case 'use': {
        if (!target) {
          responses.push('Bạn muốn sử dụng gì?');
          break;
        }
        
        const items = await ItemSchema.find({ _id: { $in: player.inventory } });
        const item = items.find((i: any) => 
          i.name.toLowerCase().includes(target.toLowerCase())
        );

        if (!item) {
          responses.push(`Bạn không có "${target}" trong túi đồ.`);
          break;
        }

        // Handle Recipe items - learn the recipe
        if (item.type === 'Recipe') {
          // Check if player already knows this recipe
          if (player.knownRecipes && player.knownRecipes.some((r: any) => r.toString() === item._id.toString())) {
            responses.push(`Bạn đã biết công thức [${item.name}] rồi!`);
            break;
          }
          
          // Add recipe to known recipes
          if (!player.knownRecipes) {
            player.knownRecipes = [];
          }
          player.knownRecipes.push(item._id);
          
          // Remove recipe item from inventory
          player.inventory = player.inventory.filter((id: any) => id.toString() !== item._id.toString());
          await player.save();
          
          responses.push(`[+] Bạn đã học công thức [${item.name}]!`);
          responses.push('Bạn có thể chế tạo vật phẩm này từ menu [Chế Tạo].');
          break;
        }
        // Handle consumable items
        else if (item.type === 'consumable') {
          // Handle healing items
          if (item.stats?.healing) {
            const healAmount = item.stats.healing;
            const oldHp = player.hp;
            player.hp = Math.min(player.maxHp, player.hp + healAmount);
            const actualHeal = player.hp - oldHp;
            
            // Remove item from inventory
            player.inventory = player.inventory.filter((id: any) => id.toString() !== item._id.toString());
            await player.save();
            
            // Delete the consumed item
            await ItemSchema.findByIdAndDelete(item._id);
            
            responses.push(`Bạn sử dụng [${item.name}], hồi phục ${actualHeal} HP.`);
            responses.push(`HP hiện tại: ${player.hp}/${player.maxHp}`);
            
            // Broadcast to room
            const room = await RoomSchema.findById(player.currentRoomId);
            if (room) {
              gameState.broadcastToRoom(
                room._id.toString(),
                {
                  type: 'normal',
                  message: `[${player.username}] sử dụng [${item.name}].`
                },
                playerId
              );
            }
          } 
          // Handle buff items (like EXP boost)
          else if (item.effects && item.effects.buff) {
            const buffType = item.effects.buff;
            const multiplier = item.effects.multiplier || 1;
            const durationMinutes = item.effects.duration_minutes || 60;
            
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
            player.inventory = player.inventory.filter((id: any) => id.toString() !== item._id.toString());
            await player.save();
            
            // Delete the consumed item
            await ItemSchema.findByIdAndDelete(item._id);
            
            responses.push(`[+] Bạn đã kích hoạt [${item.name}]!`);
            responses.push(`[+] Bạn sẽ nhận được ${multiplier}x EXP trong ${durationMinutes} phút!`);
            
            // Broadcast to room
            const room = await RoomSchema.findById(player.currentRoomId);
            if (room) {
              gameState.broadcastToRoom(
                room._id.toString(),
                {
                  type: 'normal',
                  message: `[+] [${player.username}] đã kích hoạt [${item.name}]!`
                },
                playerId
              );
            }
          }
          // Handle title badges
          else if (item.type === 'TITLE_BADGE' && item.grantTitle) {
            // Grant the title to the player
            player.title = item.grantTitle;
            
            // Remove item from inventory
            player.inventory = player.inventory.filter((id: any) => id.toString() !== item._id.toString());
            await player.save();
            
            // Delete the consumed item
            await ItemSchema.findByIdAndDelete(item._id);
            
            responses.push(`═══════════════════════════════════`);
            responses.push(`[***] Bạn đã nhận được danh hiệu mới! [***]`);
            responses.push(`[${item.grantTitle}]`);
            responses.push(`═══════════════════════════════════`);
            
            // Broadcast to room
            const room = await RoomSchema.findById(player.currentRoomId);
            if (room) {
              gameState.broadcastToRoom(
                room._id.toString(),
                {
                  type: 'critical',
                  message: `[***] [${player.username}] đã nhận được danh hiệu [${item.grantTitle}]! [***]`
                },
                playerId
              );
            }
          }
          // Handle premium pet food
          else if (item.type === 'PET_FOOD' && item.data?.expBonus) {
            if (!player.activePetId) {
              responses.push('Bạn cần triệu hồi pet trước khi cho ăn!');
              break;
            }
            
            const { addExp: addPetExp } = await import('../utils/petService');
            const expResult = await addPetExp(player.activePetId.toString(), item.data.expBonus);
            
            if (expResult.success) {
              // Remove item from inventory
              player.inventory = player.inventory.filter((id: any) => id.toString() !== item._id.toString());
              await player.save();
              
              // Delete the consumed item
              await ItemSchema.findByIdAndDelete(item._id);
              
              responses.push(`Bạn cho pet ăn [${item.name}].`);
              responses.push(`[${expResult.pet.nickname}] nhận được ${item.data.expBonus} EXP!`);
              
              if (expResult.leveledUp && expResult.leveledUp.length > 0) {
                for (const level of expResult.leveledUp) {
                  responses.push('═══════════════════════════════════');
                  responses.push(`[${expResult.pet.nickname}] ĐÃ LÊN CẤP ${level}!`);
                  responses.push('═══════════════════════════════════');
                }
              }
            }
          } else {
            responses.push(`Bạn không thể sử dụng [${item.name}] ngay bây giờ.`);
          }
        }
        // Handle PET_EGG items - hatch a pet
        else if (item.type === 'PET_EGG') {
          if (!item.data?.grantsPetKey) {
            responses.push(`[${item.name}] không có thông tin pet.`);
            break;
          }

          // Import pet service functions
          const { determinePetQuality } = await import('../utils/petService');
          const { PetTemplateSchema } = await import('../../models/PetTemplate');
          const { PetSchema } = await import('../../models/Pet');

          // Get pet template
          const petTemplate = await PetTemplateSchema.findOne({ petKey: item.data.grantsPetKey });
          if (!petTemplate) {
            responses.push(`Không tìm thấy thông tin pet cho [${item.name}].`);
            break;
          }

          // Determine pet quality
          const quality = determinePetQuality();

          // Create new pet
          const newPet = await PetSchema.create({
            ownerId: player._id,
            templateId: petTemplate._id,
            petKey: item.data.grantsPetKey,
            nickname: petTemplate.name,
            quality,
            level: 1,
            exp: 0,
            hp: petTemplate.baseStats.hp,
            maxHp: petTemplate.baseStats.hp,
            damage: petTemplate.baseStats.damage,
            defense: petTemplate.baseStats.defense,
            isActive: false
          });

          // Add pet to player's pets list
          if (!player.pets) {
            player.pets = [];
          }
          player.pets.push(newPet._id);

          // Remove egg from inventory
          player.inventory = player.inventory.filter((id: any) => id.toString() !== item._id.toString());
          await player.save();

          // Delete the consumed egg
          await ItemSchema.findByIdAndDelete(item._id);

          responses.push('═══════════════════════════════════');
          responses.push(`[***] Bạn đã ấp nở một con pet mới! [***]`);
          responses.push(`Tên: [${newPet.nickname}]`);
          responses.push(`Phẩm chất: ${quality}`);
          responses.push('═══════════════════════════════════');
          responses.push('Sử dụng lệnh "pet" để xem và quản lý pet của bạn.');

          // Broadcast to room
          const room = await RoomSchema.findById(player.currentRoomId);
          if (room) {
            gameState.broadcastToRoom(
              room._id.toString(),
              {
                type: 'critical',
                message: `[***] [${player.username}] đã ấp nở một con pet mới: [${newPet.nickname}]! [***]`
              },
              playerId
            );
          }
        } else {
          responses.push(`[${item.name}] không phải là vật phẩm có thể sử dụng.`);
        }
        break;
      }

      case 'list': {
        const room = await RoomSchema.findById(player.currentRoomId);
        if (!room || !room.agents || room.agents.length === 0) {
          responses.push('Không có ai ở đây để bán hàng.');
          break;
        }

        const vendors = await AgentSchema.find({ 
          _id: { $in: room.agents },
          isVendor: true
        }).populate('shopInventory').populate('shopItems');

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

        const currencySymbol = vendor.shopType === 'premium' ? '💎' : '💰';
        responses.push(`════════ HÀNG CỦA ${vendor.name.toUpperCase()} ════════`);
        uniqueItems.forEach((item: any, index: number) => {
          const itemPrice = vendor.shopType === 'premium' ? (item.premiumPrice ?? 0) : (item.price ?? 0);
          const spaces = ' '.repeat(Math.max(20 - item.name.length, 1));
          responses.push(`${index + 1}. [${item.name}]${spaces}- ${itemPrice} ${currencySymbol}`);
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

        const room = await RoomSchema.findById(player.currentRoomId);
        if (!room || !room.agents || room.agents.length === 0) {
          responses.push('Không có ai ở đây để bán hàng.');
          break;
        }

        const vendors = await AgentSchema.find({ 
          _id: { $in: room.agents },
          isVendor: true
        }).populate('shopInventory').populate('shopItems');

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
        const item = uniqueItems.find((i: any) => 
          i.name.toLowerCase().includes(target.toLowerCase())
        );

        if (!item) {
          responses.push(`[${vendor.name}] không bán "${target}".`);
          break;
        }

        // Check price based on shop type
        const isPremiumShop = vendor.shopType === 'premium';
        const itemPrice = isPremiumShop ? (item.premiumPrice ?? 0) : (item.price ?? 0);
        const currencySymbol = isPremiumShop ? '💎' : '💰';

        // Validate that item has a valid price
        if (itemPrice <= 0) {
          responses.push(`[${item.name}] không có giá bán.`);
          break;
        }

        if (isPremiumShop) {
          if (player.premiumCurrency < itemPrice) {
            responses.push(`Bạn không có đủ Cổ Thạch để mua [${item.name}]. Cần ${itemPrice} ${currencySymbol}, bạn chỉ có ${player.premiumCurrency} ${currencySymbol}.`);
            break;
          }
        } else {
          if (player.gold < itemPrice) {
            responses.push(`Bạn không có đủ vàng để mua [${item.name}]. Cần ${itemPrice} ${currencySymbol}, bạn chỉ có ${player.gold} ${currencySymbol}.`);
            break;
          }
        }

        // Create a new item instance for the player
        const newItem = await ItemSchema.create({
          name: item.name,
          description: item.description,
          type: item.type,
          value: item.value,
          price: item.price,
          sellValue: item.sellValue,
          premiumPrice: item.premiumPrice,
          stats: item.stats,
          effects: item.effects,
          quality: item.quality,
          rarity: item.rarity,
          slot: item.slot,
          requiredLevel: item.requiredLevel,
          recipe: item.recipe,
          resultItem: item.resultItem
        });

        // Deduct currency
        if (isPremiumShop) {
          player.premiumCurrency -= itemPrice;
        } else {
          player.gold -= itemPrice;
        }
        
        player.inventory.push(newItem._id);
        await player.save();

        responses.push(`Bạn đã mua [${item.name}] với giá ${itemPrice} ${currencySymbol}!`);
        if (isPremiumShop) {
          responses.push(`Cổ Thạch còn lại: ${player.premiumCurrency} ${currencySymbol}`);
        } else {
          responses.push(`Vàng còn lại: ${player.gold} ${currencySymbol}`);
        }
        break;
      }

      case 'sell': {
        if (!target) {
          responses.push('Bạn muốn bán gì?');
          break;
        }

        const room = await RoomSchema.findById(player.currentRoomId);
        if (!room || !room.agents || room.agents.length === 0) {
          responses.push('Không có ai ở đây để mua hàng.');
          break;
        }

        // Check for vendors (only gold shops buy items)
        const vendors = await AgentSchema.find({ 
          _id: { $in: room.agents },
          isVendor: true,
          shopType: 'gold'
        });

        if (vendors.length === 0) {
          responses.push('Không có ai ở đây để mua hàng.');
          break;
        }

        const items = await ItemSchema.find({ _id: { $in: player.inventory } });
        const item = items.find((i: any) => 
          i.name.toLowerCase().includes(target.toLowerCase())
        );

        if (!item) {
          responses.push(`Bạn không có "${target}" trong túi đồ.`);
          break;
        }

        // Use sellValue field or fallback to 50% of value
        const sellValue = (item.sellValue ?? 0) > 0 ? item.sellValue : Math.floor((item.value ?? 0) * 0.5);

        if (sellValue <= 0) {
          responses.push(`Không thể bán [${item.name}]. Vật phẩm này không có giá trị bán.`);
          break;
        }

        player.gold += sellValue;
        player.inventory = player.inventory.filter((id: any) => id.toString() !== item._id.toString());
        await player.save();

        // Delete the sold item
        await ItemSchema.findByIdAndDelete(item._id);

        responses.push(`Bạn đã bán [${item.name}] nhận được ${sellValue} 💰 Vàng.`);
        responses.push(`Vàng hiện có: ${player.gold}`);
        break;
      }

      case 'equip': {
        if (!target) {
          responses.push('Bạn muốn trang bị gì?');
          break;
        }

        const items = await ItemSchema.find({ _id: { $in: player.inventory } });
        const item = items.find((i: any) => 
          i.name.toLowerCase().includes(target.toLowerCase())
        );

        if (!item) {
          responses.push(`Bạn không có "${target}" trong túi đồ.`);
          break;
        }

        console.log('item.type', item)
        if (item.requiredLevel && player.level < item.requiredLevel) {
          responses.push(`Bạn chưa đủ cấp độ (Cần Cấp ${item.requiredLevel}) để mặc [${item.name}].`);
          break;
        }

        const slot = item.slot;
        if (!slot || !['helmet', 'chest', 'legs', 'boots', 'weapon'].includes(slot)) {
          responses.push(`[${item.name}] không có vị trí trang bị hợp lệ.`);
          break;
        }

        // Initialize equipment if not exists
        if (!player.equipment) {
          player.equipment = {
            helmet: null,
            chest: null,
            legs: null,
            boots: null,
            weapon: null
          };
        }

        // Unequip current item in slot if exists
        const currentEquippedId = player.equipment[slot as keyof typeof player.equipment];
        if (currentEquippedId) {
          // Add currently equipped item back to inventory
          player.inventory.push(currentEquippedId);
          const currentItem = await ItemSchema.findById(currentEquippedId);
          if (currentItem) {
            responses.push(`Đã gỡ [${currentItem.name}] khỏi vị trí ${slot}.`);
          }
        }

        // Remove item from inventory and equip it
        player.inventory = player.inventory.filter((id: any) => id.toString() !== item._id.toString());
        (player.equipment as any)[slot] = item._id;
        await player.save();

        responses.push(`Đã trang bị [${item.name}] vào vị trí ${slot}!`);

        // Calculate and apply stats with set bonuses
        const { applyStatsToPlayer } = await import('../utils/playerStats');
        const statsResult = await applyStatsToPlayer(playerId);
        if (statsResult.messages && statsResult.messages.length > 0) {
          responses.push(...statsResult.messages);
        }

        // Broadcast to room
        const room = await RoomSchema.findById(player.currentRoomId);
        if (room) {
          gameState.broadcastToRoom(
            room._id.toString(),
            {
              type: 'normal',
              message: `[${player.username}] trang bị [${item.name}].`
            },
            playerId
          );
        }
        break;
      }

      case 'unequip': {
        if (!target) {
          responses.push('Bạn muốn gỡ trang bị gì? (helmet/chest/legs/boots/weapon)');
          break;
        }

        const slotMap: Record<string, string> = {
          'helmet': 'helmet',
          'mu': 'helmet',
          'mũ': 'helmet',
          'chest': 'chest',
          'ao': 'chest',
          'áo': 'chest',
          'legs': 'legs',
          'quan': 'legs',
          'quần': 'legs',
          'boots': 'boots',
          'giay': 'boots',
          'giày': 'boots',
          'weapon': 'weapon',
          'vu_khi': 'weapon',
          'vũ khí': 'weapon'
        };

        const slot = slotMap[target.toLowerCase()] || target.toLowerCase();

        if (!['helmet', 'chest', 'legs', 'boots', 'weapon'].includes(slot)) {
          responses.push('Vị trí không hợp lệ. Sử dụng: helmet, chest, legs, boots, hoặc weapon.');
          break;
        }

        // Initialize equipment if not exists
        if (!player.equipment) {
          player.equipment = {
            helmet: null,
            chest: null,
            legs: null,
            boots: null,
            weapon: null
          };
        }

        const equippedItemId = player.equipment[slot as keyof typeof player.equipment];
        if (!equippedItemId) {
          responses.push(`Không có gì được trang bị ở vị trí ${slot}.`);
          break;
        }

        const equippedItem = await ItemSchema.findById(equippedItemId);
        if (!equippedItem) {
          responses.push('Lỗi: Không tìm thấy vật phẩm được trang bị.');
          break;
        }

        // Remove from equipment and add to inventory
        (player.equipment as any)[slot] = null;
        player.inventory.push(equippedItemId);
        await player.save();

        responses.push(`Đã gỡ [${equippedItem.name}] khỏi vị trí ${slot}.`);

        // Recalculate stats
        const { applyStatsToPlayer } = await import('../utils/playerStats');
        const statsResult = await applyStatsToPlayer(playerId);
        if (statsResult.messages && statsResult.messages.length > 0) {
          responses.push(...statsResult.messages);
        }

        // Broadcast to room
        const room = await RoomSchema.findById(player.currentRoomId);
        if (room) {
          gameState.broadcastToRoom(
            room._id.toString(),
            {
              type: 'normal',
              message: `[${player.username}] gỡ [${equippedItem.name}].`
            },
            playerId
          );
        }
        break;
      }

      default:
        responses.push('Lệnh không hợp lệ.');
    }

  } catch (error) {
    console.error('Error in item command:', error);
    responses.push('Lỗi khi xử lý lệnh vật phẩm.');
  }

  return responses;
}
