<template>
  <FullscreenOverlay
    title="Chuồng Thú Cưng"
    @close="$emit('close')"
  >
    <div class="pet-overlay-content">
      <!-- Tab Selector -->
      <TabSelector
        :tabs="tabs"
        :active-tab="activeTab"
        @tab-change="activeTab = $event"
      />

      <!-- Pet Stable Tab -->
      <div v-if="activeTab === 'stable'" class="pet-stable">
        <div v-if="loading" class="loading-message">Đang tải...</div>
        <div v-else-if="error" class="error-message">{{ error }}</div>
        <div v-else-if="pets?.length === 0" class="empty-message">
          Bạn chưa có thú cưng nào.
          <br>
          Mua trứng thú cưng từ [Huấn Luyện Sư Kito] để bắt đầu!
        </div>
        <div v-else class="pet-list">
          <div
            v-for="pet in pets"
            :key="pet._id"
            class="pet-card"
            :class="{ active: pet.isActive }"
            @click="selectPet(pet)"
          >
            <div class="pet-header">
              <span class="pet-name">{{ pet.nickname }}</span>
              <span class="pet-level">Lv.{{ pet.level }}</span>
            </div>
            <div class="pet-quality" :class="'quality-' + pet.quality.toLowerCase()">
              {{ getQualityName(pet.quality) }}
            </div>
            <div class="pet-type">{{ pet.templateName }}</div>
            <div class="pet-stats">
              HP: {{ pet.currentStats.maxHp }} | ATK: {{ pet.currentStats.attack }} | DEF: {{ pet.currentStats.defense }}
            </div>
            <div class="pet-exp">
              EXP: {{ pet.exp }}/{{ pet.expToNextLevel }}
            </div>
            <div v-if="pet.isActive" class="active-badge">Đang Triệu Hồi</div>
            <div class="pet-actions">
              <button v-if="!pet.isActive" class="btn-summon" @click.stop="summonPet(pet)">
                Triệu Hồi
              </button>
              <button v-else class="btn-unsummon" @click.stop="unsummonPet()">
                Thu Hồi
              </button>
              <button class="btn-details" @click.stop="viewDetails(pet)">
                Chi Tiết
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Egg Hatching Tab -->
      <div v-else-if="activeTab === 'hatch'" class="egg-hatching-tab">
        <!-- Egg Selection Phase -->
        <div v-if="!selectedEgg && !hatching && !hatchedPet" class="egg-selection-phase">
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
            <button class="btn-cancel" @click="cancelEggSelection">
              ← Quay Lại
            </button>
          </div>
        </div>

        <!-- Hatching Animation Phase -->
        <div v-if="hatching" class="hatching-phase">
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
            <button class="btn-confirm" @click="finishHatching">
              Hoàn Thành
            </button>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="hatchError" class="error-message">
          {{ hatchError }}
        </div>
      </div>

      <!-- Pet Details Tab -->
      <div v-else-if="activeTab === 'details'" class="pet-details">
        <div v-if="!selectedPet" class="empty-message">
          Chọn một thú cưng từ tab Chuồng để xem chi tiết.
        </div>
        <div v-else class="detail-content">
          <div class="detail-header">
            <h2>{{ selectedPet.nickname }}</h2>
            <span class="detail-quality" :class="'quality-' + selectedPet.quality.toLowerCase()">
              {{ getQualityName(selectedPet.quality) }}
            </span>
          </div>

          <div class="detail-section">
            <h3>Thông Tin Cơ Bản</h3>
            <div class="detail-row">Loài: {{ selectedPet.templateName }}</div>
            <div class="detail-row">Cấp độ: {{ selectedPet.level }}</div>
            <div class="detail-row">Kinh nghiệm: {{ selectedPet.exp }}/{{ selectedPet.expToNextLevel }}</div>
          </div>

          <div class="detail-section">
            <h3>Chỉ Số</h3>
            <div class="detail-row">HP: {{ selectedPet.currentStats.hp }}/{{ selectedPet.currentStats.maxHp }}</div>
            <div class="detail-row">Tấn Công: {{ selectedPet.currentStats.attack }}</div>
            <div class="detail-row">Phòng Thủ: {{ selectedPet.currentStats.defense }}</div>
          </div>

          <div class="detail-section">
            <h3>Kỹ Năng</h3>
            <div v-if="selectedPet.skills.length === 0" class="detail-row">
              Chưa học kỹ năng nào
            </div>
            <div v-else>
              <div v-for="skill in selectedPet.skills" :key="skill" class="detail-row">
                - {{ skill }}
              </div>
            </div>
          </div>

          <div class="detail-actions">
            <button class="btn-action" @click="showRenameDialog = true">
              Đổi Tên Pet
            </button>
            <button class="btn-action" @click="showRerollDialog = true">
              Tẩy Tủy (Đổi Phẩm Chất)
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Rename Dialog -->
    <div v-if="showRenameDialog" class="dialog-overlay" @click.self="showRenameDialog = false">
      <div class="dialog-box">
        <h3>Đổi Tên Pet</h3>
        <p>Cần: 1x Thẻ Đổi Tên Pet</p>
        <input
          v-model="newPetName"
          type="text"
          placeholder="Tên mới (2-20 ký tự)"
          maxlength="20"
          class="input-field"
        />
        <div class="dialog-actions">
          <button class="btn-confirm" @click="confirmRename">Xác Nhận</button>
          <button class="btn-cancel" @click="showRenameDialog = false">Hủy</button>
        </div>
      </div>
    </div>

    <!-- Reroll Dialog -->
    <div v-if="showRerollDialog" class="dialog-overlay" @click.self="showRerollDialog = false">
      <div class="dialog-box">
        <h3>Tẩy Tủy Pet</h3>
        <p>Cần: 1x Đá Tẩy Tủy Pet</p>
        <p>Phẩm chất hiện tại: {{ getQualityName(selectedPet?.quality || '') }}</p>
        <p class="warning">Cảnh báo: Phẩm chất mới sẽ được chọn ngẫu nhiên!</p>
        <div class="dialog-actions">
          <button class="btn-confirm" @click="confirmReroll">Xác Nhận</button>
          <button class="btn-cancel" @click="showRerollDialog = false">Hủy</button>
        </div>
      </div>
    </div>
  </FullscreenOverlay>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import FullscreenOverlay from './FullscreenOverlay.vue';
import TabSelector from './TabSelector.vue';

interface Pet {
  _id: string;
  nickname: string;
  level: number;
  exp: number;
  expToNextLevel: number;
  quality: string;
  currentStats: {
    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
  };
  skills: string[];
  templateName: string;
  isActive: boolean;
}

const emit = defineEmits<{
  close: [];
}>();

const tabs = [
  { id: 'stable', label: 'Chuồng' },
  { id: 'hatch', label: 'Ấp Trứng' },
  { id: 'details', label: 'Chi Tiết' }
];

const activeTab = ref('stable');
const loading = ref(true);
const error = ref('');
const pets = ref<Pet[]>([]);
const selectedPet = ref<Pet | null>(null);
const showRenameDialog = ref(false);
const showRerollDialog = ref(false);
const newPetName = ref('');

// Egg hatching state
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

const petEggs = ref<PetEgg[]>([]);
const selectedEgg = ref<PetEgg | null>(null);
const hatching = ref(false);
const hatchProgress = ref(0);
const hatchingText = ref('');
const hatchedPet = ref<HatchedPet | null>(null);
const hatchError = ref('');

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

const loadPets = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await $fetch('/api/pet/stable');
    if (response.success) {
      pets.value = response.pets;
    } else {
      error.value = 'Không thể tải danh sách thú cưng';
    }
  } catch (err: any) {
    error.value = err.message || 'Lỗi khi tải thú cưng';
  } finally {
    loading.value = false;
  }
};

const selectPet = (pet: Pet) => {
  selectedPet.value = pet;
};

const viewDetails = (pet: Pet) => {
  selectedPet.value = pet;
  activeTab.value = 'details';
};

const summonPet = async (pet: Pet) => {
  // Send command to summon pet
  const ws = (window as any).gameWs;
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'command',
      payload: { command: `summon ${pet.nickname}` }
    }));
  }
  // Reload pets after a short delay
  setTimeout(loadPets, 1000);
};

const unsummonPet = async () => {
  // Send command to unsummon pet
  const ws = (window as any).gameWs;
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'command',
      payload: { command: 'unsummon' }
    }));
  }
  // Reload pets after a short delay
  setTimeout(loadPets, 1000);
};

const confirmRename = async () => {
  if (!selectedPet.value || !newPetName.value) return;

  if (newPetName.value.length < 2 || newPetName.value.length > 20) {
    alert('Tên pet phải từ 2-20 ký tự!');
    return;
  }

  try {
    // Find rename tag in inventory
    const inventoryItems = await $fetch('/api/player/info');
    const renameTag = inventoryItems.inventory?.find((item: any) => 
      item.itemKey === 'pet_rename_tag'
    );

    if (!renameTag) {
      alert('Bạn không có Thẻ Đổi Tên Pet!');
      return;
    }

    const response = await $fetch('/api/pet/rename', {
      method: 'POST',
      body: {
        petId: selectedPet.value._id,
        newName: newPetName.value,
        tagInstanceId: renameTag._id
      }
    });

    if (response.success) {
      alert(response.message);
      showRenameDialog.value = false;
      newPetName.value = '';
      await loadPets();
    }
  } catch (err: any) {
    alert(err.data?.message || 'Lỗi khi đổi tên pet');
  }
};

const confirmReroll = async () => {
  if (!selectedPet.value) return;

  try {
    // Find reroll stone in inventory
    const inventoryItems = await $fetch('/api/player/info');
    const rerollStone = inventoryItems.inventory?.find((item: any) => 
      item.itemKey === 'pet_reroll_stone'
    );

    if (!rerollStone) {
      alert('Bạn không có Đá Tẩy Tủy Pet!');
      return;
    }

    const response = await $fetch('/api/pet/reroll-quality', {
      method: 'POST',
      body: {
        petId: selectedPet.value._id,
        materialInstanceId: rerollStone._id
      }
    });

    if (response.success) {
      alert(response.message);
      showRerollDialog.value = false;
      await loadPets();
    }
  } catch (err: any) {
    alert(err.data?.message || 'Lỗi khi tẩy tủy pet');
  }
};

// Egg hatching functions
const loadPetEggs = async () => {
  try {
    const response = await $fetch('/api/player/info');
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
    hatchError.value = 'Không thể tải danh sách trứng thú cưng';
  }
};

const selectEgg = (egg: PetEgg) => {
  selectedEgg.value = egg;
  hatchError.value = '';
};

const cancelEggSelection = () => {
  selectedEgg.value = null;
  hatchError.value = '';
};

const confirmHatch = async () => {
  if (!selectedEgg.value) return;

  hatching.value = true;
  hatchProgress.value = 0;
  hatchError.value = '';

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

  const progressInterval = setInterval(() => {
    if (hatchProgress.value < 100) {
      hatchProgress.value += 5;
    }
  }, 150);

  try {
    const ws = (window as any).gameWs;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'command',
        payload: { input: `use ${selectedEgg.value.name}` }
      }));

      await new Promise(resolve => setTimeout(resolve, 3000));

      const petResponse = await $fetch('/api/pet/stable');
      
      if (petResponse.success && petResponse.pets && petResponse.pets.length > 0) {
        const newestPet = petResponse.pets[petResponse.pets.length - 1];
        hatchedPet.value = newestPet;
      }

      clearInterval(textInterval);
      clearInterval(progressInterval);
      hatching.value = false;
      hatchProgress.value = 100;

      if (!hatchedPet.value) {
        hatchError.value = 'Có lỗi xảy ra khi nở trứng. Vui lòng thử lại.';
        selectedEgg.value = null;
      }
    } else {
      throw new Error('WebSocket connection not available');
    }
  } catch (error: any) {
    console.error('Error hatching egg:', error);
    hatchError.value = error.message || 'Không thể nở trứng. Vui lòng thử lại.';
    clearInterval(textInterval);
    clearInterval(progressInterval);
    hatching.value = false;
    selectedEgg.value = null;
  }
};

const finishHatching = () => {
  selectedEgg.value = null;
  hatching.value = false;
  hatchProgress.value = 0;
  hatchingText.value = '';
  hatchedPet.value = null;
  hatchError.value = '';
  activeTab.value = 'stable';
  loadPets();
  loadPetEggs();
};

onMounted(() => {
  loadPets();
  loadPetEggs();
});
</script>

<style scoped>
.pet-overlay-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
}

.pet-stable,
.pet-details {
  flex: 1;
  overflow-y: auto;
}

.loading-message,
.error-message,
.empty-message {
  text-align: center;
  padding: 2rem;
  color: var(--text-dim);
}

.error-message {
  color: var(--text-damage);
}

.pet-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  padding: 1rem;
}

.pet-card {
  background: rgba(0, 136, 0, 0.1);
  border: 1px solid rgba(0, 136, 0, 0.3);
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.pet-card:hover {
  background: rgba(0, 136, 0, 0.2);
  border-color: var(--text-accent);
}

.pet-card.active {
  border-color: var(--text-accent);
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
}

.pet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.pet-name {
  font-weight: bold;
  font-size: 1.2em;
  color: var(--text-bright);
}

.pet-level {
  color: var(--text-accent);
}

.pet-quality {
  font-size: 0.9em;
  margin-bottom: 0.25rem;
}

.quality-common { color: #888; }
.quality-uncommon { color: #4CAF50; }
.quality-rare { color: #2196F3; }
.quality-epic { color: #9C27B0; }
.quality-legendary { color: #FF9800; }

.pet-type,
.pet-stats,
.pet-exp {
  font-size: 0.9em;
  color: var(--text-dim);
  margin-bottom: 0.25rem;
}

.active-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: var(--text-accent);
  color: #000;
  padding: 0.25rem 0.5rem;
  font-size: 0.8em;
  font-weight: bold;
}

.pet-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.btn-summon,
.btn-unsummon,
.btn-details,
.btn-action {
  padding: 0.5rem 1rem;
  border: 1px solid var(--text-accent);
  background: transparent;
  color: var(--text-accent);
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.btn-summon:hover,
.btn-details:hover,
.btn-action:hover {
  background: var(--text-accent);
  color: #000;
}

.btn-unsummon {
  border-color: var(--text-damage);
  color: var(--text-damage);
}

.btn-unsummon:hover {
  background: var(--text-damage);
  color: #000;
}

.detail-content {
  padding: 1rem;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.detail-header h2 {
  margin: 0;
  color: var(--text-bright);
}

.detail-quality {
  font-size: 1.1em;
  font-weight: bold;
}

.detail-section {
  margin-bottom: 1.5rem;
}

.detail-section h3 {
  color: var(--text-accent);
  margin-bottom: 0.5rem;
}

.detail-row {
  padding: 0.25rem 0;
  color: var(--text-dim);
}

.detail-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-box {
  background: #000;
  border: 2px solid var(--text-accent);
  padding: 2rem;
  max-width: 400px;
  width: 90%;
}

.dialog-box h3 {
  margin-top: 0;
  color: var(--text-accent);
}

.dialog-box p {
  color: var(--text-dim);
  margin: 0.5rem 0;
}

.warning {
  color: var(--text-damage);
}

.input-field {
  width: 100%;
  padding: 0.5rem;
  margin: 1rem 0;
  background: rgba(0, 136, 0, 0.1);
  border: 1px solid var(--text-accent);
  color: var(--text-bright);
  font-family: inherit;
}

.dialog-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

.btn-confirm,
.btn-cancel {
  padding: 0.5rem 1rem;
  border: 1px solid var(--text-accent);
  background: transparent;
  color: var(--text-accent);
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.btn-confirm:hover {
  background: var(--text-accent);
  color: #000;
}

.btn-cancel {
  border-color: var(--text-damage);
  color: var(--text-damage);
}

.btn-cancel:hover {
  background: var(--text-damage);
  color: #000;
}

/* Egg Hatching Tab Styles */
.egg-hatching-tab {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.egg-selection-phase,
.confirmation-phase,
.hatching-phase,
.success-phase {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
  margin: 0 auto;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #008800, #00ff00);
  transition: width 0.15s ease-out;
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
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

.success-phase .pet-name {
  font-size: 28px;
  color: var(--text-bright);
  margin-bottom: 0.5rem;
}

.success-phase .pet-quality {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 1rem;
}

.success-phase .pet-stats {
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

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
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
