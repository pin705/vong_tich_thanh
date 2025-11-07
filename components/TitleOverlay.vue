<template>
  <FullscreenOverlay :isOpen="isOpen" title="DANH HIỆU" size="medium" @close="close">
    <div class="title-container">
      <div v-if="loading" class="loading">Đang tải...</div>

      <div v-else-if="titles.length === 0" class="no-titles">
        Bạn chưa mở khóa danh hiệu nào. Hoàn thành thành tựu để nhận danh hiệu!
      </div>

      <div v-else class="title-list">
        <div
          v-for="title in titles"
          :key="title.key"
          :class="['title-card', { active: title.key === activeTitleKey }]"
          @click="equipTitle(title.key)"
        >
          <div class="title-header">
            <div class="title-name">{{ title.name }}</div>
            <div v-if="title.key === activeTitleKey" class="equipped-badge">
              ✓ Đang trang bị
            </div>
          </div>

          <div v-if="title.stats" class="title-stats">
            <span v-if="title.stats.hp" class="stat">+{{ title.stats.hp }} HP</span>
            <span v-if="title.stats.attack" class="stat">+{{ title.stats.attack }} Tấn Công</span>
            <span v-if="title.stats.defense" class="stat">+{{ title.stats.defense }} Phòng Thủ</span>
            <span v-if="title.stats.critChance" class="stat">+{{ title.stats.critChance }}% Chí Mạng</span>
            <span v-if="title.stats.critDamage" class="stat">+{{ title.stats.critDamage }}% Sát Thương CM</span>
            <span v-if="title.stats.dodge" class="stat">+{{ title.stats.dodge }}% Né Tránh</span>
            <span v-if="title.stats.lifesteal" class="stat">+{{ title.stats.lifesteal }}% Hút Máu</span>
          </div>

          <div class="title-hint">
            Nhấn để {{ title.key === activeTitleKey ? 'tháo' : 'trang bị' }}
          </div>
        </div>
      </div>

      <div v-if="message" :class="['message', messageType]">
        {{ message }}
      </div>
    </div>
  </FullscreenOverlay>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import FullscreenOverlay from './FullscreenOverlay.vue';

interface Props {
  isOpen: boolean;
  playerState?: any;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  refresh: [];
}>();

const titles = ref<any[]>([]);
const activeTitleKey = ref<string | null>(null);
const loading = ref(true);
const message = ref('');
const messageType = ref('success');

const close = () => {
  emit('close');
};

const fetchTitles = async () => {
  loading.value = true;
  try {
    // Get player info which includes unlockedTitles and activeTitleKey
    const response = await $fetch('/api/player/info', {
      method: 'GET',
    });

    if (response.success && response.player) {
      titles.value = response.player.unlockedTitles || [];
      activeTitleKey.value = response.player.activeTitleKey || null;
    }
  } catch (error) {
    console.error('Error fetching titles:', error);
    message.value = 'Lỗi khi tải danh hiệu.';
    messageType.value = 'error';
  } finally {
    loading.value = false;
  }
};

const equipTitle = async (titleKey: string) => {
  // If clicking on active title, unequip it
  const newTitleKey = titleKey === activeTitleKey.value ? null : titleKey;

  try {
    const response = await $fetch('/api/player/equip-title', {
      method: 'POST',
      body: { titleKey: newTitleKey },
    });

    if (response.success) {
      activeTitleKey.value = response.activeTitleKey;
      message.value = response.message;
      messageType.value = 'success';
      
      // Emit refresh event to update player state
      emit('refresh');
      
      // Clear message after 3 seconds
      setTimeout(() => {
        message.value = '';
      }, 3000);
    } else {
      message.value = response.message || 'Lỗi khi trang bị danh hiệu.';
      messageType.value = 'error';
    }
  } catch (error) {
    console.error('Error equipping title:', error);
    message.value = 'Lỗi khi trang bị danh hiệu.';
    messageType.value = 'error';
  }
};

onMounted(() => {
  if (props.isOpen) {
    fetchTitles();
  }
});

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    fetchTitles();
    message.value = '';
  }
});
</script>

<style scoped>
.title-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 300px;
}

.loading,
.no-titles {
  text-align: center;
  color: var(--text-dim);
  padding: 2rem;
  font-size: 16px;
}

.title-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.title-card {
  background: rgba(0, 136, 0, 0.1);
  border: 2px solid var(--text-dim);
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.title-card:hover {
  border-color: var(--text-bright);
  background: rgba(0, 136, 0, 0.15);
}

.title-card.active {
  border-color: var(--text-accent);
  background: rgba(0, 255, 0, 0.2);
}

.title-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-name {
  color: var(--text-accent);
  font-size: 20px;
  font-weight: bold;
}

.equipped-badge {
  color: var(--text-accent);
  font-size: 14px;
  background: rgba(0, 255, 0, 0.2);
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--text-accent);
}

.title-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.stat {
  background: rgba(0, 136, 0, 0.2);
  border: 1px solid var(--text-dim);
  padding: 0.25rem 0.5rem;
  font-size: 14px;
  color: var(--text-bright);
}

.title-hint {
  color: var(--text-dim);
  font-size: 12px;
  font-style: italic;
}

.message {
  padding: 1rem;
  border: 2px solid;
  text-align: center;
  font-size: 16px;
}

.message.success {
  border-color: var(--text-accent);
  color: var(--text-accent);
  background: rgba(0, 255, 0, 0.1);
}

.message.error {
  border-color: var(--text-danger);
  color: var(--text-danger);
  background: rgba(255, 0, 0, 0.1);
}
</style>
