<template>
  <FullscreenOverlay :isOpen="isOpen" @close="$emit('close')" size="medium" :title="popupTitle">
    <div class="trading-popup">
      <!-- Header with merchant info -->
      <div class="merchant-header">
        <div class="merchant-name">{{ merchantName }}</div>
        <div class="player-gold">Vàng của bạn: <span class="gold-amount">{{ playerGold }}</span></div>
      </div>

      <!-- Tab Navigation -->
      <div class="tab-navigation">
        <button
          class="tab-button"
          :class="{ active: activeTab === 'buy' }"
          @click="activeTab = 'buy'"
        >
          [1] Mua Hàng
        </button>
        <button
          class="tab-button"
          :class="{ active: activeTab === 'sell' }"
          @click="activeTab = 'sell'"
        >
          [2] Bán Hàng
        </button>
      </div>

      <!-- Buy Tab -->
      <div v-if="activeTab === 'buy'" class="tab-content">
        <div v-if="merchantItems.length === 0" class="empty-message">
          {{ merchantName }} không có hàng để bán.
        </div>
        <ItemGrid
          v-else
          :items="merchantItems"
          :actions="buyActions"
          :showPrice="true"
          :columns="4"
          @itemAction="handleBuyAction"
        />
      </div>

      <!-- Sell Tab -->
      <div v-if="activeTab === 'sell'" class="tab-content">
        <div v-if="playerItems.length === 0 || playerItems.every(i => !i)" class="empty-message">
          Bạn không có vật phẩm nào để bán.
        </div>
        <ItemGrid
          v-else
          :items="playerItems"
          :actions="sellActions"
          :showPrice="true"
          :columns="4"
          @itemAction="handleSellAction"
        />
      </div>
    </div>
  </FullscreenOverlay>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import FullscreenOverlay from './FullscreenOverlay.vue';
import ItemGrid from './ItemGrid.vue';

interface ItemStats {
  damage?: number;
  defense?: number;
  healing?: number;
  critChance?: number;
  critDamage?: number;
  lifesteal?: number;
  dodge?: number;
}

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: 'weapon' | 'armor' | 'consumable' | 'misc';
  value: number;
  stats?: ItemStats;
  levelRequirement?: number;
  equipped?: boolean;
}

interface Props {
  isOpen: boolean;
  merchantName: string;
  merchantItems: InventoryItem[];
  playerItems: (InventoryItem | null)[];
  playerGold: number;
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  merchantName: 'Thương nhân',
  merchantItems: () => [],
  playerItems: () => [],
  playerGold: 0
});

const emit = defineEmits<{
  close: [];
  buy: [itemId: string];
  sell: [itemId: string];
}>();

const activeTab = ref<'buy' | 'sell'>('buy');

const popupTitle = computed(() => {
  return `Giao Dịch - ${props.merchantName}`;
});

// Buy actions
const buyActions = computed(() => [
  {
    id: 'buy',
    label: 'Mua',
    number: 1,
    condition: (item: InventoryItem) => props.playerGold >= item.value
  },
  {
    id: 'inspect',
    label: 'Xem xét',
    number: 2
  }
]);

// Sell actions
const sellActions = computed(() => [
  {
    id: 'sell',
    label: 'Bán',
    number: 1
  },
  {
    id: 'inspect',
    label: 'Xem xét',
    number: 2
  }
]);

const handleBuyAction = (action: string, itemId: string) => {
  if (action === 'buy') {
    emit('buy', itemId);
  }
};

const handleSellAction = (action: string, itemId: string) => {
  if (action === 'sell') {
    emit('sell', itemId);
  }
};
</script>

<style scoped>
.trading-popup {
  display: flex;
  flex-direction: column;
  height: 100%;
  font-family: 'VT323', 'Source Code Pro', monospace;
  color: var(--text-bright);
}

.merchant-header {
  padding: 1rem;
  border-bottom: 1px solid rgba(0, 136, 0, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.merchant-name {
  color: var(--text-accent);
  font-size: 20px;
  font-weight: bold;
}

.player-gold {
  color: var(--text-dim);
  font-size: 16px;
}

.gold-amount {
  color: var(--text-accent);
  font-weight: bold;
}

.tab-navigation {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  border-bottom: 2px solid rgba(0, 136, 0, 0.3);
  background: rgba(0, 136, 0, 0.05);
}

.tab-button {
  flex: 1;
  background: transparent;
  color: var(--text-dim);
  border: 1px solid rgba(0, 136, 0, 0.3);
  padding: 0.6rem;
  cursor: pointer;
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 16px;
  transition: all 0.2s;
}

.tab-button:hover {
  background: rgba(0, 136, 0, 0.2);
  color: var(--text-bright);
}

.tab-button.active {
  background: rgba(0, 136, 0, 0.3);
  color: var(--text-accent);
  border-color: var(--text-bright);
  font-weight: bold;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.empty-message {
  text-align: center;
  color: var(--text-dim);
  padding: 2rem;
  font-size: 16px;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .merchant-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.75rem;
  }

  .merchant-name {
    font-size: 18px;
  }

  .player-gold {
    font-size: 14px;
  }

  .tab-button {
    font-size: 14px;
    padding: 0.5rem;
  }

  .tab-content {
    padding: 0.75rem;
  }

  .empty-message {
    font-size: 14px;
    padding: 1.5rem;
  }
}
</style>
