<template>
  <FullscreenOverlay :isOpen="isOpen" @close="$emit('close')" title="Cây Chức Nghiệp">
    <div class="profession-container">
      <!-- Header -->
      <div class="profession-header">
        <h2>CÂY CHỨC NGHIỆP</h2>
        <div v-if="currentProfession" class="current-profession">
          <span class="profession-name">{{ getProfessionTierName() }}</span>
          <span class="profession-tier">Tầng {{ currentTier }}</span>
        </div>
        <div v-else class="no-profession">
          Chưa chọn chức nghiệp
        </div>
      </div>

      <!-- Profession Selection -->
      <div v-if="!currentProfession" class="profession-selection">
        <h3>CHỌN CHỨC NGHIỆP CỦA BẠN</h3>
        <div class="profession-grid">
          <div 
            v-for="(progression, key) in professionProgressions" 
            :key="key"
            class="profession-card"
            @click="selectProfession(key)"
          >
            <div class="profession-card-header">{{ progression.baseName }}</div>
            <div class="profession-card-body">
              <div class="profession-description">
                {{ progression.tiers[0].description }}
              </div>
              <div class="profession-benefits">
                <div class="benefit-label">Kỹ Năng Ban Đầu:</div>
                <div 
                  v-for="skill in progression.tiers[0].benefits.skillsGranted" 
                  :key="skill"
                  class="skill-item"
                >
                  • {{ skill }}
                </div>
              </div>
            </div>
            <button class="select-button">[Chọn]</button>
          </div>
        </div>
      </div>

      <!-- Profession Tree -->
      <div v-else class="profession-tree">
        <div class="tree-path">
          <div 
            v-for="tier in professionTiers" 
            :key="tier.tier"
            :class="['tier-node', { 
              'tier-unlocked': currentTier >= tier.tier,
              'tier-current': currentTier === tier.tier,
              'tier-locked': currentTier < tier.tier
            }]"
          >
            <div class="tier-header">
              <div class="tier-number">Tầng {{ tier.tier }}</div>
              <div class="tier-name">{{ tier.name }}</div>
            </div>
            <div class="tier-body">
              <div class="tier-description">{{ tier.description }}</div>
              
              <div class="tier-requirements">
                <div class="requirement-label">YÊU CẦU:</div>
                <div v-if="tier.requirements.level">
                  • Cấp độ: {{ tier.requirements.level }}
                  <span v-if="playerLevel >= tier.requirements.level" class="met">✓</span>
                  <span v-else class="not-met">✗</span>
                </div>
                <div v-if="tier.requirements.professionLevel">
                  • Cấp nghề: {{ tier.requirements.professionLevel }}
                  <span v-if="professionLevel >= tier.requirements.professionLevel" class="met">✓</span>
                  <span v-else class="not-met">✗</span>
                </div>
              </div>
              
              <div class="tier-benefits">
                <div class="benefit-label">LỢI ÍCH:</div>
                <div v-if="tier.benefits.skillsGranted">
                  <strong>Kỹ Năng:</strong>
                  <div v-for="skill in tier.benefits.skillsGranted" :key="skill">
                    • {{ skill }}
                  </div>
                </div>
                <div v-if="tier.benefits.statBonuses">
                  <strong>Chỉ Số:</strong>
                  <div v-for="(value, stat) in tier.benefits.statBonuses" :key="stat">
                    • {{ stat }}: +{{ value }}
                  </div>
                </div>
              </div>
              
              <button 
                v-if="canAdvance(tier)"
                class="advance-button"
                @click="advanceTier(tier)"
              >
                [Thăng Cấp]
              </button>
              <button 
                v-else-if="currentTier < tier.tier"
                class="advance-button disabled"
                disabled
              >
                [Bị Khóa]
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="profession-footer">
        <div class="hint">Nhấn ESC để đóng</div>
      </div>
    </div>
  </FullscreenOverlay>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import FullscreenOverlay from './FullscreenOverlay.vue';

interface Props {
  isOpen: boolean;
  currentProfession: string | null;
  currentTier: number;
  playerLevel: number;
  professionLevel: number;
}

const props = defineProps<Props>();
const emit = defineEmits(['close', 'selectProfession', 'advanceTier']);

// Mock data - this would come from server
const professionProgressions = ref({
  blacksmith: {
    baseName: 'Thợ Rèn',
    tiers: [
      {
        tier: 1,
        name: 'Thợ Rèn Tập Sự',
        description: 'Người mới bắt đầu học nghề rèn',
        requirements: { level: 1 },
        benefits: {
          skillsGranted: ['Rèn Cơ Bản', 'Sửa Chữa Vật Phẩm'],
          statBonuses: { strength: 2 }
        }
      },
      {
        tier: 2,
        name: 'Thợ Rèn Thành Thạo',
        description: 'Thợ rèn có kinh nghiệm',
        requirements: { level: 20, professionLevel: 50 },
        benefits: {
          skillsGranted: ['Rèn Nâng Cao', 'Tôi Vũ Khí'],
          statBonuses: { strength: 5, defense: 3 }
        }
      },
      {
        tier: 3,
        name: 'Đại Thợ Rèn',
        description: 'Bậc thầy nghệ thuật rèn',
        requirements: { level: 40, professionLevel: 100 },
        benefits: {
          skillsGranted: ['Rèn Bậc Thầy', 'Tạo Huyền Thoại'],
          statBonuses: { strength: 10, defense: 5 }
        }
      }
    ]
  },
  // Add other professions...
});

const professionTiers = computed(() => {
  if (!props.currentProfession) return [];
  return professionProgressions.value[props.currentProfession as keyof typeof professionProgressions.value]?.tiers || [];
});

function getProfessionTierName(): string {
  const tiers = professionTiers.value;
  if (tiers.length === 0) return '';
  return tiers.find(t => t.tier === props.currentTier)?.name || '';
}

function canAdvance(tier: any): boolean {
  if (props.currentTier + 1 !== tier.tier) return false;
  
  if (tier.requirements.level && props.playerLevel < tier.requirements.level) {
    return false;
  }
  
  if (tier.requirements.professionLevel && props.professionLevel < tier.requirements.professionLevel) {
    return false;
  }
  
  return true;
}

function selectProfession(professionKey: string) {
  emit('selectProfession', professionKey);
}

function advanceTier(tier: any) {
  emit('advanceTier', tier);
}
</script>

<style scoped>
.profession-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: #00ff00;
  font-family: 'VT323', 'Source Code Pro', monospace;
}

.profession-header {
  padding: 1rem;
  border-bottom: 1px solid #008800;
  text-align: center;
}

.profession-header h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.current-profession {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 0.5rem;
}

.profession-name {
  color: #ffb000;
  font-weight: bold;
}

.profession-tier {
  color: #00aaaa;
}

.no-profession {
  color: #008800;
  font-style: italic;
}

.profession-selection {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.profession-selection h3 {
  text-align: center;
  margin-bottom: 1rem;
  color: #ffb000;
}

.profession-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.profession-card {
  border: 1px solid #008800;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.profession-card:hover {
  border-color: #00ff00;
  background: rgba(0, 255, 0, 0.1);
}

.profession-card-header {
  font-size: 1.2rem;
  font-weight: bold;
  color: #ffb000;
  margin-bottom: 0.5rem;
  text-align: center;
}

.profession-card-body {
  margin-bottom: 1rem;
}

.profession-description {
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #00aaaa;
}

.profession-benefits {
  font-size: 0.85rem;
}

.benefit-label {
  color: #ffb000;
  font-weight: bold;
  margin: 0.5rem 0 0.25rem 0;
}

.skill-item {
  color: #00ff00;
  margin-left: 0.5rem;
}

.select-button {
  width: 100%;
  background: #008800;
  border: 1px solid #00ff00;
  color: #000000;
  padding: 0.5rem;
  cursor: pointer;
  font-family: 'VT323', monospace;
  font-size: 1rem;
  font-weight: bold;
}

.select-button:hover {
  background: #00ff00;
}

.profession-tree {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.tree-path {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tier-node {
  border: 2px solid #008800;
  padding: 1rem;
}

.tier-node.tier-unlocked {
  border-color: #00ff00;
  background: rgba(0, 255, 0, 0.05);
}

.tier-node.tier-current {
  border-color: #ffb000;
  background: rgba(255, 176, 0, 0.1);
}

.tier-node.tier-locked {
  border-color: #444444;
  opacity: 0.6;
}

.tier-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #008800;
}

.tier-number {
  color: #00aaaa;
}

.tier-name {
  color: #ffb000;
  font-weight: bold;
}

.tier-body {
  font-size: 0.9rem;
}

.tier-description {
  margin-bottom: 0.5rem;
  color: #00aaaa;
}

.tier-requirements,
.tier-benefits {
  margin: 0.5rem 0;
}

.requirement-label {
  color: #ff6600;
  font-weight: bold;
}

.met {
  color: #00ff00;
}

.not-met {
  color: #ff0000;
}

.advance-button {
  width: 100%;
  margin-top: 0.5rem;
  background: #008800;
  border: 1px solid #00ff00;
  color: #000000;
  padding: 0.5rem;
  cursor: pointer;
  font-family: 'VT323', monospace;
  font-size: 1rem;
  font-weight: bold;
}

.advance-button:hover:not(.disabled) {
  background: #00ff00;
}

.advance-button.disabled {
  background: #444444;
  border-color: #666666;
  color: #888888;
  cursor: not-allowed;
}

.profession-footer {
  padding: 1rem;
  border-top: 1px solid #008800;
  text-align: center;
}

.hint {
  color: #008800;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .profession-grid {
    grid-template-columns: 1fr;
  }
  
  .tier-header {
    flex-direction: column;
    gap: 0.25rem;
  }
}
</style>
