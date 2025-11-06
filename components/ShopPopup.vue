<template>
  <teleport to="body">
    <div v-if="isOpen" class="shop-overlay" @click.self="close">
      <div class="shop-popup">
        <div class="popup-header">
          <span class="popup-title">{{ vendorName }} - Cửa Hàng</span>
          <button class="popup-close" @click="close">[X]</button>
        </div>
        
        <div class="popup-tabs">
          <button 
            class="tab-button" 
            :class="{ active: activeTab === 'buy' }"
            @click="activeTab = 'buy'"
          >
            [ MUA HÀNG ]
          </button>
          <button 
            class="tab-button" 
            :class="{ active: activeTab === 'sell' }"
            @click="activeTab = 'sell'"
          >
            [ BÁN ĐỒ ]
          </button>
        </div>

        <div class="popup-body">
          <div class="currency-display">
            <span class="currency-label">
              {{ shopType === 'premium' ? 'Cổ Thạch [G]:' : 'Vàng [V]:' }}
            </span>
            <span class="currency-value">
              {{ shopType === 'premium' ? playerPremiumCurrency : playerGold }}
            </span>
          </div>

          <!-- Buy Tab -->
          <div v-if="activeTab === 'buy'" class="tab-content">
            <div v-if="loading" class="loading-message">
              Đang tải...
            </div>

            <div v-else-if="error" class="error-message">
              {{ error }}
            </div>

            <div v-else-if="shopItems.length === 0" class="empty-message">
              <div class="empty-icon">[ ? ]</div>
              <p>Cửa hàng hiện không có sản phẩm.</p>
              <p class="empty-hint">Thử nói chuyện với người bán hàng hoặc sử dụng lệnh "list" để xem hàng hóa.</p>
            </div>

            <div v-else class="items-grid">
              <div
                v-for="item in shopItems"
                :key="item._id"
                class="item-card"
                :class="{ 'can-afford': canAfford(item) }"
              >
                <div class="item-header">
                  <span class="item-name" :class="`quality-${item.quality?.toLowerCase()}`">
                    {{ item.name }}
                  </span>
                  <span v-if="item.quality" class="item-quality">
                    [{{ item.quality }}]
                  </span>
                </div>
                <div class="item-description">{{ item.description }}</div>
                <div v-if="item.requiredLevel && item.requiredLevel > 1" class="item-level">
                  Yêu cầu cấp: {{ item.requiredLevel }}
                </div>
                <div v-if="item.effects" class="item-effects">
                  <div v-if="item.effects.buff === 'EXP_BOOST'">
                    {{ item.effects.multiplier }}x EXP trong {{ item.effects.duration_minutes }} phút
                  </div>
                </div>
                <div class="item-footer">
                  <span class="item-price">
                    {{ getItemPrice(item) }} {{ shopType === 'premium' ? '[G]' : '[V]' }}
                  </span>
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

          <!-- Sell Tab -->
          <div v-if="activeTab === 'sell'" class="tab-content">
            <div v-if="playerInventory.length === 0" class="empty-message">
              Túi đồ của bạn đang trống.
            </div>

            <div v-else class="items-grid">
              <div
                v-for="item in playerInventory"
                :key="item._id"
                class="item-card"
                :class="{ 'can-sell': canSell(item) }"
              >
                <div class="item-header">
                  <span class="item-name" :class="`quality-${item.quality?.toLowerCase()}`">
                    {{ item.name }}
                  </span>
                </div>
                <div class="item-description">{{ item.description }}</div>
                <div class="item-footer">
                  <span class="item-price">
                    {{ getSellValue(item) }} [V]
                  </span>
                  <button
                    class="sell-button"
                    :disabled="!canSell(item) || selling"
                    @click="sellItem(item)"
                  >
                    {{ canSell(item) ? 'Bán' : 'Không bán được' }}
                  </button>
                </div>
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

interface ShopItem {
  _id: string;
  name: string;
  description: string;
  type: string;
  price: number;
  sellValue: number;
  premiumPrice: number;
  quality?: string;
  requiredLevel?: number;
  effects?: {
    buff: string;
    multiplier: number;
    duration_minutes: number;
  };
}

interface Props {
  isOpen: boolean;
  vendorId: string;
  vendorName: string;
  shopType: 'gold' | 'premium';
  playerGold: number;
  playerPremiumCurrency: number;
  playerInventory: ShopItem[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  sendCommand: [command: string];
  itemPurchased: [];
}>();

const activeTab = ref<'buy' | 'sell'>('buy');
const shopItems = ref<ShopItem[]>([]);
const loading = ref(false);
const error = ref('');
const purchasing = ref(false);
const selling = ref(false);

// Fetch shop items when popup opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    activeTab.value = 'buy';
    // Request shop inventory via command
    emit('sendCommand', `list`);
  }
});

// This will be called from parent when list command returns
const setShopItems = (items: ShopItem[]) => {
  shopItems.value = items;
};

const getItemPrice = (item: ShopItem): number => {
  return props.shopType === 'premium' ? item.premiumPrice : item.price;
};

const getSellValue = (item: ShopItem): number => {
  return item.sellValue ?? 0;
};

const canAfford = (item: ShopItem): boolean => {
  const price = getItemPrice(item);
  if (props.shopType === 'premium') {
    return props.playerPremiumCurrency >= price;
  } else {
    return props.playerGold >= price;
  }
};

const canSell = (item: ShopItem): boolean => {
  // Can only sell to gold shops, not premium shops
  if (props.shopType === 'premium') return false;
  return getSellValue(item) > 0;
};

const buyItem = (item: ShopItem) => {
  if (!canAfford(item) || purchasing.value) return;
  
  purchasing.value = true;
  emit('sendCommand', `buy ${item.name}`);
  
  // Reset after a delay
  setTimeout(() => {
    purchasing.value = false;
    emit('itemPurchased');
  }, 500);
};

const sellItem = (item: ShopItem) => {
  if (!canSell(item) || selling.value) return;
  
  selling.value = true;
  emit('sendCommand', `sell ${item.name}`);
  
  // Reset after a delay
  setTimeout(() => {
    selling.value = false;
    emit('itemPurchased');
  }, 500);
};

const close = () => {
  emit('close');
};

// Expose setShopItems for parent component
defineExpose({
  setShopItems
});
</script>

<style scoped>
.shop-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.85);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.shop-popup {
  width: 90%;
  max-width: 800px;
  max-height: 85vh;
  background-color: var(--bg-black);
  border: 2px solid var(--text-bright);
  box-shadow: 0 0 25px rgba(0, 255, 0, 0.4);
  font-family: 'VT323', 'Source Code Pro', monospace;
  display: flex;
  flex-direction: column;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 2px solid var(--text-bright);
  background-color: rgba(0, 136, 0, 0.1);
}

.popup-title {
  color: var(--text-accent);
  font-size: 22px;
  font-weight: bold;
}

.popup-close {
  color: var(--text-danger);
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 20px;
  font-weight: bold;
  padding: 0 0.5rem;
  transition: color 0.2s;
}

.popup-close:hover {
  color: var(--text-bright);
}

.popup-tabs {
  display: flex;
  border-bottom: 1px solid var(--text-dim);
  background-color: rgba(0, 0, 0, 0.3);
}

.tab-button {
  flex: 1;
  padding: 0.75rem;
  background: transparent;
  border: none;
  color: var(--text-dim);
  font-family: inherit;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-button.active {
  color: var(--text-accent);
  background-color: rgba(0, 136, 0, 0.15);
  border-bottom: 2px solid var(--text-accent);
}

.tab-button:hover:not(.active) {
  color: var(--text-bright);
  background-color: rgba(0, 136, 0, 0.05);
}

.popup-body {
  padding: 1rem;
  overflow-y: auto;
  flex: 1;
}

.currency-display {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  margin-bottom: 1rem;
  background-color: rgba(0, 136, 136, 0.1);
  border: 1px solid var(--text-cyan);
}

.currency-label {
  color: var(--text-dim);
  font-size: 18px;
}

.currency-value {
  color: var(--text-accent);
  font-size: 18px;
  font-weight: bold;
}

.tab-content {
  min-height: 200px;
}

.loading-message,
.error-message,
.empty-message {
  text-align: center;
  padding: 2rem;
  color: var(--text-dim);
  font-size: 18px;
}

.empty-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 0.5rem;
}

.empty-hint {
  color: var(--text-cyan);
  font-size: 14px;
  font-style: italic;
  margin-top: 0.5rem;
}

.error-message {
  color: var(--text-danger);
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.item-card {
  background-color: rgba(0, 136, 0, 0.05);
  border: 1px solid var(--text-dim);
  padding: 1rem;
  transition: all 0.2s;
}

.item-card.can-afford {
  border-color: var(--text-bright);
}

.item-card.can-sell {
  border-color: var(--text-bright);
}

.item-card:hover {
  background-color: rgba(0, 136, 0, 0.1);
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.item-name {
  color: var(--text-bright);
  font-size: 18px;
  font-weight: bold;
}

.item-name.quality-hiếm {
  color: #3b82f6;
}

.item-name.quality-sử_thi {
  color: #a855f7;
}

.item-quality {
  color: var(--text-dim);
  font-size: 14px;
}

.item-description {
  color: var(--text-dim);
  font-size: 14px;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.item-level {
  color: var(--text-cyan);
  font-size: 14px;
  margin-bottom: 0.5rem;
}

.item-effects {
  color: var(--text-accent);
  font-size: 14px;
  margin-bottom: 0.5rem;
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
  color: var(--text-accent);
  font-size: 18px;
  font-weight: bold;
}

.buy-button,
.sell-button {
  padding: 0.5rem 1rem;
  background-color: var(--text-bright);
  color: var(--bg-black);
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.2s;
}

.buy-button:hover:not(:disabled),
.sell-button:hover:not(:disabled) {
  background-color: var(--text-accent);
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
}

.buy-button:disabled,
.sell-button:disabled {
  background-color: var(--text-dim);
  cursor: not-allowed;
  opacity: 0.5;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .shop-popup {
    width: 95%;
    max-height: 90vh;
  }

  .popup-header {
    padding: 0.75rem;
  }

  .popup-title {
    font-size: 18px;
  }

  .popup-body {
    padding: 0.5rem;
  }

  .currency-display {
    padding: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .currency-label,
  .currency-value {
    font-size: 16px;
  }

  .items-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .item-card {
    padding: 0.75rem;
  }

  .tab-button {
    font-size: 16px;
    padding: 0.5rem;
  }
}
</style>
