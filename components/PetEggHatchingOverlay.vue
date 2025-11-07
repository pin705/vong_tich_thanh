<template>
  <FullscreenOverlay
    :isOpen="isOpen"
    @close="handleClose"
    size="medium"
    title="Ấp Trứng Thú Cưng"
  >
    <div class="egg-hatching-container">
      <!-- Egg Selection Phase -->
      <div v-if="!selectedEgg && !hatching && !hatchedPet" class="egg-selection-phase">
        <div class="section-title">[ Chọn Trứng Để Ấp ]</div>
        
        <div v-if="petEggs.length === 0" class="empty-message">
          Bạn không có trứng thú cưng nào.
          <br>
          Hãy mua trứng từ [Huấn Luyện Sư Kito] để bắt đầu!
        </div>
        
        <div v-else class="egg-grid">
          <div
            v-for="egg in petEggs"
            :key="egg.id"
            class="egg-card"
            @click="selectEgg(egg)"
          >
            <div class="egg-icon">🥚</div>
            <div class="egg-name">{{ egg.name }}</div>
            <div class="egg-description">{{ egg.description }}</div>
            <button class="btn-select">Chọn Trứng Này</button>
          </div>
        </div>
      </div>

      <!-- Confirmation Phase -->
      <div v-if="selectedEgg && !hatching && !hatchedPet" class="confirmation-phase">
        <div class="section-title">[ Xác Nhận Ấp Trứng ]</div>
        
        <div class="egg-display">
          <div class="egg-icon-large">🥚</div>
          <div class="egg-details">
            <h3>{{ selectedEgg.name }}</h3>
            <p>{{ selectedEgg.description }}</p>
          </div>
        </div>

        <div class="warning-message">
          ⚠️ Sau khi nở, trứng sẽ biến thành thú cưng với phẩm chất ngẫu nhiên!
          <br>
          Phẩm chất: Thường, Không Phổ Biến, Hiếm, Sử Thi, Huyền Thoại
        </div>

        <div class="action-buttons">
          <button class="btn-confirm" @click="confirmHatch">
            ✨ Bắt Đầu Ấp Trứng
          </button>
          <button class="btn-cancel" @click="cancelSelection">
            ← Quay Lại
          </button>
        </div>
      </div>

      <!-- Hatching Animation Phase -->
      <div v-if="hatching" class="hatching-phase">
        <div class="section-title">[ Đang Ấp Trứng... ]</div>
        
        <div class="egg-animation">
          <div class="egg-icon-animated" :class="{ 'shaking': hatching }">🥚</div>
          <div class="hatching-text">{{ hatchingText }}</div>
        </div>

        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${hatchProgress}%` }"></div>
        </div>
      </div>

      <!-- Success Phase -->
      <div v-if="hatchedPet" class="success-phase">
        <div class="section-title">[ 🎉 Trứng Đã Nở! ]</div>
        
        <div class="pet-reveal">
          <div class="pet-icon">🐾</div>
          <div class="pet-info">
            <h2 class="pet-name">{{ hatchedPet.nickname }}</h2>
            <div class="pet-quality" :class="'quality-' + hatchedPet.quality.toLowerCase()">
              {{ getQualityName(hatchedPet.quality) }}
            </div>
            <div class="pet-stats">
              <div class="stat-item">HP: {{ hatchedPet.currentStats.maxHp }}</div>
              <div class="stat-item">Tấn Công: {{ hatchedPet.currentStats.attack }}</div>
              <div class="stat-item">Phòng Thủ: {{ hatchedPet.currentStats.defense }}</div>
            </div>
          </div>
        </div>

        <div class="success-message">
          🎊 Chúc mừng! Bạn đã nhận được [{{ hatchedPet.nickname }}]!
          <br>
          Sử dụng lệnh <code>summon {{ hatchedPet.nickname }}</code> để triệu hồi thú cưng!
        </div>

        <div class="action-buttons">
          <button class="btn-confirm" @click="handleClose">
            Hoàn Thành
          </button>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
    </div>
  </FullscreenOverlay>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import FullscreenOverlay from './FullscreenOverlay.vue';

interface PetEgg {
  id: string;
  name: string;
  description: string;
  data?: {
    grantsPetKey?: string;
  };
}

interface HatchedPet {
  _id: string;
  nickname: string;
  quality: string;
  currentStats: {
    maxHp: number;
    attack: number;
    defense: number;
  };
}

interface Props {
  isOpen: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  eggHatched: [];
}>();

const petEggs = ref<PetEgg[]>([]);
const selectedEgg = ref<PetEgg | null>(null);
const hatching = ref(false);
const hatchProgress = ref(0);
const hatchingText = ref('');
const hatchedPet = ref<HatchedPet | null>(null);
const errorMessage = ref('');

const qualityNames: { [key: string]: string } = {
  COMMON: 'Thường',
  UNCOMMON: 'Không Phổ Biến',
  RARE: 'Hiếm',
  EPIC: 'Sử Thi',
  LEGENDARY: 'Huyền Thoại'
};

const getQualityName = (quality: string) => {
  return qualityNames[quality] || quality;
};

const loadPetEggs = async () => {
  try {
    // Fetch player inventory
    const response = await $fetch('/api/player/info');
    
    // Filter pet eggs from inventory
    petEggs.value = (response.inventory || [])
      .filter((item: any) => item.type === 'PET_EGG')
      .map((item: any) => ({
        id: item._id,
        name: item.name,
        description: item.description,
        data: item.data
      }));
  } catch (error) {
    console.error('Error loading pet eggs:', error);
    errorMessage.value = 'Không thể tải danh sách trứng thú cưng';
  }
};

const selectEgg = (egg: PetEgg) => {
  selectedEgg.value = egg;
  errorMessage.value = '';
};

const cancelSelection = () => {
  selectedEgg.value = null;
  errorMessage.value = '';
};

const confirmHatch = async () => {
  if (!selectedEgg.value) return;

  hatching.value = true;
  hatchProgress.value = 0;
  errorMessage.value = '';

  // Animate hatching process
  const hatchingTexts = [
    'Trứng đang rung chuyển...',
    'Có gì đó đang cựa quậy bên trong...',
    'Vỏ trứng bắt đầu nứt...',
    'Sắp nở rồi...'
  ];

  let textIndex = 0;
  const textInterval = setInterval(() => {
    if (textIndex < hatchingTexts.length) {
      hatchingText.value = hatchingTexts[textIndex];
      textIndex++;
    }
  }, 800);

  // Progress bar animation
  const progressInterval = setInterval(() => {
    if (hatchProgress.value < 100) {
      hatchProgress.value += 5;
    }
  }, 150);

  try {
    // Send command to hatch egg via WebSocket
    const ws = (window as any).gameWs;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'command',
        payload: { command: `use ${selectedEgg.value.name}` }
      }));

      // Wait for hatching animation
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Fetch updated pet list
      const petResponse = await $fetch('/api/pet/stable');
      
      if (petResponse.success && petResponse.pets && petResponse.pets.length > 0) {
        // Get the newest pet (last one added)
        const newestPet = petResponse.pets[petResponse.pets.length - 1];
        hatchedPet.value = newestPet;
      }

      clearInterval(textInterval);
      clearInterval(progressInterval);
      hatching.value = false;
      hatchProgress.value = 100;

      if (!hatchedPet.value) {
        errorMessage.value = 'Có lỗi xảy ra khi nở trứng. Vui lòng thử lại.';
        selectedEgg.value = null;
      }
    } else {
      throw new Error('WebSocket connection not available');
    }
  } catch (error: any) {
    console.error('Error hatching egg:', error);
    errorMessage.value = error.message || 'Không thể nở trứng. Vui lòng thử lại.';
    clearInterval(textInterval);
    clearInterval(progressInterval);
    hatching.value = false;
    selectedEgg.value = null;
  }
};

const handleClose = () => {
  // Reset state
  selectedEgg.value = null;
  hatching.value = false;
  hatchProgress.value = 0;
  hatchingText.value = '';
  hatchedPet.value = null;
  errorMessage.value = '';
  
  emit('close');
  
  // Emit event to refresh inventory/pets
  if (hatchedPet.value) {
    emit('eggHatched');
  }
};

onMounted(() => {
  if (props.isOpen) {
    loadPetEggs();
  }
});

// Watch for overlay open state
import { watch } from 'vue';
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    loadPetEggs();
  }
});
</script>

<style scoped>
.egg-hatching-container {
  padding: 1.5rem;
  color: var(--text-bright);
  font-family: 'VT323', 'Source Code Pro', monospace;
  min-height: 400px;
}

.section-title {
  color: var(--text-accent);
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 1.5rem;
  text-align: center;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid rgba(0, 136, 0, 0.3);
}

/* Egg Selection Phase */
.egg-selection-phase {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.empty-message {
  text-align: center;
  padding: 3rem 2rem;
  color: var(--text-dim);
  font-size: 18px;
  line-height: 1.8;
}

.egg-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.egg-card {
  background: rgba(0, 136, 0, 0.1);
  border: 2px solid rgba(0, 136, 0, 0.3);
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.egg-card:hover {
  border-color: var(--text-accent);
  background: rgba(0, 255, 0, 0.15);
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 255, 0, 0.2);
}

.egg-icon {
  font-size: 48px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.egg-name {
  font-size: 18px;
  font-weight: bold;
  color: var(--text-bright);
  text-align: center;
}

.egg-description {
  font-size: 14px;
  color: var(--text-dim);
  text-align: center;
  line-height: 1.4;
}

.btn-select {
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid var(--text-accent);
  color: var(--text-accent);
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  font-size: 16px;
}

.btn-select:hover {
  background: var(--text-accent);
  color: #000;
}

/* Confirmation Phase */
.confirmation-phase {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.egg-display {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 2rem;
  background: rgba(0, 136, 0, 0.05);
  border: 1px solid rgba(0, 136, 0, 0.3);
}

.egg-icon-large {
  font-size: 80px;
  animation: float 3s ease-in-out infinite;
}

.egg-details h3 {
  font-size: 24px;
  color: var(--text-bright);
  margin-bottom: 0.5rem;
}

.egg-details p {
  font-size: 16px;
  color: var(--text-dim);
  line-height: 1.5;
}

.warning-message {
  padding: 1rem;
  background: rgba(255, 176, 0, 0.1);
  border: 1px solid rgba(255, 176, 0, 0.3);
  color: var(--text-accent);
  font-size: 16px;
  text-align: center;
  line-height: 1.8;
}

/* Hatching Phase */
.hatching-phase {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  align-items: center;
}

.egg-animation {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
}

.egg-icon-animated {
  font-size: 100px;
}

.egg-icon-animated.shaking {
  animation: shake 0.5s ease-in-out infinite;
}

@keyframes shake {
  0%, 100% { transform: rotate(-5deg); }
  50% { transform: rotate(5deg); }
}

.hatching-text {
  font-size: 20px;
  color: var(--text-accent);
  text-align: center;
  min-height: 30px;
}

.progress-bar {
  width: 100%;
  max-width: 400px;
  height: 30px;
  background: rgba(0, 136, 0, 0.1);
  border: 2px solid rgba(0, 136, 0, 0.3);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #008800, #00ff00);
  transition: width 0.15s ease-out;
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
}

/* Success Phase */
.success-phase {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.pet-reveal {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 2rem;
  background: rgba(0, 136, 0, 0.1);
  border: 2px solid var(--text-accent);
  animation: glow 2s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% { box-shadow: 0 0 10px rgba(0, 255, 0, 0.3); }
  50% { box-shadow: 0 0 20px rgba(0, 255, 0, 0.6); }
}

.pet-icon {
  font-size: 80px;
}

.pet-info {
  flex: 1;
}

.pet-name {
  font-size: 28px;
  color: var(--text-bright);
  margin-bottom: 0.5rem;
}

.pet-quality {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 1rem;
}

.quality-common { color: #888; }
.quality-uncommon { color: #4CAF50; }
.quality-rare { color: #2196F3; }
.quality-epic { color: #9C27B0; }
.quality-legendary { color: #FF9800; }

.pet-stats {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.stat-item {
  background: rgba(0, 136, 0, 0.2);
  padding: 0.5rem 1rem;
  border: 1px solid rgba(0, 136, 0, 0.4);
  font-size: 16px;
}

.success-message {
  padding: 1rem;
  background: rgba(0, 255, 0, 0.1);
  border: 1px solid rgba(0, 255, 0, 0.3);
  color: var(--text-bright);
  font-size: 16px;
  text-align: center;
  line-height: 1.8;
}

.success-message code {
  background: rgba(0, 0, 0, 0.3);
  padding: 0.25rem 0.5rem;
  color: var(--text-accent);
  font-family: inherit;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
}

.btn-confirm,
.btn-cancel {
  padding: 0.75rem 2rem;
  font-size: 18px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid;
}

.btn-confirm {
  background: transparent;
  border-color: var(--text-accent);
  color: var(--text-accent);
}

.btn-confirm:hover {
  background: var(--text-accent);
  color: #000;
}

.btn-cancel {
  background: transparent;
  border-color: var(--text-dim);
  color: var(--text-dim);
}

.btn-cancel:hover {
  background: var(--text-dim);
  color: #000;
}

/* Error Message */
.error-message {
  padding: 1rem;
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid rgba(255, 0, 0, 0.3);
  color: var(--text-damage);
  font-size: 16px;
  text-align: center;
  margin-top: 1rem;
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .egg-grid {
    grid-template-columns: 1fr;
  }

  .egg-display,
  .pet-reveal {
    flex-direction: column;
    text-align: center;
  }
}
</style>
