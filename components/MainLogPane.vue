<template>
  <div ref="logArea" class="log-pane">
    <div v-for="message in messages" :key="message.id" :class="getMessageClass(message)">
      <span v-if="message.type === 'loot'" v-html="message.text"></span>
      <template v-else>
        <span v-if="shouldShowIcon(message)" class="message-icon">{{ getMessageIcon(message) }}</span>
        <span class="message-text">{{ message.text }}</span>
      </template>
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

// Determine if icon should be shown
const shouldShowIcon = (message: Message) => {
  const iconTypes = ['accent', 'system', 'action', 'xp', 'loot'];
  return iconTypes.includes(message.type);
};

// Get appropriate icon for message type
const getMessageIcon = (message: Message) => {
  const icons: Record<string, string> = {
    'accent': '>',
    'system': '[i]',
    'action': '~',
    'xp': '*',
    'loot': '$'
  };
  return icons[message.type] || '';
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
  margin-bottom: 0.15rem;
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 18px;
  line-height: 1.5;
  padding: 0.1rem 0.3rem;
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
}

.message-icon {
  font-size: 16px;
  flex-shrink: 0;
  display: inline-block;
}

.message-text {
  flex: 1;
}

.message-normal {
  color: var(--text-dim);
}

.message-action {
  color: var(--text-bright);
  font-style: italic;
}

.message-accent {
  color: var(--text-accent);
  font-weight: bold;
  font-size: 19px;
  padding: 0.3rem 0.5rem;
  border-left: 3px solid var(--text-accent);
  background-color: rgba(255, 176, 0, 0.05);
}

.message-error {
  color: var(--theme-text-error);
  border-left: 3px solid var(--theme-text-error);
  background-color: rgba(170, 0, 0, 0.05);
  padding: 0.3rem 0.5rem;
}

.message-system {
  color: var(--theme-text-system);
  border-left: 2px solid var(--theme-text-system);
  background-color: rgba(0, 255, 255, 0.03);
}

.message-loot {
  color: var(--theme-text-loot);
  border-left: 3px solid var(--theme-text-loot);
  background-color: rgba(255, 0, 255, 0.05);
  padding: 0.2rem 0.5rem;
}

.message-xp {
  color: var(--theme-text-xp);
  border-left: 3px solid var(--theme-text-xp);
  background-color: rgba(0, 255, 170, 0.05);
  padding: 0.2rem 0.5rem;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .log-pane {
    padding: 0.5rem;
  }

  .message {
    font-size: 16px;
    line-height: 1.3;
    padding: 0.1rem 0.2rem;
  }

  .message-icon {
    font-size: 14px;
  }

  .message-accent {
    font-size: 17px;
  }
}
</style>
