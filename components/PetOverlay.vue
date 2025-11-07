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

onMounted(() => {
  loadPets();
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
</style>
