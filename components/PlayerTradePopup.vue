<template>
  <FullscreenOverlay :isOpen="isOpen" @close="handleCancel" size="large" title="Giao Dịch Người Chơi">
    <div class="player-trade-popup">
      <!-- Trade Partner Info -->
      <div class="trade-header">
        <div class="partner-info">
          <span class="label">Đối tác:</span>
          <span class="partner-name">[{{ partnerName }}]</span>
        </div>
        <div class="trade-status">
          <span :class="['status-badge', statusClass]">{{ statusText }}</span>
        </div>
      </div>

      <!-- Trade Grid: Two columns for each player's offer -->
      <div class="trade-grid">
        <!-- Your Offer -->
        <div class="trade-column">
          <h3 class="column-title">Bạn Đưa Ra</h3>
          
          <!-- Your Items -->
          <div class="items-section">
            <div v-if="yourItems.length === 0" class="empty-message">
              Chưa có vật phẩm nào
            </div>
            <div v-else class="items-list">
              <div 
                v-for="item in yourItems" 
                :key="item.id"
                class="trade-item"
              >
                <span class="item-name">[{{ item.name }}]</span>
                <button 
                  v-if="!isLocked"
                  class="remove-btn"
                  @click="$emit('removeItem', item.id, 'your')"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          <!-- Your Gold -->
          <div class="gold-section">
            <div class="gold-display">
              <span class="label">Vàng:</span>
              <span class="gold-amount">{{ yourGold }}</span>
            </div>
            <div v-if="!isLocked" class="gold-input">
              <input
                v-model.number="goldInput"
                type="number"
                min="0"
                :max="maxGold"
                placeholder="Nhập số vàng"
                @keydown.enter="handleSetGold"
              />
              <button @click="handleSetGold" class="set-gold-btn">Đặt</button>
            </div>
          </div>

          <!-- Add Item Button -->
          <button 
            v-if="!isLocked"
            class="add-item-btn"
            @click="$emit('openInventory')"
          >
            + Thêm Vật Phẩm
          </button>
        </div>

        <!-- Partner's Offer -->
        <div class="trade-column">
          <h3 class="column-title">{{ partnerName }} Đưa Ra</h3>
          
          <!-- Partner's Items -->
          <div class="items-section">
            <div v-if="partnerItems.length === 0" class="empty-message">
              Chưa có vật phẩm nào
            </div>
            <div v-else class="items-list">
              <div 
                v-for="item in partnerItems" 
                :key="item.id"
                class="trade-item"
              >
                <span class="item-name">[{{ item.name }}]</span>
              </div>
            </div>
          </div>

          <!-- Partner's Gold -->
          <div class="gold-section">
            <div class="gold-display">
              <span class="label">Vàng:</span>
              <span class="gold-amount">{{ partnerGold }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Lock Status -->
      <div class="lock-status">
        <div class="lock-row">
          <span :class="['lock-indicator', { locked: isYourLocked }]">
            {{ isYourLocked ? '🔒' : '🔓' }}
          </span>
          <span class="lock-label">Bạn: {{ isYourLocked ? 'ĐÃ KHÓA' : 'Chưa khóa' }}</span>
        </div>
        <div class="lock-row">
          <span :class="['lock-indicator', { locked: isPartnerLocked }]">
            {{ isPartnerLocked ? '🔒' : '🔓' }}
          </span>
          <span class="lock-label">{{ partnerName }}: {{ isPartnerLocked ? 'ĐÃ KHÓA' : 'Chưa khóa' }}</span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button 
          v-if="!isLocked"
          class="action-btn lock-btn"
          @click="$emit('lock')"
        >
          Khóa Giao Dịch
        </button>
        <button 
          v-if="isLocked && !isConfirmed"
          class="action-btn confirm-btn"
          @click="$emit('confirm')"
          :disabled="!bothLocked"
        >
          Xác Nhận
        </button>
        <button 
          class="action-btn cancel-btn"
          @click="handleCancel"
        >
          Hủy
        </button>
      </div>

      <!-- Instructions -->
      <div class="instructions">
        <p v-if="!isLocked">
          💡 Thêm vật phẩm và vàng của bạn, sau đó nhấn "Khóa Giao Dịch"
        </p>
        <p v-else-if="!bothLocked">
          ⏳ Đang chờ đối tác khóa giao dịch...
        </p>
        <p v-else-if="!bothConfirmed">
          ✅ Kiểm tra kỹ và nhấn "Xác Nhận" để hoàn tất
        </p>
        <p v-else>
          🎉 Giao dịch đang được thực hiện...
        </p>
      </div>
    </div>
  </FullscreenOverlay>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import FullscreenOverlay from './FullscreenOverlay.vue';

interface TradeItem {
  id: string;
  name: string;
}

interface Props {
  isOpen: boolean;
  partnerName: string;
  yourItems: TradeItem[];
  partnerItems: TradeItem[];
  yourGold: number;
  partnerGold: number;
  maxGold: number;
  isYourLocked: boolean;
  isPartnerLocked: boolean;
  isYourConfirmed: boolean;
  isPartnerConfirmed: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  partnerName: 'Unknown',
  yourItems: () => [],
  partnerItems: () => [],
  yourGold: 0,
  partnerGold: 0,
  maxGold: 0,
  isYourLocked: false,
  isPartnerLocked: false,
  isYourConfirmed: false,
  isPartnerConfirmed: false,
});

const emit = defineEmits<{
  close: [];
  lock: [];
  confirm: [];
  cancel: [];
  setGold: [amount: number];
  removeItem: [itemId: string, side: 'your' | 'partner'];
  openInventory: [];
}>();

const goldInput = ref(0);

const isLocked = computed(() => props.isYourLocked);
const isConfirmed = computed(() => props.isYourConfirmed);
const bothLocked = computed(() => props.isYourLocked && props.isPartnerLocked);
const bothConfirmed = computed(() => props.isYourConfirmed && props.isPartnerConfirmed);

const statusClass = computed(() => {
  if (bothConfirmed.value) return 'success';
  if (bothLocked.value) return 'ready';
  if (isLocked.value) return 'waiting';
  return 'active';
});

const statusText = computed(() => {
  if (bothConfirmed.value) return 'ĐANG XỬ LÝ';
  if (bothLocked.value) return 'SẴN SÀNG';
  if (isLocked.value || props.isPartnerLocked) return 'CHỜ KHÓA';
  return 'ĐANG GIAO DỊCH';
});

const handleSetGold = () => {
  if (goldInput.value > 0 && goldInput.value <= props.maxGold) {
    emit('setGold', goldInput.value);
  }
};

const handleCancel = () => {
  emit('cancel');
  emit('close');
};
</script>

<style scoped>
.player-trade-popup {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  height: 100%;
  font-family: 'VT323', 'Source Code Pro', monospace;
  color: var(--text-bright);
  padding: 1rem;
}

.trade-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(0, 136, 0, 0.1);
  border: 1px solid rgba(0, 136, 0, 0.3);
  border-radius: 4px;
}

.partner-info {
  font-size: 20px;
}

.partner-name {
  color: var(--text-accent);
  font-weight: bold;
  margin-left: 0.5rem;
}

.trade-status {
  display: flex;
  align-items: center;
}

.status-badge {
  padding: 0.4rem 1rem;
  border-radius: 4px;
  font-weight: bold;
  font-size: 16px;
}

.status-badge.active {
  background: rgba(255, 165, 0, 0.2);
  color: #ffa500;
  border: 1px solid #ffa500;
}

.status-badge.waiting {
  background: rgba(255, 255, 0, 0.2);
  color: #ffff00;
  border: 1px solid #ffff00;
}

.status-badge.ready {
  background: rgba(0, 255, 0, 0.2);
  color: #00ff00;
  border: 1px solid #00ff00;
}

.status-badge.success {
  background: rgba(0, 255, 0, 0.3);
  color: #00ff00;
  border: 1px solid #00ff00;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.trade-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  flex: 1;
  min-height: 0;
}

.trade-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border: 2px solid rgba(0, 136, 0, 0.3);
  border-radius: 8px;
  padding: 1rem;
  background: rgba(0, 136, 0, 0.05);
}

.column-title {
  font-size: 18px;
  color: var(--text-accent);
  margin: 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(0, 136, 0, 0.3);
}

.items-section {
  flex: 1;
  min-height: 200px;
  overflow-y: auto;
}

.empty-message {
  text-align: center;
  color: var(--text-dim);
  padding: 2rem;
  font-size: 16px;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.trade-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: rgba(0, 136, 0, 0.15);
  border: 1px solid rgba(0, 136, 0, 0.4);
  border-radius: 4px;
}

.item-name {
  color: var(--text-accent);
  font-size: 16px;
}

.remove-btn {
  background: rgba(255, 0, 0, 0.3);
  border: 1px solid #ff0000;
  color: #ff0000;
  padding: 0.2rem 0.5rem;
  cursor: pointer;
  border-radius: 3px;
  font-family: inherit;
  font-size: 14px;
  transition: all 0.2s;
}

.remove-btn:hover {
  background: rgba(255, 0, 0, 0.5);
}

.gold-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 4px;
}

.gold-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
}

.gold-amount {
  color: #ffd700;
  font-weight: bold;
  font-size: 18px;
}

.gold-input {
  display: flex;
  gap: 0.5rem;
}

.gold-input input {
  flex: 1;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 136, 0, 0.5);
  color: var(--text-bright);
  padding: 0.4rem;
  font-family: inherit;
  font-size: 16px;
}

.set-gold-btn {
  background: rgba(0, 136, 0, 0.3);
  border: 1px solid var(--text-bright);
  color: var(--text-bright);
  padding: 0.4rem 1rem;
  cursor: pointer;
  font-family: inherit;
  font-size: 16px;
  transition: all 0.2s;
}

.set-gold-btn:hover {
  background: rgba(0, 136, 0, 0.5);
}

.add-item-btn {
  background: rgba(0, 136, 0, 0.3);
  border: 1px solid var(--text-bright);
  color: var(--text-bright);
  padding: 0.75rem;
  cursor: pointer;
  font-family: inherit;
  font-size: 16px;
  border-radius: 4px;
  transition: all 0.2s;
}

.add-item-btn:hover {
  background: rgba(0, 136, 0, 0.5);
}

.lock-status {
  display: flex;
  justify-content: space-around;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 136, 0, 0.3);
  border-radius: 4px;
}

.lock-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 16px;
}

.lock-indicator {
  font-size: 24px;
  transition: all 0.3s;
}

.lock-indicator.locked {
  animation: lock-bounce 0.5s;
}

@keyframes lock-bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.action-btn {
  padding: 0.75rem 2rem;
  font-family: inherit;
  font-size: 18px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid;
}

.lock-btn {
  background: rgba(255, 165, 0, 0.3);
  border-color: #ffa500;
  color: #ffa500;
}

.lock-btn:hover {
  background: rgba(255, 165, 0, 0.5);
}

.confirm-btn {
  background: rgba(0, 255, 0, 0.3);
  border-color: #00ff00;
  color: #00ff00;
}

.confirm-btn:hover:not(:disabled) {
  background: rgba(0, 255, 0, 0.5);
}

.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cancel-btn {
  background: rgba(255, 0, 0, 0.3);
  border-color: #ff0000;
  color: #ff0000;
}

.cancel-btn:hover {
  background: rgba(255, 0, 0, 0.5);
}

.instructions {
  text-align: center;
  padding: 1rem;
  background: rgba(0, 136, 0, 0.1);
  border: 1px solid rgba(0, 136, 0, 0.3);
  border-radius: 4px;
  font-size: 16px;
  color: var(--text-dim);
}

.instructions p {
  margin: 0;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .trade-grid {
    grid-template-columns: 1fr;
  }

  .trade-header {
    flex-direction: column;
    gap: 0.5rem;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
  }
}
</style>
