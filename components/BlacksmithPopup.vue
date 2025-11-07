<template>
  <FullscreenOverlay :isOpen="isOpen" @close="$emit('close')" size="large" title="Thợ Rèn - Cường Hóa Trang Bị">
    <div class="blacksmith-container">
      <!-- Equipment Selection -->
      <div class="equipment-section">
        <div class="section-title">[ Chọn Trang Bị ]</div>
        
        <div v-if="loading" class="loading-message">Đang tải...</div>
        <div v-else-if="equipmentItems.length === 0" class="empty-message">
          Bạn không có trang bị nào. Hãy tìm trang bị từ quái vật hoặc thương nhân!
        </div>
        <div v-else class="items-grid">
          <div
            v-for="item in equipmentItems"
            :key="item.id"
            :class="['item-card', { selected: selectedEquipment?.id === item.id }]"
            @click="selectEquipment(item)"
          >
            <div class="item-name" :class="getQualityClass(item.quality)">
              {{ item.name }}
            </div>
            <div v-if="item.enhancementLevel" class="item-enhancement">
              +{{ item.enhancementLevel }}
            </div>
            <div class="item-stats">
              <span v-if="item.stats?.damage">⚔️ {{ item.stats.damage }}</span>
              <span v-if="item.stats?.defense">🛡️ {{ item.stats.defense }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Material Selection -->
      <div class="material-section">
        <div class="section-title">[ Chọn Vật Liệu ]</div>
        
        <div v-if="upgradeItems.length === 0" class="empty-message">
          Bạn không có vật liệu nâng cấp. Hãy săn boss hoặc mua từ thương nhân!
        </div>
        <div v-else class="items-grid">
          <div
            v-for="item in upgradeItems"
            :key="item.id"
            :class="['item-card', { selected: selectedMaterial?.id === item.id }]"
            @click="selectMaterial(item)"
          >
            <div class="item-name">{{ item.name }}</div>
            <div class="item-type">{{ getMaterialTypeName(item.upgradeType) }}</div>
          </div>
        </div>
      </div>

      <!-- Enhancement Preview -->
      <div v-if="selectedEquipment && selectedMaterial" class="enhancement-preview">
        <div class="section-title">[ Kết Quả Dự Kiến ]</div>
        
        <div class="preview-content">
          <div class="preview-item">
            <strong>Trang bị:</strong> {{ selectedEquipment.name }}
          </div>
          <div class="preview-item">
            <strong>Cấp hiện tại:</strong> +{{ selectedEquipment.enhancementLevel || 0 }}
          </div>
          <div class="preview-item">
            <strong>Nếu thành công:</strong> +{{ (selectedEquipment.enhancementLevel || 0) + 1 }}
          </div>
          <div class="preview-item">
            <strong>Tỉ lệ thành công:</strong> 
            <span :class="getSuccessRateClass(getSuccessRate())">
              {{ (getSuccessRate() * 100).toFixed(0) }}%
            </span>
          </div>
          <div class="preview-item">
            <strong>Chi phí:</strong> {{ getGoldCost() }} 💰
          </div>
          <div class="preview-warning">
            ⚠️ Nếu thất bại, trang bị sẽ không thay đổi (không mất cấp)
          </div>
        </div>

        <div class="enhance-actions">
          <button
            class="enhance-button"
            :class="{ disabled: !canEnhance() }"
            :disabled="!canEnhance() || enhancing"
            @click="handleEnhance"
          >
            <template v-if="enhancing">
              [⚙️] Đang cường hóa...
            </template>
            <template v-else>
              [✨] CƯỜNG HÓA
            </template>
          </button>
          <div v-if="!canEnhance()" class="insufficient-notice">
            {{ getInsufficientReason() }}
          </div>
        </div>

        <!-- Result Message -->
        <div v-if="enhancementResult" class="enhancement-result" :class="enhancementResult.success ? 'success' : 'failure'">
          {{ enhancementResult.message }}
        </div>
      </div>

      <!-- Help Text -->
      <div class="help-section">
        <div class="help-title">💡 Hướng Dẫn</div>
        <ul class="help-list">
          <li>Chọn trang bị muốn cường hóa và vật liệu nâng cấp</li>
          <li>Mỗi lần cường hóa sẽ tốn Vàng và vật liệu</li>
          <li>Tỉ lệ thành công giảm dần theo cấp độ cường hóa</li>
          <li>Nếu thất bại, trang bị không mất cấp nhưng mất vật liệu</li>
          <li>Tìm "Đá Cường Hóa" từ boss hoặc mua từ thương nhân</li>
        </ul>
      </div>
    </div>
  </FullscreenOverlay>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import FullscreenOverlay from './FullscreenOverlay.vue';

interface Props {
  isOpen: boolean;
}

interface Item {
  id: string;
  name: string;
  type: string;
  quality?: string;
  stats?: any;
  enhancementLevel?: number;
  upgradeType?: string;
}

interface EnhancementResult {
  success: boolean;
  message: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
}>();

const loading = ref(false);
const enhancing = ref(false);
const selectedEquipment = ref<Item | null>(null);
const selectedMaterial = ref<Item | null>(null);
const enhancementResult = ref<EnhancementResult | null>(null);
const equipmentItems = ref<Item[]>([]);
const upgradeItems = ref<Item[]>([]);
const playerGold = ref(0);

onMounted(async () => {
  if (props.isOpen) {
    await loadInventory();
  }
});

async function loadInventory() {
  loading.value = true;
  try {
    // In a real implementation, this would fetch from API
    // For now, we'll use placeholder data
    console.log('Loading inventory...');
  } catch (error) {
    console.error('Error loading inventory:', error);
  } finally {
    loading.value = false;
  }
}

function selectEquipment(item: Item) {
  selectedEquipment.value = item;
  enhancementResult.value = null;
}

function selectMaterial(item: Item) {
  selectedMaterial.value = item;
  enhancementResult.value = null;
}

function getQualityClass(quality?: string) {
  if (!quality) return '';
  const qualityMap: Record<string, string> = {
    'Thô': 'quality-poor',
    'Thường': 'quality-common',
    'Tốt': 'quality-good',
    'Hiếm': 'quality-rare',
    'Sử Thi': 'quality-epic',
  };
  return qualityMap[quality] || '';
}

function getMaterialTypeName(type?: string) {
  const typeMap: Record<string, string> = {
    'enhancement': 'Cường Hóa',
    'star': 'Nâng Sao',
    'refine': 'Tinh Luyện',
  };
  return typeMap[type || ''] || 'Vật Liệu';
}

function getSuccessRate() {
  if (!selectedEquipment.value) return 0.9;
  const level = selectedEquipment.value.enhancementLevel || 0;
  const baseChance = 0.9;
  const decreasePerLevel = 0.05;
  const minChance = 0.1;
  return Math.max(minChance, baseChance - level * decreasePerLevel);
}

function getSuccessRateClass(rate: number) {
  if (rate >= 0.7) return 'rate-high';
  if (rate >= 0.4) return 'rate-medium';
  return 'rate-low';
}

function getGoldCost() {
  if (!selectedEquipment.value) return 0;
  const level = selectedEquipment.value.enhancementLevel || 0;
  const baseCost = 100;
  return Math.floor(baseCost * Math.pow(1.5, level));
}

function canEnhance() {
  if (!selectedEquipment.value || !selectedMaterial.value) return false;
  if (playerGold.value < getGoldCost()) return false;
  return true;
}

function getInsufficientReason() {
  if (!selectedEquipment.value) return 'Chưa chọn trang bị';
  if (!selectedMaterial.value) return 'Chưa chọn vật liệu';
  if (playerGold.value < getGoldCost()) return 'Không đủ vàng';
  return '';
}

async function handleEnhance() {
  if (!canEnhance()) return;
  
  enhancing.value = true;
  enhancementResult.value = null;
  
  try {
    // Call the enhancement API
    const response = await $fetch('/api/item/enhance', {
      method: 'POST',
      body: {
        itemId: selectedEquipment.value!.id,
        materialId: selectedMaterial.value!.id,
      },
    });

    enhancementResult.value = {
      success: (response as any).success,
      message: (response as any).message,
    };

    if ((response as any).success) {
      // Reload inventory
      await loadInventory();
      selectedMaterial.value = null;
    }
  } catch (error: any) {
    enhancementResult.value = {
      success: false,
      message: error.data?.message || 'Lỗi khi cường hóa',
    };
  } finally {
    enhancing.value = false;
  }
}
</script>

<style scoped>
.blacksmith-container {
  padding: 20px;
  color: #e0e0e0;
}

.equipment-section,
.material-section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 1.2rem;
  font-weight: bold;
  color: #ffd700;
  margin-bottom: 15px;
  text-align: center;
  border-bottom: 2px solid #4a4a4a;
  padding-bottom: 10px;
}

.loading-message,
.empty-message {
  text-align: center;
  padding: 30px;
  color: #888;
  font-style: italic;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.item-card {
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid #4a4a4a;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.2s;
}

.item-card:hover {
  border-color: #ffd700;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(255, 215, 0, 0.2);
}

.item-card.selected {
  border-color: #00ff00;
  background: rgba(0, 255, 0, 0.1);
}

.item-name {
  font-weight: bold;
  margin-bottom: 5px;
}

.item-enhancement {
  color: #00ff00;
  font-weight: bold;
  font-size: 1.2rem;
  margin: 5px 0;
}

.item-stats {
  display: flex;
  gap: 10px;
  font-size: 0.9rem;
  color: #ccc;
}

.item-type {
  color: #888;
  font-size: 0.9rem;
}

.quality-poor { color: #808080; }
.quality-common { color: #ffffff; }
.quality-good { color: #1eff00; }
.quality-rare { color: #0070dd; }
.quality-epic { color: #a335ee; }

.enhancement-preview {
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid #ffd700;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
}

.preview-content {
  margin: 20px 0;
}

.preview-item {
  padding: 8px 0;
  border-bottom: 1px solid #4a4a4a;
}

.preview-warning {
  margin-top: 15px;
  padding: 10px;
  background: rgba(255, 69, 0, 0.2);
  border: 1px solid #ff4500;
  border-radius: 5px;
  color: #ffa500;
  text-align: center;
}

.rate-high { color: #00ff00; }
.rate-medium { color: #ffa500; }
.rate-low { color: #ff4500; }

.enhance-actions {
  margin-top: 20px;
}

.enhance-button {
  width: 100%;
  padding: 15px;
  font-size: 1.2rem;
  font-weight: bold;
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  color: #000;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.2s;
}

.enhance-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #ffed4e, #ffb347);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(255, 215, 0, 0.4);
}

.enhance-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.insufficient-notice {
  margin-top: 10px;
  padding: 10px;
  background: rgba(255, 0, 0, 0.2);
  border: 1px solid #ff4500;
  border-radius: 5px;
  color: #ff6347;
  text-align: center;
}

.enhancement-result {
  margin-top: 20px;
  padding: 15px;
  border-radius: 5px;
  text-align: center;
  font-weight: bold;
  font-size: 1.1rem;
}

.enhancement-result.success {
  background: rgba(0, 255, 0, 0.2);
  border: 2px solid #00ff00;
  color: #00ff00;
}

.enhancement-result.failure {
  background: rgba(255, 0, 0, 0.2);
  border: 2px solid #ff0000;
  color: #ff6347;
}

.help-section {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid #4a4a4a;
  border-radius: 5px;
  padding: 15px;
}

.help-title {
  font-weight: bold;
  margin-bottom: 10px;
  color: #ffd700;
}

.help-list {
  list-style-position: inside;
  line-height: 1.8;
  color: #ccc;
}

.help-list li {
  margin-bottom: 5px;
}
</style>
