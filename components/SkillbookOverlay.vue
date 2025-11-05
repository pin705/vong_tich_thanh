<template>
  <FullscreenOverlay :isOpen="isOpen" @close="$emit('close')">
    <div class="skillbook-container">
      <!-- Header -->
      <div class="skillbook-header">
        <h2>SỔ KỸ NĂNG</h2>
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
          </div>
          <div 
            v-for="(skill, index) in activeSkills" 
            :key="skill._id"
            class="skill-item"
            @click="selectSkill(skill)"
          >
            <div class="skill-number">[{{ index + 1 }}]</div>
            <div class="skill-info">
              <div class="skill-name">{{ skill.name }}</div>
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
          </div>
          <div 
            v-for="skill in passiveSkills" 
            :key="skill._id"
            class="skill-item passive"
            @click="selectSkill(skill)"
          >
            <div class="skill-number">[P]</div>
            <div class="skill-info">
              <div class="skill-name">{{ skill.name }}</div>
              <div class="skill-description-short">{{ skill.description }}</div>
            </div>
          </div>
        </div>

        <!-- Skill Detail Panel -->
        <div v-if="selectedSkill" class="skill-detail">
          <div class="skill-detail-header">{{ selectedSkill.name }}</div>
          <div class="skill-detail-body">
            <p>{{ selectedSkill.description }}</p>
            <div class="skill-stats">
              <div v-if="selectedSkill.resourceCost > 0">
                <strong>Tài nguyên:</strong> {{ selectedSkill.resourceCost }} {{ getResourceName() }}
              </div>
              <div v-if="selectedSkill.cooldown > 0">
                <strong>Thời gian hồi:</strong> {{ selectedSkill.cooldown }} giây
              </div>
              <div v-if="selectedSkill.damage > 0">
                <strong>Sát thương:</strong> {{ selectedSkill.damage }}
              </div>
              <div v-if="selectedSkill.healing > 0">
                <strong>Hồi máu:</strong> {{ selectedSkill.healing }}
              </div>
            </div>
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
}

const props = defineProps<Props>();
const emit = defineEmits(['close', 'assignSkill']);

const activeTab = ref<'active' | 'passive'>('active');
const selectedSkill = ref<Skill | null>(null);

const activeSkills = computed(() => {
  return props.skills.filter(s => s.type === 'active');
});

const passiveSkills = computed(() => {
  return props.skills.filter(s => s.type === 'passive');
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

function assignToHotkey() {
  if (selectedSkill.value) {
    emit('assignSkill', selectedSkill.value);
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
  margin-bottom: 1rem;
  color: #00ff00;
  text-align: center;
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
  width: 100%;
  transition: all 0.2s;
}

.action-button:hover {
  background: #00ff00;
  transform: scale(1.02);
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
</style>
