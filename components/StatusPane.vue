<template>
  <div class="status-pane">
    <!-- Status Effects -->
    <StatusEffects 
      v-if="statusEffects && statusEffects.length > 0"
      :effects="statusEffects"
      @effectClick="handleEffectClick"
    />

    <div class="status-section">
      <div class="status-title">[ Bạn: {{ playerName }} ]</div>
      <div class="stat-row">
        <span class="stat-label">HP:</span>
        <span class="stat-bar">{{ renderBar(hp, maxHp) }}</span>
        <span class="stat-value">{{ hp }}/{{ maxHp }}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">{{ getResourceName }}:</span>
        <span class="stat-bar">{{ renderBar(playerClass ? resource : mp, playerClass ? maxResource : maxMp) }}</span>
        <span class="stat-value">{{ playerClass ? resource : mp }}/{{ playerClass ? maxResource : maxMp }}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Cấp:</span>
        <span class="stat-value">{{ level }}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">💰 Vàng:</span>
        <span class="stat-value">{{ gold }}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">💎 Cổ Thạch:</span>
        <span class="stat-value">{{ premiumCurrency }}</span>
      </div>
    </div>
    
    <div v-if="inCombat && targetName" class="status-section target-section">
      <div class="status-title">[ Mục tiêu: {{ targetName }} ]</div>
      <div class="stat-row">
        <span class="stat-label">HP:</span>
        <span class="stat-bar">{{ renderBar(targetHp, targetMaxHp) }}</span>
        <span class="stat-value">{{ targetHp }}/{{ targetMaxHp }}</span>
      </div>
      
      <!-- Boss Cast Bar -->
      <div v-if="targetCasting" class="cast-bar-container">
        <div class="cast-label">{{ targetCasting.skillName }}</div>
        <div class="cast-bar-wrapper">
          <div class="cast-bar" :style="{ width: `${targetCasting.progress}%` }"></div>
        </div>
        <div class="cast-time">{{ (targetCasting.remaining / 1000).toFixed(1) }}s</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import StatusEffects from './StatusEffects.vue';

interface StatusEffect {
  id: string;
  name: string;
  type: 'buff' | 'debuff';
  description: string;
  duration?: number;
}

interface TargetCasting {
  skillName: string;
  progress: number; // 0-100
  remaining: number; // milliseconds
}

const props = defineProps({
  playerName: {
    type: String,
    default: 'Người chơi'
  },
  hp: {
    type: Number,
    default: 100
  },
  maxHp: {
    type: Number,
    default: 100
  },
  mp: {
    type: Number,
    default: 50
  },
  maxMp: {
    type: Number,
    default: 50
  },
  level: {
    type: Number,
    default: 1
  },
  gold: {
    type: Number,
    default: 0
  },
  premiumCurrency: {
    type: Number,
    default: 0
  },
  inCombat: {
    type: Boolean,
    default: false
  },
  targetName: {
    type: String,
    default: ''
  },
  targetHp: {
    type: Number,
    default: 0
  },
  targetMaxHp: {
    type: Number,
    default: 0
  },
  statusEffects: {
    type: Array as () => StatusEffect[],
    default: () => []
  },
  targetCasting: {
    type: Object as () => TargetCasting | null,
    default: null
  },
  playerClass: {
    type: String,
    default: ''
  },
  resource: {
    type: Number,
    default: 0
  },
  maxResource: {
    type: Number,
    default: 100
  }
});

const getResourceName = computed(() => {
  const resourceNames: Record<string, string> = {
    mutant_warrior: 'Nộ',
    rune_historian: 'Mana',
    stalker: 'Năng Lượng',
    scrap_engineer: 'Linh Kiện',
  };
  return resourceNames[props.playerClass] || 'MP';
});

const emit = defineEmits<{
  effectClick: [effect: StatusEffect];
}>();

const handleEffectClick = (effect: StatusEffect) => {
  emit('effectClick', effect);
};

const renderBar = (current: number, max: number): string => {
  if (max === 0) return '[----------]';
  const barLength = 10;
  const filled = Math.round((current / max) * barLength);
  const empty = barLength - filled;
  return '[' + '|'.repeat(filled) + '-'.repeat(empty) + ']';
};
</script>

<style scoped>
.status-pane {
  padding: 0.75rem;
  background-color: rgba(0, 136, 0, 0.03);
  border: 1px solid rgba(0, 136, 0, 0.3);
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 16px;
  line-height: 1.6;
  overflow-y: auto;
}

.status-section {
  margin-bottom: 1rem;
}

.status-section:last-child {
  margin-bottom: 0;
}

.target-section {
  border-top: 1px solid rgba(0, 136, 0, 0.3);
  padding-top: 0.75rem;
}

.status-title {
  color: var(--text-accent);
  font-weight: bold;
  margin-bottom: 0.5rem;
  font-size: 17px;
}

.stat-row {
  display: flex;
  align-items: center;
  margin-bottom: 0.25rem;
  color: var(--text-bright);
}

.stat-label {
  color: var(--text-dim);
  min-width: 50px;
  margin-right: 0.5rem;
}

.stat-bar {
  color: var(--text-bright);
  margin-right: 0.5rem;
  font-family: monospace;
}

.stat-value {
  color: var(--text-bright);
}

.cast-bar-container {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(0, 136, 0, 0.3);
}

.cast-label {
  color: var(--text-accent);
  font-weight: bold;
  margin-bottom: 0.25rem;
  font-size: 15px;
}

.cast-bar-wrapper {
  height: 16px;
  background-color: rgba(0, 0, 0, 0.5);
  border: 1px solid var(--text-dim);
  position: relative;
  overflow: hidden;
  margin-bottom: 0.25rem;
}

.cast-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--text-danger), var(--text-accent));
  transition: width 0.1s linear;
}

.cast-time {
  color: var(--text-bright);
  font-size: 14px;
  text-align: right;
}
</style>
