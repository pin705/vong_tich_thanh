<template>
  <div class="status-pane">
    <div class="status-section">
      <div class="status-title">[ Bạn: {{ playerName }} ]</div>
      <div class="stat-row">
        <span class="stat-label">HP:</span>
        <span class="stat-bar">{{ renderBar(hp, maxHp) }}</span>
        <span class="stat-value">{{ hp }}/{{ maxHp }}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">MP:</span>
        <span class="stat-bar">{{ renderBar(mp, maxMp) }}</span>
        <span class="stat-value">{{ mp }}/{{ maxMp }}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Cấp:</span>
        <span class="stat-value">{{ level }}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Vàng:</span>
        <span class="stat-value">{{ gold }}</span>
      </div>
    </div>
    
    <div v-if="inCombat && targetName" class="status-section target-section">
      <div class="status-title">[ Mục tiêu: {{ targetName }} ]</div>
      <div class="stat-row">
        <span class="stat-label">HP:</span>
        <span class="stat-bar">{{ renderBar(targetHp, targetMaxHp) }}</span>
        <span class="stat-value">{{ targetHp }}/{{ targetMaxHp }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

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
  }
});

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
  background-color: rgba(0, 136, 0, 0.05);
  border: 1px solid var(--text-dim);
  border-radius: 4px;
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
  border-top: 1px solid var(--text-dim);
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
</style>
