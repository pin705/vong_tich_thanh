<template>
  <FullscreenOverlay :isOpen="isOpen" @close="$emit('close')" size="large" title="Trang Bị">
    <div class="equipment-container">
      <!-- Equipment Slots Display -->
      <div class="equipment-slots-section">
        <div class="section-title">[ Trang Bị Hiện Tại ]</div>
        <div class="equipment-grid">
          <div
            v-for="slot in equipmentSlots"
            :key="slot.key"
            class="equipment-slot"
            @click="handleSlotClick(slot.key)"
          >
            <div class="slot-header">
              <span class="slot-icon">{{ slot.icon }}</span>
              <span class="slot-name">{{ slot.name }}</span>
            </div>
            <div v-if="getEquippedItem(slot.key)" class="equipped-item">
              <div class="item-name" :class="getQualityClass(getEquippedItem(slot.key)?.quality)">
                {{ getEquippedItem(slot.key)?.name }}
              </div>
              <div class="item-stats">
                <span v-for="(value, stat) in getEquippedItem(slot.key)?.stats" :key="stat" class="stat-item">
                  {{ stat }}: +{{ value }}
                </span>
              </div>
            </div>
            <div v-else class="empty-slot">
              [Trống]
            </div>
          </div>
        </div>
      </div>

      <!-- Set Bonus Section -->
      <div v-if="activeSets.length > 0" class="set-bonus-section">
        <div class="section-title">[ Set Bonus Đang Kích Hoạt ]</div>
        <div v-for="set in activeSets" :key="set.setKey" class="set-bonus-item">
          <div class="set-name">{{ set.setName }} ({{ set.equippedCount }} món)</div>
          <div class="set-bonuses">
            <div v-for="(bonus, index) in set.activeBonus" :key="index" class="bonus-detail">
              <span class="bonus-tier">[{{ bonus.requiredPieces }} món]</span>
              <span class="bonus-stats">
                <template v-for="(value, stat) in bonus.stats" :key="stat">
                  +{{ value }} {{ stat }}
                </template>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Instructions -->
      <div class="instructions">
        Click vào ô trang bị để xem/thay đổi. Mở [Túi Đồ] để chọn trang bị.
      </div>
    </div>
  </FullscreenOverlay>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import FullscreenOverlay from './FullscreenOverlay.vue';

interface Equipment {
  helmet?: any;
  chest?: any;
  legs?: any;
  boots?: any;
  weapon?: any;
}

interface SetBonus {
  setKey: string;
  setName: string;
  equippedCount: number;
  activeBonus: Array<{
    requiredPieces: number;
    stats: Record<string, number>;
  }>;
}

interface Props {
  isOpen: boolean;
  equipment: Equipment;
  activeSets?: SetBonus[];
}

const props = withDefaults(defineProps<Props>(), {
  activeSets: () => []
});

const emit = defineEmits<{
  close: [];
  selectSlot: [slot: string];
}>();

const equipmentSlots = [
  { key: 'helmet', name: 'Mũ', icon: '[H]' },
  { key: 'chest', name: 'Áo', icon: '[A]' },
  { key: 'legs', name: 'Quần', icon: '[Q]' },
  { key: 'boots', name: 'Giày', icon: '[G]' },
  { key: 'weapon', name: 'Vũ Khí', icon: '[W]' }
];

function getEquippedItem(slot: string): any {
  return props.equipment[slot as keyof Equipment];
}

function getQualityClass(quality?: string): string {
  const qualityMap: Record<string, string> = {
    'Thô': 'quality-poor',
    'Thường': 'quality-common',
    'Tốt': 'quality-good',
    'Hiếm': 'quality-rare',
    'Sử Thi': 'quality-epic'
  };
  return quality ? qualityMap[quality] || '' : '';
}

function handleSlotClick(slot: string) {
  emit('selectSlot', slot);
}
</script>

<style scoped>
.equipment-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  color: var(--text-bright);
  font-family: 'VT323', 'Source Code Pro', monospace;
  padding: 1.5rem;
}

.section-title {
  color: var(--text-accent);
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(0, 136, 0, 0.3);
}

.equipment-slots-section {
  flex: 1;
}

.equipment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.equipment-slot {
  background-color: rgba(0, 136, 0, 0.05);
  border: 1px solid rgba(0, 136, 0, 0.3);
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 100px;
}

.equipment-slot:hover {
  background-color: rgba(0, 255, 0, 0.1);
  border-color: var(--text-accent);
  transform: translateY(-2px);
}

.slot-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(0, 136, 0, 0.2);
}

.slot-icon {
  font-size: 1.5rem;
}

.slot-name {
  color: var(--text-dim);
  font-size: 16px;
  font-weight: bold;
}

.equipped-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.item-name {
  font-size: 16px;
  font-weight: bold;
}

.quality-poor {
  color: #9d9d9d;
}

.quality-common {
  color: var(--text-bright);
}

.quality-good {
  color: #00ff00;
}

.quality-rare {
  color: #0099ff;
}

.quality-epic {
  color: #ff00ff;
}

.item-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 14px;
  color: var(--text-dim);
}

.stat-item {
  background-color: rgba(0, 136, 0, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 2px;
}

.empty-slot {
  color: var(--text-dim);
  font-style: italic;
  text-align: center;
  padding: 1rem 0;
}

.set-bonus-section {
  background-color: rgba(0, 136, 136, 0.1);
  border: 1px solid var(--text-cyan);
  padding: 1rem;
}

.set-bonus-item {
  margin-bottom: 1rem;
}

.set-bonus-item:last-child {
  margin-bottom: 0;
}

.set-name {
  color: var(--text-accent);
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.set-bonuses {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.bonus-detail {
  display: flex;
  gap: 0.5rem;
  font-size: 14px;
}

.bonus-tier {
  color: var(--text-dim);
}

.bonus-stats {
  color: var(--text-bright);
}

.instructions {
  text-align: center;
  color: var(--text-dim);
  font-style: italic;
  padding: 1rem;
  background-color: rgba(0, 136, 0, 0.05);
  border: 1px solid rgba(0, 136, 0, 0.2);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .equipment-grid {
    grid-template-columns: 1fr;
  }

  .equipment-slot {
    min-height: 80px;
  }
}
</style>
