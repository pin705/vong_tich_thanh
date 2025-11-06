import { PlayerSchema } from '../../models/Player';
import { AgentSchema } from '../../models/Agent';
import { ItemSchema } from '../../models/Item';
import { RoomSchema } from '../../models/Room';
import { PlayerQuestSchema } from '../../models/PlayerQuest';
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
    // Don't save here - will be saved after level up check in main combat flow
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
    // Don't save here - will be saved after level up check in main combat flow
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
    
    // Check for level up for party members
    const memberLevelUpMessages = await checkLevelUp(memberPlayer);
    
    // Save after level up check
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
      
      // Send level up messages if any
      if (memberLevelUpMessages.length > 0) {
        for (const msg of memberLevelUpMessages) {
          member.ws.send(JSON.stringify({
            type: 'system',
            category: 'level',
            message: msg
          }));
        }
      }
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
    
    // Grant talent point on every level up (changed from level 10+ only)
    player.talentPoints = (player.talentPoints || 0) + 1;
    
    // Phase 29: Grant skill points on level up
    player.skillPoints = (player.skillPoints || 0) + 1;
    
    messages.push('');
    messages.push('═══════════════════════════════════');
    messages.push(`    LEVEL UP! Bạn đã lên cấp ${player.level}!`);
    messages.push(`    HP tối đa tăng thêm ${HP_GAIN_PER_LEVEL}!`);
    messages.push(`    HP đã được hồi phục đầy!`);
    messages.push(`    [*] Bạn nhận được 1 điểm kỹ năng!`);
    messages.push(`    [*] Bạn nhận được 1 điểm thiên phú!`);
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
    
    // Player attacks (only if auto-attacking is enabled)
    const playerState = gameState.getPlayerState(playerId);
    if (!playerState) {
      console.error('Player state not found for combat tick');
      return;
    }
    
    if (playerState.isAutoAttacking) {
      const playerBaseDamage = await calculatePlayerDamage(player);
      const playerDamage = calculateDamage(playerBaseDamage);
      agent.hp = Math.max(0, agent.hp - playerDamage);
      await agent.save();
      
      // Enhanced combat narrative with varied attack descriptions
      const isCritical = playerDamage > playerBaseDamage * CRITICAL_HIT_MULTIPLIER;
      const isGlancing = playerDamage < playerBaseDamage * GLANCING_BLOW_MULTIPLIER;
      
      let attackMessage = '';
      if (isCritical) {
        const critMessages = [
          `Bạn tung ra một đòn chí mạng vào [${agent.name}]!`,
          `Đòn đánh của bạn xé toạc phòng thủ của [${agent.name}]!`,
          `Bạn tìm được khe hở và giáng một đòn hiểm hóc vào [${agent.name}]!`,
          `Sức mạnh bùng nổ! Bạn đánh trúng điểm yếu của [${agent.name}]!`
        ];
        attackMessage = critMessages[Math.floor(Math.random() * critMessages.length)];
        attackMessage += ` Gây ${playerDamage} sát thương! (Chí mạng!)`;
      } else if (isGlancing) {
        const glancingMessages = [
          `Đòn đánh của bạn chỉ sượt qua [${agent.name}].`,
          `[${agent.name}] né tránh một phần đòn tấn công của bạn.`,
          `Bạn đánh trúng [${agent.name}] nhưng không gây nhiều sát thương.`,
          `Đòn đánh yếu ớt, [${agent.name}] hầu như không bị ảnh hưởng.`
        ];
        attackMessage = glancingMessages[Math.floor(Math.random() * glancingMessages.length)];
        attackMessage += ` Gây ${playerDamage} sát thương. (Trượt phớt)`;
      } else {
        const normalMessages = [
          `Bạn vung vũ khí đánh trúng [${agent.name}].`,
          `Bạn tấn công [${agent.name}] với một đòn chắc chắn.`,
          `Bạn ra đòn và [${agent.name}] không kịp né.`,
          `Bạn giáng xuống một đòn uy lực lên [${agent.name}].`,
          `Bạn lao tới và tung đòn vào [${agent.name}].`,
          `Vũ khí của bạn rít lên khi chém vào [${agent.name}].`
        ];
        attackMessage = normalMessages[Math.floor(Math.random() * normalMessages.length)];
        attackMessage += ` Gây ${playerDamage} sát thương.`;
      }
      
      attackMessage += ` (HP còn lại: ${agent.hp}/${agent.maxHp})`;
      messages.push(attackMessage);
    }
    
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
      
      // Reset player state when combat ends
      const endPlayerState = gameState.getPlayerState(playerId);
      if (endPlayerState) {
        endPlayerState.inCombat = false;
        endPlayerState.isAutoAttacking = false;
        endPlayerState.combatTargetId = null;
      }
      
      // Check for level up BEFORE saving to ensure level changes are persisted
      const levelUpMessages = await checkLevelUp(player);
      messages.push(...levelUpMessages);
      
      // Save player state after level up check
      await player.save();
      
      // Drop loot
      const lootMessages = await dropLoot(agent, player.currentRoomId.toString());
      messages.push(...lootMessages);
      
      // Update quest progress for killing this mob
      const questMessages = await updateQuestProgress(playerId, 'kill', agent.name);
      messages.push(...questMessages);
      
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
        shopType: agent.shopType,
        maxInstances: agent.maxInstances
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
      
      // Send combat-end message
      const endPlayerObj = gameState.getPlayer(playerId);
      if (endPlayerObj && endPlayerObj.ws) {
        endPlayerObj.ws.send(JSON.stringify({
          type: 'combat-end'
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
    
    // Enhanced enemy attack narrative with more variety
    const hpPercent = (player.hp / player.maxHp) * 100;
    let enemyAttackMessage = '';
    
    if (playerDefense > 0) {
      const deflectMessages = [
        `[${agent.name}] lao vào tấn công bạn!`,
        `[${agent.name}] đánh trả dữ dội!`,
        `[${agent.name}] phản công với sức mạnh đáng sợ!`,
        `[${agent.name}] tấn công ngược bạn!`
      ];
      const deflectMessage = deflectMessages[Math.floor(Math.random() * deflectMessages.length)];
      enemyAttackMessage = `${deflectMessage} Gây ${agentDamage} sát thương, nhưng giáp của bạn hấp thụ ${playerDefense} sát thương.`;
    } else {
      const attackMessages = [
        `[${agent.name}] vung vuốt lên người bạn!`,
        `[${agent.name}] tấn công bạn bằng sức mạnh dữ dội!`,
        `[${agent.name}] lao vào và đánh trúng bạn!`,
        `[${agent.name}] phản công với đòn hiểm hóc!`
      ];
      const attackMessage = attackMessages[Math.floor(Math.random() * attackMessages.length)];
      enemyAttackMessage = `${attackMessage} Gây ${actualDamage} sát thương!`;
    }
    
    // Add HP warning if critical
    if (hpPercent <= 20) {
      enemyAttackMessage += ` (HP còn lại: ${player.hp}/${player.maxHp}) ⚠️ CẢN H BÁO: HP RẤT THẤP!`;
    } else if (hpPercent <= 40) {
      enemyAttackMessage += ` (HP còn lại: ${player.hp}/${player.maxHp}) ⚠️ Cảnh báo: HP thấp!`;
    } else {
      enemyAttackMessage += ` (HP còn lại: ${player.hp}/${player.maxHp})`;
    }
    
    messages.push(enemyAttackMessage);
    
    // Check if player died
    if (player.hp <= 0) {
      messages.push('');
      messages.push('Bạn đã bị đánh bại!');
      messages.push('Bạn tỉnh dậy tại Cổng Thành Cũ...');
      
      player.inCombat = false;
      player.combatTarget = undefined;
      
      // Reset player state when player dies
      const deathPlayerState = gameState.getPlayerState(playerId);
      if (deathPlayerState) {
        deathPlayerState.inCombat = false;
        deathPlayerState.isAutoAttacking = false;
        deathPlayerState.combatTargetId = null;
      }
      
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
      
      // Send combat-end message
      const deathPlayerObj = gameState.getPlayer(playerId);
      if (deathPlayerObj && deathPlayerObj.ws) {
        deathPlayerObj.ws.send(JSON.stringify({
          type: 'combat-end'
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
    
    // Initialize player state with auto-attack enabled
    const playerState = gameState.getPlayerState(playerId);
    if (playerState) {
      playerState.inCombat = true;
      playerState.isAutoAttacking = true; // Auto-enable when starting combat
      playerState.combatTargetId = agentId;
    }
    
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
    
    // Send combat-start message with skills and cooldowns to player
    const playerObj = gameState.getPlayer(playerId);
    if (playerObj && playerObj.ws) {
      // Populate player skills
      await player.populate('skills');
      
      const playerState = gameState.getPlayerState(playerId);
      
      playerObj.ws.send(JSON.stringify({
        type: 'combat-start',
        targetData: {
          id: agent._id.toString(),
          name: agent.name,
          hp: agent.hp,
          maxHp: agent.maxHp,
          level: agent.level
        },
        playerSkills: player.skills || [],
        playerCooldowns: playerState?.skillCooldowns || []
      }));
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
      
      // Reset player state when fleeing
      const fleePlayerState = gameState.getPlayerState(playerId);
      if (fleePlayerState) {
        fleePlayerState.inCombat = false;
        fleePlayerState.isAutoAttacking = false;
        fleePlayerState.combatTargetId = null;
      }
      
      // Send combat-end message
      const fleePlayerObj = gameState.getPlayer(playerId);
      if (fleePlayerObj && fleePlayerObj.ws) {
        fleePlayerObj.ws.send(JSON.stringify({
          type: 'combat-end'
        }));
      }
      
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

// Update quest progress when player performs an action
async function updateQuestProgress(playerId: string, actionType: string, target: string): Promise<string[]> {
  const messages: string[] = [];
  
  try {
    // Find active quests for this player
    const activeQuests = await PlayerQuestSchema.find({
      playerId,
      status: 'active'
    });
    
    if (activeQuests.length === 0) {
      return messages;
    }
    
    // Update progress for matching objectives
    for (const quest of activeQuests) {
      let questUpdated = false;
      
      for (const objective of quest.objectives) {
        // Check if objective matches the action
        if (objective.type === actionType && objective.target.toLowerCase() === target.toLowerCase()) {
          if (objective.progress < objective.count) {
            objective.progress += 1;
            questUpdated = true;
            
            // Check if objective is now complete
            if (objective.progress >= objective.count) {
              messages.push(`[Quest] Objective completed: ${objective.target} (${objective.progress}/${objective.count})`);
            } else {
              messages.push(`[Quest] Progress: ${objective.target} (${objective.progress}/${objective.count})`);
            }
          }
        }
      }
      
      if (questUpdated) {
        // Check if all objectives are complete
        const allComplete = quest.objectives.every((obj: any) => obj.progress >= obj.count);
        if (allComplete) {
          messages.push('');
          messages.push(`[!] Quest "${quest.questId}" ready to complete!`);
          messages.push('Return to the quest giver to claim your reward.');
        }
        
        await quest.save();
      }
    }
  } catch (error) {
    console.error('Error updating quest progress:', error);
  }
  
  return messages;
}
