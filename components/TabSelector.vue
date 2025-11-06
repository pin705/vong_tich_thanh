<template>
  <div class="tab-selector">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      :class="['tab', { active: currentTab === tab.id, unread: tab.hasUnread }]"
      @click="$emit('tabChange', tab.id)"
    >
      {{ tab.label }}
      <span v-if="tab.hasUnread" class="unread-indicator">●</span>
    </button>
  </div>
</template>

<script setup lang="ts">
interface Tab {
  id: string;
  label: string;
  hasUnread: boolean;
}

defineProps<{
  tabs: Tab[];
  currentTab: string;
}>();

defineEmits<{
  tabChange: [tabId: string];
}>();
</script>

<style scoped>
.tab-selector {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  background-color: var(--bg-black);
  border-bottom: 1px solid rgba(0, 136, 0, 0.3);
}

.tab {
  position: relative;
  padding: 0.4rem 1rem;
  background: transparent;
  border: 1px solid rgba(0, 136, 0, 0.3);
  color: var(--text-dim);
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab:hover {
  color: var(--text-bright);
  border-color: rgba(0, 136, 0, 0.6);
}

.tab.active {
  color: var(--text-bright);
  background-color: rgba(0, 136, 0, 0.1);
  border-color: var(--text-accent);
}

.tab.unread {
  animation: pulse 2s infinite;
  border-color: var(--text-accent);
}

.unread-indicator {
  position: absolute;
  top: -2px;
  right: -2px;
  color: var(--text-accent);
  font-size: 20px;
  animation: blink 1s infinite;
}

@keyframes pulse {
  0%, 100% {
    border-color: rgba(0, 136, 0, 0.3);
  }
  50% {
    border-color: var(--text-accent);
  }
}

@keyframes blink {
  0%, 50%, 100% {
    opacity: 1;
  }
  25%, 75% {
    opacity: 0.3;
  }
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .tab-selector {
    padding: 0.3rem;
    gap: 0.3rem;
  }

  .tab {
    padding: 0.3rem 0.6rem;
    font-size: 16px;
  }
}
</style>
