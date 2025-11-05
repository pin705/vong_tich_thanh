<template>
  <div class="actions-pane">
    <div v-if="targetName" class="actions-title">[ Hành Động: {{ targetName }} ]</div>
    <div v-else class="actions-title">[ Hành Động ]</div>
    <div class="actions-list">
      <div
        v-for="(action, index) in availableActions"
        :key="index"
        class="action-item"
        :class="{ disabled: action.disabled }"
        @click="executeAction(action)"
      >
        [{{ index + 1 }}] {{ action.label }}{{ action.disabled ? ' (mờ)' : '' }}
      </div>
      <div v-if="availableActions.length === 0" class="action-empty">
        Chọn mục tiêu để xem hành động
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Action {
  label: string;
  command: string;
  disabled?: boolean;
}

const props = defineProps<{
  targetType: 'player' | 'npc' | 'mob' | null;
  targetName: string;
  targetId: string;
}>();

const emit = defineEmits<{
  executeAction: [command: string];
}>();

const availableActions = computed<Action[]>(() => {
  if (!props.targetType) return [];

  switch (props.targetType) {
    case 'npc':
      return [
        { label: 'talk', command: `talk ${props.targetName}` },
        { label: 'look', command: `look ${props.targetName}` },
        { label: 'trade', command: `list`, disabled: false }, // Can be dynamic based on NPC
        { label: 'attack', command: `attack ${props.targetName}` }
      ];
    case 'mob':
      return [
        { label: 'attack', command: `attack ${props.targetName}` },
        { label: 'look', command: `look ${props.targetName}` }
      ];
    case 'player':
      return [
        { label: 'talk', command: `say Xin chào ${props.targetName}!` },
        { label: 'look', command: `look ${props.targetName}` },
        { label: 'trade', command: `trade ${props.targetName}`, disabled: true },
        { label: 'party invite', command: `party invite ${props.targetName}`, disabled: true },
        { label: 'guild invite', command: `guild invite ${props.targetName}`, disabled: true }
      ];
    default:
      return [];
  }
});

const executeAction = (action: Action) => {
  if (action.disabled) return;
  emit('executeAction', action.command);
};
</script>

<style scoped>
.actions-pane {
  padding: 0.75rem;
  background-color: rgba(0, 136, 0, 0.05);
  border: 1px solid var(--text-dim);
  border-radius: 4px;
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 16px;
  line-height: 1.4;
  overflow-y: auto;
}

.actions-title {
  color: var(--text-accent);
  font-weight: bold;
  margin-bottom: 0.5rem;
  font-size: 16px;
}

.actions-list {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.action-item {
  color: var(--text-bright);
  cursor: pointer;
  padding: 0.15rem 0.25rem;
  transition: background-color 0.2s;
}

.action-item:hover:not(.disabled) {
  background-color: rgba(0, 255, 0, 0.1);
}

.action-item.disabled {
  color: var(--text-dim);
  cursor: not-allowed;
  opacity: 0.5;
}

.action-empty {
  color: var(--text-dim);
  font-style: italic;
}
</style>
