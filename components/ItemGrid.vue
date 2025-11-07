<template>
  <div class="item-grid-container">
    <div class="inventory-grid">
      <div
        v-for="(item, index) in items"
        :key="item ? item.id : `empty-${index}`"
        class="inventory-slot"
        :class="{ 
          'has-item': item, 
          'equipped': item?.equipped, 
          'clickable': clickable,
          [getQualityClass(item?.quality)]: item?.quality
        }"
        @click="item && clickable && handleItemClick(item, $event)"
      >
        <div v-if="item" class="item-icon">
          {{ getItemIcon(item.type) }}
        </div>
        <div v-if="item" class="item-name" :class="getQualityClass(item.quality)">
          <span v-if="item.enhancementLevel" class="enhancement-level">+{{ item.enhancementLevel }}</span>
          {{ truncateName(item.name) }}
        </div>
        <div v-if="item?.quality" class="item-quality-icon" :class="getQualityClass(item.quality)">
          {{ getQualityIcon(item.quality) }}
        </div>
        <div v-if="item && showPrice" class="item-price">{{ item.value }}g</div>
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
        <div v-if="selectedItem.quality" class="item-quality" :class="getQualityClass(selectedItem.quality)">
          {{ getQualityIcon(selectedItem.quality) }} {{ selectedItem.quality }}
        </div>
        
        <div v-if="selectedItem.enhancementLevel" class="item-enhancement">
          Cường hóa: <span class="enhancement-value">+{{ selectedItem.enhancementLevel }}</span>
        </div>
        
        <div v-if="selectedItem.stars" class="item-stars">
          Số sao: <span class="stars-value">{{ '★'.repeat(selectedItem.stars) }}{{ '☆'.repeat(5 - selectedItem.stars) }}</span>
        </div>
        
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

        <div v-if="selectedItem.setName" class="item-set-info">
          <div class="set-title">[ Bộ Đồ: {{ selectedItem.setName }} ]</div>
          <div v-if="selectedItem.setBonus" class="set-bonus-desc">
            {{ selectedItem.setBonus }}
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
            v-for="action in availableActions"
            :key="action.id"
            class="action-btn"
            @click="executeAction(action.id)"
          >
            [{{ action.number }}] {{ action.label }}
          </button>
        </div>
      </template>
    </Popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
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
  /** 
   * Item quality tier affecting stats and rarity
   * Values: Thô (Poor/Gray), Thường (Common/Green), Tốt (Good/Bright Green), 
   * Hiếm (Rare/Blue), Sử Thi (Epic/Purple)
   */
  quality?: string;
  /** 
   * Equipment set name for set bonus (e.g., "Set Chiến Binh")
   */
  setName?: string;
  /** 
   * Description of set bonuses when multiple pieces are equipped
   * Format: "(2 món): +10 HP, (4 món): +15 Damage"
   */
  setBonus?: string;
  /** 
   * Enhancement level for equipment (0-15)
   */
  enhancementLevel?: number;
  /** 
   * Star rating for items (1-5)
   */
  stars?: number;
}

interface ItemAction {
  id: string;
  label: string;
  number: number;
  condition?: (item: InventoryItem) => boolean;
}

interface Props {
  items: (InventoryItem | null)[];
  actions?: ItemAction[];
  clickable?: boolean;
  showPrice?: boolean;
  columns?: number;
}

const props = withDefaults(defineProps<Props>(), {
  clickable: true,
  showPrice: false,
  columns: 4,
  actions: () => []
});

const emit = defineEmits<{
  itemAction: [action: string, itemId: string];
}>();

const popoverOpen = ref(false);
const selectedItem = ref<InventoryItem | null>(null);

// Quality mapping constants
const QUALITY_MAP = {
  'Thô': 'quality-poor',
  'Thường': 'quality-common',
  'Tốt': 'quality-good',
  'Hiếm': 'quality-rare',
  'Sử Thi': 'quality-epic'
} as const;

const QUALITY_ICONS = {
  'Thô': '●',
  'Thường': '●',
  'Tốt': '◆',
  'Hiếm': '★',
  'Sử Thi': '⬟'
} as const;

const getItemIcon = (type: string): string => {
  const icons: Record<string, string> = {
    weapon: '[/]',
    armor: '[=]',
    consumable: '[!]',
    misc: '[?]'
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

const getQualityClass = (quality?: string): string => {
  return quality ? QUALITY_MAP[quality as keyof typeof QUALITY_MAP] || '' : '';
};

const getQualityIcon = (quality?: string): string => {
  return quality ? QUALITY_ICONS[quality as keyof typeof QUALITY_ICONS] || '' : '';
};

const handleItemClick = (item: InventoryItem, event: MouseEvent) => {
  selectedItem.value = item;
  popoverOpen.value = true;
};

const closePopover = () => {
  popoverOpen.value = false;
  selectedItem.value = null;
};

const availableActions = computed(() => {
  if (!selectedItem.value || props.actions.length === 0) {
    return [];
  }
  
  return props.actions
    .filter(action => !action.condition || action.condition(selectedItem.value!))
    .map((action, index) => ({
      ...action,
      number: index + 1
    }));
});

const executeAction = (actionId: string) => {
  if (selectedItem.value) {
    emit('itemAction', actionId, selectedItem.value.id);
    closePopover();
  }
};
</script>

<style scoped>
.item-grid-container {
  font-family: 'VT323', 'Source Code Pro', monospace;
}

.inventory-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

/* Support different column counts */
@media (min-width: 1024px) {
  .inventory-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.inventory-slot {
  aspect-ratio: 1;
  border: 1px solid rgba(0, 136, 0, 0.3);
  background-color: rgba(0, 136, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  transition: all 0.2s;
  position: relative;
}

.inventory-slot.clickable {
  cursor: pointer;
}

.inventory-slot.clickable:hover {
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

.item-price {
  font-size: 10px;
  color: var(--text-accent);
  position: absolute;
  bottom: 2px;
  right: 4px;
}

.item-quality-icon {
  position: absolute;
  top: 2px;
  right: 4px;
  font-size: 12px;
}

/* Quality colors */
.quality-poor {
  color: #9d9d9d !important;
}

.quality-common {
  color: var(--text-bright) !important;
}

.quality-good {
  color: #00ff00 !important;
}

.quality-rare {
  color: #0099ff !important;
}

.quality-epic {
  color: #ff00ff !important;
}

/* Slot border colors by quality */
.inventory-slot.quality-poor {
  border-color: #9d9d9d;
}

.inventory-slot.quality-common {
  border-color: var(--text-bright);
}

.inventory-slot.quality-good {
  border-color: #00ff00;
}

.inventory-slot.quality-rare {
  border-color: #0099ff;
}

.inventory-slot.quality-epic {
  border-color: #ff00ff;
}

/* Enhancement level badge */
.enhancement-level {
  color: var(--text-accent);
  font-weight: bold;
  margin-right: 0.25rem;
}

/* Popover Item Details */
.item-details {
  color: var(--text-dim);
}

.item-quality {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  background-color: rgba(0, 136, 0, 0.1);
  border-left: 3px solid currentColor;
}

.item-enhancement {
  font-size: 15px;
  color: var(--text-bright);
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  background-color: rgba(255, 215, 0, 0.1);
  border-left: 3px solid var(--text-accent);
}

.enhancement-value {
  color: var(--text-accent);
  font-weight: bold;
}

.item-stars {
  font-size: 15px;
  color: var(--text-bright);
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  background-color: rgba(255, 215, 0, 0.1);
}

.stars-value {
  color: #FFD700;
  font-weight: bold;
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

.stats-title {
  color: var(--text-accent);
  font-weight: bold;
  margin-bottom: 0.5rem;
  font-size: 16px;
}

.stat-line {
  color: var(--text-bright);
  margin-bottom: 0.25rem;
}

.item-set-info {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background-color: rgba(0, 255, 255, 0.1);
  border: 1px solid var(--text-cyan);
}

.set-title {
  color: var(--text-cyan);
  font-weight: bold;
  font-size: 15px;
  margin-bottom: 0.5rem;
}

.set-bonus-desc {
  color: var(--text-bright);
  font-size: 13px;
  line-height: 1.5;
  font-style: italic;
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
}
</style>
