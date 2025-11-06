<template>
  <div class="player-status-header">
    <!-- Player Info Section -->
    <div class="player-info-section">
      <span class="player-name">{{ name }}</span>
      <span class="player-level">Lv.{{ level }}</span>
    </div>

    <div class="status-section">
      <span class="status-label">HP:</span>
      <div class="status-bar-container">
        <div class="status-bar hp-bar" :style="{ width: hpPercentage + '%' }"></div>
      </div>
      <span class="status-text">{{ hp }}/{{ maxHp }}</span>
    </div>

    <div class="status-section">
      <span class="status-label">MP:</span>
      <div class="status-bar-container">
        <div class="status-bar mp-bar" :style="{ width: resourcePercentage + '%' }"></div>
      </div>
      <span class="status-text">{{ resource }}/{{ maxResource }}</span>
    </div>

    <div class="currency-section">
      <span class="currency-label">💰</span>
      <span class="currency-value">{{ currency }}</span>
    </div>

    <div class="currency-section">
      <span class="currency-label">💎</span>
      <span class="currency-value">{{ premiumCurrency }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  name?: string;
  level?: number;
  hp: number;
  maxHp: number;
  resource: number;
  maxResource: number;
  currency: number;
  premiumCurrency: number;
}

const props = withDefaults(defineProps<Props>(), {
  name: 'Player',
  level: 1,
  hp: 0,
  maxHp: 100,
  resource: 0,
  maxResource: 100,
  currency: 0,
  premiumCurrency: 0
});

const hpPercentage = computed(() => {
  return props.maxHp > 0 ? Math.floor((props.hp / props.maxHp) * 100) : 0;
});

const resourcePercentage = computed(() => {
  return props.maxResource > 0 ? Math.floor((props.resource / props.maxResource) * 100) : 0;
});
</script>

<style scoped>
.player-status-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background-color: rgba(0, 136, 0, 0.1);
  border-bottom: 1px solid var(--text-bright);
  font-family: 'VT323', 'Source Code Pro', monospace;
  flex-wrap: wrap;
  gap: 1rem;
}

.player-info-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 150px;
}

.player-name {
  color: var(--text-accent);
  font-size: 20px;
  font-weight: bold;
}

.player-level {
  color: var(--text-bright);
  font-size: 18px;
  background-color: rgba(0, 255, 0, 0.15);
  padding: 0.1rem 0.5rem;
  border-radius: 3px;
  border: 1px solid var(--text-bright);
}

.status-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 200px;
}

.status-label {
  color: var(--text-dim);
  font-size: 16px;
  min-width: 35px;
}

.status-bar-container {
  flex: 1;
  height: 18px;
  background-color: rgba(136, 0, 0, 0.3);
  border: 1px solid var(--text-dim);
  position: relative;
  min-width: 100px;
}

.status-bar {
  height: 100%;
  transition: width 0.3s ease;
}

.hp-bar {
  background-color: #00ff00;
}

.mp-bar {
  background-color: #00aaff;
}

.status-text {
  color: var(--text-bright);
  font-size: 14px;
  min-width: 70px;
  text-align: right;
}

.currency-section {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.currency-label {
  color: var(--text-accent);
  font-size: 18px;
}

.currency-value {
  color: var(--text-bright);
  font-size: 16px;
  font-weight: bold;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .player-status-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
    padding: 0.5rem;
  }

  .player-info-section {
    justify-content: space-between;
    min-width: auto;
  }

  .player-name {
    font-size: 18px;
  }

  .player-level {
    font-size: 16px;
  }

  .status-section {
    min-width: auto;
  }

  .status-bar-container {
    min-width: 80px;
  }

  .status-label {
    font-size: 14px;
    min-width: 30px;
  }

  .status-text {
    font-size: 13px;
    min-width: 60px;
  }

  .currency-label {
    font-size: 16px;
  }

  .currency-value {
    font-size: 14px;
  }
}
</style>
