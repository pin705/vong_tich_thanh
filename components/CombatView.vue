<template>
  <div class="combat-view-container">
    <!-- Combatant Panes (Player and Target) -->
    <div class="combatant-panes">
      <!-- Player Pane -->
      <div class="combatant-pane player-pane">
        <div class="combatant-name">{{ player?.name || 'Player' }}</div>
        <div class="hp-bar-container">
          <div class="bar hp-bar">
            <div class="bar-fill hp-fill" :style="{ width: playerHpPercent + '%' }"></div>
          </div>
          <div class="bar-text">HP: {{ player?.hp || 0 }} / {{ player?.maxHp || 100 }}</div>
        </div>
        <div class="resource-bar-container" v-if="player?.resource !== undefined">
          <div class="bar resource-bar">
            <div class="bar-fill resource-fill" :style="{ width: playerResourcePercent + '%' }"></div>
          </div>
          <div class="bar-text">Mana: {{ player?.resource || 0 }} / {{ player?.maxResource || 100 }}</div>
        </div>
      </div>

      <!-- Target Pane -->
      <div class="combatant-pane target-pane">
        <div class="combatant-name">{{ target?.name || 'Target' }}</div>
        <div class="hp-bar-container">
          <div class="bar hp-bar">
            <div class="bar-fill hp-fill target-hp" :style="{ width: targetHpPercent + '%' }"></div>
          </div>
          <div class="bar-text">HP: {{ target?.hp || 0 }} / {{ target?.maxHp || 100 }}</div>
        </div>
      </div>
    </div>

    <!-- Combat Status -->
    <div class="combat-status">
      {{ combatStatus || 'Đang chiến đấu...' }}
    </div>

    <!-- Skill Bar -->
    <div class="skill-bar" v-if="displaySkills.length > 0">
      <div
        v-for="skill in displaySkills"
        :key="skill._id"
        class="skill-slot"
        :class="{ 'skill-ready': skill.isReady, 'skill-cooldown': !skill.isReady }"
      >
        <div class="skill-name">{{ skill.name }}</div>
        <div class="skill-cooldown-text">{{ skill.cooldownText }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

interface PlayerData {
  name: string;
  hp: number;
  maxHp: number;
  resource?: number;
  maxResource?: number;
}

interface TargetData {
  name: string;
  hp: number;
  maxHp: number;
}

interface Skill {
  _id: string;
  name: string;
  description?: string;
  cooldown?: number;
}

interface Cooldown {
  skillId: string;
  readyAt: number;
}

const props = defineProps<{
  player?: PlayerData;
  target?: TargetData;
  combatStatus?: string;
  skills?: Skill[];
  cooldowns?: Cooldown[];
}>();

// Current time for cooldown calculations
const now = ref(Date.now());

// Update time every second
let intervalId: number | null = null;

onMounted(() => {
  intervalId = setInterval(() => {
    now.value = Date.now();
  }, 1000);
});

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});

// Computed properties
const playerHpPercent = computed(() => {
  if (!props.player || !props.player.maxHp) return 0;
  return Math.max(0, Math.min(100, (props.player.hp / props.player.maxHp) * 100));
});

const playerResourcePercent = computed(() => {
  if (!props.player || !props.player.maxResource) return 0;
  return Math.max(0, Math.min(100, ((props.player.resource || 0) / props.player.maxResource) * 100));
});

const targetHpPercent = computed(() => {
  if (!props.target || !props.target.maxHp) return 0;
  return Math.max(0, Math.min(100, (props.target.hp / props.target.maxHp) * 100));
});

const displaySkills = computed(() => {
  if (!props.skills || props.skills.length === 0) return [];

  return props.skills.map(skill => {
    // Find cooldown for this skill
    const cooldown = props.cooldowns?.find(cd => cd.skillId === skill._id);
    
    if (cooldown) {
      const secondsLeft = Math.ceil((cooldown.readyAt - now.value) / 1000);
      
      return {
        ...skill,
        isReady: secondsLeft <= 0,
        cooldownText: secondsLeft > 0 ? `${secondsLeft}s` : 'Sẵn sàng'
      };
    }
    
    // No cooldown found, skill is ready
    return {
      ...skill,
      isReady: true,
      cooldownText: 'Sẵn sàng'
    };
  });
});
</script>

<style scoped>
.combat-view-container {
  border-bottom: 1px solid var(--text-dim);
  padding: 0.4rem 0.5rem;
  background-color: rgba(0, 0, 0, 0.3);
  position: relative;
  font-size: 14px;
}

.combatant-panes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
}

.combatant-pane {
  padding: 0.4rem;
  border: 1px solid var(--text-dim);
  background-color: rgba(0, 136, 0, 0.1);
}

.combatant-name {
  color: var(--text-bright);
  font-weight: bold;
  margin-bottom: 0.3rem;
  text-align: center;
  font-size: 0.9em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hp-bar-container,
.resource-bar-container {
  margin-bottom: 0.2rem;
}

.bar {
  position: relative;
  height: 16px;
  background-color: rgba(0, 0, 0, 0.5);
  border: 1px solid var(--text-dim);
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.hp-fill {
  background-color: #00ff00;
}

.target-hp {
  background-color: #ff4444;
}

.resource-fill {
  background-color: #0088ff;
}

.bar-text {
  text-align: center;
  font-size: 0.75em;
  color: var(--text-bright);
  margin-top: 0.1rem;
}

.combat-status {
  text-align: center;
  font-style: italic;
  margin-top: 0.3rem;
  color: var(--text-accent);
  padding: 0.2rem;
  border-top: 1px dashed var(--text-dim);
  font-size: 0.85em;
}

.skill-bar {
  display: flex;
  justify-content: center;
  gap: 0.3rem;
  padding-top: 0.3rem;
  border-top: 1px dashed var(--text-dim);
  margin-top: 0.3rem;
  flex-wrap: wrap;
}

.skill-slot {
  border: 1px solid var(--text-dim);
  padding: 0.25rem 0.4rem;
  text-align: center;
  min-width: 65px;
  background-color: rgba(0, 0, 0, 0.3);
  transition: all 0.2s;
}

.skill-slot.skill-ready {
  border-color: var(--text-accent);
  background-color: rgba(255, 176, 0, 0.1);
}

.skill-slot.skill-cooldown {
  opacity: 0.6;
}

.skill-name {
  font-size: 0.75em;
  color: var(--text-bright);
  font-weight: bold;
  margin-bottom: 0.15rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.skill-cooldown-text {
  font-size: 0.7em;
  color: var(--text-dim);
}

.skill-ready .skill-cooldown-text {
  color: var(--text-accent);
}

/* Mobile responsiveness - more compact */
@media (max-width: 768px) {
  .combat-view-container {
    padding: 0.3rem 0.4rem;
    font-size: 13px;
  }

  .combatant-panes {
    gap: 0.4rem;
  }

  .combatant-pane {
    padding: 0.3rem;
  }

  .combatant-name {
    font-size: 0.85em;
    margin-bottom: 0.25rem;
  }

  .bar {
    height: 14px;
  }

  .bar-text {
    font-size: 0.7em;
  }

  .combat-status {
    font-size: 0.8em;
    padding: 0.15rem;
    margin-top: 0.25rem;
  }

  .skill-bar {
    gap: 0.2rem;
    padding-top: 0.25rem;
    margin-top: 0.25rem;
  }

  .skill-slot {
    min-width: 55px;
    padding: 0.2rem 0.3rem;
  }

  .skill-name {
    font-size: 0.7em;
    margin-bottom: 0.1rem;
  }

  .skill-cooldown-text {
    font-size: 0.65em;
  }
}

/* Very small screens - stack vertically */
@media (max-width: 480px) {
  .combatant-panes {
    grid-template-columns: 1fr;
    gap: 0.3rem;
  }

  .combat-view-container {
    padding: 0.25rem 0.3rem;
  }
}
</style>
