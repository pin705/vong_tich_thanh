<template>
  <div class="skill-bar">
    <div 
      v-for="skill in equippedSkills" 
      :key="skill.id" 
      class="skill-slot"
      @click="handleSkillClick(skill)"
      @mouseenter="showTooltip(skill, $event)"
      @mouseleave="hideTooltip"
    >
      <div class="skill-icon">
        <span class="skill-slot-number">{{ skill.slot }}</span>
        <span class="skill-name">{{ getShortName(skill.name) }}</span>
      </div>
      
      <!-- Cooldown overlay -->
      <div v-if="getCooldown(skill.id) > 0" class="cooldown-overlay">
        <span class="cooldown-timer">{{ getCooldown(skill.id) }}</span>
      </div>
      
      <!-- Mana cost indicator -->
      <div class="mana-cost">{{ skill.manaCost }}</div>
    </div>
    
    <!-- Tooltip -->
    <Teleport to="body" v-if="typeof document !== 'undefined'">
      <div 
        v-if="tooltipSkill" 
        class="skill-tooltip"
        :style="{ top: tooltipPos.y + 'px', left: tooltipPos.x + 'px' }"
      >
        <div class="tooltip-header">{{ tooltipSkill.name }}</div>
        <div class="tooltip-description">{{ tooltipSkill.description }}</div>
        <div class="tooltip-stats">
          <div v-if="tooltipSkill.damage > 0" class="tooltip-stat">
            <span class="stat-label">Sát Thương:</span>
            <span class="stat-value damage">{{ tooltipSkill.damage }}</span>
          </div>
          <div v-if="tooltipSkill.healing > 0" class="tooltip-stat">
            <span class="stat-label">Hồi Máu:</span>
            <span class="stat-value heal">{{ tooltipSkill.healing }}</span>
          </div>
          <div class="tooltip-stat">
            <span class="stat-label">Mana:</span>
            <span class="stat-value">{{ tooltipSkill.manaCost }}</span>
          </div>
          <div class="tooltip-stat">
            <span class="stat-label">Cooldown:</span>
            <span class="stat-value">{{ tooltipSkill.cooldown }}s</span>
          </div>
          <div class="tooltip-stat">
            <span class="stat-label">Cấp:</span>
            <span class="stat-value">{{ tooltipSkill.rank }}/{{ tooltipSkill.maxRank }}</span>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { EquippedSkill } from '~/composables/usePlayerState';

const props = defineProps<{
  equippedSkills: EquippedSkill[];
  skillCooldowns: Record<string, number>;
}>();

const emit = defineEmits<{
  useSkill: [skillId: string];
}>();

const tooltipSkill = ref<EquippedSkill | null>(null);
const tooltipPos = ref({ x: 0, y: 0 });

// Get cooldown for a skill
const getCooldown = (skillId: string): number => {
  return props.skillCooldowns[skillId] || 0;
};

// Get short name for display (max 8 chars)
const getShortName = (name: string): string => {
  if (name.length <= 8) return name;
  return name.substring(0, 7) + '…';
};

// Handle skill click
const handleSkillClick = (skill: EquippedSkill) => {
  if (getCooldown(skill.id) === 0) {
    emit('useSkill', skill.id);
  }
};

// Show tooltip
const showTooltip = (skill: EquippedSkill, event: MouseEvent) => {
  tooltipSkill.value = skill;
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  tooltipPos.value = {
    x: rect.left + rect.width / 2,
    y: rect.top - 10
  };
};

// Hide tooltip
const hideTooltip = () => {
  tooltipSkill.value = null;
};
</script>

<style scoped>
.skill-bar {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  background-color: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(0, 136, 0, 0.5);
  border-radius: 4px;
}

.skill-slot {
  position: relative;
  width: 60px;
  height: 60px;
  background-color: rgba(0, 136, 0, 0.1);
  border: 2px solid rgba(0, 136, 0, 0.5);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.skill-slot:hover {
  border-color: var(--text-bright);
  background-color: rgba(0, 136, 0, 0.2);
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
}

.skill-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  width: 100%;
  height: 100%;
  padding: 0.25rem;
}

.skill-slot-number {
  position: absolute;
  top: 2px;
  left: 4px;
  font-size: 10px;
  color: var(--text-dim);
  font-weight: bold;
}

.skill-name {
  font-size: 11px;
  color: var(--text-bright);
  text-align: center;
  word-break: break-word;
  line-height: 1.2;
}

.cooldown-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
}

.cooldown-timer {
  font-size: 18px;
  font-weight: bold;
  color: var(--text-accent);
  text-shadow: 0 0 5px rgba(255, 165, 0, 0.5);
}

.mana-cost {
  position: absolute;
  bottom: 2px;
  right: 4px;
  font-size: 10px;
  color: var(--text-cyan);
  font-weight: bold;
  background-color: rgba(0, 0, 0, 0.6);
  padding: 1px 3px;
  border-radius: 2px;
}

/* Tooltip styles */
.skill-tooltip {
  position: fixed;
  background-color: rgba(0, 0, 0, 0.95);
  border: 2px solid var(--text-bright);
  border-radius: 4px;
  padding: 0.75rem;
  font-family: 'VT323', 'Source Code Pro', monospace;
  z-index: 10000;
  pointer-events: none;
  transform: translate(-50%, -100%);
  min-width: 250px;
  max-width: 350px;
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
}

.tooltip-header {
  font-size: 18px;
  font-weight: bold;
  color: var(--text-bright);
  margin-bottom: 0.5rem;
  border-bottom: 1px solid rgba(0, 136, 0, 0.5);
  padding-bottom: 0.25rem;
}

.tooltip-description {
  font-size: 14px;
  color: var(--text-normal);
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

.tooltip-stats {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.tooltip-stat {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.stat-label {
  color: var(--text-dim);
}

.stat-value {
  color: var(--text-bright);
  font-weight: bold;
}

.stat-value.damage {
  color: var(--text-accent);
}

.stat-value.heal {
  color: #00ff00;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .skill-bar {
    gap: 0.3rem;
    padding: 0.3rem;
  }
  
  .skill-slot {
    width: 50px;
    height: 50px;
  }
  
  .skill-name {
    font-size: 10px;
  }
  
  .skill-tooltip {
    min-width: 200px;
    max-width: 280px;
    font-size: 12px;
  }
}
</style>
