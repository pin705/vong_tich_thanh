<template>
  <div class="player-status-header">
    <!-- Player Info Section -->
    <div class="player-info-section">
      <span class="player-name">{{ name }}</span>
      <span class="player-level">Lv.{{ level }}</span>
    </div>

    <div class="status-section">
      <AttributeBar 
        label="HP" 
        :currentValue="hp" 
        :maxValue="maxHp" 
        color="hp"
      />
    </div>

    <div class="status-section">
      <AttributeBar 
        label="MP" 
        :currentValue="resource" 
        :maxValue="maxResource" 
        color="mp"
      />
    </div>

    <div class="currency-section">
      <span class="currency-label">Vàng</span>
      <span class="currency-value">{{ currency }}</span>
    </div>

    <div class="currency-section">
      <span class="currency-label">Cổ Thạch</span>
      <span class="currency-value">{{ premiumCurrency }}</span>
    </div>

    <div v-if="dungeonCoin > 0" class="currency-section">
      <span class="currency-label">Xu HN</span>
      <span class="currency-value">{{ dungeonCoin }}</span>
    </div>

    <div v-if="trainingBadge > 0" class="currency-section">
      <span class="currency-label">Huy Hiệu</span>
      <span class="currency-value">{{ trainingBadge }}</span>
    </div>

    <div v-if="gloryPoints > 0" class="currency-section">
      <span class="currency-label">Vinh Quang</span>
      <span class="currency-value">{{ gloryPoints }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import AttributeBar from './AttributeBar.vue';

interface Props {
  name?: string;
  level?: number;
  hp: number;
  maxHp: number;
  resource: number;
  maxResource: number;
  currency: number;
  premiumCurrency: number;
  dungeonCoin?: number;
  trainingBadge?: number;
  gloryPoints?: number;
}

const props = withDefaults(defineProps<Props>(), {
  name: 'Player',
  level: 1,
  hp: 0,
  maxHp: 100,
  resource: 0,
  maxResource: 100,
  currency: 0,
  premiumCurrency: 0,
  dungeonCoin: 0,
  trainingBadge: 0,
  gloryPoints: 0
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
  gap: 0.8rem;
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
  min-width: 180px;
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

/* Mobile responsiveness - make it sticky and compact */
@media (max-width: 768px) {
  .player-status-header {
    position: sticky;
    top: 0;
    z-index: 100;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.5rem;
    background-color: rgba(0, 136, 0, 0.15);
    backdrop-filter: blur(5px);
  }

  .player-info-section {
    flex: 1 1 auto;
    justify-content: flex-start;
    min-width: auto;
    gap: 0.5rem;
  }

  .player-name {
    font-size: 16px;
  }

  .player-level {
    font-size: 14px;
    padding: 0.05rem 0.4rem;
  }

  .status-section {
    flex: 1 1 calc(50% - 0.4rem);
    min-width: auto;
    gap: 0.3rem;
  }

  .currency-section {
    flex: 0 1 auto;
    gap: 0.25rem;
  }

  .currency-label {
    font-size: 14px;
  }

  .currency-value {
    font-size: 13px;
  }
}

/* Very small screens - further optimize */
@media (max-width: 480px) {
  .player-status-header {
    gap: 0.3rem;
    padding: 0.3rem 0.4rem;
  }

  .player-info-section {
    flex: 1 1 100%;
    gap: 0.4rem;
  }

  .player-name {
    font-size: 15px;
  }

  .player-level {
    font-size: 13px;
  }

  .status-section {
    flex: 1 1 100%;
  }

  .currency-section {
    flex: 0 1 auto;
  }

  .currency-label {
    font-size: 13px;
  }

  .currency-value {
    font-size: 12px;
  }
}
</style>
