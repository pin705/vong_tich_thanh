<template>
  <FullscreenOverlay :isOpen="isOpen" @close="$emit('close')" title="Sổ Kỹ Năng">
    <div class="skillbook-container">
      <!-- Header -->
      <div class="skillbook-header">
        <h2>SỔ KỸ NĂNG</h2>
        <div class="skill-points-display">Điểm Kỹ Năng: {{ skillPoints || 0 }}</div>
        <div class="tab-bar">
          <button 
            :class="['tab-button', { active: activeTab === 'active' }]"
            @click="activeTab = 'active'"
          >
            [Kỹ Năng Chủ Động]
          </button>
          <button 
            :class="['tab-button', { active: activeTab === 'passive' }]"
            @click="activeTab = 'passive'"
          >
            [Kỹ Năng Bị Động]
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="skillbook-content">
        <div v-if="activeTab === 'active'" class="skills-list">
          <div v-if="activeSkills.length === 0" class="empty-message">
            Bạn chưa có kỹ năng chủ động nào.
            <br><br>
            <small>💡 Chọn nghề nghiệp (cấp 5) và nâng thiên phú (cấp 10) để mở khóa kỹ năng!</small>
          </div>
          <div 
            v-for="(skill, index) in activeSkills" 
            :key="skill._id"
            class="skill-item"
            @click="selectSkill(skill)"
          >
            <div class="skill-number">[{{ index + 1 }}]</div>
            <div class="skill-info">
              <div class="skill-name">
                {{ skill.name }}
                <span v-if="skill.upgradeLevel && skill.upgradeLevel > 1" class="skill-level">
                  Lv.{{ skill.upgradeLevel }}
                </span>
              </div>
              <div class="skill-cost">
                {{ skill.resourceCost }} {{ getResourceName() }}
                <span v-if="skill.cooldown > 0"> | CD: {{ skill.cooldown }}s</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="skills-list">
          <div v-if="passiveSkills.length === 0" class="empty-message">
            Bạn chưa có kỹ năng bị động nào.
            <br><br>
            <small>💡 Chọn nghề nghiệp (cấp 5) và nâng thiên phú (cấp 10) để mở khóa kỹ năng!</small>
          </div>
          <div 
            v-for="skill in passiveSkills" 
            :key="skill._id"
            class="skill-item passive"
            @click="selectSkill(skill)"
          >
            <div class="skill-number">[P]</div>
            <div class="skill-info">
              <div class="skill-name">
                {{ skill.name }}
                <span v-if="skill.upgradeLevel && skill.upgradeLevel > 1" class="skill-level">
                  Lv.{{ skill.upgradeLevel }}
                </span>
              </div>
              <div class="skill-description-short">{{ skill.description }}</div>
            </div>
          </div>
        </div>

        <!-- Skill Detail Panel -->
        <div v-if="selectedSkill" class="skill-detail">
          <div class="skill-detail-header">
            {{ selectedSkill.name }}
            <span v-if="selectedSkill.upgradeLevel && selectedSkill.upgradeLevel > 1" class="skill-level-badge">
              Level {{ selectedSkill.upgradeLevel }}
            </span>
          </div>
          <div class="skill-detail-body">
            <p>{{ selectedSkill.description }}</p>
            <div class="skill-stats">
              <div v-if="selectedSkill.resourceCost && selectedSkill.resourceCost > 0">
                <strong>Tài nguyên:</strong> {{ selectedSkill.resourceCost }} {{ getResourceName() }}
              </div>
              <div v-if="selectedSkill.cooldown && selectedSkill.cooldown > 0">
                <strong>Thời gian hồi:</strong> {{ selectedSkill.cooldown }} giây
              </div>
              <div v-if="selectedSkill.damage && selectedSkill.damage > 0">
                <strong>Sát thương:</strong> {{ selectedSkill.damage }}
              </div>
              <div v-if="selectedSkill.healing && selectedSkill.healing > 0">
                <strong>Hồi máu:</strong> {{ selectedSkill.healing }}
              </div>
              <div v-if="selectedSkill.targetType">
                <strong>Loại mục tiêu:</strong> {{ getTargetTypeName(selectedSkill.targetType) }}
              </div>
              <div v-if="selectedSkill.range && selectedSkill.range > 1">
                <strong>Tầm xa:</strong> {{ selectedSkill.range }}
              </div>
              <div v-if="selectedSkill.tier">
                <strong>Cấp độ kỹ năng:</strong> {{ selectedSkill.tier }}
              </div>
            </div>
            <div class="action-buttons">
              <button 
                v-if="canUpgrade(selectedSkill)"
                class="action-button upgrade-button"
                @click="upgradeSkill"
              >
                [⬆️ Nâng Cấp] ({{ selectedSkill.skillPointCost || 1 }} điểm)
              </button>
              <button 
                v-if="selectedSkill.type === 'active'"
                class="action-button"
                @click="assignToHotkey"
              >
                [Gán Lên Phím Tắt]
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="skillbook-footer">
        <div class="hint">Nhấn ESC để đóng</div>
      </div>
    </div>
  </FullscreenOverlay>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Skill } from '~/types';
import FullscreenOverlay from './FullscreenOverlay.vue';

interface Props {
  isOpen: boolean;
  skills: Skill[];
  playerClass?: string;
  skillPoints?: number;
}

const props = defineProps<Props>();
const emit = defineEmits(['close', 'assignSkill', 'skillUpgraded']);

const activeTab = ref<'active' | 'passive'>('active');
const selectedSkill = ref<Skill | null>(null);

// Get player's learned skills with upgrade levels
const learnedSkillLevels = ref<Record<string, number>>({});

const activeSkills = computed(() => {
  return props.skills.filter(s => s.type === 'active').map(s => ({
    ...s,
    upgradeLevel: learnedSkillLevels.value[s._id] || 1,
  }));
});

const passiveSkills = computed(() => {
  return props.skills.filter(s => s.type === 'passive').map(s => ({
    ...s,
    upgradeLevel: learnedSkillLevels.value[s._id] || 1,
  }));
});

function selectSkill(skill: Skill) {
  selectedSkill.value = skill;
}

function getResourceName(): string {
  const resourceNames: Record<string, string> = {
    mutant_warrior: 'Nộ',
    rune_historian: 'Mana',
    stalker: 'Năng Lượng',
    scrap_engineer: 'Linh Kiện',
  };
  return resourceNames[props.playerClass || ''] || 'Tài Nguyên';
}

function getTargetTypeName(targetType: string): string {
  const targetTypeNames: Record<string, string> = {
    self: 'Bản Thân',
    single: 'Đơn Mục Tiêu',
    area: 'Vùng',
    cone: 'Hình Nón',
    line: 'Tuyến Thẳng',
  };
  return targetTypeNames[targetType] || targetType;
}

function assignToHotkey() {
  if (selectedSkill.value) {
    emit('assignSkill', selectedSkill.value);
  }
}

function canUpgrade(skill: Skill | null): boolean {
  if (!skill) return false;
  const currentLevel = learnedSkillLevels.value[skill._id] || 1;
  const maxLevel = skill.maxUpgradeLevel || 1;
  if (currentLevel >= maxLevel) return false;
  const upgradeCost = skill.skillPointCost || 1;
  return (props.skillPoints || 0) >= upgradeCost;
}

async function upgradeSkill() {
  if (!selectedSkill.value) return;
  
  try {
    const response = await $fetch('/api/player/skills/upgrade', {
      method: 'POST',
      body: { skillId: selectedSkill.value._id }
    });
    
    if (response.success) {
      // Update local skill level
      learnedSkillLevels.value[selectedSkill.value._id] = response.newLevel;
      // Emit event to update skill points in parent
      emit('skillUpgraded', {
        skillId: selectedSkill.value._id,
        newLevel: response.newLevel,
        skillPoints: response.skillPoints
      });
      // Show success message
      alert(response.message || 'Nâng cấp kỹ năng thành công!');
    }
  } catch (error: any) {
    console.error('Error upgrading skill:', error);
    const errorMsg = error.data?.message || error.message || 'Không thể nâng cấp kỹ năng.';
    alert(errorMsg);
  }
}
</script>

<style scoped>
.skillbook-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: #00ff00;
  font-family: 'VT323', 'Source Code Pro', monospace;
}

.skillbook-header {
  padding: 1rem;
  border-bottom: 1px solid #008800;
}

.skillbook-header h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: #00ff00;
  text-align: center;
}

.skill-points-display {
  text-align: center;
  font-size: 1.2rem;
  color: #00ff00;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: rgba(0, 136, 0, 0.1);
  border: 1px solid #008800;
}

.tab-bar {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.tab-button {
  background: transparent;
  border: 1px solid #008800;
  color: #008800;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 1.1rem;
  transition: all 0.2s;
}

.tab-button:hover {
  background: rgba(0, 136, 0, 0.2);
}

.tab-button.active {
  background: #008800;
  color: #000000;
  border-color: #00ff00;
}

.skillbook-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  overflow-y: auto;
}

.skills-list {
  border: 1px solid #008800;
  padding: 1rem;
  overflow-y: auto;
}

.empty-message {
  color: #008800;
  font-style: italic;
  text-align: center;
  padding: 2rem;
}

.skill-item {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid #008800;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.skill-item:hover {
  background: rgba(0, 255, 0, 0.1);
  border-color: #00ff00;
}

.skill-item.passive {
  border-color: #00aaaa;
}

.skill-number {
  font-weight: bold;
  color: #ffb000;
  min-width: 2rem;
}

.skill-info {
  flex: 1;
}

.skill-name {
  font-weight: bold;
  color: #00ff00;
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.skill-level {
  color: #ffb000;
  font-size: 0.85rem;
  padding: 0.1rem 0.3rem;
  border: 1px solid #ffb000;
  background: rgba(255, 176, 0, 0.1);
}

.skill-level-badge {
  color: #ffb000;
  font-size: 0.9rem;
  padding: 0.2rem 0.5rem;
  border: 1px solid #ffb000;
  background: rgba(255, 176, 0, 0.1);
  margin-left: auto;
}

.skill-cost,
.skill-description-short {
  font-size: 0.9rem;
  color: #00aaaa;
}

.skill-detail {
  border: 1px solid #00ff00;
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.skill-detail-header {
  font-size: 1.3rem;
  font-weight: bold;
  color: #ffb000;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #008800;
}

.skill-detail-body {
  flex: 1;
}

.skill-detail-body p {
  margin-bottom: 1rem;
  line-height: 1.5;
}

.skill-stats {
  background: rgba(0, 136, 0, 0.2);
  padding: 1rem;
  margin-bottom: 1rem;
}

.skill-stats > div {
  margin-bottom: 0.5rem;
}

.skill-stats strong {
  color: #ffb000;
}

.action-button {
  background: #008800;
  border: 1px solid #00ff00;
  color: #000000;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 1.1rem;
  font-weight: bold;
  transition: all 0.2s;
}

.action-button:hover {
  background: #00ff00;
  transform: scale(1.02);
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.action-buttons .action-button {
  flex: 1;
  min-width: 200px;
}

.upgrade-button {
  background: #006600;
  border-color: #00cc00;
}

.upgrade-button:hover {
  background: #00cc00;
}

.skillbook-footer {
  padding: 1rem;
  border-top: 1px solid #008800;
  text-align: center;
}

.hint {
  color: #008800;
  font-size: 0.9rem;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .skillbook-header h2 {
    font-size: 1.2rem;
    margin-bottom: 0.75rem;
  }

  .tab-bar {
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .tab-button {
    padding: 0.4rem 0.75rem;
    font-size: 0.95rem;
    flex: 1;
    min-width: 0;
  }

  .skillbook-content {
    grid-template-columns: 1fr;
    gap: 0.75rem;
    padding: 0.5rem;
  }

  .skills-list {
    padding: 0.75rem;
    max-height: 40vh;
  }

  .skill-item {
    padding: 0.6rem;
    margin-bottom: 0.4rem;
  }

  .skill-number {
    min-width: 1.5rem;
    font-size: 0.9rem;
  }

  .skill-name {
    font-size: 0.95rem;
  }

  .skill-cost,
  .skill-description-short {
    font-size: 0.85rem;
  }

  .skill-detail {
    padding: 0.75rem;
    max-height: 40vh;
    overflow-y: auto;
  }

  .skill-detail-header {
    font-size: 1.1rem;
  }

  .skill-detail-body p {
    font-size: 0.9rem;
  }

  .skill-stats {
    padding: 0.75rem;
    font-size: 0.9rem;
  }

  .action-button {
    padding: 0.6rem 1rem;
    font-size: 0.95rem;
  }

  .skillbook-footer {
    padding: 0.75rem;
  }

  .hint {
    font-size: 0.8rem;
  }
}
</style>
