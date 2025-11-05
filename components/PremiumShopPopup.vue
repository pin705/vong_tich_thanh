<template>
  <teleport to="body">
    <div v-if="isOpen" class="premium-shop-overlay" @click.self="close">
      <div class="premium-shop-popup">
        <div class="popup-header">
          <span class="popup-title">💎 Cửa Hàng Cao Cấp 💎</span>
          <button class="popup-close" @click="close">[X]</button>
        </div>
        
        <div class="popup-body">
          <div class="currency-display">
            <span class="currency-label">Cổ Thạch của bạn:</span>
            <span class="currency-value">{{ playerPremiumCurrency }} 💎</span>
          </div>

          <div v-if="loading" class="loading-message">
            Đang tải...
          </div>

          <div v-else-if="error" class="error-message">
            {{ error }}
          </div>

          <div v-else-if="items.length === 0" class="empty-message">
            Cửa hàng hiện không có sản phẩm.
          </div>

          <div v-else class="items-grid">
            <div
              v-for="item in items"
              :key="item._id"
              class="item-card"
              :class="{ 'can-afford': canAfford(item) }"
            >
              <div class="item-header">
                <span class="item-name">{{ item.name }}</span>
              </div>
              <div class="item-description">{{ item.description }}</div>
              <div v-if="item.effects" class="item-effects">
                <div v-if="item.effects.buff === 'EXP_BOOST'">
                  ⚡ {{ item.effects.multiplier }}x EXP trong {{ item.effects.duration_minutes }} phút
                </div>
              </div>
              <div class="item-footer">
                <span class="item-price">💎 {{ item.premiumPrice }}</span>
                <button
                  class="buy-button"
                  :disabled="!canAfford(item) || purchasing"
                  @click="buyItem(item)"
                >
                  {{ canAfford(item) ? 'Mua' : 'Không đủ' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface PremiumItem {
  _id: string;
  name: string;
  description: string;
  type: string;
  premiumPrice: number;
  effects?: {
    buff: string;
    multiplier: number;
    duration_minutes: number;
  };
}

interface Props {
  isOpen: boolean;
  playerPremiumCurrency: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  itemPurchased: [];
}>();

const items = ref<PremiumItem[]>([]);
const loading = ref(false);
const error = ref('');
const purchasing = ref(false);

// Fetch premium items when popup opens
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    await fetchPremiumItems();
  }
});

const fetchPremiumItems = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await $fetch('/api/shop/premium');
    if (response.success) {
      items.value = response.items;
    } else {
      error.value = response.message || 'Không thể tải danh sách vật phẩm';
    }
  } catch (err) {
    console.error('Error fetching premium items:', err);
    error.value = 'Lỗi khi tải danh sách vật phẩm';
  } finally {
    loading.value = false;
  }
};

const canAfford = (item: PremiumItem): boolean => {
  return props.playerPremiumCurrency >= item.premiumPrice;
};

const buyItem = async (item: PremiumItem) => {
  if (!canAfford(item) || purchasing.value) return;
  
  purchasing.value = true;
  try {
    const response = await $fetch('/api/shop/buy-premium', {
      method: 'POST',
      body: { itemId: item._id }
    });
    
    if (response.success) {
      // Notify parent that purchase was successful
      emit('itemPurchased');
      // Show success message
      alert(response.message);
      // Close popup
      close();
    } else {
      alert(response.message || 'Không thể mua vật phẩm');
    }
  } catch (err) {
    console.error('Error buying item:', err);
    alert('Lỗi khi mua vật phẩm');
  } finally {
    purchasing.value = false;
  }
};

const close = () => {
  emit('close');
};
</script>

<style scoped>
.premium-shop-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.premium-shop-popup {
  background-color: rgba(0, 20, 0, 0.95);
  border: 2px solid var(--text-accent);
  border-radius: 4px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  font-family: 'VT323', 'Source Code Pro', monospace;
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--text-accent);
  background-color: rgba(0, 30, 0, 0.8);
}

.popup-title {
  font-size: 20px;
  font-weight: bold;
  color: #FFD700;
}

.popup-close {
  background: none;
  border: none;
  color: var(--text-danger);
  font-size: 18px;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  font-family: inherit;
}

.popup-close:hover {
  color: #ff0000;
}

.popup-body {
  padding: 1rem;
  overflow-y: auto;
  flex: 1;
}

.currency-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: rgba(0, 50, 0, 0.5);
  border: 1px solid var(--text-accent);
  margin-bottom: 1rem;
  border-radius: 4px;
}

.currency-label {
  color: var(--text-dim);
  font-size: 16px;
}

.currency-value {
  color: #FFD700;
  font-size: 18px;
  font-weight: bold;
}

.loading-message,
.error-message,
.empty-message {
  text-align: center;
  padding: 2rem;
  color: var(--text-dim);
  font-size: 16px;
}

.error-message {
  color: var(--text-danger);
}

.items-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.item-card {
  background-color: rgba(0, 30, 0, 0.6);
  border: 1px solid var(--text-dim);
  border-radius: 4px;
  padding: 1rem;
  transition: all 0.2s;
}

.item-card:hover {
  border-color: var(--text-accent);
  background-color: rgba(0, 40, 0, 0.7);
}

.item-card.can-afford {
  border-color: var(--text-accent);
}

.item-header {
  margin-bottom: 0.5rem;
}

.item-name {
  color: #FFD700;
  font-size: 18px;
  font-weight: bold;
}

.item-description {
  color: var(--text-bright);
  font-size: 14px;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.item-effects {
  color: var(--text-accent);
  font-size: 15px;
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  background-color: rgba(0, 136, 0, 0.1);
  border-left: 2px solid var(--text-accent);
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--text-dim);
}

.item-price {
  color: #FFD700;
  font-size: 16px;
  font-weight: bold;
}

.buy-button {
  background-color: rgba(0, 136, 0, 0.5);
  border: 1px solid var(--text-accent);
  color: var(--text-bright);
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-family: inherit;
  font-size: 16px;
  border-radius: 3px;
  transition: all 0.2s;
}

.buy-button:hover:not(:disabled) {
  background-color: rgba(0, 180, 0, 0.6);
  border-color: #00ff00;
}

.buy-button:disabled {
  background-color: rgba(50, 50, 50, 0.5);
  border-color: var(--text-dim);
  color: var(--text-dim);
  cursor: not-allowed;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .premium-shop-popup {
    width: 95%;
    max-height: 90vh;
  }

  .popup-title {
    font-size: 18px;
  }

  .item-name {
    font-size: 16px;
  }

  .item-description {
    font-size: 13px;
  }
}
</style>
