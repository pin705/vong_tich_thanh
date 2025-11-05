import { PlayerSchema } from '../../models/Player';
import { AgentSchema } from '../../models/Agent';
import { ItemSchema } from '../../models/Item';
import { RoomSchema } from '../../models/Room';
import { gameState } from './gameState';
import { scheduleAgentRespawn } from './npcAI';
import { COMBAT_TICK_INTERVAL, FLEE_SUCCESS_CHANCE, EXPERIENCE_PER_LEVEL, HP_GAIN_PER_LEVEL } from './constants';

// Calculate damage with some randomness
function calculateDamage(baseDamage: number): number {
  const variance = 0.2; // 20% variance
  const min = Math.floor(baseDamage * (1 - variance));
  const max = Math.ceil(baseDamage * (1 + variance));
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Calculate player base damage (including equipped weapon)
async function calculatePlayerDamage(player: any): Promise<number> {
  let baseDamage = 5 + player.level; // Base damage increases with level
  
  // Check inventory for equipped weapon
  if (player.inventory && player.inventory.length > 0) {
    const items = await ItemSchema.find({ _id: { $in: player.inventory } });
    const weapons = items.filter((item: any) => item.type === 'weapon');
    if (weapons.length > 0) {
      // Use the best weapon
      const bestWeapon = weapons.reduce((best: any, current: any) => {
        const bestDmg = best.stats?.damage || 0;
        const currentDmg = current.stats?.damage || 0;
        return currentDmg > bestDmg ? current : best;
      });
      baseDamage += bestWeapon.stats?.damage || 0;
    }
  }
  
  return baseDamage;
}

// Calculate player defense (including equipped armor)
async function calculatePlayerDefense(player: any): Promise<number> {
  let defense = 0;
  
  // Check inventory for equipped armor
  if (player.inventory && player.inventory.length > 0) {
    const items = await ItemSchema.find({ _id: { $in: player.inventory } });
    const armors = items.filter((item: any) => item.type === 'armor');
    if (armors.length > 0) {
      // Use the best armor
      const bestArmor = armors.reduce((best: any, current: any) => {
        const bestDef = best.stats?.defense || 0;
        const currentDef = current.stats?.defense || 0;
        return currentDef > bestDef ? current : best;
      });
      defense += bestArmor.stats?.defense || 0;
    }
  }
  
  return defense;
}

// Check if player should level up and handle level up
async function checkLevelUp(player: any): Promise<string[]> {
  const messages: string[] = [];
  
  while (player.experience >= player.level * EXPERIENCE_PER_LEVEL) {
    player.level += 1;
    player.maxHp += HP_GAIN_PER_LEVEL;
    player.hp = player.maxHp; // Full heal on level up
    messages.push('');
    messages.push('═══════════════════════════════════');
    messages.push(`    LEVEL UP! Bạn đã lên cấp ${player.level}!`);
    messages.push(`    HP tối đa tăng thêm ${HP_GAIN_PER_LEVEL}!`);
    messages.push(`    HP đã được hồi phục đầy!`);
    messages.push('═══════════════════════════════════');
  }
  
  return messages;
}

// Drop loot from defeated agent
async function dropLoot(agent: any, roomId: string): Promise<string[]> {
  const messages: string[] = [];
  
  if (agent.loot && agent.loot.length > 0) {
    const room = await RoomSchema.findById(roomId);
    if (room) {
      for (const lootId of agent.loot) {
        // Create a new instance of the loot item
        const originalItem = await ItemSchema.findById(lootId);
        if (originalItem) {
          const newItem = await ItemSchema.create({
            name: originalItem.name,
            description: originalItem.description,
            type: originalItem.type,
            value: originalItem.value,
            stats: originalItem.stats
          });
          
          room.items.push(newItem._id);
          messages.push(`[${agent.name}] làm rơi ra một [${originalItem.name}].`);
        }
      }
      await room.save();
    }
  }
  
  return messages;
}

// Combat tick - executes one round of combat
export async function executeCombatTick(playerId: string, agentId: string): Promise<void> {
  try {
    const player = await PlayerSchema.findById(playerId);
    const agent = await AgentSchema.findById(agentId);
    
    if (!player || !agent) {
      console.error('Player or agent not found in combat tick');
      gameState.stopCombat(playerId);
      return;
    }
    
    // Check if either is already dead
    if (player.hp <= 0 || agent.hp <= 0) {
      gameState.stopCombat(playerId);
      return;
    }
    
    const messages: string[] = [];
    const room = await RoomSchema.findById(player.currentRoomId);
    
    // Player attacks
    const playerBaseDamage = await calculatePlayerDamage(player);
    const playerDamage = calculateDamage(playerBaseDamage);
    agent.hp = Math.max(0, agent.hp - playerDamage);
    await agent.save();
    
    messages.push(`Bạn tấn công [${agent.name}], gây ${playerDamage} sát thương.`);
    
    // Check if agent died
    if (agent.hp <= 0) {
      messages.push('');
      messages.push(`Bạn đã hạ gục [${agent.name}]!`);
      messages.push(`Bạn nhận được ${agent.experience} điểm kinh nghiệm.`);
      
      player.experience += agent.experience;
      player.inCombat = false;
      player.combatTarget = undefined;
      await player.save();
      
      // Check for level up
      const levelUpMessages = await checkLevelUp(player);
      messages.push(...levelUpMessages);
      
      // Drop loot
      const lootMessages = await dropLoot(agent, player.currentRoomId.toString());
      messages.push(...lootMessages);
      
      // Save agent data for respawn and remove from room
      const agentData = {
        _id: agent._id,
        name: agent.name,
        description: agent.description,
        type: agent.type,
        maxHp: agent.maxHp,
        level: agent.level,
        damage: agent.damage,
        behavior: agent.behavior,
        patrolRoute: agent.patrolRoute,
        dialogue: agent.dialogue,
        shopItems: agent.shopItems,
        loot: agent.loot,
        experience: agent.experience
      };
      
      if (room) {
        room.agents = room.agents.filter((id: any) => id.toString() !== agent._id.toString());
        await room.save();
        
        // Schedule respawn
        scheduleAgentRespawn(agentData, room._id.toString());
      }
      
      // Delete the agent
      await AgentSchema.findByIdAndDelete(agent._id);
      
      gameState.stopCombat(playerId);
      
      // Send messages to player
      const playerObj = gameState.getPlayer(playerId);
      if (playerObj && playerObj.ws) {
        messages.forEach(msg => {
          if (msg === '') {
            playerObj.ws.send(JSON.stringify({ type: 'normal', message: '' }));
          } else if (msg.includes('[') && msg.includes(']')) {
            playerObj.ws.send(JSON.stringify({ type: 'accent', message: msg }));
          } else if (msg.includes('═')) {
            playerObj.ws.send(JSON.stringify({ type: 'system', message: msg }));
          } else {
            playerObj.ws.send(JSON.stringify({ type: 'action', message: msg }));
          }
        });
        
        // Show updated stats
        playerObj.ws.send(JSON.stringify({ 
          type: 'system', 
          message: `HP: ${player.hp}/${player.maxHp} | Level: ${player.level} | XP: ${player.experience}/${player.level * EXPERIENCE_PER_LEVEL}` 
        }));
      }
      
      // Broadcast to room
      if (room) {
        gameState.broadcastToRoom(
          room._id.toString(),
          {
            type: 'normal',
            message: `[${player.username}] đã hạ gục [${agent.name}]!`
          },
          playerId
        );
      }
      
      return;
    }
    
    // Agent attacks back
    const agentDamage = calculateDamage(agent.damage);
    const playerDefense = await calculatePlayerDefense(player);
    const actualDamage = Math.max(1, agentDamage - playerDefense); // Minimum 1 damage
    
    player.hp = Math.max(0, player.hp - actualDamage);
    await player.save();
    
    if (playerDefense > 0) {
      messages.push(`[${agent.name}] tấn công bạn, gây ${agentDamage} sát thương (giảm ${playerDefense} bởi giáp).`);
    } else {
      messages.push(`[${agent.name}] tấn công bạn, gây ${actualDamage} sát thương.`);
    }
    
    // Check if player died
    if (player.hp <= 0) {
      messages.push('');
      messages.push('Bạn đã bị đánh bại!');
      messages.push('Bạn tỉnh dậy tại Cổng Thành Cũ...');
      
      player.inCombat = false;
      player.combatTarget = undefined;
      
      // Respawn at starting location
      const startingRoom = await RoomSchema.findOne({ name: 'Cổng Thành Cũ' });
      if (startingRoom) {
        player.currentRoomId = startingRoom._id;
        gameState.updatePlayerRoom(playerId, startingRoom._id.toString());
      }
      
      // Restore some HP
      player.hp = Math.floor(player.maxHp * 0.5);
      await player.save();
      
      gameState.stopCombat(playerId);
      
      // Send messages to player
      const playerObj = gameState.getPlayer(playerId);
      if (playerObj && playerObj.ws) {
        messages.forEach(msg => {
          if (msg === '') {
            playerObj.ws.send(JSON.stringify({ type: 'normal', message: '' }));
          } else if (msg.includes('[') && msg.includes(']')) {
            playerObj.ws.send(JSON.stringify({ type: 'accent', message: msg }));
          } else {
            playerObj.ws.send(JSON.stringify({ type: 'error', message: msg }));
          }
        });
        
        // Show updated stats
        playerObj.ws.send(JSON.stringify({ 
          type: 'system', 
          message: `HP: ${player.hp}/${player.maxHp} | Level: ${player.level}` 
        }));
      }
      
      // Broadcast to room
      if (room) {
        gameState.broadcastToRoom(
          room._id.toString(),
          {
            type: 'normal',
            message: `[${player.username}] đã bị [${agent.name}] đánh bại!`
          },
          playerId
        );
      }
      
      // Agent exits combat
      agent.inCombat = false;
      agent.combatTarget = undefined;
      await agent.save();
      
      return;
    }
    
    // Send combat messages to player
    const playerObj = gameState.getPlayer(playerId);
    if (playerObj && playerObj.ws) {
      messages.forEach(msg => {
        if (msg.includes('[') && msg.includes(']')) {
          playerObj.ws.send(JSON.stringify({ type: 'accent', message: msg }));
        } else {
          playerObj.ws.send(JSON.stringify({ type: 'action', message: msg }));
        }
      });
      
      // Show HP
      playerObj.ws.send(JSON.stringify({ 
        type: 'system', 
        message: `HP: ${player.hp}/${player.maxHp} | [${agent.name}] HP: ${agent.hp}/${agent.maxHp}` 
      }));
    }
    
    // Broadcast to room spectators
    if (room) {
      gameState.broadcastToRoom(
        room._id.toString(),
        {
          type: 'normal',
          message: `[${player.username}] đang chiến đấu với [${agent.name}]...`
        },
        playerId
      );
    }
    
  } catch (error) {
    console.error('Error in combat tick:', error);
    gameState.stopCombat(playerId);
  }
}

// Start combat between player and agent
export async function startCombat(playerId: string, agentId: string): Promise<string[]> {
  const messages: string[] = [];
  
  try {
    const player = await PlayerSchema.findById(playerId);
    const agent = await AgentSchema.findById(agentId);
    
    if (!player || !agent) {
      messages.push('Lỗi: Không tìm thấy thông tin người chơi hoặc mục tiêu.');
      return messages;
    }
    
    // Mark both as in combat
    player.inCombat = true;
    player.combatTarget = agent._id;
    await player.save();
    
    agent.inCombat = true;
    agent.combatTarget = player._id as any;
    await agent.save();
    
    messages.push(`Bạn lao vào tấn công [${agent.name}]!`);
    messages.push(`HP: ${player.hp}/${player.maxHp} | [${agent.name}] HP: ${agent.hp}/${agent.maxHp}`);
    
    // Broadcast to room
    const room = await RoomSchema.findById(player.currentRoomId);
    if (room) {
      gameState.broadcastToRoom(
        room._id.toString(),
        {
          type: 'accent',
          message: `[${player.username}] bắt đầu tấn công [${agent.name}]!`
        },
        playerId
      );
    }
    
    // Start combat tick
    gameState.startCombat(playerId, COMBAT_TICK_INTERVAL, () => {
      executeCombatTick(playerId, agentId);
    });
    
  } catch (error) {
    console.error('Error starting combat:', error);
    messages.push('Lỗi khi bắt đầu chiến đấu.');
  }
  
  return messages;
}

// Flee from combat
export async function fleeCombat(playerId: string): Promise<string[]> {
  const messages: string[] = [];
  
  try {
    const player = await PlayerSchema.findById(playerId);
    if (!player) {
      messages.push('Lỗi: Không tìm thấy thông tin người chơi.');
      return messages;
    }
    
    if (!player.inCombat) {
      messages.push('Bạn không đang trong chiến đấu.');
      return messages;
    }
    
    // Check flee success
    const fleeSuccess = Math.random() < FLEE_SUCCESS_CHANCE;
    
    if (fleeSuccess) {
      // Get current room and find available exits
      const currentRoom = await RoomSchema.findById(player.currentRoomId);
      if (!currentRoom) {
        messages.push('Lỗi: Không tìm thấy phòng hiện tại.');
        return messages;
      }
      
      const exits = ['north', 'south', 'east', 'west', 'up', 'down']
        .filter(dir => (currentRoom.exits as any)[dir]);
      
      if (exits.length === 0) {
        messages.push('Bạn không tìm thấy lối thoát!');
        return messages;
      }
      
      // Pick random exit
      const randomExit = exits[Math.floor(Math.random() * exits.length)];
      const nextRoomId = (currentRoom.exits as any)[randomExit];
      const nextRoom = await RoomSchema.findById(nextRoomId);
      
      if (!nextRoom) {
        messages.push('Lỗi: Không tìm thấy phòng đích.');
        return messages;
      }
      
      // Broadcast to old room
      gameState.broadcastToRoom(
        player.currentRoomId.toString(),
        {
          type: 'normal',
          message: `[${player.username}] bỏ chạy khỏi chiến đấu!`
        },
        playerId
      );
      
      // Stop combat
      const agent = player.combatTarget ? await AgentSchema.findById(player.combatTarget) : null;
      if (agent) {
        agent.inCombat = false;
        agent.combatTarget = undefined;
        await agent.save();
      }
      
      player.inCombat = false;
      player.combatTarget = undefined;
      player.currentRoomId = nextRoom._id;
      await player.save();
      
      gameState.stopCombat(playerId);
      gameState.updatePlayerRoom(playerId, nextRoom._id.toString());
      
      // Broadcast to new room
      gameState.broadcastToRoom(
        nextRoom._id.toString(),
        {
          type: 'normal',
          message: `[${player.username}] chạy vào, trông rất hoảng sợ!`
        },
        playerId
      );
      
      messages.push('Bạn đã bỏ chạy thành công!');
      messages.push('');
      messages.push(`[${nextRoom.name}]`);
      messages.push(nextRoom.description);
      
    } else {
      messages.push('Bạn không thể bỏ chạy! Bạn bị chặn lại!');
    }
    
  } catch (error) {
    console.error('Error fleeing combat:', error);
    messages.push('Lỗi khi bỏ chạy.');
  }
  
  return messages;
}
