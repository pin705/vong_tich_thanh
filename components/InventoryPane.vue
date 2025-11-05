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
        :class="{ active: activeTab === 'inventory' }"
        @click="activeTab = 'inventory'"
      >
        [Túi Đồ]
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

    <!-- Inventory Tab -->
    <div v-if="activeTab === 'inventory'" class="tab-content">
      <div class="inventory-grid">
        <div
          v-for="(item, index) in inventoryItems"
          :key="item ? item.id : `empty-${index}`"
          class="inventory-slot"
          :class="{ 'has-item': item, 'equipped': item?.equipped }"
          @click="item && showItemPopover(item, $event)"
        >
          <div v-if="item" class="item-icon">
            {{ getItemIcon(item.type) }}
          </div>
          <div v-if="item" class="item-name">{{ truncateName(item.name) }}</div>
        </div>
      </div>
    </div>

    <!-- Item Popover -->
    <Popover
      :isOpen="popoverOpen"
      :title="selectedItem?.name"
      @close="closePopover"
      width="350px"
    >
      <div v-if="selectedItem" class="item-details">
        <div class="item-description">{{ selectedItem.description }}</div>
        
        <div class="item-stats" v-if="selectedItem.stats">
          <div class="stats-title">[ Chỉ Số ]</div>
          <div v-if="selectedItem.stats.damage" class="stat-line">
            + {{ selectedItem.stats.damage }} Sát thương
          </div>
          <div v-if="selectedItem.stats.defense" class="stat-line">
            + {{ selectedItem.stats.defense }} Phòng thủ
          </div>
          <div v-if="selectedItem.stats.healing" class="stat-line">
            + {{ selectedItem.stats.healing }} Hồi máu
          </div>
          <div v-if="selectedItem.stats.critChance" class="stat-line">
            + {{ selectedItem.stats.critChance }}% Bạo kích
          </div>
          <div v-if="selectedItem.stats.critDamage" class="stat-line">
            + {{ selectedItem.stats.critDamage }}% ST Bạo kích
          </div>
          <div v-if="selectedItem.stats.lifesteal" class="stat-line">
            + {{ selectedItem.stats.lifesteal }}% Hút máu
          </div>
          <div v-if="selectedItem.stats.dodge" class="stat-line">
            + {{ selectedItem.stats.dodge }}% Né tránh
          </div>
        </div>

        <div class="item-info">
          <div v-if="selectedItem.levelRequirement" class="level-req">
            Yêu cầu cấp: {{ selectedItem.levelRequirement }}
          </div>
          <div class="item-type">Loại: {{ getTypeName(selectedItem.type) }}</div>
          <div class="item-value">Giá trị: {{ selectedItem.value }} vàng</div>
        </div>
      </div>

      <template #footer>
        <div class="item-actions">
          <button
            v-if="canUseItem(selectedItem)"
            class="action-btn"
            @click="executeAction('use')"
          >
            [1] Sử dụng
          </button>
          <button
            v-if="canEquipItem(selectedItem)"
            class="action-btn"
            @click="executeAction('equip')"
          >
            [{{ selectedItem?.equipped ? '2' : '1' }}] {{ selectedItem?.equipped ? 'Tháo' : 'Trang bị' }}
          </button>
          <button
            class="action-btn"
            @click="executeAction('drop')"
          >
            [{{ getActionNumber() }}] Vứt bỏ
          </button>
        </div>
      </template>
    </Popover>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Popover from './Popover.vue';

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

const activeTab = ref<'info' | 'inventory'>('info');
const popoverOpen = ref(false);
const selectedItem = ref<InventoryItem | null>(null);

const getItemIcon = (type: string): string => {
  const icons: Record<string, string> = {
    weapon: '⚔',
    armor: '🛡',
    consumable: '🧪',
    misc: '📦'
  };
  return icons[type] || '?';
};

// Constants for item name truncation
const MAX_ITEM_NAME_LENGTH = 10;
const TRUNCATE_AT_LENGTH = 8;

const truncateName = (name: string): string => {
  return name.length > MAX_ITEM_NAME_LENGTH 
    ? name.substring(0, TRUNCATE_AT_LENGTH) + '...' 
    : name;
};

const getTypeName = (type: string): string => {
  const typeNames: Record<string, string> = {
    weapon: 'Vũ khí',
    armor: 'Giáp',
    consumable: 'Tiêu hao',
    misc: 'Khác'
  };
  return typeNames[type] || type;
};

const showItemPopover = (item: InventoryItem, event: MouseEvent) => {
  selectedItem.value = item;
  popoverOpen.value = true;
};

const closePopover = () => {
  popoverOpen.value = false;
  selectedItem.value = null;
};

const canUseItem = (item: InventoryItem | null): boolean => {
  return item?.type === 'consumable';
};

const canEquipItem = (item: InventoryItem | null): boolean => {
  return item?.type === 'weapon' || item?.type === 'armor';
};

const getActionNumber = (): number => {
  let num = 1;
  if (canUseItem(selectedItem.value)) num++;
  if (canEquipItem(selectedItem.value)) num++;
  return num;
};

const executeAction = (action: string) => {
  if (selectedItem.value) {
    emit('executeAction', action, selectedItem.value.id);
    closePopover();
  }
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

/* Inventory Tab Styles */
.inventory-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.inventory-slot {
  aspect-ratio: 1;
  border: 1px solid rgba(0, 136, 0, 0.3);
  background-color: rgba(0, 136, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0.25rem;
}

.inventory-slot:hover {
  border-color: var(--text-bright);
  background-color: rgba(0, 255, 0, 0.1);
}

.inventory-slot.has-item {
  border-color: var(--text-dim);
}

.inventory-slot.equipped {
  border-color: var(--text-accent);
  background-color: rgba(255, 176, 0, 0.1);
}

.item-icon {
  font-size: 24px;
  margin-bottom: 0.25rem;
}

.item-name {
  font-size: 11px;
  color: var(--text-bright);
  text-align: center;
  word-break: break-word;
  line-height: 1.2;
}

/* Popover Item Details */
.item-details {
  color: var(--text-dim);
}

.item-description {
  margin-bottom: 1rem;
  color: var(--text-bright);
  line-height: 1.6;
}

.item-stats {
  margin-bottom: 1rem;
  padding: 0.5rem;
  background-color: rgba(0, 136, 0, 0.1);
}

.stat-line {
  color: var(--text-bright);
  margin-bottom: 0.25rem;
}

.item-info {
  font-size: 14px;
}

.level-req {
  color: var(--text-accent);
  margin-bottom: 0.5rem;
}

.item-type,
.item-value {
  color: var(--text-dim);
  margin-bottom: 0.25rem;
}

.item-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.action-btn {
  background: transparent;
  color: var(--text-bright);
  border: 1px solid var(--text-dim);
  padding: 0.5rem;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
  text-align: left;
}

.action-btn:hover {
  background-color: rgba(0, 255, 0, 0.1);
  border-color: var(--text-bright);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .inventory-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.4rem;
  }

  .item-icon {
    font-size: 20px;
  }

  .item-name {
    font-size: 10px;
  }

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
