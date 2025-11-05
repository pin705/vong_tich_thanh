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
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Tab {
  id: string;
  label: string;
}

const tabs: Tab[] = [
  { id: 'map', label: '[Bản Đồ]' },
  { id: 'worldmap', label: '[Thế Giới]' },
  { id: 'occupants', label: '[Xung Quanh]' },
  { id: 'inventory', label: '[Túi Đồ]' },
  { id: 'quests', label: '[Nhiệm Vụ]' },
  { id: 'skills', label: '[Kỹ Năng]' },
  { id: 'talents', label: '[Thiên Phú]' },
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
}

.tab-button {
  flex: 1;
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
}

.tab-button:last-child {
  border-right: none;
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
  }
}
</style>
