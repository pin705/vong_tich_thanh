<template>
  <div ref="logArea" class="log-pane">
    <div v-for="message in messages" :key="message.id" :class="getMessageClass(message)">
      <span v-if="message.type === 'loot'" v-html="message.text"></span>
      <template v-else>{{ message.text }}</template>
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
.log-pane {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  padding-bottom: 0.5rem;
  white-space: pre-wrap;
  word-wrap: break-word;
  background-color: rgba(0, 136, 0, 0.03);
}

.message {
  margin-bottom: 0.1rem;
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 18px;
  line-height: 1.4;
}

.message-normal {
  color: var(--text-dim);
}

.message-action {
  color: var(--text-bright);
}

.message-accent {
  color: var(--text-accent);
}

.message-error {
  color: var(--theme-text-error);
}

.message-system {
  color: var(--theme-text-system);
}

.message-loot {
  color: var(--theme-text-loot);
}

.message-xp {
  color: var(--theme-text-xp);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .log-pane {
    padding: 0.5rem;
  }

  .message {
    font-size: 16px;
    line-height: 1.3;
  }
}
</style>
