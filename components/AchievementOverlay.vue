<template>
  <FullscreenOverlay :isOpen="isOpen" title="THÀNH TỰU" @close="close">
    <div class="achievement-container">
      <!-- Tabs -->
      <div class="tabs">
        <button
          v-for="category in categories"
          :key="category.key"
          :class="['tab', { active: activeTab === category.key }]"
          @click="activeTab = category.key"
        >
          {{ category.label }}
        </button>
      </div>

      <!-- Achievement List -->
      <div class="achievement-list">
        <div
          v-for="achievement in filteredAchievements"
          :key="achievement.achievementKey"
          :class="['achievement-card', { completed: achievement.completed }]"
        >
          <div class="achievement-header">
            <div class="achievement-name">
              <span v-if="achievement.completed" class="check-icon">✓</span>
              {{ achievement.name }}
            </div>
            <div class="achievement-progress">
              {{ achievement.progress }} / {{ achievement.target }}
            </div>
          </div>

          <div class="achievement-description">
            {{ achievement.description }}
          </div>

          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: progressPercentage(achievement) + '%' }"
            ></div>
          </div>

          <!-- Rewards -->
          <div v-if="achievement.rewards" class="rewards">
            <span v-if="achievement.rewards.exp" class="reward">
              +{{ achievement.rewards.exp }} EXP
            </span>
            <span v-if="achievement.rewards.gold" class="reward">
              +{{ achievement.rewards.gold }} vàng
            </span>
            <span v-if="achievement.rewards.title" class="reward title-reward">
              Danh hiệu: {{ achievement.rewards.title.name }}
            </span>
          </div>
        </div>

        <div v-if="filteredAchievements.length === 0" class="no-achievements">
          Chưa có thành tựu nào trong danh mục này.
        </div>
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

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
}>();

const activeTab = ref<string>('COMBAT');
const achievements = ref<any>({
  COMBAT: [],
  EXPLORATION: [],
  SOCIAL: [],
  COLLECTION: [],
});

const categories = [
  { key: 'COMBAT', label: 'Chiến Đấu' },
  { key: 'EXPLORATION', label: 'Khám Phá' },
  { key: 'SOCIAL', label: 'Xã Hội' },
  { key: 'COLLECTION', label: 'Sưu Tập' },
];

const filteredAchievements = computed(() => {
  return achievements.value[activeTab.value] || [];
});

const progressPercentage = (achievement: any) => {
  if (achievement.target === 0) return 0;
  return Math.min(100, Math.floor((achievement.progress / achievement.target) * 100));
};

const close = () => {
  emit('close');
};

const fetchAchievements = async () => {
  try {
    const response = await $fetch('/api/player/achievements', {
      method: 'GET',
    });

    if (response.success) {
      achievements.value = response.achievements;
    }
  } catch (error) {
    console.error('Error fetching achievements:', error);
  }
};

onMounted(() => {
  if (props.isOpen) {
    fetchAchievements();
  }
});

// Refetch when opened
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    fetchAchievements();
  }
});
</script>

<style scoped>
.achievement-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid var(--text-dim);
  padding-bottom: 0.5rem;
}

.tab {
  background: transparent;
  color: var(--text-dim);
  border: 1px solid var(--text-dim);
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 16px;
}

.tab:hover {
  color: var(--text-bright);
  border-color: var(--text-bright);
}

.tab.active {
  background: var(--text-accent);
  color: var(--bg-black);
  border-color: var(--text-accent);
}

.achievement-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.achievement-card {
  background: rgba(0, 136, 0, 0.1);
  border: 1px solid var(--text-dim);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: all 0.2s;
}

.achievement-card.completed {
  border-color: var(--text-accent);
  background: rgba(0, 255, 0, 0.15);
}

.achievement-card:hover {
  border-color: var(--text-bright);
}

.achievement-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.achievement-name {
  color: var(--text-accent);
  font-size: 18px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.check-icon {
  color: var(--text-accent);
  font-size: 20px;
}

.achievement-progress {
  color: var(--text-bright);
  font-size: 16px;
}

.achievement-description {
  color: var(--text-dim);
  font-size: 14px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--bg-black);
  border: 1px solid var(--text-dim);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--text-accent);
  transition: width 0.3s;
}

.rewards {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.reward {
  background: rgba(0, 136, 0, 0.2);
  border: 1px solid var(--text-dim);
  padding: 0.25rem 0.5rem;
  font-size: 12px;
  color: var(--text-bright);
}

.title-reward {
  border-color: var(--text-accent);
  color: var(--text-accent);
}

.no-achievements {
  text-align: center;
  color: var(--text-dim);
  padding: 2rem;
  font-size: 16px;
}

/* Scrollbar */
.achievement-list::-webkit-scrollbar {
  width: 10px;
}

.achievement-list::-webkit-scrollbar-track {
  background: var(--bg-black);
}

.achievement-list::-webkit-scrollbar-thumb {
  background: var(--text-dim);
  border: 2px solid var(--bg-black);
}

.achievement-list::-webkit-scrollbar-thumb:hover {
  background: var(--text-bright);
}
</style>
