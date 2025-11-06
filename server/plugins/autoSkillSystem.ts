import { PlayerSchema } from '~/models/Player';
import { SkillSchema } from '~/models/Skill';
import { gameState } from '../utils/gameState';

// Auto-skill system for automated skill usage
let autoSkillInterval: NodeJS.Timeout | null = null;
const AUTO_SKILL_CHECK_INTERVAL = 3000; // Check every 3 seconds

// Evaluate condition for auto-skill
function evaluateCondition(condition: any, player: any, target: any): boolean {
  const { type, value } = condition;
  
  switch (type) {
    case 'hp_below':
      return player.hp < (player.maxHp * value / 100);
    case 'hp_above':
      return player.hp > (player.maxHp * value / 100);
    case 'resource_above':
      return (player.resource || 0) > value;
    case 'resource_below':
      return (player.resource || 0) < value;
    case 'in_combat':
      return player.inCombat === value;
    case 'target_hp_below':
      return target && target.hp < (target.maxHp * value / 100);
    case 'target_hp_above':
      return target && target.hp > (target.maxHp * value / 100);
    default:
      return true;
  }
}

// Check if skill is on cooldown
function isSkillOnCooldown(player: any, skillId: string, cooldownSeconds: number): boolean {
  if (!player.skillCooldowns) {
    return false;
  }
  
  const lastUsed = player.skillCooldowns.get(skillId);
  if (!lastUsed) {
    return false;
  }
  
  const now = new Date();
  const timeSinceUsed = (now.getTime() - lastUsed.getTime()) / 1000;
  return timeSinceUsed < cooldownSeconds;
}

// Use a skill automatically
async function useAutoSkill(player: any, skill: any): Promise<boolean> {
  try {
    // Check if skill is on cooldown
    if (isSkillOnCooldown(player, skill._id.toString(), skill.cooldown || 0)) {
      return false;
    }
    
    // Check resource cost
    if (skill.resourceCost && (player.resource || 0) < skill.resourceCost) {
      return false;
    }
    
    // Apply skill effects
    let message = `(Auto) [${skill.name}] được kích hoạt!`;
    
    if (skill.type === 'active') {
      // Handle different skill types
      if (skill.healing > 0) {
        const healAmount = skill.healing;
        player.hp = Math.min(player.maxHp, player.hp + healAmount);
        message = `(Auto) Bạn sử dụng [${skill.name}]! Hồi ${healAmount} HP.`;
      }
      
      if (skill.damage > 0 && player.inCombat && player.combatTarget) {
        // Damage skill would be handled by combat system
        message = `(Auto) [${skill.name}] của bạn được kích hoạt!`;
      }
      
      // Consume resource
      if (skill.resourceCost) {
        player.resource = Math.max(0, (player.resource || 0) - skill.resourceCost);
      }
      
      // Set cooldown
      if (!player.skillCooldowns) {
        player.skillCooldowns = new Map();
      }
      player.skillCooldowns.set(skill._id.toString(), new Date());
      
      await player.save();
      
      // Send message to player
      const playerObj = gameState.getPlayer(player._id.toString());
      if (playerObj?.ws) {
        playerObj.ws.send(JSON.stringify({
          type: 'system',
          category: 'auto-skill',
          message,
        }));
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error using auto-skill:', error);
    return false;
  }
}

// Process auto-skills for all players
async function processAutoSkills() {
  try {
    // Get all online players with auto-skills configured
    const onlinePlayers = gameState.getAllPlayers();
    
    for (const playerObj of onlinePlayers) {
      const player = await PlayerSchema.findById(playerObj.id).populate('autoSkills.skillId');
      if (!player || !player.autoSkills || player.autoSkills.length === 0) {
        continue;
      }
      
      // Sort by priority (higher first)
      const sortedSkills = [...player.autoSkills].sort((a: any, b: any) => 
        (b.priority || 0) - (a.priority || 0)
      );
      
      // Get target if in combat
      let target = null;
      if (player.inCombat && player.combatTarget) {
        const { AgentSchema } = await import('~/models/Agent');
        target = await AgentSchema.findById(player.combatTarget);
      }
      
      // Try to use each skill in priority order
      for (const autoSkill of sortedSkills) {
        const skill = autoSkill.skillId;
        if (!skill) continue;
        
        // Check all conditions
        const conditions = autoSkill.conditions || new Map();
        let allConditionsMet = true;
        
        for (const [key, value] of conditions.entries()) {
          if (!evaluateCondition(value, player, target)) {
            allConditionsMet = false;
            break;
          }
        }
        
        if (allConditionsMet) {
          const used = await useAutoSkill(player, skill);
          if (used) {
            // Only use one skill per tick to avoid spamming
            break;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error processing auto-skills:', error);
  }
}

// Start auto-skill system
export function startAutoSkillSystem() {
  if (autoSkillInterval) {
    console.log('[Auto-Skill] System already running');
    return;
  }
  
  console.log('[Auto-Skill] Starting auto-skill system...');
  autoSkillInterval = setInterval(processAutoSkills, AUTO_SKILL_CHECK_INTERVAL);
}

// Stop auto-skill system
export function stopAutoSkillSystem() {
  if (autoSkillInterval) {
    console.log('[Auto-Skill] Stopping auto-skill system...');
    clearInterval(autoSkillInterval);
    autoSkillInterval = null;
  }
}

export default defineNitroPlugin((nitroApp) => {
  console.log('[Auto-Skill] Initializing auto-skill system...');
  
  // Start auto-skill system when server starts
  startAutoSkillSystem();
  
  // Stop auto-skill system on server shutdown
  nitroApp.hooks.hook('close', () => {
    stopAutoSkillSystem();
  });
});
