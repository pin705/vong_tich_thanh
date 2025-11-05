import type { Command } from '~/types';
import { PlayerSchema } from '../../models/Player';
import { RoomSchema } from '../../models/Room';
import { ItemSchema } from '../../models/Item';
import { AgentSchema } from '../../models/Agent';
import { gameState } from './gameState';
import { DEV_FEATURE_MESSAGE, SMALL_POTION_HEALING } from './constants';
import { startCombat, fleeCombat } from './combatSystem';

// Helper function to format room description
async function formatRoomDescription(room: any, player: any): Promise<string[]> {
  const responses: string[] = [];
  
  // Room name
  responses.push(`[${room.name}]`);
  
  // Room description
  responses.push(room.description);
  responses.push('');
  
  // Exits
  const exits = [];
  if (room.exits.north) exits.push('bắc');
  if (room.exits.south) exits.push('nam');
  if (room.exits.east) exits.push('đông');
  if (room.exits.west) exits.push('tây');
  if (room.exits.up) exits.push('lên');
  if (room.exits.down) exits.push('xuống');
  
  if (exits.length > 0) {
    responses.push(`Lối ra: [${exits.join(', ')}]`);
  } else {
    responses.push('Không có lối ra rõ ràng.');
  }
  
  // Items in room
  if (room.items && room.items.length > 0) {
    const items = await ItemSchema.find({ _id: { $in: room.items } });
    if (items.length > 0) {
      responses.push('Bạn thấy:');
      items.forEach((item: any) => {
        responses.push(`  - [${item.name}]`);
      });
    }
  }
  
  // Agents in room
  if (room.agents && room.agents.length > 0) {
    const agents = await AgentSchema.find({ _id: { $in: room.agents } });
    agents.forEach((agent: any) => {
      responses.push(`Một [${agent.name}] đang đứng đây.`);
    });
  }
  
  // Other players in room
  const playersInRoom = gameState.getPlayersInRoom(room._id.toString());
  const otherPlayers = playersInRoom.filter(p => p.id !== player._id.toString());
  if (otherPlayers.length > 0) {
    otherPlayers.forEach(p => {
      responses.push(`[${p.username}] đang ở đây.`);
    });
  }
  
  return responses;
}

// Main command handler with database integration
export async function handleCommandDb(command: Command, playerId: string): Promise<string[]> {
  const { action, target, args } = command;
  const responses: string[] = [];

  try {
    // Get player from database
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
        responses.push('KHÁC:');
        responses.push('  help                     - Hiển thị trợ giúp');
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
            const agents = await AgentSchema.find({ _id: { $in: room.agents } });
            const agent = agents.find((a: any) => 
              a.name.toLowerCase().includes(targetLower)
            );
            if (agent) {
              responses.push(agent.description);
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

      case 'go':
      case 'n':
      case 's':
      case 'e':
      case 'w':
      case 'u':
      case 'd':
      case 'north':
      case 'south':
      case 'east':
      case 'west':
      case 'up':
      case 'down':
      case 'bắc':
      case 'nam':
      case 'đông':
      case 'tây':
      case 'lên':
      case 'xuống':
        let direction = target || action;
        if (!direction || direction === 'go') {
          responses.push('Bạn muốn đi hướng nào? (bắc/nam/đông/tây/lên/xuống)');
          break;
        }

        // Normalize direction
        const directionMap: { [key: string]: string } = {
          'n': 'north', 'north': 'north', 'bắc': 'north',
          's': 'south', 'south': 'south', 'nam': 'south',
          'e': 'east', 'east': 'east', 'đông': 'east',
          'w': 'west', 'west': 'west', 'tây': 'west',
          'u': 'up', 'up': 'up', 'lên': 'up',
          'd': 'down', 'down': 'down', 'xuống': 'down',
        };
        
        const normalizedDir = directionMap[direction.toLowerCase()];
        if (!normalizedDir) {
          responses.push(`Hướng "${direction}" không hợp lệ.`);
          break;
        }

        const currentRoom = await RoomSchema.findById(player.currentRoomId);
        if (!currentRoom) {
          responses.push('Lỗi: Không tìm thấy phòng hiện tại.');
          break;
        }

        const nextRoomId = (currentRoom.exits as any)[normalizedDir];
        if (!nextRoomId) {
          responses.push('Bạn không thể đi theo hướng đó.');
          break;
        }

        const nextRoom = await RoomSchema.findById(nextRoomId);
        if (!nextRoom) {
          responses.push('Lỗi: Không tìm thấy phòng đích.');
          break;
        }

        // Check if player is in combat
        if (player.inCombat) {
          responses.push('Bạn không thể di chuyển khi đang trong chiến đấu! Hãy dùng lệnh "flee" để bỏ chạy.');
          break;
        }

        // Broadcast to old room
        const directionNames: { [key: string]: string } = {
          'north': 'bắc', 'south': 'nam', 'east': 'đông',
          'west': 'tây', 'up': 'lên', 'down': 'xuống'
        };
        gameState.broadcastToRoom(
          player.currentRoomId.toString(),
          {
            type: 'normal',
            message: `[${player.username}] đi về phía ${directionNames[normalizedDir]}.`
          },
          playerId
        );

        // Update player location
        player.currentRoomId = nextRoom._id;
        await player.save();
        gameState.updatePlayerRoom(playerId, nextRoom._id.toString());

        // Broadcast to new room
        gameState.broadcastToRoom(
          nextRoom._id.toString(),
          {
            type: 'normal',
            message: `[${player.username}] đi vào từ phía ${directionNames[normalizedDir]}.`
          },
          playerId
        );

        // Show new room
        responses.push(`Bạn đi về phía ${directionNames[normalizedDir]}...`);
        responses.push('');
        const newRoomDesc = await formatRoomDescription(nextRoom, player);
        responses.push(...newRoomDesc);
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
        
        // Broadcast to room as chat_log
        const sayRoom = await RoomSchema.findById(player.currentRoomId);
        if (sayRoom) {
          gameState.broadcastToRoom(
            sayRoom._id.toString(),
            {
              type: 'chat_log',
              payload: {
                user: player.username,
                message: message
              }
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

        const merchants = await AgentSchema.find({ 
          _id: { $in: listRoom.agents },
          shopItems: { $exists: true, $ne: [] }
        });

        if (merchants.length === 0) {
          responses.push('Không có ai ở đây để bán hàng.');
          break;
        }

        const merchant = merchants[0];
        const shopItems = await ItemSchema.find({ _id: { $in: merchant.shopItems } });

        responses.push(`════════ HÀNG CỦA ${merchant.name.toUpperCase()} ════════`);
        shopItems.forEach((item: any, index: number) => {
          const spaces = ' '.repeat(20 - item.name.length);
          responses.push(`${index + 1}. [${item.name}]${spaces}- ${item.value} vàng`);
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

        const buyMerchants = await AgentSchema.find({ 
          _id: { $in: buyRoom.agents },
          shopItems: { $exists: true, $ne: [] }
        });

        if (buyMerchants.length === 0) {
          responses.push('Không có ai ở đây để bán hàng.');
          break;
        }

        const buyMerchant = buyMerchants[0];
        const buyShopItems = await ItemSchema.find({ _id: { $in: buyMerchant.shopItems } });
        const buyItem = buyShopItems.find((i: any) => 
          i.name.toLowerCase().includes(target.toLowerCase())
        );

        if (!buyItem) {
          responses.push(`[${buyMerchant.name}] không bán "${target}".`);
          break;
        }

        if (player.gold < buyItem.value) {
          responses.push(`Bạn không có đủ vàng để mua [${buyItem.name}]. Cần ${buyItem.value} vàng, bạn chỉ có ${player.gold} vàng.`);
          break;
        }

        // Create a new item instance for the player
        const newItem = await ItemSchema.create({
          name: buyItem.name,
          description: buyItem.description,
          type: buyItem.type,
          value: buyItem.value,
          stats: buyItem.stats
        });

        player.gold -= buyItem.value;
        player.inventory.push(newItem._id);
        await player.save();

        responses.push(`Bạn đã mua [${buyItem.name}] với giá ${buyItem.value} vàng.`);
        responses.push(`Vàng còn lại: ${player.gold}`);
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

        const sellMerchants = await AgentSchema.find({ 
          _id: { $in: sellRoom.agents },
          shopItems: { $exists: true }
        });

        if (sellMerchants.length === 0) {
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

        const sellValue = Math.floor(sellItem.value * 0.5); // Sell for 50% of value

        player.gold += sellValue;
        player.inventory = player.inventory.filter((id: any) => id.toString() !== sellItem._id.toString());
        await player.save();

        // Delete the sold item
        await ItemSchema.findByIdAndDelete(sellItem._id);

        responses.push(`Bạn đã bán [${sellItem.name}] với giá ${sellValue} vàng.`);
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
        if (!attackRoom || !attackRoom.agents || attackRoom.agents.length === 0) {
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

        // Start combat
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

        // Handle consumable items
        if (useItem.type === 'consumable') {
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

      case 'quit':
        responses.push('Tạm biệt! Hẹn gặp lại.');
        break;

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
