<template>
  <FullscreenOverlay :isOpen="isOpen" @close="$emit('close')" size="large" title="Nhân Vật">
    <div class="character-menu-container">
      <!-- Tab Navigation -->
      <div class="tab-navigation">
        <button
          class="tab-button"
          :class="{ active: activeTab === 'info' }"
          @click="activeTab = 'info'"
        >
          [1] Thông Tin
        </button>
        <button
          class="tab-button"
          :class="{ active: activeTab === 'items' }"
          @click="activeTab = 'items'"
        >
          [2] Vật Phẩm
        </button>
        <button
          class="tab-button"
          :class="{ active: activeTab === 'equipment' }"
          @click="activeTab = 'equipment'"
        >
          [3] Trang Bị
        </button>
        <button
          v-if="profession && level >= 5"
          class="tab-button"
          :class="{ active: activeTab === 'skills' }"
          @click="activeTab = 'skills'"
        >
          [4] Kỹ Năng
        </button>
        <button
          v-if="profession && level >= 10"
          class="tab-button"
          :class="{ active: activeTab === 'talents' }"
          @click="activeTab = 'talents'"
        >
          [5] Thiên Phú
        </button>
      </div>

      <!-- Info Tab -->
      <div v-if="activeTab === 'info'" class="tab-content info-content">
        <div class="info-section">
          <div class="section-title">[ Thông Tin Cơ Bản ]</div>
          <div class="info-row">
            <span class="info-label">Tên:</span>
            <span class="info-value">{{ playerName }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Cấp:</span>
            <span class="info-value">{{ level }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Kinh nghiệm:</span>
            <span class="info-value">{{ exp }}/{{ nextLevelExp }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">HP:</span>
            <span class="info-value">{{ hp }}/{{ maxHp }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">MP/Tài nguyên:</span>
            <span class="info-value">{{ resource }}/{{ maxResource }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Vàng:</span>
            <span class="info-value">{{ gold }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Cổ Thạch:</span>
            <span class="info-value">{{ premiumCurrency }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Nghề nghiệp:</span>
            <span class="info-value">{{ professionDisplayName }}</span>
          </div>
        </div>

        <!-- Profession Choice Call to Action -->
        <div v-if="!profession && level >= 5" class="profession-cta-section">
          <button class="profession-cta-button" @click="emit('openProfessionChoice')">
            <span class="cta-icon">!</span> CHỌN NGHỀ NGHIỆP !
          </button>
          <p class="cta-message">Bạn đã đạt đủ cấp độ để chọn nghề nghiệp!</p>
        </div>

        <!-- Player Stats -->
        <div class="stats-section">
          <div class="section-title">[ Chỉ Số Chiến Đấu ]</div>
          <div class="stat-row">
            <span class="stat-label">Sát thương:</span>
            <span class="stat-value">{{ stats.damage }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Phòng thủ:</span>
            <span class="stat-value">{{ stats.defense }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Bạo kích:</span>
            <span class="stat-value">{{ stats.critChance }}%</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">ST Bạo kích:</span>
            <span class="stat-value">{{ stats.critDamage }}%</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Hút máu:</span>
            <span class="stat-value">{{ stats.lifesteal }}%</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Né tránh:</span>
            <span class="stat-value">{{ stats.dodge }}%</span>
          </div>
        </div>

        <!-- Achievements and Titles Section -->
        <div class="quick-access-section">
          <div class="section-title">[ Truy Cập Nhanh ]</div>
          <div class="quick-access-buttons">
            <button class="quick-access-button" @click="emit('openAchievements')">
              <span class="button-label">Thành Tựu</span>
            </button>
            <button class="quick-access-button" @click="emit('openTitles')">
              <span class="button-label">Danh Hiệu</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Items Tab -->
      <div v-if="activeTab === 'items'" class="tab-content inventory-content">
        <div class="inventory-section">
          <div class="section-title">[ Vật Phẩm ]</div>
          <div class="inventory-grid">
            <div
              v-for="(item, index) in regularItems"
              :key="index"
              class="inventory-slot"
              :class="{ 'has-item': item }"
              @click="item && handleItemClick(item)"
            >
              <div v-if="item" class="item-content">
                <div class="item-name">{{ item.name }}</div>
                <div v-if="item.quantity && item.quantity > 1" class="item-quantity">x{{ item.quantity }}</div>
              </div>
              <div v-else class="empty-slot">
                <span class="slot-number">{{ index + 1 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Equipment Tab -->
      <div v-if="activeTab === 'equipment'" class="tab-content inventory-content">
        <div class="inventory-section">
          <div class="section-title">[ Trang Bị ]</div>
          <div class="inventory-grid">
            <div
              v-for="(item, index) in equipmentItems"
              :key="index"
              class="inventory-slot"
              :class="{ 'has-item': item, 'equipped': item?.equipped }"
              @click="item && handleItemClick(item)"
            >
              <div v-if="item" class="item-content">
                <div class="item-name">{{ item.name }}</div>
                <div v-if="item.equipped" class="equipped-badge">[E]</div>
                <div v-if="item.quantity && item.quantity > 1" class="item-quantity">x{{ item.quantity }}</div>
              </div>
              <div v-else class="empty-slot">
                <span class="slot-number">{{ index + 1 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Skills Tab -->
      <div v-if="activeTab === 'skills'" class="tab-content skills-content">
        <div class="skills-container">
          <div class="skill-points-header">
            <strong>Điểm Kỹ Năng:</strong> {{ skillPoints || 0 }}
          </div>
          <div v-if="loading" class="loading-message">Đang tải...</div>
          <div v-else-if="skills.length === 0" class="empty-message">
            <strong>📚 Cách Học Kỹ Năng</strong>
            <br><br>
            Để học kỹ năng mới, hãy:<br>
            1️⃣ Mở Tab <strong>[5] Thiên Phú</strong> bên cạnh<br>
            2️⃣ Chọn một nhánh thiên phú phù hợp<br>
            3️⃣ Nâng cấp các thiên phú (cần điểm thiên phú)<br>
            4️⃣ Một số thiên phú sẽ <strong>mở khóa kỹ năng mới</strong>!
            <br><br>
            <small>💡 Bạn nhận điểm thiên phú mỗi khi lên cấp!</small>
          </div>
          <div v-else class="skills-grid">
            <div
              v-for="skill in skills"
              :key="skill.id"
              class="skill-card"
            >
              <div class="skill-name">
                {{ skill.name }}
                <span v-if="skill.upgradeLevel && skill.upgradeLevel > 1" class="skill-level">
                  Lv.{{ skill.upgradeLevel }}
                </span>
              </div>
              <div class="skill-description">{{ skill.description }}</div>
              <div class="skill-details">
                <div v-if="skill.damage" class="skill-stat">
                  Sát thương: {{ skill.damage }}
                </div>
                <div v-if="skill.resourceCost" class="skill-stat">
                  Chi phí: {{ skill.resourceCost }}
                </div>
                <div v-if="skill.cooldown" class="skill-stat">
                  Hồi chiêu: {{ skill.cooldown }}s
                </div>
              </div>
              <div class="skill-actions">
                <button
                  v-if="canUpgradeSkill(skill)"
                  class="btn-upgrade-skill"
                  @click.stop="$emit('upgradeSkill', skill._id)"
                >
                  ⬆️ Nâng Cấp ({{ skill.skillPointCost || 1 }}đ)
                </button>
                <button class="btn-use-skill" @click.stop="$emit('assignSkill', skill)">
                  Sử Dụng
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Talents Tab -->
      <div v-if="activeTab === 'talents'" class="tab-content talents-content">
        <div class="talents-container">
          <div class="talents-header">
            <div class="talent-points">
              Điểm Thiên Phú: <span class="points-value">{{ talentPoints }}</span>
            </div>
          </div>
          
          <div v-if="loading" class="loading-message">Đang tải...</div>
          <div v-else-if="branches.length === 0" class="empty-message">
            Chưa có thiên phú nào.
          </div>
          <div v-else class="talents-grid">
            <div
              v-for="branch in branches"
              :key="branch.id"
              class="talent-branch"
            >
              <div class="branch-name">{{ branch.name }}</div>
              <div class="branch-talents">
                <div
                  v-for="talent in branch.talents"
                  :key="talent.id"
                  class="talent-item"
                  :class="{ allocated: allocatedTalents[talent.id] > 0, maxed: allocatedTalents[talent.id] >= talent.maxRank }"
                  @click="$emit('allocateTalent', talent.id)"
                >
                  <div class="talent-name">{{ talent.name }}</div>
                  <div class="talent-rank">{{ allocatedTalents[talent.id] || 0 }}/{{ talent.maxRank }}</div>
                  <div class="talent-description">{{ talent.description }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </FullscreenOverlay>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import FullscreenOverlay from './FullscreenOverlay.vue';

interface Skill {
  id: string;
  name: string;
  description: string;
  damage?: number;
  resourceCost?: number;
  cooldown?: number;
}

interface Talent {
  id: string;
  name: string;
  description: string;
  maxRank: number;
}

interface TalentBranch {
  id: string;
  name: string;
  talents: Talent[];
}

interface Props {
  isOpen: boolean;
  playerName: string;
  level: number;
  exp: number;
  nextLevelExp: number;
  hp: number;
  maxHp: number;
  resource: number;
  maxResource: number;
  gold: number;
  premiumCurrency: number;
  profession?: string | null;
  stats: {
    damage: number;
    defense: number;
    critChance: number;
    critDamage: number;
    lifesteal: number;
    dodge: number;
  };
  skills: Skill[];
  branches: TalentBranch[];
  allocatedTalents: Record<string, number>;
  talentPoints: number;
  skillPoints?: number;
  inventoryItems: any[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  assignSkill: [skill: Skill];
  allocateTalent: [talentId: string];
  upgradeSkill: [skillId: string];
  openProfessionChoice: [];
  inventoryAction: [action: string, itemId: string];
  openAchievements: [];
  openTitles: [];
}>();

const activeTab = ref<'info' | 'items' | 'equipment' | 'skills' | 'talents'>('info');
const loading = ref(false);

// Get profession display name in Vietnamese
const professionDisplayName = computed(() => {
  if (!props.profession) return 'Lãng Khách';
  
  const professionNames: Record<string, string> = {
    'blacksmith': 'Thợ Rèn',
    'alchemist': 'Giả Kim Sư',
    'enchanter': 'Phù Phép Sư',
    'hunter': 'Thợ Săn',
    'miner': 'Thợ Mỏ',
    'herbalist': 'Dược Sư'
  };
  
  return professionNames[props.profession] || props.profession;
});

// Separate items into regular items and equipment
const regularItems = computed(() => {
  return props.inventoryItems.filter(item => {
    if (!item) return false;
    const type = item.type?.toLowerCase();
    return type !== 'weapon' && type !== 'armor' && type !== 'equipment';
  });
});

const equipmentItems = computed(() => {
  return props.inventoryItems.filter(item => {
    if (!item) return false;
    const type = item.type?.toLowerCase();
    return type === 'weapon' || type === 'armor' || type === 'equipment';
  });
});

// Handle inventory item click
const handleItemClick = (item: any) => {
  // Emit event to parent for handling item actions
  // This could open a contextual menu or execute an action
  emit('inventoryAction', 'use', item.id || item.name);
};

// Check if skill can be upgraded
const canUpgradeSkill = (skill: Skill): boolean => {
  const currentLevel = skill.upgradeLevel || 1;
  const maxLevel = skill.maxUpgradeLevel || 1;
  if (currentLevel >= maxLevel) return false;
  const upgradeCost = skill.skillPointCost || 1;
  return (props.skillPoints || 0) >= upgradeCost;
};
</script>

<style scoped>
.character-menu-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: var(--text-bright);
  font-family: 'VT323', 'Source Code Pro', monospace;
}

.tab-navigation {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-bottom: 1px solid rgba(0, 136, 0, 0.5);
  background-color: rgba(0, 136, 0, 0.05);
}

.tab-button {
  flex: 1;
  padding: 0.75rem 1rem;
  background: transparent;
  color: var(--text-bright);
  border: 1px solid rgba(0, 136, 0, 0.3);
  cursor: pointer;
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 18px;
  transition: all 0.2s;
}

.tab-button:hover {
  background-color: rgba(0, 255, 0, 0.1);
  color: var(--text-accent);
  border-color: var(--text-accent);
}

.tab-button.active {
  background-color: rgba(0, 255, 0, 0.15);
  color: var(--text-accent);
  border-color: var(--text-accent);
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

/* Mobile & Tablet optimizations for tab-content */
@media (max-width: 1024px) {
  .tab-content {
    padding: 1rem;
  }
}

@media (max-width: 768px) {
  .tab-content {
    padding: 0.75rem;
  }
}

@media (max-width: 480px) {
  .tab-content {
    padding: 0.5rem;
  }
}

/* Info Tab Styles */
.info-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.info-section, .stats-section {
  background-color: rgba(0, 136, 0, 0.03);
  border: 1px solid rgba(0, 136, 0, 0.3);
  padding: 1rem;
}

/* Mobile & Tablet optimizations for sections */
@media (max-width: 768px) {
  .info-section, .stats-section {
    padding: 0.75rem;
  }
}

@media (max-width: 480px) {
  .info-section, .stats-section {
    padding: 0.5rem;
  }
}

.section-title {
  color: var(--text-accent);
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(0, 136, 0, 0.3);
}

.info-row, .stat-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(0, 136, 0, 0.1);
}

.info-row:last-child, .stat-row:last-child {
  border-bottom: none;
}

.info-label, .stat-label {
  color: var(--text-dim);
  font-size: 16px;
}

.info-value, .stat-value {
  color: var(--text-bright);
  font-size: 16px;
  font-weight: bold;
}

/* Profession CTA Styles */
.profession-cta-section {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background-color: rgba(255, 176, 0, 0.1);
  border: 2px solid #ffb000;
  text-align: center;
}

.profession-cta-button {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #ffb000 0%, #ff8800 100%);
  border: 2px solid #ffd700;
  color: #000000;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  font-family: 'VT323', 'Source Code Pro', monospace;
  transition: all 0.3s;
  margin-bottom: 0.75rem;
  animation: pulse 2s ease-in-out infinite;
}

.profession-cta-button:hover {
  background: linear-gradient(135deg, #ffd700 0%, #ffb000 100%);
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(255, 176, 0, 0.6);
}

.cta-icon {
  display: inline-block;
  animation: bounce 1s ease-in-out infinite;
}

.cta-message {
  color: #ffb000;
  font-size: 16px;
  margin: 0;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 10px rgba(255, 176, 0, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(255, 176, 0, 0.8);
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

/* Quick Access Section Styles */
.quick-access-section {
  background-color: rgba(0, 136, 0, 0.03);
  border: 1px solid rgba(0, 136, 0, 0.3);
  padding: 1rem;
}

.quick-access-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 1rem;
}

.quick-access-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background-color: rgba(0, 136, 0, 0.05);
  border: 1px solid rgba(0, 136, 0, 0.4);
  color: var(--text-bright);
  cursor: pointer;
  font-family: 'VT323', 'Source Code Pro', monospace;
  transition: all 0.3s;
}

.quick-access-button:hover {
  background-color: rgba(0, 255, 0, 0.1);
  border-color: var(--text-accent);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 255, 0, 0.2);
}

.button-icon {
  font-size: 32px;
  filter: grayscale(30%);
  transition: filter 0.3s;
}

.quick-access-button:hover .button-icon {
  filter: grayscale(0%);
}

.button-label {
  font-size: 16px;
  font-weight: bold;
  text-align: center;
}

/* Skills Tab Styles */
.skills-container {
  width: 100%;
}

.skill-points-header {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background-color: rgba(0, 136, 0, 0.1);
  border: 1px solid rgba(0, 136, 0, 0.3);
  text-align: center;
  color: var(--text-accent);
  font-size: 18px;
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.skill-card {
  background-color: rgba(0, 136, 0, 0.03);
  border: 1px solid rgba(0, 136, 0, 0.3);
  padding: 1rem;
  transition: all 0.2s;
}

.skill-card:hover {
  background-color: rgba(0, 255, 0, 0.1);
  border-color: var(--text-accent);
}

.skill-name {
  color: var(--text-accent);
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.skill-level {
  font-size: 14px;
  color: var(--text-bright);
  background: rgba(0, 136, 0, 0.2);
  padding: 0.2rem 0.5rem;
  border-radius: 3px;
}

.skill-description {
  color: var(--text-dim);
  font-size: 14px;
  margin-bottom: 0.5rem;
}

.skill-details {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(0, 136, 0, 0.2);
}

.skill-stat {
  color: var(--text-bright);
  font-size: 14px;
  margin-bottom: 0.25rem;
}

.skill-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.btn-upgrade-skill,
.btn-use-skill {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid var(--text-accent);
  background: transparent;
  color: var(--text-accent);
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  font-size: 14px;
}

.btn-upgrade-skill {
  background: rgba(0, 136, 0, 0.2);
}

.btn-upgrade-skill:hover,
.btn-use-skill:hover {
  background: var(--text-accent);
  color: #000;
}

/* Talents Tab Styles */
.talents-container {
  width: 100%;
}

.talents-header {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: rgba(0, 136, 0, 0.05);
  border: 1px solid rgba(0, 136, 0, 0.3);
}

.talent-points {
  color: var(--text-accent);
  font-size: 20px;
  font-weight: bold;
}

.points-value {
  color: var(--text-bright);
}

.talents-grid {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.talent-branch {
  background-color: rgba(0, 136, 0, 0.03);
  border: 1px solid rgba(0, 136, 0, 0.3);
  padding: 1rem;
}

.branch-name {
  color: var(--text-accent);
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(0, 136, 0, 0.3);
}

.branch-talents {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.talent-item {
  background-color: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(0, 136, 0, 0.3);
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.talent-item:hover {
  background-color: rgba(0, 255, 0, 0.05);
  border-color: var(--text-accent);
}

.talent-item.allocated {
  background-color: rgba(0, 255, 0, 0.1);
  border-color: var(--text-bright);
}

.talent-item.maxed {
  background-color: rgba(0, 255, 0, 0.15);
  border-color: var(--text-accent);
}

.talent-name {
  color: var(--text-bright);
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.talent-rank {
  color: var(--text-accent);
  font-size: 14px;
  margin-bottom: 0.5rem;
}

.talent-description {
  color: var(--text-dim);
  font-size: 14px;
}

/* Inventory Tab Styles */
.inventory-section {
  width: 100%;
}

.inventory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.75rem;
}

.inventory-slot {
  aspect-ratio: 1;
  background-color: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 136, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  padding: 0.5rem;
}

.inventory-slot.has-item {
  background-color: rgba(0, 136, 0, 0.05);
  border-color: rgba(0, 136, 0, 0.5);
}

.inventory-slot.has-item:hover {
  background-color: rgba(0, 255, 0, 0.1);
  border-color: var(--text-accent);
  transform: scale(1.05);
}

.inventory-slot.equipped {
  background-color: rgba(255, 176, 0, 0.1);
  border-color: var(--text-accent);
  box-shadow: 0 0 10px rgba(255, 176, 0, 0.3);
}

.item-content {
  text-align: center;
  width: 100%;
}

.item-name {
  color: var(--text-bright);
  font-size: 14px;
  font-weight: bold;
  word-wrap: break-word;
  line-height: 1.2;
}

.item-quantity {
  color: var(--text-accent);
  font-size: 12px;
  margin-top: 0.25rem;
}

.equipped-badge {
  color: var(--text-accent);
  font-size: 11px;
  font-weight: bold;
  margin-top: 0.15rem;
  text-shadow: 0 0 5px rgba(255, 176, 0, 0.5);
}

.empty-slot {
  color: var(--text-dim);
  opacity: 0.3;
}

.slot-number {
  font-size: 12px;
}

.loading-message, .empty-message {
  text-align: center;
  color: var(--text-dim);
  font-size: 18px;
  padding: 2rem;
}

/* Mobile responsiveness */
@media (max-width: 1024px) {
  .tab-navigation {
    padding: 0.75rem;
    gap: 0.375rem;
  }
  
  .tab-button {
    padding: 0.625rem 0.875rem;
  }
  
  .skill-card, .talent-branch, .talent-item {
    padding: 0.75rem;
  }
  
  .talents-header {
    padding: 0.75rem;
  }
}

@media (max-width: 768px) {
  .tab-navigation {
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.5rem;
  }
  
  .tab-button {
    font-size: 16px;
    padding: 0.5rem 0.75rem;
  }
  
  .skills-grid, .branch-talents {
    grid-template-columns: 1fr;
  }

  .inventory-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 0.5rem;
  }

  .item-name {
    font-size: 12px;
  }
  
  .skill-card, .talent-branch, .talent-item {
    padding: 0.625rem;
  }
  
  .talents-header {
    padding: 0.625rem;
  }
  
  .inventory-slot {
    padding: 0.375rem;
  }
  
  .profession-cta-section {
    padding: 1rem;
  }
  
  .quick-access-section {
    padding: 0.75rem;
  }

  .quick-access-buttons {
    gap: 0.75rem;
  }

  .button-icon {
    font-size: 28px;
  }

  .button-label {
    font-size: 14px;
  }
  
  .info-content {
    gap: 1rem;
  }
  
  .talents-grid {
    gap: 1rem;
  }
}

@media (max-width: 480px) {
  .tab-navigation {
    padding: 0.375rem;
  }
  
  .tab-button {
    padding: 0.375rem 0.5rem;
    font-size: 14px;
  }
  
  .skill-card, .talent-branch, .talent-item {
    padding: 0.5rem;
  }
  
  .talents-header {
    padding: 0.5rem;
  }
  
  .inventory-slot {
    padding: 0.25rem;
  }
  
  .profession-cta-section {
    padding: 0.75rem;
  }
  
  .profession-cta-button {
    padding: 0.75rem;
    font-size: 18px;
  }
  
  .quick-access-section {
    padding: 0.5rem;
  }

  .quick-access-buttons {
    gap: 0.5rem;
    grid-template-columns: 1fr;
  }

  .quick-access-button {
    padding: 0.75rem;
  }

  .button-icon {
    font-size: 24px;
  }

  .button-label {
    font-size: 13px;
  }
  
  .info-content {
    gap: 0.75rem;
  }
  
  .talents-grid {
    gap: 0.75rem;
  }
  
  .inventory-grid {
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
    gap: 0.375rem;
  }
}
</style>
