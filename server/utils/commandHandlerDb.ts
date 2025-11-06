import type { Command } from '~/types';
import { PlayerSchema } from '../../models/Player';
import { RoomSchema } from '../../models/Room';
import { ItemSchema } from '../../models/Item';
import { AgentSchema } from '../../models/Agent';
import { BuffSchema } from '../../models/Buff';
import { gameState } from './gameState';
import { DEV_FEATURE_MESSAGE, SMALL_POTION_HEALING } from './constants';
import { startCombat, fleeCombat } from './combatSystem';
import { partyService } from './partyService';
import { tradeService } from './tradeService';
import { handleMovementCommand, handleGotoCommand } from '../commands/movement';
import { handleCombatCommand } from '../commands/combat';
import { handleItemCommand } from '../commands/item';
import { formatRoomDescription } from './roomUtils';
import { deduplicateItemsById } from './itemDeduplication';

// Command routing configuration
const MOVEMENT_COMMANDS = ['go', 'n', 's', 'e', 'w', 'u', 'd', 
                           'north', 'south', 'east', 'west', 'up', 'down',
                           'bắc', 'nam', 'đông', 'tây', 'lên', 'xuống'];

const COMBAT_COMMANDS = ['attack', 'a', 'kill', 'flee', 'run'];

const ITEM_COMMANDS = ['inventory', 'i', 'get', 'g', 'drop', 'use', 
                       'list', 'buy', 'sell'];

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
      case 'help':
        responses.push('');
        responses.push('═══════════════════════════════════════════════════');
        responses.push('            DANH SÁCH LỆNH                         ');
        responses.push('═══════════════════════════════════════════════════');
        responses.push('');
        responses.push('DI CHUYỂN:');
        responses.push('  go [hướng] hoặc [n/s/e/w/u/d]');
        responses.push('  Ví dụ: go bắc, n, s, e, w');
        responses.push('');
        responses.push('QUAN SÁT:');
        responses.push('  look [đối tượng]    (l)  - Quan sát phòng/vật/người');
        responses.push('  inventory           (i)  - Xem túi đồ');
        responses.push('');
        responses.push('TƯƠNG TÁC:');
        responses.push('  talk [tên]          (t)  - Nói chuyện với NPC');
        responses.push('  say [text]               - Nói với người chơi khác');
        responses.push('  get [vật]           (g)  - Nhặt vật phẩm');
        responses.push('  drop [vật]               - Thả vật phẩm');
        responses.push('  use [vật]                - Sử dụng vật phẩm');
        responses.push('');
        responses.push('CHIẾN ĐẤU:');
        responses.push('  attack [tên]        (a)  - Tấn công mục tiêu');
        responses.push('  flee                     - Bỏ chạy khỏi chiến đấu');
        responses.push('');
        responses.push('MUA BÁN:');
        responses.push('  list                     - Xem hàng hóa');
        responses.push('  buy [vật]                - Mua vật phẩm');
        responses.push('  sell [vật]               - Bán vật phẩm');
        responses.push('');
        responses.push('CLASS & THIÊN PHÚ:');
        responses.push('  skills          (sk)     - Xem sổ kỹ năng');
        responses.push('  talents    (thienphu)    - Xem bảng thiên phú');
        responses.push('');
        responses.push('TỔ ĐỘI (PARTY):');
        responses.push('  party invite [tên]  (moi)- Mời người chơi vào nhóm');
        responses.push('  party accept             - Chấp nhận lời mời');
        responses.push('  party decline            - Từ chối lời mời');
        responses.push('  party leave        (roi) - Rời nhóm');
        responses.push('  party kick [tên]         - Đuổi thành viên (trưởng nhóm)');
        responses.push('  party promote [tên]      - Trao quyền trưởng nhóm');
        responses.push('  party loot [rule]        - Đặt quy tắc nhặt đồ');
        responses.push('  p [tin nhắn]             - Chat với nhóm');
        responses.push('');
        responses.push('BANG HỘI (GUILD):');
        responses.push('  guild                    - Xem lệnh bang hội');
        responses.push('  guild invite [tên]       - Mời người chơi vào bang');
        responses.push('  guild deposit gold [số]  - Gửi vàng vào kho bang');
        responses.push('  guild withdraw gold [số] - Rút vàng (lãnh đạo và sĩ quan)');
        responses.push('  g [tin nhắn]             - Chat với bang');
        responses.push('');
        responses.push('PvP:');
        responses.push('  pvp [on/off]             - Bật/tắt chế độ PvP');
        responses.push('  attack [tên người chơi]  - Tấn công người chơi (cần PvP)');
        responses.push('');
        responses.push('KHÁC:');
        responses.push('  help                     - Hiển thị trợ giúp');
        responses.push('  alias add [tên] [lệnh]   - Tạo lệnh tắt tùy chỉnh');
        responses.push('  alias remove [tên]       - Xóa lệnh tắt');
        responses.push('  alias list               - Xem danh sách lệnh tắt');
        responses.push('  quit                     - Thoát game');
        responses.push('');
        break;

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
          // Look at specific target
          const targetLower = target.toLowerCase();
          
          // Check agents
          if (room.agents && room.agents.length > 0) {
            const agents = await AgentSchema.find({ _id: { $in: room.agents } }).populate('loot');
            const agent = agents.find((a: any) => 
              a.name.toLowerCase().includes(targetLower)
            );
            if (agent) {
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
                  const lootNames = agent.loot.map((item: any) => `[${item.name}]`).join(', ');
                  responses.push(`Vật phẩm: ${lootNames}`);
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
          }
          
          // Check items
          if (room.items && room.items.length > 0) {
            const items = await ItemSchema.find({ _id: { $in: room.items } });
            const item = items.find((i: any) => 
              i.name.toLowerCase().includes(targetLower)
            );
            if (item) {
              responses.push(item.description);
              break;
            }
          }
          
          // Check other players
          const playersInRoom = gameState.getPlayersInRoom(room._id.toString());
          const otherPlayer = playersInRoom.find(p => 
            p.username.toLowerCase().includes(targetLower) && p.id !== playerId
          );
          if (otherPlayer) {
            responses.push(`[${otherPlayer.username}] đang đứng ở đây, trông có vẻ đang suy nghĩ về điều gì đó.`);
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
        if (!talkRoom || !talkRoom.agents || talkRoom.agents.length === 0) {
          responses.push(`Bạn không thấy "${target}" ở đây để nói chuyện.`);
          break;
        }

        const talkAgents = await AgentSchema.find({ _id: { $in: talkRoom.agents } });
        const talkAgent = talkAgents.find((a: any) => 
          a.name.toLowerCase().includes(target.toLowerCase())
        );

        if (!talkAgent) {
          responses.push(`Bạn không thấy "${target}" ở đây để nói chuyện.`);
          break;
        }

        if (talkAgent.dialogue && talkAgent.dialogue.length > 0) {
          const randomDialogue = talkAgent.dialogue[Math.floor(Math.random() * talkAgent.dialogue.length)];
          responses.push(`[${talkAgent.name}] nói: "${randomDialogue}"`);
        } else {
          responses.push(`[${talkAgent.name}] không có gì để nói với bạn.`);
        }
        break;

      case 'say':
        if (!target && (!args || args.length === 0)) {
          responses.push('Bạn muốn nói gì?');
          break;
        }

        const message = [target, ...(args || [])].filter(Boolean).join(' ');
        responses.push(`Bạn nói: "${message}"`);
        
        // Broadcast to room as chat with proper channel and category
        const sayRoom = await RoomSchema.findById(player.currentRoomId);
        if (sayRoom) {
          gameState.broadcastToRoom(
            sayRoom._id.toString(),
            {
              type: 'chat',
              channel: 'chat',
              category: 'say',
              user: player.username,
              message: message
            },
            playerId
          );
        }
        break;

      case 'inventory':
      case 'i':
        responses.push('════════════ TÚI ĐỒ ════════════');
        responses.push(`Vàng: ${player.gold}`);
        responses.push(`HP: ${player.hp}/${player.maxHp}`);
        responses.push(`Level: ${player.level} (XP: ${player.experience})`);
        responses.push('');
        
        if (player.inventory && player.inventory.length > 0) {
          responses.push('Vật phẩm:');
          const inventory = await ItemSchema.find({ _id: { $in: player.inventory } });
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

        const getItems = await ItemSchema.find({ _id: { $in: getRoom.items } });
        const getItem = getItems.find((i: any) => 
          i.name.toLowerCase().includes(target.toLowerCase())
        );

        if (!getItem) {
          responses.push(`Không có "${target}" ở đây để nhặt.`);
          break;
        }

        // Remove from room, add to player inventory
        getRoom.items = getRoom.items.filter((id: any) => id.toString() !== getItem._id.toString());
        await getRoom.save();

        player.inventory.push(getItem._id);
        await player.save();

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

        const dropItems = await ItemSchema.find({ _id: { $in: player.inventory } });
        const dropItem = dropItems.find((i: any) => 
          i.name.toLowerCase().includes(target.toLowerCase())
        );

        if (!dropItem) {
          responses.push(`Bạn không có "${target}" trong túi đồ.`);
          break;
        }

        const dropRoom = await RoomSchema.findById(player.currentRoomId);
        if (!dropRoom) {
          responses.push('Lỗi: Không tìm thấy phòng hiện tại.');
          break;
        }

        // Remove from player, add to room
        player.inventory = player.inventory.filter((id: any) => id.toString() !== dropItem._id.toString());
        await player.save();

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

      case 'list':
        const listRoom = await RoomSchema.findById(player.currentRoomId);
        if (!listRoom || !listRoom.agents || listRoom.agents.length === 0) {
          responses.push('Không có ai ở đây để bán hàng.');
          break;
        }

        // Phase 25: Use new vendor system
        const vendors = await AgentSchema.find({ 
          _id: { $in: listRoom.agents },
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

      case 'buy':
        if (!target) {
          responses.push('Bạn muốn mua gì?');
          break;
        }

        const buyRoom = await RoomSchema.findById(player.currentRoomId);
        if (!buyRoom || !buyRoom.agents || buyRoom.agents.length === 0) {
          responses.push('Không có ai ở đây để bán hàng.');
          break;
        }

        // Phase 25: Use new vendor system
        const buyVendors = await AgentSchema.find({ 
          _id: { $in: buyRoom.agents },
          isVendor: true
        }).populate('shopInventory').populate('shopItems');

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

        // Check price based on shop type
        const isPremiumShop = buyVendor.shopType === 'premium';
        const itemPrice = isPremiumShop ? (buyItem.premiumPrice ?? 0) : (buyItem.price ?? 0);
        const buyCurrencySymbol = isPremiumShop ? '💎' : '💰';

        // Validate that item has a valid price
        if (itemPrice <= 0) {
          responses.push(`[${buyItem.name}] không có giá bán.`);
          break;
        }

        if (isPremiumShop) {
          if (player.premiumCurrency < itemPrice) {
            responses.push(`Bạn không có đủ Cổ Thạch để mua [${buyItem.name}]. Cần ${itemPrice} ${buyCurrencySymbol}, bạn chỉ có ${player.premiumCurrency} ${buyCurrencySymbol}.`);
            break;
          }
        } else {
          if (player.gold < itemPrice) {
            responses.push(`Bạn không có đủ vàng để mua [${buyItem.name}]. Cần ${itemPrice} ${buyCurrencySymbol}, bạn chỉ có ${player.gold} ${buyCurrencySymbol}.`);
            break;
          }
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
          resultItem: buyItem.resultItem
        });

        // Deduct currency
        if (isPremiumShop) {
          player.premiumCurrency -= itemPrice;
        } else {
          player.gold -= itemPrice;
        }
        
        player.inventory.push(newBuyItem._id);
        await player.save();

        responses.push(`Bạn đã mua [${buyItem.name}] với giá ${itemPrice} ${buyCurrencySymbol}!`);
        if (isPremiumShop) {
          responses.push(`Cổ Thạch còn lại: ${player.premiumCurrency} ${buyCurrencySymbol}`);
        } else {
          responses.push(`Vàng còn lại: ${player.gold} ${buyCurrencySymbol}`);
        }
        break;

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

        const sellItems = await ItemSchema.find({ _id: { $in: player.inventory } });
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
        } else {
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
      case 'roi': {
        // Get subcommand
        const subCommand = target?.toLowerCase();
        const subTarget = args?.[0];
        
        // Check if this is party chat (p [message] instead of p [subcommand])
        // Party chat if: action is 'p' AND target is not a party subcommand
        const partySubcommands = ['invite', 'accept', 'decline', 'leave', 'kick', 'promote', 'loot'];
        if (action === 'p' && target && !partySubcommands.includes(subCommand)) {
          // This is party chat
          const chatMessage = [target, ...(args || [])].filter(Boolean).join(' ');
          
          if (!chatMessage) {
            responses.push('Bạn muốn nói gì với nhóm?');
            break;
          }
          
          const playerParty = partyService.getPlayerParty(playerId);
          if (!playerParty) {
            responses.push('Bạn không ở trong nhóm nào.');
            break;
          }
          
          // Broadcast to all party members
          const memberIds = partyService.getPartyMemberIds(playerParty.partyId);
          const members = gameState.getPlayersByIds(memberIds);
          
          members.forEach(member => {
            if (member.ws) {
              member.ws.send(JSON.stringify({
                type: 'chat',
                channel: 'chat',
                category: 'party',
                user: player.username,
                message: chatMessage
              }));
            }
          });
          
          // Don't add to responses - it will be shown via chat system
          break;
        }
        
        // Handle "moi" alias for "party invite"
        if (action === 'moi') {
          // moi [player] -> party invite [player]
          const targetPlayerName = target;
          if (!targetPlayerName) {
            responses.push('Mời ai vào nhóm? Cú pháp: moi [tên người chơi]');
            break;
          }
          
          // Find target player by name
          const currentRoom = await RoomSchema.findById(player.currentRoomId);
          if (!currentRoom) break;
          
          const playersInRoom = gameState.getPlayersInRoom(currentRoom._id.toString());
          const targetPlayerInfo = playersInRoom.find(p => 
            p.username.toLowerCase().includes(targetPlayerName.toLowerCase()) && p.id !== playerId
          );
          
          if (!targetPlayerInfo) {
            responses.push(`Không tìm thấy người chơi "${targetPlayerName}" ở đây.`);
            break;
          }
          
          const inviteResult = partyService.invitePlayer(playerId, targetPlayerInfo.id);
          responses.push(inviteResult.message);
          
          if (inviteResult.success) {
            // Send invitation to target player
            const targetPlayer = gameState.getPlayer(targetPlayerInfo.id);
            if (targetPlayer?.ws) {
              targetPlayer.ws.send(JSON.stringify({
                type: 'party_invitation',
                payload: {
                  inviterId: playerId,
                  inviterName: player.username,
                  partyId: inviteResult.partyId
                }
              }));
            }
            
            // Update party ID in game state
            gameState.updatePlayerParty(playerId, inviteResult.partyId!);
          }
          break;
        }
        
        // Handle "roi" alias for "party leave"
        if (action === 'roi') {
          // Get party info BEFORE leaving
          const playerPartyBeforeLeave = partyService.getPlayerParty(playerId);
          const partyIdBeforeLeave = playerPartyBeforeLeave?.partyId;
          
          const leaveResult = partyService.leaveParty(playerId);
          responses.push(leaveResult.message);
          
          if (leaveResult.success) {
            gameState.updatePlayerParty(playerId, null);
            
            // Notify remaining party members (if party still exists)
            if (partyIdBeforeLeave) {
              const memberIds = partyService.getPartyMemberIds(partyIdBeforeLeave);
              const members = gameState.getPlayersByIds(memberIds);
              members.forEach(member => {
                if (member.ws) {
                  member.ws.send(JSON.stringify({
                    type: 'system',
                    category: 'party',
                    message: `[${player.username}] đã rời nhóm.`
                  }));
                  
                  if (leaveResult.newLeaderId === member.id) {
                    member.ws.send(JSON.stringify({
                      type: 'system',
                      category: 'party',
                      message: `Bạn đã trở thành nhóm trưởng.`
                    }));
                  }
                }
              });
            }
          }
          break;
        }
        
        // Handle regular party commands
        if (!subCommand) {
          // No subcommand - show party status
          const playerParty = partyService.getPlayerParty(playerId);
          if (!playerParty) {
            responses.push('Bạn không ở trong nhóm nào.');
            responses.push('Sử dụng: party invite [tên] để mời người khác.');
          } else {
            const { party } = playerParty;
            responses.push('═══════════════════════════════════');
            responses.push('           TỔ ĐỘI                  ');
            responses.push('═══════════════════════════════════');
            
            const memberIds = Array.from(party.memberIds);
            const members = await PlayerSchema.find({ _id: { $in: memberIds } });
            
            for (const member of members) {
              const isLeader = member._id.toString() === party.leaderId;
              const prefix = isLeader ? '(L)' : '   ';
              responses.push(`${prefix} [${member.username}] - Level ${member.level}`);
              responses.push(`     HP: ${member.hp}/${member.maxHp}`);
            }
            
            responses.push('');
            responses.push(`Quy tắc nhặt đồ: ${party.lootRule === 'leader-only' ? 'Chỉ Trưởng Nhóm' : 'Theo Lượt'}`);
          }
          break;
        }
        
        switch (subCommand) {
          case 'invite': {
            if (!subTarget) {
              responses.push('Mời ai vào nhóm? Cú pháp: party invite [tên]');
              break;
            }
            
            // Find target player by name
            const currentRoom = await RoomSchema.findById(player.currentRoomId);
            if (!currentRoom) break;
            
            const playersInRoom = gameState.getPlayersInRoom(currentRoom._id.toString());
            const targetPlayerInfo = playersInRoom.find(p => 
              p.username.toLowerCase().includes(subTarget.toLowerCase()) && p.id !== playerId
            );
            
            if (!targetPlayerInfo) {
              responses.push(`Không tìm thấy người chơi "${subTarget}" ở đây.`);
              break;
            }
            
            const inviteResult = partyService.invitePlayer(playerId, targetPlayerInfo.id);
            responses.push(inviteResult.message);
            
            if (inviteResult.success) {
              // Send invitation to target player
              const targetPlayer = gameState.getPlayer(targetPlayerInfo.id);
              if (targetPlayer?.ws) {
                targetPlayer.ws.send(JSON.stringify({
                  type: 'party_invitation',
                  payload: {
                    inviterId: playerId,
                    inviterName: player.username,
                    partyId: inviteResult.partyId
                  }
                }));
              }
              
              // Update party ID in game state
              gameState.updatePlayerParty(playerId, inviteResult.partyId!);
            }
            break;
          }
          
          case 'accept': {
            // Get pending invitations
            const invitations = partyService.getPendingInvitations(playerId);
            if (invitations.length === 0) {
              responses.push('Không có lời mời nào.');
              break;
            }
            
            // Accept the most recent invitation
            const invitation = invitations[0];
            const inviter = await PlayerSchema.findById(invitation.inviterId);
            if (!inviter) {
              responses.push('Không tìm thấy người mời.');
              break;
            }
            
            const acceptResult = partyService.acceptInvitation(playerId, invitation.inviterId);
            responses.push(acceptResult.message);
            
            if (acceptResult.success) {
              gameState.updatePlayerParty(playerId, acceptResult.partyId!);
              
              // Notify party members
              const memberIds = partyService.getPartyMemberIds(acceptResult.partyId!);
              const members = gameState.getPlayersByIds(memberIds);
              members.forEach(member => {
                if (member.ws && member.id !== playerId) {
                  member.ws.send(JSON.stringify({
                    type: 'system',
                    category: 'party',
                    message: `[${player.username}] đã tham gia nhóm.`
                  }));
                }
              });
            }
            break;
          }
          
          case 'decline': {
            // Get pending invitations
            const invitations = partyService.getPendingInvitations(playerId);
            if (invitations.length === 0) {
              responses.push('Không có lời mời nào.');
              break;
            }
            
            // Decline the most recent invitation
            const invitation = invitations[0];
            const declineResult = partyService.declineInvitation(playerId, invitation.inviterId);
            responses.push(declineResult.message);
            break;
          }
          
          case 'leave': {
            // Get party info BEFORE leaving
            const playerPartyBeforeLeave = partyService.getPlayerParty(playerId);
            const partyIdBeforeLeave = playerPartyBeforeLeave?.partyId;
            
            const leaveResult = partyService.leaveParty(playerId);
            responses.push(leaveResult.message);
            
            if (leaveResult.success) {
              gameState.updatePlayerParty(playerId, null);
              
              // Notify remaining party members (if party still exists)
              if (partyIdBeforeLeave) {
                const memberIds = partyService.getPartyMemberIds(partyIdBeforeLeave);
                const members = gameState.getPlayersByIds(memberIds);
                members.forEach(member => {
                  if (member.ws) {
                    member.ws.send(JSON.stringify({
                      type: 'system',
                      category: 'party',
                      message: `[${player.username}] đã rời nhóm.`
                    }));
                    
                    if (leaveResult.newLeaderId === member.id) {
                      member.ws.send(JSON.stringify({
                        type: 'system',
                        category: 'party',
                        message: `Bạn đã trở thành nhóm trưởng.`
                      }));
                    }
                  }
                });
              }
            }
            break;
          }
          
          case 'kick': {
            if (!subTarget) {
              responses.push('Đuổi ai khỏi nhóm? Cú pháp: party kick [tên]');
              break;
            }
            
            // Find target player in party
            const playerParty = partyService.getPlayerParty(playerId);
            if (!playerParty) {
              responses.push('Bạn không ở trong nhóm nào.');
              break;
            }
            
            const memberIds = Array.from(playerParty.party.memberIds);
            const members = await PlayerSchema.find({ _id: { $in: memberIds } });
            const targetMember = members.find(m => 
              m.username.toLowerCase().includes(subTarget.toLowerCase()) && m._id.toString() !== playerId
            );
            
            if (!targetMember) {
              responses.push(`Không tìm thấy thành viên "${subTarget}" trong nhóm.`);
              break;
            }
            
            const kickResult = partyService.kickPlayer(playerId, targetMember._id.toString());
            responses.push(kickResult.message);
            
            if (kickResult.success) {
              gameState.updatePlayerParty(targetMember._id.toString(), null);
              
              // Notify kicked player
              const kickedPlayer = gameState.getPlayer(targetMember._id.toString());
              if (kickedPlayer?.ws) {
                kickedPlayer.ws.send(JSON.stringify({
                  type: 'system',
                  category: 'party',
                  message: `Bạn đã bị đuổi khỏi nhóm.`
                }));
              }
              
              // Notify other party members
              const remainingMemberIds = partyService.getPartyMemberIds(playerParty.partyId);
              const remainingMembers = gameState.getPlayersByIds(remainingMemberIds);
              remainingMembers.forEach(member => {
                if (member.ws && member.id !== playerId) {
                  member.ws.send(JSON.stringify({
                    type: 'system',
                    category: 'party',
                    message: `[${targetMember.username}] đã bị đuổi khỏi nhóm.`
                  }));
                }
              });
            }
            break;
          }
          
          case 'promote': {
            if (!subTarget) {
              responses.push('Trao quyền cho ai? Cú pháp: party promote [tên]');
              break;
            }
            
            // Find target player in party
            const playerParty = partyService.getPlayerParty(playerId);
            if (!playerParty) {
              responses.push('Bạn không ở trong nhóm nào.');
              break;
            }
            
            const memberIds = Array.from(playerParty.party.memberIds);
            const members = await PlayerSchema.find({ _id: { $in: memberIds } });
            const targetMember = members.find(m => 
              m.username.toLowerCase().includes(subTarget.toLowerCase())
            );
            
            if (!targetMember) {
              responses.push(`Không tìm thấy thành viên "${subTarget}" trong nhóm.`);
              break;
            }
            
            const promoteResult = partyService.promotePlayer(playerId, targetMember._id.toString());
            responses.push(promoteResult.message);
            
            if (promoteResult.success) {
              // Notify all party members
              const allMemberIds = partyService.getPartyMemberIds(playerParty.partyId);
              const allMembers = gameState.getPlayersByIds(allMemberIds);
              allMembers.forEach(member => {
                if (member.ws) {
                  member.ws.send(JSON.stringify({
                    type: 'system',
                    category: 'party',
                    message: `[${targetMember.username}] đã trở thành nhóm trưởng.`
                  }));
                }
              });
            }
            break;
          }
          
          case 'loot': {
            if (!subTarget) {
              responses.push('Chọn quy tắc nhặt đồ:');
              responses.push('  party loot leader-only  - Chỉ trưởng nhóm');
              responses.push('  party loot round-robin  - Theo lượt');
              break;
            }
            
            const lootRule = subTarget.toLowerCase();
            if (lootRule !== 'leader-only' && lootRule !== 'round-robin') {
              responses.push('Quy tắc không hợp lệ. Sử dụng: leader-only hoặc round-robin');
              break;
            }
            
            const lootResult = partyService.setLootRule(playerId, lootRule as 'leader-only' | 'round-robin');
            responses.push(lootResult.message);
            
            if (lootResult.success) {
              // Notify party members
              const playerParty = partyService.getPlayerParty(playerId);
              if (playerParty) {
                const memberIds = partyService.getPartyMemberIds(playerParty.partyId);
                const members = gameState.getPlayersByIds(memberIds);
                members.forEach(member => {
                  if (member.ws && member.id !== playerId) {
                    member.ws.send(JSON.stringify({
                      type: 'system',
                      category: 'party',
                      message: lootResult.message
                    }));
                  }
                });
              }
            }
            break;
          }
          
          default:
            responses.push('Lệnh nhóm không hợp lệ.');
            responses.push('Các lệnh: party [invite/accept/decline/leave/kick/promote/loot]');
            break;
        }
        break;
      }

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
          responses.push('Sử dụng: trade [invite/accept/decline/add/gold/lock/confirm/cancel]');
          break;
        }

        switch (subCommand) {
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

                // Exchange items
                for (const itemId of trade.initiatorItems) {
                  initiator.inventory = initiator.inventory.filter((id: any) => id.toString() !== itemId);
                  target.inventory.push(itemId);
                }
                for (const itemId of trade.targetItems) {
                  target.inventory = target.inventory.filter((id: any) => id.toString() !== itemId);
                  initiator.inventory.push(itemId);
                }

                // Exchange gold
                initiator.gold -= trade.initiatorGold;
                target.gold += trade.initiatorGold;
                target.gold -= trade.targetGold;
                initiator.gold += trade.targetGold;

                await initiator.save();
                await target.save();

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
      case 'w': {
        // World chat
        const chatMessage = [target, ...(args || [])].filter(Boolean).join(' ');
        
        if (!chatMessage) {
          responses.push('Bạn muốn nói gì với toàn thế giới?');
          break;
        }
        
        // Import and use broadcast service
        const { broadcastService } = await import('./broadcastService');
        broadcastService.sendWorldMessage(playerId, chatMessage, player.username);
        
        responses.push(`[Thế Giới] Bạn nói: "${chatMessage}"`);
        break;
      }

      case 'guild':
      case 'g': {
        // Guild chat
        const chatMessage = [target, ...(args || [])].filter(Boolean).join(' ');
        
        if (!chatMessage) {
          responses.push('Bạn muốn nói gì với bang hội?');
          break;
        }
        
        // Check if player is in a guild
        if (!player.guild) {
          responses.push('Bạn không ở trong bang hội nào.');
          break;
        }
        
        // Import and use broadcast service
        const { broadcastService } = await import('./broadcastService');
        await broadcastService.sendGuildMessage(playerId, player.guild.toString(), chatMessage);
        
        responses.push(`[Guild] Bạn nói: "${chatMessage}"`);
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
            const builtInCommands = [
              'go', 'look', 'l', 'talk', 't', 'say', 'get', 'g', 'drop', 'use',
              'attack', 'a', 'kill', 'flee', 'run', 'inventory', 'i',
              'list', 'buy', 'sell', 'party', 'p', 'moi', 'roi', 'guild',
              'pvp', 'trade', 'quit', 'help', 'alias', 'skills', 'talents',
              'n', 's', 'e', 'w', 'u', 'd', 'north', 'south', 'east', 'west', 'up', 'down'
            ];
            
            if (builtInCommands.includes(aliasName.toLowerCase())) {
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
