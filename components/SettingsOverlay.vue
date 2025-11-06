<template>
  <FullscreenOverlay :isOpen="isOpen" title="CÀI ĐẶT" @close="close">
    <div class="settings-container">
      <!-- Tab Navigation -->
      <div class="settings-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="settings-tab"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          [{{ tab.order }}] {{ tab.label }}
        </button>
      </div>

      <!-- Tab Content -->
      <div class="settings-content">
        <!-- Giao Diện Tab -->
        <div v-if="activeTab === 'theme'" class="tab-panel">
          <div class="setting-section">
            <h3 class="section-title">Giao Diện:</h3>
            <div class="theme-options">
              <div
                v-for="theme in themes"
                :key="theme.id"
                class="theme-option"
                :class="{ selected: currentTheme === theme.id }"
                @click="selectTheme(theme.id)"
              >
                <span class="theme-checkbox">{{ currentTheme === theme.id ? '[X]' : '[ ]' }}</span>
                <span class="theme-name">{{ theme.name }}</span>
              </div>
            </div>
          </div>

          <div class="setting-section">
            <h3 class="section-title">Cỡ Chữ:</h3>
            <div class="font-size-options">
              <button
                v-for="size in fontSizes"
                :key="size.id"
                class="font-size-button"
                :class="{ selected: currentFontSize === size.id }"
                @click="selectFontSize(size.id)"
              >
                {{ size.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- Âm Thanh Tab -->
        <div v-else-if="activeTab === 'audio'" class="tab-panel">
          <div class="setting-section">
            <p class="coming-soon">Tính năng âm thanh đang được phát triển...</p>
          </div>
        </div>

        <!-- Lối Chơi Tab -->
        <div v-else-if="activeTab === 'gameplay'" class="tab-panel">
          <div class="setting-section">
            <p class="coming-soon">Cài đặt lối chơi đang được phát triển...</p>
          </div>
        </div>

        <!-- Gift Code Tab -->
        <div v-else-if="activeTab === 'giftcode'" class="tab-panel">
          <div class="setting-section">
            <h3 class="section-title">Nhập Gift Code:</h3>
            <p class="section-description">Nhập mã Gift Code để nhận quà tặng đặc biệt!</p>
            
            <div class="giftcode-input-container">
              <input
                v-model="giftCodeInput"
                type="text"
                class="giftcode-input"
                placeholder="Nhập mã code..."
                @keydown.enter="redeemGiftCode"
              />
              <button
                class="giftcode-button"
                @click="redeemGiftCode"
                :disabled="!giftCodeInput.trim() || redeemingCode"
              >
                {{ redeemingCode ? 'Đang xử lý...' : '[Nhận]' }}
              </button>
            </div>

            <!-- Status message -->
            <div v-if="giftCodeMessage" class="giftcode-message" :class="giftCodeStatus">
              {{ giftCodeMessage }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </FullscreenOverlay>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import FullscreenOverlay from './FullscreenOverlay.vue';

interface Props {
  isOpen: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  themeChange: [themeId: string];
  fontSizeChange: [sizeId: string];
}>();

// Tab definitions
const tabs = [
  { id: 'theme', label: 'Giao Diện', order: '1' },
  { id: 'audio', label: 'Âm Thanh', order: '2' },
  { id: 'gameplay', label: 'Lối Chơi', order: '3' },
  { id: 'giftcode', label: 'Gift Code', order: '4' }
];

// Theme definitions
const themes = [
  {
    id: 'vong-tich',
    name: 'Vong Tích (Cổ Điển)'
  },
  {
    id: 'ho-phach',
    name: 'Hổ Phách (Hoài Cổ)'
  },
  {
    id: 'co-ngu',
    name: 'Cổ Ngữ (Lạnh Lẽo)'
  }
];

// Font size definitions
const fontSizes = [
  { id: 'small', label: '[Nhỏ]' },
  { id: 'medium', label: '[Vừa]' },
  { id: 'large', label: '[Lớn]' }
];

const activeTab = ref('theme');
const currentTheme = ref('vong-tich');
const currentFontSize = ref('medium');
const giftCodeInput = ref('');
const giftCodeMessage = ref('');
const giftCodeStatus = ref<'success' | 'error'>('success');
const redeemingCode = ref(false);

const close = () => {
  emit('close');
};

const selectTheme = (themeId: string) => {
  currentTheme.value = themeId;
  emit('themeChange', themeId);
  // Save to localStorage with error handling
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('game-theme', themeId);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  }
};

const selectFontSize = (sizeId: string) => {
  currentFontSize.value = sizeId;
  emit('fontSizeChange', sizeId);
  // Save to localStorage with error handling
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('game-font-size', sizeId);
    } catch (error) {
      console.warn('Failed to save font size preference:', error);
    }
  }
};

const redeemGiftCode = async () => {
  if (!giftCodeInput.value.trim() || redeemingCode.value) return;
  
  redeemingCode.value = true;
  giftCodeMessage.value = '';
  
  try {
    const response = await $fetch('/api/player/redeem-code', {
      method: 'POST',
      body: {
        code: giftCodeInput.value.trim()
      }
    });
    
    if (response.success) {
      giftCodeMessage.value = response.message;
      giftCodeStatus.value = 'success';
      giftCodeInput.value = '';
    }
  } catch (error: any) {
    giftCodeMessage.value = error.data?.statusMessage || 'Không thể sử dụng mã code.';
    giftCodeStatus.value = 'error';
  } finally {
    redeemingCode.value = false;
  }
};

// Load saved preferences on mount
onMounted(() => {
  if (typeof window !== 'undefined') {
    try {
      const savedTheme = localStorage.getItem('game-theme');
      const savedFontSize = localStorage.getItem('game-font-size');
      
      // Validate theme exists in available options
      if (savedTheme && themes.some(t => t.id === savedTheme)) {
        currentTheme.value = savedTheme;
      }
      
      // Validate font size exists in available options
      if (savedFontSize && fontSizes.some(s => s.id === savedFontSize)) {
        currentFontSize.value = savedFontSize;
      }
    } catch (error) {
      console.warn('Failed to load saved preferences:', error);
    }
  }
});
</script>

<style scoped>
.settings-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.settings-tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid var(--text-dim);
  padding-bottom: 0.5rem;
  margin-bottom: 1.5rem;
}

.settings-tab {
  background: transparent;
  color: var(--text-bright);
  border: 1px solid var(--text-dim);
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 18px;
  transition: all 0.2s;
}

.settings-tab:hover {
  background-color: rgba(0, 255, 0, 0.1);
  color: var(--text-accent);
}

.settings-tab.active {
  background-color: rgba(0, 255, 0, 0.15);
  color: var(--text-accent);
  border-color: var(--text-bright);
}

.settings-content {
  flex: 1;
  overflow-y: auto;
}

.tab-panel {
  animation: fadeIn 0.2s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.setting-section {
  margin-bottom: 2rem;
}

.section-title {
  color: var(--text-accent);
  font-size: 20px;
  margin-bottom: 1rem;
  font-weight: bold;
}

.theme-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.theme-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.theme-option:hover {
  background-color: rgba(0, 255, 0, 0.05);
  border-color: var(--text-dim);
}

.theme-option.selected {
  background-color: rgba(0, 255, 0, 0.1);
  border-color: var(--text-bright);
}

.theme-checkbox {
  color: var(--text-bright);
  font-size: 18px;
  min-width: 2rem;
}

.theme-name {
  color: var(--text-bright);
  font-size: 18px;
}

.font-size-options {
  display: flex;
  gap: 1rem;
}

.font-size-button {
  background: transparent;
  color: var(--text-bright);
  border: 1px solid var(--text-dim);
  padding: 0.5rem 1.5rem;
  cursor: pointer;
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 18px;
  transition: all 0.2s;
}

.font-size-button:hover {
  background-color: rgba(0, 255, 0, 0.1);
  color: var(--text-accent);
}

.font-size-button.selected {
  background-color: rgba(0, 255, 0, 0.15);
  color: var(--text-accent);
  border-color: var(--text-bright);
}

.coming-soon {
  color: var(--text-dim);
  font-style: italic;
  font-size: 16px;
}

/* Gift Code styles */
.section-description {
  color: var(--text-dim);
  font-size: 16px;
  margin-bottom: 1rem;
}

.giftcode-input-container {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.giftcode-input {
  flex: 1;
  background-color: var(--bg-black);
  color: var(--text-bright);
  border: 1px solid var(--text-dim);
  padding: 0.75rem;
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 18px;
  text-transform: uppercase;
}

.giftcode-input:focus {
  outline: none;
  border-color: var(--text-accent);
  box-shadow: 0 0 5px rgba(0, 255, 0, 0.3);
}

.giftcode-button {
  background: transparent;
  color: var(--text-accent);
  border: 2px solid var(--text-accent);
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 18px;
  font-weight: bold;
  transition: all 0.2s;
  white-space: nowrap;
}

.giftcode-button:hover:not(:disabled) {
  background-color: var(--text-accent);
  color: var(--bg-black);
}

.giftcode-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.giftcode-message {
  padding: 0.75rem;
  border-left: 3px solid;
  margin-top: 0.5rem;
}

.giftcode-message.success {
  background-color: rgba(0, 255, 0, 0.1);
  border-color: var(--text-accent);
  color: var(--text-accent);
}

.giftcode-message.error {
  background-color: rgba(255, 0, 0, 0.1);
  border-color: var(--text-danger);
  color: var(--text-danger);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .settings-tabs {
    flex-wrap: wrap;
  }

  .settings-tab {
    font-size: 16px;
    padding: 0.4rem 0.75rem;
  }

  .theme-option {
    padding: 0.5rem;
  }

  .font-size-options {
    flex-direction: column;
  }
}
</style>
