<template>
  <div class="footer-tab-bar">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      class="tab-button"
      :class="{ active: activeTab === tab.id }"
      @click="handleTabClick(tab.id)"
    >
      {{ tab.label }}
      <span v-if="tab.id === 'mail' && hasUnreadMail" class="unread-indicator">[!]</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Tab {
  id: string;
  label: string;
}

interface Props {
  hasUnreadMail?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  hasUnreadMail: false
});

const tabs: Tab[] = [
  { id: 'map', label: '[Bản Đồ]' },
  { id: 'occupants', label: '[Xung Quanh]' },
  { id: 'character', label: '[Nhân Vật]' },
  { id: 'party', label: '[Nhóm]' },
  { id: 'guild', label: '[Bang Hội]' },
  { id: 'mail', label: '[Thư]' },
  { id: 'auction', label: '[Chợ]' },
  { id: 'quests', label: '[Nhiệm Vụ]' },
  { id: 'settings', label: '[Cài Đặt]' }
];

const emit = defineEmits<{
  tabClick: [tabId: string];
}>();

const activeTab = ref<string | null>(null);

const handleTabClick = (tabId: string) => {
  activeTab.value = tabId;
  emit('tabClick', tabId);
  // Reset active state after a short delay
  setTimeout(() => {
    activeTab.value = null;
  }, 300);
};
</script>

<style scoped>
.footer-tab-bar {
  display: flex;
  width: 100%;
  border-top: 1px solid rgba(0, 136, 0, 0.5);
  background-color: var(--bg-black);
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
}

/* Hide scrollbar for cleaner look but keep functionality */
.footer-tab-bar::-webkit-scrollbar {
  height: 4px;
}

.footer-tab-bar::-webkit-scrollbar-track {
  background: transparent;
}

.footer-tab-bar::-webkit-scrollbar-thumb {
  background: rgba(0, 136, 0, 0.3);
  border-radius: 2px;
}

.footer-tab-bar::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 136, 0, 0.5);
}

.tab-button {
  flex: 1 0 auto;
  min-width: fit-content;
  padding: 0.75rem 0.5rem;
  background: transparent;
  color: var(--text-bright);
  border: none;
  border-right: 1px solid rgba(0, 136, 0, 0.3);
  cursor: pointer;
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 16px;
  transition: all 0.2s;
  text-align: center;
  white-space: nowrap;
}

.tab-button:last-child {
  border-right: none;
}

.tab-button .unread-indicator {
  margin-left: 0.25rem;
  color: var(--text-danger);
  font-weight: bold;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50%, 100% { opacity: 1; }
  25%, 75% { opacity: 0.3; }
}

.tab-button:hover {
  background-color: rgba(0, 255, 0, 0.1);
  color: var(--text-accent);
}

.tab-button.active {
  background-color: rgba(0, 255, 0, 0.15);
  color: var(--text-accent);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .tab-button {
    font-size: 14px;
    padding: 0.6rem 0.3rem;
    min-width: 80px;
  }
}

/* Tablet responsiveness */
@media (min-width: 769px) and (max-width: 1024px) {
  .tab-button {
    font-size: 15px;
    padding: 0.7rem 0.4rem;
  }
}
</style>
