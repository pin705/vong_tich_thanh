<template>
  <div class="chat-pane">
    <div class="chat-title">[ Log Giao Tiếp ]</div>
    <div ref="chatArea" class="chat-area">
      <div v-for="msg in messages" :key="msg.id" class="chat-message">
        <span class="chat-user" v-if="msg.user">[{{ msg.user }}]:</span>
        <span class="chat-text">{{ msg.text }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';

interface ChatMessage {
  id: string;
  user?: string;
  text: string;
  timestamp: Date;
}

const props = defineProps<{
  messages: ChatMessage[];
}>();

const chatArea = ref<HTMLElement | null>(null);

// Auto-scroll to bottom when new messages arrive
watch(() => props.messages.length, () => {
  nextTick(() => {
    if (chatArea.value) {
      chatArea.value.scrollTop = chatArea.value.scrollHeight;
    }
  });
});
</script>

<style scoped>
.chat-pane {
  padding: 0.75rem;
  background-color: rgba(0, 136, 0, 0.05);
  border: 1px solid var(--text-dim);
  border-radius: 4px;
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 16px;
  line-height: 1.4;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-title {
  color: var(--text-accent);
  font-weight: bold;
  margin-bottom: 0.5rem;
  font-size: 16px;
}

.chat-area {
  flex: 1;
  overflow-y: auto;
  color: var(--text-cyan);
}

.chat-message {
  margin-bottom: 0.25rem;
}

.chat-user {
  color: var(--text-bright);
  margin-right: 0.5rem;
}

.chat-text {
  color: var(--text-cyan);
}
</style>
