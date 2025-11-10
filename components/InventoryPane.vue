<template>
  <div class="inventory-pane">
    <div class="inventory-header">
      <button
        class="tab-button"
        :class="{ active: activeTab === 'info' }"
        @click="activeTab = 'info'"
      >
        [Thông Tin]
      </button>
      <button
        class="tab-button"
        :class="{ active: activeTab === 'items' }"
        @click="activeTab = 'items'"
      >
        [Vật Phẩm]
      </button>
      <button
        class="tab-button"
        :class="{ active: activeTab === 'equipment' }"
        @click="activeTab = 'equipment'"
      >
        [Trang Bị]
      </button>
    </div>

    <!-- Info Tab -->
    <div v-if="activeTab === 'info'" class="tab-content">
      <div class="info-section">
        <div class="info-row">
          <span class="info-label">Tên:</span>
          <span class="info-value">{{ playerName }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Cấp:</span>
          <span class="info-value">{{ level }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Kinh nghiệm:</span>
          <span class="info-value">{{ exp }}/{{ nextLevelExp }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Vàng:</span>
          <span class="info-value">{{ gold }}</span>
        </div>
      </div>

      <!-- Player Stats -->
      <div class="stats-section">
        <div class="stats-title">[ Chỉ Số ]</div>
        <div class="stat-row">
          <span class="stat-label">Sát thương:</span>
          <span class="stat-value">{{ stats.damage }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Phòng thủ:</span>
          <span class="stat-value">{{ stats.defense }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Bạo kích:</span>
          <span class="stat-value">{{ stats.critChance }}%</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">ST Bạo kích:</span>
          <span class="stat-value">{{ stats.critDamage }}%</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Hút máu:</span>
          <span class="stat-value">{{ stats.lifesteal }}%</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Né tránh:</span>
          <span class="stat-value">{{ stats.dodge }}%</span>
        </div>
      </div>
    </div>

    <!-- Items Tab -->
    <div v-if="activeTab === 'items'" class="tab-content">
      <ItemGrid
        :items="regularItems"
        :actions="itemActions"
        @itemAction="handleItemAction"
      />
    </div>

    <!-- Equipment Tab -->
    <div v-if="activeTab === 'equipment'" class="tab-content">
      <ItemGrid
        :items="equipmentItems"
        :actions="equipmentActions"
        @itemAction="handleItemAction"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
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

interface PlayerStats {
  damage: number;
  defense: number;
  critChance: number;
  critDamage: number;
  lifesteal: number;
  dodge: number;
}

const props = defineProps<{
  playerName: string;
  level: number;
  exp: number;
  nextLevelExp: number;
  gold: number;
  stats: PlayerStats;
  inventoryItems: (InventoryItem | null)[];
}>();

const emit = defineEmits<{
  executeAction: [action: string, itemId: string];
}>();

const activeTab = ref<'info' | 'items' | 'equipment'>('info');

// Separate items into regular items and equipment
const regularItems = computed(() => {
  return props.inventoryItems.filter(item => 
    item && item.type !== 'weapon' && item.type !== 'armor' && item.type !== 'Equipment' && !item.slot
  );
});

const equipmentItems = computed(() => {
  return props.inventoryItems.filter(item => 
    item && (item.type === 'weapon' || item.type === 'armor' || item.type === 'Equipment' || item.slot)
  );
});

// Define actions for regular items
const itemActions = computed(() => [
  {
    id: 'use',
    label: 'Sử dụng',
    number: 1,
    condition: (item: InventoryItem) => item.type === 'consumable'
  },
  {
    id: 'drop',
    label: 'Vứt bỏ',
    number: 3
  }
]);

// Define actions for equipment
const equipmentActions = computed(() => [
  {
    id: 'equip',
    label: 'Trang bị',
    number: 1,
    condition: (item: InventoryItem) => !item.equipped
  },
  {
    id: 'unequip',
    label: 'Tháo',
    number: 1,
    condition: (item: InventoryItem) => item.equipped
  },
  {
    id: 'drop',
    label: 'Vứt bỏ',
    number: 2
  }
]);

const handleItemAction = (action: string, itemId: string) => {
  emit('executeAction', action, itemId);
};
</script>

<style scoped>
.inventory-pane {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: rgba(0, 136, 0, 0.03);
  font-family: 'VT323', 'Source Code Pro', monospace;
}

.inventory-header {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  border-bottom: 1px solid rgba(0, 136, 0, 0.3);
}

.tab-button {
  flex: 1;
  background: transparent;
  color: var(--text-dim);
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  font-size: 16px;
  transition: all 0.2s;
}

.tab-button:hover {
  color: var(--text-bright);
  background-color: rgba(0, 255, 0, 0.05);
}

.tab-button.active {
  color: var(--text-accent);
  background-color: rgba(255, 176, 0, 0.1);
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem;
}

/* Info Tab Styles */
.info-section {
  margin-bottom: 1rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 16px;
}

.info-label {
  color: var(--text-dim);
}

.info-value {
  color: var(--text-bright);
}

.stats-section {
  margin-top: 1rem;
}

.stats-title {
  color: var(--text-accent);
  font-weight: bold;
  margin-bottom: 0.5rem;
  font-size: 16px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
  font-size: 15px;
}

.stat-label {
  color: var(--text-dim);
}

.stat-value {
  color: var(--text-bright);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .tab-button {
    font-size: 14px;
    padding: 0.4rem;
  }

  .info-row,
  .stat-row {
    font-size: 14px;
  }
}
</style>
