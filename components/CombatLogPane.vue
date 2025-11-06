<template>
  <div ref="logArea" class="combat-log-pane">
    <div v-for="message in messages" :key="message.id" :class="getMessageClass(message)">
      {{ message.text }}
    </div>
    <div v-if="messages.length === 0" class="empty-message">
      Không có hoạt động chiến đấu nào.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import type { Message } from '~/types';

const props = defineProps<{
  messages: Message[];
}>();

const logArea = ref<HTMLElement | null>(null);

// Auto-scroll to bottom when new messages arrive
watch(() => props.messages.length, () => {
  nextTick(() => {
    if (logArea.value) {
      logArea.value.scrollTop = logArea.value.scrollHeight;
    }
  });
});

// Get CSS class for message type
const getMessageClass = (message: Message) => {
  return `message message-${message.type}`;
};
</script>

<style scoped>
.combat-log-pane {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  padding-bottom: 0.5rem;
  white-space: pre-wrap;
  word-wrap: break-word;
  background-color: rgba(136, 0, 0, 0.03);
}

.empty-message {
  color: var(--text-dim);
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 18px;
  text-align: center;
  padding: 2rem;
  opacity: 0.6;
}

.message {
  margin-bottom: 0.1rem;
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 18px;
  line-height: 1.4;
}

.message-combat_log {
  color: var(--text-bright);
}

.message-damage_in {
  color: var(--theme-text-damage-in);
  font-weight: bold;
}

.message-damage_out {
  color: var(--theme-text-damage-out);
}

.message-heal {
  color: var(--theme-text-heal);
}

.message-critical {
  color: var(--theme-text-critical);
  font-weight: bold;
  text-shadow: 0 0 5px currentColor;
}

.message-xp {
  color: var(--theme-text-xp);
}

.message-loot {
  color: var(--theme-text-loot);
}

.message-error {
  color: var(--theme-text-error);
}

.message-system {
  color: var(--theme-text-system);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .combat-log-pane {
    padding: 0.5rem;
  }

  .message {
    font-size: 16px;
    line-height: 1.3;
  }

  .empty-message {
    font-size: 16px;
    padding: 1rem;
  }
}
</style>
