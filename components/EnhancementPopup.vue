<template>
  <FullscreenOverlay :isOpen="isOpen" @close="$emit('close')" size="medium" title="Cường Hóa Trang Bị">
    <div class="enhancement-container">
      <!-- Item Slot -->
      <div class="enhancement-section">
        <div class="section-title">[ Trang Bị ]</div>
        <div class="slot-container">
          <div 
            class="enhancement-slot" 
            :class="{ 'has-item': selectedItem }"
            @click="$emit('selectItem')"
          >
            <div v-if="selectedItem" class="slot-content">
              <div class="item-name">{{ selectedItem.name }}</div>
              <div class="item-level">+{{ selectedItem.enhancementLevel || 0 }}</div>
            </div>
            <div v-else class="slot-empty">
              [Nhấn để chọn trang bị]
            </div>
          </div>
        </div>
      </div>

      <!-- Material Slot -->
      <div class="enhancement-section">
        <div class="section-title">[ Vật Liệu ]</div>
        <div class="slot-container">
          <div 
            class="enhancement-slot" 
            :class="{ 'has-item': selectedMaterial }"
            @click="$emit('selectMaterial')"
          >
            <div v-if="selectedMaterial" class="slot-content">
              <div class="item-name">{{ selectedMaterial.name }}</div>
              <div class="item-count">x{{ selectedMaterial.count }}</div>
            </div>
            <div v-else class="slot-empty">
              [Nhấn để chọn vật liệu]
            </div>
          </div>
        </div>
      </div>

      <!-- Enhancement Info -->
      <div v-if="selectedItem && selectedMaterial" class="enhancement-info">
        <div class="info-row">
          <span class="info-label">Cấp hiện tại:</span>
          <span class="info-value">+{{ selectedItem.enhancementLevel || 0 }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Cấp tiếp theo:</span>
          <span class="info-value success">+{{ (selectedItem.enhancementLevel || 0) + 1 }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Tỉ lệ thành công:</span>
          <span class="info-value" :class="getSuccessRateClass()">{{ successRate }}%</span>
        </div>
        <div class="info-row">
          <span class="info-label">Chi phí vàng:</span>
          <span class="info-value">{{ goldCost }}</span>
        </div>
      </div>

      <!-- Enhancement Button -->
      <div class="enhancement-actions">
        <button
          class="enhance-btn"
          :disabled="!canEnhance"
          @click="$emit('enhance')"
        >
          CƯỜNG HÓA
        </button>
      </div>

      <!-- Warning -->
      <div class="enhancement-warning">
        [!] Nếu thất bại, trang bị sẽ không giảm cấp nhưng mất vật liệu
      </div>
    </div>
  </FullscreenOverlay>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import FullscreenOverlay from './FullscreenOverlay.vue';

interface Item {
  id: string;
  name: string;
  enhancementLevel?: number;
}

interface Material {
  id: string;
  name: string;
  count: number;
}

interface Props {
  isOpen: boolean;
  selectedItem?: Item | null;
  selectedMaterial?: Material | null;
  goldCost?: number;
  successRate?: number;
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  goldCost: 1000,
  successRate: 80
});

const emit = defineEmits<{
  close: [];
  selectItem: [];
  selectMaterial: [];
  enhance: [];
}>();

const canEnhance = computed(() => {
  return props.selectedItem && props.selectedMaterial;
});

const getSuccessRateClass = () => {
  if (props.successRate >= 70) return 'success';
  if (props.successRate >= 40) return 'warning';
  return 'danger';
};
</script>

<style scoped>
.enhancement-container {
  padding: 1.5rem;
  color: var(--text-bright);
}

.enhancement-section {
  margin-bottom: 1.5rem;
}

.section-title {
  color: var(--text-accent);
  font-weight: bold;
  margin-bottom: 0.75rem;
  font-size: 18px;
}

.slot-container {
  display: flex;
  justify-content: center;
}

.enhancement-slot {
  width: 100%;
  min-height: 120px;
  border: 2px dashed rgba(0, 136, 0, 0.5);
  background-color: rgba(0, 136, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.enhancement-slot:hover {
  border-color: var(--text-bright);
  background-color: rgba(0, 255, 0, 0.1);
}

.enhancement-slot.has-item {
  border-style: solid;
  border-color: var(--text-accent);
  background-color: rgba(0, 136, 0, 0.15);
}

.slot-empty {
  color: var(--text-dim);
  font-size: 16px;
}

.slot-content {
  text-align: center;
}

.item-name {
  font-size: 18px;
  color: var(--text-bright);
  margin-bottom: 0.5rem;
}

.item-level {
  font-size: 24px;
  color: var(--text-accent);
  font-weight: bold;
}

.item-count {
  font-size: 16px;
  color: var(--text-bright);
}

.enhancement-info {
  background-color: rgba(0, 136, 0, 0.1);
  padding: 1rem;
  border: 1px solid rgba(0, 136, 0, 0.3);
  margin-bottom: 1.5rem;
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
  font-weight: bold;
}

.info-value.success {
  color: #00ff00;
}

.info-value.warning {
  color: #ffaa00;
}

.info-value.danger {
  color: #ff4444;
}

.enhancement-actions {
  margin-bottom: 1rem;
}

.enhance-btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(0, 136, 0, 0.8), rgba(0, 255, 0, 0.8));
  color: var(--bg-black);
  border: 2px solid var(--text-bright);
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.enhance-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(0, 255, 0, 0.9), rgba(0, 255, 0, 0.9));
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 255, 0, 0.4);
}

.enhance-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: rgba(136, 136, 136, 0.5);
}

.enhancement-warning {
  text-align: center;
  color: var(--text-damage);
  font-size: 14px;
  padding: 0.75rem;
  background-color: rgba(136, 0, 0, 0.1);
  border: 1px solid rgba(136, 0, 0, 0.3);
}

@media (max-width: 768px) {
  .enhancement-container {
    padding: 1rem;
  }

  .section-title {
    font-size: 16px;
  }

  .enhancement-slot {
    min-height: 100px;
  }

  .item-name {
    font-size: 16px;
  }

  .item-level {
    font-size: 20px;
  }
}
</style>
