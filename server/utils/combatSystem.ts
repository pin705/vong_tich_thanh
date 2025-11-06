import { PlayerSchema } from '../../models/Player';
import { AgentSchema } from '../../models/Agent';
import { ItemSchema } from '../../models/Item';
import { RoomSchema } from '../../models/Room';
import { gameState } from './gameState';
import { partyService } from './partyService';
import { scheduleAgentRespawn } from './npcAI';
import { applyExpBuff } from './buffSystem';
import { clearBossState } from './bossMechanics';
import { broadcastRoomOccupants } from '../routes/ws';
import { COMBAT_TICK_INTERVAL, FLEE_SUCCESS_CHANCE, EXPERIENCE_PER_LEVEL, HP_GAIN_PER_LEVEL, MINIMUM_DAMAGE } from './constants';

// Boss reward constants
const BOSS_PREMIUM_CURRENCY_MULTIPLIER = 10;
const BOSS_GOLD_MULTIPLIER = 100;

// Combat narrative constants
const CRITICAL_HIT_MULTIPLIER = 1.1;
const GLANCING_BLOW_MULTIPLIER = 0.9;

// Helper function to categorize combat messages for semantic highlighting
function getCombatMessageType(message: string): string {
  if (message === '') return 'normal';
  if (message.includes('LEVEL UP') || message.includes('═')) return 'critical';
  if (message.includes('điểm kinh nghiệm')) return 'xp';
  if (message.includes('làm rơi')) return 'loot';
  if (message.includes('tấn công bạn')) return 'damage_in';
  if (message.includes('Bạn tấn công') || (message.includes('gây') && message.includes('sát thương'))) return 'damage_out';
  if (message.includes('hạ gục')) return 'damage_out';
  return 'action';
}

// Helper function to send combat state updates to player
async function sendCombatStateUpdate(playerId: string) {
  const player = await PlayerSchema.findById(playerId);
  if (!player) return;
  
  const playerObj = gameState.getPlayer(playerId);
  if (!playerObj || !playerObj.ws) return;
  
  // Send player state
  playerObj.ws.send(JSON.stringify({
    type: 'player_state',
    payload: {
      name: player.username,
      hp: player.hp,
      maxHp: player.maxHp,
      resource: player.resource || 0,
      maxResource: player.maxResource || 100,
      level: player.level,
      currency: player.gold,
      premiumCurrency: player.premiumCurrency || 0,
      inCombat: player.inCombat
    }
  }));
  
  // Send target state
  if (player.inCombat && player.combatTarget) {
    const target = await AgentSchema.findById(player.combatTarget);
    if (target) {
      playerObj.ws.send(JSON.stringify({
        type: 'target_state',
        payload: {
          name: target.name,
          hp: target.hp,
          maxHp: target.maxHp
        }
      }));
    }
  } else {
    // Clear target
    playerObj.ws.send(JSON.stringify({
      type: 'target_state',
      payload: null
    }));
  }
}

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

// Distribute experience to party members or solo player
async function distributeExperience(killer: any, totalExp: number, roomId: string): Promise<string[]> {
  const messages: string[] = [];
  
  // Check if killer is in a party
  const playerParty = partyService.getPlayerParty(killer._id.toString());
  
  if (!playerParty) {
    // Solo kill - apply EXP buff and give all EXP to killer
    const { exp: modifiedExp, multiplier } = await applyExpBuff(killer._id.toString(), totalExp);
    
    if (multiplier > 1) {
      messages.push(`[+] Bạn nhận được ${modifiedExp} điểm kinh nghiệm (${multiplier}x boost!).`);
    } else {
      messages.push(`Bạn nhận được ${modifiedExp} điểm kinh nghiệm.`);
    }
    
    killer.experience += modifiedExp;
    await killer.save();
    return messages;
  }
  
  // Party kill - distribute EXP to nearby members
  const { party } = playerParty;
  const memberIds = Array.from(party.memberIds);
  
  // Get party members in the same room (nearby)
  const playersInRoom = gameState.getPlayersInRoom(roomId);
  const nearbyPartyMembers = playersInRoom.filter(p => memberIds.includes(p.id));
  
  if (nearbyPartyMembers.length === 0) {
    // No party members nearby, apply EXP buff and give all EXP to killer
    const { exp: modifiedExp, multiplier } = await applyExpBuff(killer._id.toString(), totalExp);
    
    if (multiplier > 1) {
      messages.push(`[+] Bạn nhận được ${modifiedExp} điểm kinh nghiệm (${multiplier}x boost!).`);
    } else {
      messages.push(`Bạn nhận được ${modifiedExp} điểm kinh nghiệm.`);
    }
    
    killer.experience += modifiedExp;
    await killer.save();
    return messages;
  }
  
  // Calculate EXP per member
  const expPerMember = Math.floor(totalExp / nearbyPartyMembers.length);
  
  // Distribute EXP to each nearby party member (with individual buffs)
  for (const member of nearbyPartyMembers) {
    const memberPlayer = await PlayerSchema.findById(member.id);
    if (!memberPlayer) continue;
    
    // Apply individual EXP buff for this member
    const { exp: modifiedExp, multiplier } = await applyExpBuff(member.id, expPerMember);
    
    memberPlayer.experience += modifiedExp;
    await memberPlayer.save();
    
    // Send notification to member
    if (member.ws) {
      const buffMessage = multiplier > 1 ? ` (${multiplier}x boost!)` : '';
      const prefix = multiplier > 1 ? '[+] ' : '';
      member.ws.send(JSON.stringify({
        type: 'system',
        category: 'xp',
        message: `${prefix}Bạn nhận được ${modifiedExp} EXP (Nhóm)${buffMessage}`
      }));
    }
  }
  
  // Get killer's specific EXP (they're in the party too)
  const killerMember = nearbyPartyMembers.find(m => m.id === killer._id.toString());
  if (killerMember) {
    const { exp: modifiedExp, multiplier } = await applyExpBuff(killer._id.toString(), expPerMember);
    const buffMessage = multiplier > 1 ? ` (${multiplier}x boost!)` : '';
    messages.push(`[+] Bạn nhận được ${modifiedExp} điểm kinh nghiệm (Nhóm - ${nearbyPartyMembers.length} thành viên)${buffMessage}`);
  } else {
    messages.push(`Bạn nhận được ${expPerMember} điểm kinh nghiệm (Nhóm - ${nearbyPartyMembers.length} thành viên).`);
  }
  
  return messages;
}

// Check if player should level up and handle level up
async function checkLevelUp(player: any): Promise<string[]> {
  const messages: string[] = [];
  
  while (player.experience >= player.level * EXPERIENCE_PER_LEVEL) {
    player.level += 1;
    player.maxHp += HP_GAIN_PER_LEVEL;
    player.hp = player.maxHp; // Full heal on level up
    
    // Grant talent point if level >= 10
    if (player.level >= 10) {
      player.talentPoints = (player.talentPoints || 0) + 1;
    }
    
    // Phase 29: Grant skill points on level up
    player.skillPoints = (player.skillPoints || 0) + 1;
    
    messages.push('');
    messages.push('═══════════════════════════════════');
    messages.push(`    LEVEL UP! Bạn đã lên cấp ${player.level}!`);
    messages.push(`    HP tối đa tăng thêm ${HP_GAIN_PER_LEVEL}!`);
    messages.push(`    HP đã được hồi phục đầy!`);
    messages.push(`    [*] Bạn nhận được 1 điểm kỹ năng!`);
    if (player.level >= 10) {
      messages.push(`    [*] Bạn nhận được 1 điểm thiên phú!`);
    }
    messages.push('═══════════════════════════════════');
  }
  
  return messages;
}

// Drop loot from defeated agent
async function dropLoot(agent: any, roomId: string): Promise<string[]> {
  const messages: string[] = [];
  const room = await RoomSchema.findById(roomId);
  if (!room) return messages;

  // Phase 21: Use lootTable if available (priority)
  if (agent.lootTable && agent.lootTable.length > 0) {
    for (const lootEntry of agent.lootTable) {
      // Roll for drop chance
      const roll = Math.random();
      if (roll <= lootEntry.dropChance) {
        const originalItem = await ItemSchema.findById(lootEntry.itemId);
        if (originalItem) {
          const newItem = await ItemSchema.create({
            name: originalItem.name,
            description: originalItem.description,
            type: originalItem.type,
            value: originalItem.value,
            stats: originalItem.stats,
            rarity: originalItem.rarity,
            quality: originalItem.quality,
            slot: originalItem.slot,
            requiredLevel: originalItem.requiredLevel,
            setKey: originalItem.setKey,
            setBonus: originalItem.setBonus,
            recipe: originalItem.recipe,
            resultItem: originalItem.resultItem
          });
          
          room.items.push(newItem._id);
          
          // Highlight items by quality (prioritize quality over legacy rarity)
          const itemQuality = originalItem.quality || originalItem.rarity;
          if (itemQuality === 'Sử Thi' || itemQuality === 'legendary') {
            messages.push(`[!] [${agent.name}] làm rơi ra [${originalItem.name}] (${itemQuality})!`);
          } else if (itemQuality === 'Hiếm' || itemQuality === 'epic' || itemQuality === 'rare') {
            messages.push(`[!] [${agent.name}] làm rơi ra [${originalItem.name}] (${itemQuality})!`);
          } else {
            messages.push(`[${agent.name}] làm rơi ra một [${originalItem.name}].`);
          }
        }
      }
    }
  }
  // Legacy loot system (fallback)
  else if (agent.loot && agent.loot.length > 0) {
    for (const lootId of agent.loot) {
      // Create a new instance of the loot item
      const originalItem = await ItemSchema.findById(lootId);
      if (originalItem) {
        const newItem = await ItemSchema.create({
          name: originalItem.name,
          description: originalItem.description,
          type: originalItem.type,
          value: originalItem.value,
          stats: originalItem.stats,
          rarity: originalItem.rarity,
          quality: originalItem.quality
        });
        
        room.items.push(newItem._id);
        
        // Highlight rare items with color
        if (originalItem.rarity === 'epic' || originalItem.rarity === 'legendary') {
          messages.push(`[!] [${agent.name}] làm rơi ra [${originalItem.name}] (${originalItem.rarity})!`);
        } else {
          messages.push(`[${agent.name}] làm rơi ra một [${originalItem.name}].`);
        }
      }
    }
  }

  await room.save();
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
    
    // Enhanced combat narrative - vary attack descriptions
    const attackVerbs = ['tấn công', 'đánh trúng', 'ra đòn', 'tung đòn', 'giáng đòn'];
    const attackVerb = attackVerbs[Math.floor(Math.random() * attackVerbs.length)];
    const damageDesc = playerDamage > playerBaseDamage * CRITICAL_HIT_MULTIPLIER ? ' (Chí mạng!)' : 
                       playerDamage < playerBaseDamage * GLANCING_BLOW_MULTIPLIER ? ' (Trượt phớt)' : '';
    messages.push(`Bạn ${attackVerb} [${agent.name}], gây ${playerDamage} sát thương${damageDesc}. (HP còn lại: ${agent.hp}/${agent.maxHp})`);
    
    // Check if agent died
    if (agent.hp <= 0) {
      messages.push('');
      messages.push(`Bạn đã hạ gục [${agent.name}]!`);
      
      // Handle faction reputation (Phase 18)
      if (agent.faction) {
        const { updateReputation } = await import('./factionService');
        const reputationResult = await updateReputation(playerId, agent.faction, -10); // Lose 10 reputation for killing
        if (reputationResult.success) {
          messages.push(reputationResult.message);
        }
      }
      
      // Phase 19: Boss rewards
      let totalExp = agent.experience;
      if (agent.agentType === 'boss') {
        // Boss kills give 50x EXP
        totalExp = agent.experience * 50;
        messages.push('');
        messages.push('═══════════════════════════════════');
        messages.push(`    [!] BOSS DEFEATED! [!]`);
        messages.push('═══════════════════════════════════');
        
        // Award premium currency (Cổ Thạch)
        const premiumReward = Math.floor(agent.level * BOSS_PREMIUM_CURRENCY_MULTIPLIER);
        player.premiumCurrency = (player.premiumCurrency || 0) + premiumReward;
        messages.push(`[+] Bạn nhận được ${premiumReward} Cổ Thạch!`);
        
        // Award gold
        const goldReward = agent.level * BOSS_GOLD_MULTIPLIER;
        player.gold = (player.gold || 0) + goldReward;
        messages.push(`[+] Bạn nhận được ${goldReward} Vàng!`);
        
        // Clear boss state
        clearBossState(agent._id.toString());
        
        // Send world alert about boss defeat
        const { broadcastService } = await import('./broadcastService');
        
        // Check if player is in party - if so, mention party in alert
        const killerPartyCheck = partyService.getPlayerParty(playerId);
        if (killerPartyCheck) {
          broadcastService.sendWorldAlert(`*** [${player.username}] và đồng đội đã hạ gục [${agent.name}]! ***`);
        } else {
          broadcastService.sendWorldAlert(`*** [${player.username}] đã hạ gục [${agent.name}]! ***`);
        }
      } else if (agent.agentType === 'elite') {
        // Elite kills give 3x EXP
        totalExp = agent.experience * 3;
        messages.push('[!] Elite defeated! Bonus rewards!');
      }
      
      // Handle EXP distribution (with party support)
      const expMessages = await distributeExperience(player, totalExp, room._id.toString());
      messages.push(...expMessages);
      
      player.inCombat = false;
      player.combatTarget = undefined;
      await player.save();
      
      // Check for level up
      const levelUpMessages = await checkLevelUp(player);
      messages.push(...levelUpMessages);
      
      // Drop loot
      const lootMessages = await dropLoot(agent, player.currentRoomId.toString());
      messages.push(...lootMessages);
      
      // Notify about loot turn if in party
      const killerParty = partyService.getPlayerParty(playerId);
      if (killerParty) {
        const { party } = killerParty;
        
        if (party.lootRule === 'leader-only') {
          const leaderPlayer = await PlayerSchema.findById(party.leaderId);
          if (leaderPlayer) {
            messages.push(`Loot Rule: Chỉ [${leaderPlayer.username}] (Trưởng Nhóm) có thể nhặt đồ.`);
          }
        } else if (party.lootRule === 'round-robin') {
          const nextLooter = partyService.getNextLooter(killerParty.partyId);
          if (nextLooter) {
            const nextLooterPlayer = await PlayerSchema.findById(nextLooter);
            if (nextLooterPlayer) {
              messages.push(`Loot Turn: Đến lượt [${nextLooterPlayer.username}] nhặt đồ.`);
              
              // Notify next looter via websocket
              const nextLooterObj = gameState.getPlayer(nextLooter);
              if (nextLooterObj?.ws) {
                nextLooterObj.ws.send(JSON.stringify({
                  type: 'system',
                  category: 'loot',
                  message: 'Đến lượt bạn nhặt đồ!'
                }));
              }
            }
          }
        }
      }
      
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
        lootTable: agent.lootTable,
        experience: agent.experience,
        agentType: agent.agentType,
        mechanics: agent.mechanics,
        faction: agent.faction,
        isVendor: agent.isVendor,
        shopInventory: agent.shopInventory,
        shopType: agent.shopType
      };
      
      if (room) {
        // Use findByIdAndUpdate to avoid version conflicts
        await RoomSchema.findByIdAndUpdate(
          room._id,
          { $pull: { agents: agent._id } },
          { new: true }
        );
        
        // Schedule respawn
        await scheduleAgentRespawn(agentData, room._id.toString());
      }
      
      // Delete the agent
      await AgentSchema.findByIdAndDelete(agent._id);
      
      gameState.stopCombat(playerId);
      
      // Send messages to player with semantic types
      const playerObj = gameState.getPlayer(playerId);
      if (playerObj && playerObj.ws) {
        messages.forEach(msg => {
          const messageType = getCombatMessageType(msg);
          playerObj.ws.send(JSON.stringify({ 
            type: messageType, 
            message: msg,
            channel: 'combat',
            category: 'combat-player'
          }));
        });
        
        // Show updated stats
        playerObj.ws.send(JSON.stringify({ 
          type: 'system', 
          message: `HP: ${player.hp}/${player.maxHp} | Level: ${player.level} | XP: ${player.experience}/${player.level * EXPERIENCE_PER_LEVEL}`,
          channel: 'combat',
          category: 'combat-stats'
        }));
      }
      
      // Send state update (combat ended)
      await sendCombatStateUpdate(playerId);
      
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
        
        // Update room occupants for all players in the room
        await broadcastRoomOccupants(room._id.toString());
      }
      
      return;
    }
    
    // Agent attacks back
    const agentDamage = calculateDamage(agent.damage);
    const playerDefense = await calculatePlayerDefense(player);
    const actualDamage = Math.max(MINIMUM_DAMAGE, agentDamage - playerDefense);
    
    player.hp = Math.max(0, player.hp - actualDamage);
    await player.save();
    
    // Enhanced enemy attack narrative
    const enemyAttackVerbs = ['tấn công', 'lao vào', 'đánh trả', 'phản công', 'tấn công ngược'];
    const enemyAttackVerb = enemyAttackVerbs[Math.floor(Math.random() * enemyAttackVerbs.length)];
    if (playerDefense > 0) {
      messages.push(`[${agent.name}] ${enemyAttackVerb} bạn! Gây ${agentDamage} sát thương, nhưng giáp của bạn giảm ${playerDefense} sát thương. (HP còn lại: ${player.hp}/${player.maxHp})`);
    } else {
      messages.push(`[${agent.name}] ${enemyAttackVerb} bạn, gây ${actualDamage} sát thương! (HP còn lại: ${player.hp}/${player.maxHp})`);
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
            playerObj.ws.send(JSON.stringify({ 
              type: 'normal', 
              message: '',
              channel: 'combat',
              category: 'combat-player'
            }));
          } else if (msg.includes('[') && msg.includes(']')) {
            playerObj.ws.send(JSON.stringify({ 
              type: 'accent', 
              message: msg,
              channel: 'combat',
              category: 'combat-player'
            }));
          } else {
            playerObj.ws.send(JSON.stringify({ 
              type: 'error', 
              message: msg,
              channel: 'combat',
              category: 'combat-player'
            }));
          }
        });
        
        // Show updated stats
        playerObj.ws.send(JSON.stringify({ 
          type: 'system', 
          message: `HP: ${player.hp}/${player.maxHp} | Level: ${player.level}`,
          channel: 'combat',
          category: 'combat-stats'
        }));
      }
      
      // Send state update (player died, combat ended)
      await sendCombatStateUpdate(playerId);
      
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
    
    // Send combat messages to player with semantic types
    const playerObj = gameState.getPlayer(playerId);
    if (playerObj && playerObj.ws) {
      messages.forEach(msg => {
        const messageType = getCombatMessageType(msg);
        playerObj.ws.send(JSON.stringify({ 
          type: messageType, 
          message: msg,
          channel: 'combat',
          category: 'combat-player'
        }));
      });
      
      // Show HP
      playerObj.ws.send(JSON.stringify({ 
        type: 'system', 
        message: `HP: ${player.hp}/${player.maxHp} | [${agent.name}] HP: ${agent.hp}/${agent.maxHp}`,
        channel: 'combat',
        category: 'combat-stats'
      }));
    }
    
    // Send state update (combat continuing)
    await sendCombatStateUpdate(playerId);
    
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
    
    // Enhanced combat start narrative
    const combatStartMessages = [
      `Bạn rút vũ khí và lao vào tấn công [${agent.name}]!`,
      `Bạn nhào tới đánh [${agent.name}] với quyết tâm chiến đấu!`,
      `Bạn chuẩn bị tư thế và bắt đầu giao tranh với [${agent.name}]!`,
      `Bạn lao vào tấn công [${agent.name}]!`
    ];
    const startMessage = combatStartMessages[Math.floor(Math.random() * combatStartMessages.length)];
    messages.push(startMessage);
    
    // Add agent reaction based on behavior
    if (agent.behavior === 'aggressive') {
      messages.push(`[${agent.name}] gầm lên dữ dội và sẵn sàng chiến đấu!`);
    } else if (agent.behavior === 'wander') {
      messages.push(`[${agent.name}] quay lại và đối mặt với bạn!`);
    } else {
      messages.push(`[${agent.name}] chuẩn bị chiến đấu!`);
    }
    
    messages.push('');
    messages.push(`Trận chiến bắt đầu! HP: ${player.hp}/${player.maxHp} | [${agent.name}] HP: ${agent.hp}/${agent.maxHp}`);
    
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

// Start PvP combat between two players
export async function startPvPCombat(attackerId: string, targetId: string): Promise<string[]> {
  const messages: string[] = [];
  
  try {
    const attacker = await PlayerSchema.findById(attackerId);
    const target = await PlayerSchema.findById(targetId);
    
    if (!attacker || !target) {
      messages.push('Lỗi: Không tìm thấy thông tin người chơi.');
      return messages;
    }
    
    // Check if attacker has PvP enabled
    if (!attacker.pvpEnabled) {
      messages.push('Bạn cần bật chế độ PvP trước. Gõ: pvp on');
      return messages;
    }
    
    // Check if target has PvP enabled
    if (!target.pvpEnabled) {
      messages.push(`[${target.username}] không bật chế độ PvP.`);
      return messages;
    }
    
    // Check if both players are in the same room
    if (attacker.currentRoomId.toString() !== target.currentRoomId.toString()) {
      messages.push('Người chơi không ở cùng phòng với bạn.');
      return messages;
    }
    
    // Check if room is a safe zone
    const room = await RoomSchema.findById(attacker.currentRoomId);
    if (room && room.isSafeZone) {
      messages.push('Không thể tấn công trong khu vực an toàn.');
      return messages;
    }
    
    // Check if either player is already in combat
    if (attacker.inCombat) {
      messages.push('Bạn đang trong chiến đấu.');
      return messages;
    }
    
    if (target.inCombat) {
      messages.push(`[${target.username}] đang trong chiến đấu.`);
      return messages;
    }
    
    // Check if players are in the same party
    const attackerParty = partyService.getPlayerParty(attackerId);
    const targetParty = partyService.getPlayerParty(targetId);
    
    if (attackerParty && targetParty && attackerParty.partyId === targetParty.partyId) {
      messages.push('Không thể tấn công đồng đội trong nhóm!');
      return messages;
    }
    
    // Check if players are in the same guild
    if (attacker.guild && target.guild && 
        attacker.guild.toString() === target.guild.toString()) {
      messages.push('Không thể tấn công thành viên cùng bang!');
      return messages;
    }
    
    // Mark both as in combat
    attacker.inCombat = true;
    attacker.combatTarget = target._id as any; // Store target as player, not agent
    await attacker.save();
    
    target.inCombat = true;
    target.combatTarget = attacker._id as any;
    await target.save();
    
    messages.push(`Bạn lao vào tấn công [${target.username}]!`);
    messages.push(`HP: ${attacker.hp}/${attacker.maxHp} | [${target.username}] HP: ${target.hp}/${target.maxHp}`);
    
    // Notify target player
    const targetPlayer = gameState.getPlayer(targetId);
    if (targetPlayer?.ws) {
      targetPlayer.ws.send(JSON.stringify({
        type: 'message',
        category: 'pvp',
        message: `[${attacker.username}] tấn công bạn!`
      }));
    }
    
    // Broadcast to room
    if (room) {
      gameState.broadcastToRoom(
        room._id.toString(),
        {
          type: 'accent',
          message: `[${attacker.username}] bắt đầu tấn công [${target.username}]!`
        },
        attackerId
      );
    }
    
    // Note: PvP combat tick system would need to be implemented separately
    // For now, this marks both players as in combat
    messages.push('Chức năng PvP đang được phát triển. Hệ thống chiến đấu tự động chưa được kích hoạt.');
    
  } catch (error) {
    console.error('Error starting PvP combat:', error);
    messages.push('Lỗi khi bắt đầu chiến đấu PvP.');
  }
  
  return messages;
}
