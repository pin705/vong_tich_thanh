<template>
  <FullscreenOverlay :isOpen="isOpen" @close="$emit('close')" size="medium" title="Tháp Thử Luyện Pet">
    <div class="pet-trial-container">
      <!-- Trial Stats -->
      <div class="trial-header">
        <div class="trial-stat-box">
          <div class="stat-label">Tầng Hiện Tại</div>
          <div class="stat-value">{{ currentFloor }}</div>
        </div>
        <div class="trial-stat-box">
          <div class="stat-label">Tầng Cao Nhất</div>
          <div class="stat-value">{{ highestFloor }}</div>
        </div>
        <div class="trial-stat-box">
          <div class="stat-label">Huy Hiệu Huấn Luyện</div>
          <div class="stat-value">{{ trainingBadge }}</div>
        </div>
      </div>

      <!-- Description -->
      <div class="trial-description">
        <p>
          Tháp Thử Luyện là nơi huấn luyện Pet của bạn. Mỗi tầng sẽ có một thử thách
          mà Pet phải vượt qua một mình.
        </p>
        <p>
          <strong>Phần thưởng:</strong> Kinh nghiệm Pet và Huy Hiệu Huấn Luyện để đổi vật phẩm đặc biệt.
        </p>
        <p>
          <strong>Lưu ý:</strong> Pet phải đạt cấp tối thiểu để vào tầng cao hơn.
        </p>
      </div>

      <!-- Pet Selection -->
      <div class="pet-selection">
        <div class="section-title">Pet Tham Gia</div>
        <div v-if="activePet" class="selected-pet">
          <div class="pet-name">{{ activePet.name }}</div>
          <div class="pet-level">Lv.{{ activePet.level }}</div>
          <div class="pet-hp">HP: {{ activePet.hp }}/{{ activePet.maxHp }}</div>
        </div>
        <div v-else class="no-pet">
          Bạn chưa triệu hồi Pet. Hãy triệu hồi Pet từ Chuồng Thú Cưng!
        </div>
      </div>

      <!-- Trial Info -->
      <div class="trial-info">
        <div class="info-title">Thông Tin Tầng {{ currentFloor }}</div>
        <div class="info-content">
          <div class="info-row">
            <span class="info-label">Yêu cầu cấp Pet:</span>
            <span class="info-value">{{ getFloorRequirement() }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Phần thưởng EXP:</span>
            <span class="info-value">{{ getFloorReward() }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Huy Hiệu:</span>
            <span class="info-value">{{ getFloorBadge() }}</span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="trial-actions">
        <button 
          class="trial-btn trial-btn-primary"
          @click="enterTrial"
          :disabled="!canEnter"
        >
          {{ loading ? 'Đang tải...' : 'VÀO THỬ LUYỆN' }}
        </button>
        <button 
          class="trial-btn trial-btn-secondary"
          @click="openShop"
        >
          MỞ CỬA HÀNG
        </button>
      </div>
    </div>
  </FullscreenOverlay>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import FullscreenOverlay from './FullscreenOverlay.vue';

interface Pet {
  name: string;
  level: number;
  hp: number;
  maxHp: number;
}

interface Props {
  isOpen: boolean;
  currentFloor?: number;
  highestFloor?: number;
  trainingBadge?: number;
  activePet?: Pet | null;
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  currentFloor: 1,
  highestFloor: 1,
  trainingBadge: 0,
  activePet: null
});

const emit = defineEmits<{
  close: [];
}>();

const loading = ref(false);

const canEnter = computed(() => {
  if (!props.activePet) return false;
  if (loading.value) return false;
  return props.activePet.level >= getFloorRequirement();
});

const getFloorRequirement = () => {
  return Math.max(1, Math.floor(props.currentFloor * 1.5));
};

const getFloorReward = () => {
  return Math.floor(100 * props.currentFloor * 1.3);
};

const getFloorBadge = () => {
  return Math.max(1, Math.floor(props.currentFloor / 5));
};

const enterTrial = () => {
  if (!canEnter.value) return;
  
  loading.value = true;
  const ws = (window as any).gameWs;
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'command',
      payload: { action: 'pet-trial', target: 'enter' }
    }));
  }
  emit('close');
  loading.value = false;
};

const openShop = () => {
  const ws = (window as any).gameWs;
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'command',
      payload: { action: 'talk', target: 'Huấn Luyện Viên' }
    }));
  }
  emit('close');
};
</script>

<style scoped>
.pet-trial-container {
  padding: 1.5rem;
  color: var(--text-bright);
}

.trial-header {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  justify-content: space-around;
}

.trial-stat-box {
  flex: 1;
  background: rgba(147, 112, 219, 0.1);
  border: 2px solid #9370DB;
  padding: 1rem;
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: var(--text-dim);
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #9370DB;
}

.trial-description {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(0, 136, 0, 0.3);
  padding: 1rem;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.trial-description p {
  margin-bottom: 0.75rem;
}

.pet-selection {
  margin-bottom: 1.5rem;
}

.section-title {
  color: var(--text-accent);
  font-weight: bold;
  margin-bottom: 0.75rem;
  font-size: 18px;
}

.selected-pet {
  background: rgba(147, 112, 219, 0.15);
  border: 2px solid #9370DB;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pet-name {
  font-size: 18px;
  color: #9370DB;
  font-weight: bold;
}

.pet-level {
  color: var(--text-bright);
}

.pet-hp {
  color: var(--text-dim);
  font-size: 14px;
}

.no-pet {
  background: rgba(136, 0, 0, 0.1);
  border: 1px solid rgba(136, 0, 0, 0.3);
  padding: 1rem;
  color: var(--text-damage);
  text-align: center;
}

.trial-info {
  background: rgba(0, 136, 0, 0.1);
  border: 1px solid rgba(0, 136, 0, 0.3);
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.info-title {
  color: var(--text-accent);
  font-weight: bold;
  margin-bottom: 0.75rem;
  font-size: 16px;
}

.info-content {
  padding: 0.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.info-label {
  color: var(--text-dim);
}

.info-value {
  color: var(--text-bright);
  font-weight: bold;
}

.trial-actions {
  display: flex;
  gap: 1rem;
}

.trial-btn {
  flex: 1;
  padding: 1rem;
  font-size: 18px;
  font-weight: bold;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.trial-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.trial-btn-primary {
  background: linear-gradient(135deg, #9370DB, #8A2BE2);
  color: white;
  border: 2px solid #9370DB;
}

.trial-btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #8A2BE2, #9370DB);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(147, 112, 219, 0.4);
}

.trial-btn-secondary {
  background: linear-gradient(135deg, #2e7d32, #1b5e20);
  color: white;
  border: 2px solid #4caf50;
}

.trial-btn-secondary:hover {
  background: linear-gradient(135deg, #4caf50, #2e7d32);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.4);
}

@media (max-width: 768px) {
  .pet-trial-container {
    padding: 1rem;
  }

  .trial-header {
    flex-direction: column;
    gap: 0.75rem;
  }

  .trial-stat-box {
    padding: 0.75rem;
  }

  .stat-value {
    font-size: 20px;
  }

  .trial-actions {
    flex-direction: column;
  }
}
</style>
