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
              <!-- Gem Sockets Display -->
              <div v-if="hasSocketSupport(getEquippedItem(slot.key))" class="gem-sockets">
                <div class="socket-label">Lỗ Khảm:</div>
                <div class="socket-grid">
                  <div
                    v-for="(gem, index) in getSocketsDisplay(getEquippedItem(slot.key))"
                    :key="index"
                    class="socket-slot"
                    :class="{ 'has-gem': gem, 'empty-socket': !gem }"
                    @click.stop="gem && showGemPopover(gem, $event)"
                  >
                    <span v-if="gem" class="gem-icon" :class="getGemTypeClass(gem.gemType)">◆</span>
                    <span v-else class="empty-socket-icon">○</span>
                  </div>
                </div>
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
        Click vào ô trang bị để xem/thay đổi. Mở [Túi Đồ] để chọn trang bị. Click vào ngọc khảm để xem chi tiết.
      </div>
    </div>

    <!-- Gem Detail Popover -->
    <Popover
      :isOpen="gemPopoverOpen"
      :title="selectedGem?.name"
      @close="closeGemPopover"
      width="300px"
    >
      <div v-if="selectedGem" class="gem-details">
        <div class="gem-tier-info">
          <span class="gem-tier-label">Cấp:</span>
          <span class="gem-tier-value">Tier {{ selectedGem.gemTier }}</span>
        </div>
        
        <div class="gem-type-info">
          <span class="gem-type-icon" :class="getGemTypeClass(selectedGem.gemType)">◆</span>
          <span class="gem-type-name">{{ getGemTypeName(selectedGem.gemType) }}</span>
        </div>
        
        <div class="gem-bonus">
          <div class="bonus-title">[ Bonus Stats ]</div>
          <div class="bonus-value">
            {{ getGemBonusDisplay(selectedGem) }}
          </div>
        </div>
        
        <div class="gem-description">
          {{ selectedGem.description }}
        </div>
      </div>
    </Popover>
  </FullscreenOverlay>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import FullscreenOverlay from './FullscreenOverlay.vue';
import Popover from './Popover.vue';
import { getGemTypeClass, getGemTypeName, getGemBonusDisplay, type GemData } from '~/utils/gemHelpers';

interface Gem extends GemData {
  _id?: string;
  name: string;
  description: string;
  gemType: string;
  gemTier: number;
  gemValue: number;
}

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

const gemPopoverOpen = ref(false);
const selectedGem = ref<Gem | null>(null);

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

function hasSocketSupport(item: any): boolean {
  return item && (item.maxSockets > 0 || item.currentSockets > 0);
}

/**
 * Generate socket display array with socketed gems and empty slots
 * Returns array of gems (filled sockets) and nulls (empty sockets)
 * Note: currentSockets should always be >= socketedGems.length
 */
function getSocketsDisplay(item: any): (Gem | null)[] {
  if (!item) return [];
  
  const maxSockets = item.maxSockets || 0;
  const socketedGems = item.socketedGems || [];
  const currentSockets = item.currentSockets || 0;
  const result: (Gem | null)[] = [];
  
  // Ensure data integrity: currentSockets should not exceed maxSockets
  const validCurrentSockets = Math.min(currentSockets, maxSockets);
  
  // Add socketed gems (should not exceed currentSockets)
  for (let i = 0; i < Math.min(socketedGems.length, validCurrentSockets); i++) {
    result.push(socketedGems[i]);
  }
  
  // Add empty sockets
  for (let i = socketedGems.length; i < validCurrentSockets; i++) {
    result.push(null);
  }
  
  return result;
}

function showGemPopover(gem: Gem, event: MouseEvent): void {
  selectedGem.value = gem;
  gemPopoverOpen.value = true;
}

function closeGemPopover(): void {
  gemPopoverOpen.value = false;
  selectedGem.value = null;
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

/* Gem Sockets Styles */
.gem-sockets {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(0, 136, 0, 0.2);
}

.socket-label {
  font-size: 13px;
  color: var(--text-dim);
  margin-bottom: 0.5rem;
}

.socket-grid {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.socket-slot {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(0, 136, 0, 0.3);
  background-color: rgba(0, 0, 0, 0.3);
  transition: all 0.2s;
  cursor: pointer;
}

.socket-slot.empty-socket {
  cursor: default;
  opacity: 0.5;
}

.socket-slot.has-gem:hover {
  border-color: var(--text-bright);
  transform: scale(1.1);
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
}

.gem-icon {
  font-size: 20px;
}

.empty-socket-icon {
  font-size: 16px;
  color: var(--text-dim);
}

/* Gem Type Colors */
.gem-attack {
  color: #ff4444;
  text-shadow: 0 0 5px #ff0000;
}

.gem-hp {
  color: #44ff44;
  text-shadow: 0 0 5px #00ff00;
}

.gem-defense {
  color: #4444ff;
  text-shadow: 0 0 5px #0000ff;
}

.gem-crit-chance {
  color: #ff8800;
  text-shadow: 0 0 5px #ff6600;
}

.gem-crit-damage {
  color: #ff00ff;
  text-shadow: 0 0 5px #ff00ff;
}

.gem-dodge {
  color: #00ffff;
  text-shadow: 0 0 5px #00ffff;
}

.gem-lifesteal {
  color: #ff0088;
  text-shadow: 0 0 5px #ff0088;
}

/* Gem Details Popover */
.gem-details {
  color: var(--text-bright);
  font-size: 15px;
}

.gem-tier-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  background-color: rgba(255, 215, 0, 0.1);
  border-left: 3px solid var(--text-accent);
}

.gem-tier-label {
  color: var(--text-dim);
}

.gem-tier-value {
  color: var(--text-accent);
  font-weight: bold;
}

.gem-type-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-size: 16px;
}

.gem-type-icon {
  font-size: 24px;
}

.gem-type-name {
  font-weight: bold;
}

.gem-bonus {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background-color: rgba(0, 136, 0, 0.1);
  border: 1px solid rgba(0, 136, 0, 0.3);
}

.bonus-title {
  color: var(--text-accent);
  font-weight: bold;
  margin-bottom: 0.5rem;
  font-size: 14px;
}

.bonus-value {
  color: var(--text-bright);
  font-size: 18px;
  font-weight: bold;
}

.gem-description {
  color: var(--text-dim);
  font-size: 14px;
  line-height: 1.5;
  font-style: italic;
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
