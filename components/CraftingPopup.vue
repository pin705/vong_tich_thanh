<template>
  <FullscreenOverlay :isOpen="isOpen" @close="$emit('close')" size="large" title="Chế Tạo">
    <div class="crafting-container">
      <!-- Known Recipes List -->
      <div class="recipes-section">
        <div class="section-title">[ Công Thức Đã Học ]</div>
        
        <div v-if="loading" class="loading-message">Đang tải...</div>
        <div v-else-if="knownRecipes.length === 0" class="empty-message">
          Bạn chưa học công thức nào. Tìm [Công Thức] từ quái vật hoặc thương nhân!
        </div>
        <div v-else class="recipes-grid">
          <div
            v-for="recipe in knownRecipes"
            :key="recipe.id"
            :class="['recipe-card', { selected: selectedRecipe?.id === recipe.id }]"
            @click="selectRecipe(recipe)"
          >
            <div class="recipe-name" :class="getQualityClass(recipe.quality)">
              {{ recipe.name }}
            </div>
            <div class="recipe-result">
              Kết quả: <span class="result-name">{{ recipe.resultName }}</span>
            </div>
            <div v-if="recipe.quality" class="recipe-quality">
              Phẩm chất: <span :class="getQualityClass(recipe.quality)">{{ recipe.quality }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recipe Details -->
      <div v-if="selectedRecipe" class="recipe-detail-section">
        <div class="section-title">[ Chi Tiết Công Thức ]</div>
        
        <div class="recipe-detail">
          <div class="detail-header">
            <span class="detail-name" :class="getQualityClass(selectedRecipe.quality)">
              {{ selectedRecipe.name }}
            </span>
          </div>

          <div class="materials-required">
            <div class="materials-title">Nguyên liệu cần thiết:</div>
            <div
              v-for="material in selectedRecipe.materials"
              :key="material.id"
              :class="['material-item', { insufficient: !hasSufficientMaterial(material) }]"
            >
              <span class="material-name">{{ material.name }}</span>
              <span class="material-count">
                {{ getMaterialCount(material.id) }}/{{ material.quantity }}
              </span>
            </div>
          </div>

          <div class="result-preview">
            <div class="result-title">Sẽ tạo ra:</div>
            <div class="result-item" :class="getQualityClass(selectedRecipe.quality)">
              {{ selectedRecipe.resultName }}
            </div>
          </div>

          <div class="craft-actions">
            <button
              class="craft-button"
              :class="{ disabled: !canCraft(selectedRecipe) }"
              :disabled="!canCraft(selectedRecipe)"
              @click="handleCraft"
            >
              <template v-if="crafting">
                [⚙️] Đang chế tạo...
              </template>
              <template v-else>
                [✓] CHẾ TẠO
              </template>
            </button>
            <div v-if="!canCraft(selectedRecipe)" class="insufficient-notice">
              Không đủ nguyên liệu!
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state when no recipe selected -->
      <div v-else class="no-selection">
        Chọn một công thức để xem chi tiết và chế tạo.
      </div>
    </div>
  </FullscreenOverlay>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import FullscreenOverlay from './FullscreenOverlay.vue';

interface Material {
  id: string;
  name: string;
  quantity: number;
}

interface Recipe {
  id: string;
  name: string;
  description: string;
  quality?: string;
  resultName: string;
  materials: Material[];
}

interface Props {
  isOpen: boolean;
  knownRecipes: Recipe[];
  inventory: any[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
});

const emit = defineEmits<{
  close: [];
  craft: [recipeId: string];
}>();

const selectedRecipe = ref<Recipe | null>(null);
const crafting = ref(false);

function selectRecipe(recipe: Recipe) {
  selectedRecipe.value = recipe;
}

function getMaterialCount(materialId: string): number {
  return props.inventory.filter((item: any) => item.id === materialId).length;
}

function hasSufficientMaterial(material: Material): boolean {
  return getMaterialCount(material.id) >= material.quantity;
}

function canCraft(recipe: Recipe): boolean {
  return recipe.materials.every((material: Material) => hasSufficientMaterial(material));
}

async function handleCraft() {
  if (!selectedRecipe.value || !canCraft(selectedRecipe.value) || crafting.value) {
    return;
  }

  crafting.value = true;
  try {
    emit('craft', selectedRecipe.value.id);
    // Reset after a short delay to show feedback
    setTimeout(() => {
      crafting.value = false;
      selectedRecipe.value = null;
    }, 500);
  } catch (error) {
    console.error('Crafting error:', error);
    crafting.value = false;
  }
}

function getQualityClass(quality?: string): string {
  const qualityMap: Record<string, string> = {
    'Thô': 'quality-poor',
    'Thường': 'quality-common',
    'Tốt': 'quality-good',
    'Hiếm': 'quality-rare',
    'Sử Thi': 'quality-epic'
  };
  return quality ? qualityMap[quality] || '' : '';
}
</script>

<style scoped>
.crafting-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  color: var(--text-bright);
  font-family: 'VT323', 'Source Code Pro', monospace;
  padding: 1.5rem;
  max-height: 70vh;
  overflow-y: auto;
}

.section-title {
  color: var(--text-accent);
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(0, 136, 0, 0.3);
}

.loading-message,
.empty-message {
  text-align: center;
  color: var(--text-dim);
  padding: 2rem;
  font-style: italic;
}

.recipes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.recipe-card {
  background-color: rgba(0, 136, 0, 0.05);
  border: 1px solid rgba(0, 136, 0, 0.3);
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.recipe-card:hover {
  background-color: rgba(0, 255, 0, 0.1);
  border-color: var(--text-accent);
  transform: translateY(-2px);
}

.recipe-card.selected {
  background-color: rgba(0, 255, 0, 0.15);
  border-color: var(--text-accent);
  border-width: 2px;
}

.recipe-name {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.recipe-result {
  font-size: 14px;
  color: var(--text-dim);
  margin-bottom: 0.25rem;
}

.result-name {
  color: var(--text-bright);
}

.recipe-quality {
  font-size: 14px;
  color: var(--text-dim);
}

.quality-poor {
  color: #9d9d9d;
}

.quality-common {
  color: var(--text-bright);
}

.quality-good {
  color: #00ff00;
}

.quality-rare {
  color: #0099ff;
}

.quality-epic {
  color: #ff00ff;
}

.recipe-detail-section {
  background-color: rgba(0, 136, 0, 0.05);
  border: 1px solid rgba(0, 136, 0, 0.3);
  padding: 1.5rem;
}

.recipe-detail {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detail-header {
  font-size: 22px;
  font-weight: bold;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(0, 136, 0, 0.3);
}

.materials-required {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.materials-title {
  color: var(--text-accent);
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.material-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  background-color: rgba(0, 136, 0, 0.1);
  border-left: 2px solid var(--text-bright);
}

.material-item.insufficient {
  border-left-color: #ff0000;
  color: var(--text-dim);
}

.material-name {
  font-size: 16px;
}

.material-count {
  font-weight: bold;
}

.material-item.insufficient .material-count {
  color: #ff0000;
}

.result-preview {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.result-title {
  color: var(--text-accent);
  font-size: 18px;
  font-weight: bold;
}

.result-item {
  font-size: 20px;
  font-weight: bold;
  padding: 0.75rem;
  background-color: rgba(0, 136, 0, 0.1);
  border: 1px solid rgba(0, 136, 0, 0.3);
  text-align: center;
}

.craft-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: stretch;
}

.craft-button {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #008800 0%, #00ff00 100%);
  border: 2px solid var(--text-accent);
  color: #000000;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  font-family: 'VT323', 'Source Code Pro', monospace;
  transition: all 0.2s;
}

.craft-button:hover:not(.disabled) {
  background: linear-gradient(135deg, #00ff00 0%, #00ff00 100%);
  transform: scale(1.02);
  box-shadow: 0 0 15px rgba(0, 255, 0, 0.5);
}

.craft-button.disabled {
  background: #555555;
  border-color: #777777;
  color: #999999;
  cursor: not-allowed;
  opacity: 0.5;
}

.insufficient-notice {
  text-align: center;
  color: #ff0000;
  font-size: 14px;
}

.no-selection {
  text-align: center;
  color: var(--text-dim);
  padding: 3rem;
  font-style: italic;
  font-size: 18px;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .recipes-grid {
    grid-template-columns: 1fr;
  }

  .crafting-container {
    padding: 1rem;
  }
}
</style>
