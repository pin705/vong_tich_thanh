<template>
  <div class="chat-log-pane">
    <!-- Sub-tabs for different chat channels -->
    <div class="chat-subtabs">
      <button
        v-for="subtab in subtabs"
        :key="subtab.id"
        :class="['subtab', { active: currentSubTab === subtab.id }]"
        @click="currentSubTab = subtab.id"
      >
        {{ subtab.label }}
        <span v-if="getUnreadCount(subtab.id) > 0" class="unread-count">{{ getUnreadCount(subtab.id) }}</span>
      </button>
    </div>

    <!-- Chat messages area -->
    <div ref="chatArea" class="chat-area">
      <div v-for="msg in filteredMessages" :key="msg.id" :class="getMessageClass(msg)">
        <span class="chat-timestamp">{{ formatTime(msg.timestamp) }}</span>
        <span class="chat-user" v-if="msg.user">[{{ msg.user }}]:</span>
        <span class="chat-text">{{ msg.text }}</span>
      </div>
      <div v-if="filteredMessages.length === 0" class="empty-message">
        Chưa có tin nhắn nào.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import type { Message } from '~/types';

const props = defineProps<{
  messages: Message[];
}>();

const currentSubTab = ref('world');
const chatArea = ref<HTMLElement | null>(null);

const subtabs = [
  { id: 'world', label: 'Thế Giới' },
  { id: 'party', label: 'Nhóm' },
  { id: 'guild', label: 'Guild' },
  { id: 'say', label: 'Lân Cận' }
];

// Filter messages based on current sub-tab
const filteredMessages = computed(() => {
  if (!props.messages) return [];
  
  return props.messages.filter(msg => {
    const category = msg.category || 'say';
    
    switch (currentSubTab.value) {
      case 'world':
        return category === 'world' || category === 'world_alert';
      case 'party':
        return category === 'party';
      case 'guild':
        return category === 'guild';
      case 'say':
        return category === 'say';
      default:
        return true;
    }
  });
});

// Get unread count for a sub-tab (placeholder for future implementation)
const getUnreadCount = (subtabId: string) => {
  // This could be enhanced to track which messages have been read per sub-tab
  return 0;
};

// Format timestamp
const formatTime = (timestamp: Date) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Get CSS class for message
const getMessageClass = (message: Message) => {
  const category = message.category;
  let classes = 'chat-message';
  
  if (category === 'world_alert') {
    classes += ' world-alert';
  } else if (category === 'party') {
    classes += ' party-chat';
  } else if (category === 'guild') {
    classes += ' guild-chat';
  }
  
  return classes;
};

// Auto-scroll to bottom when new messages arrive
watch(() => props.messages.length, () => {
  nextTick(() => {
    if (chatArea.value) {
      chatArea.value.scrollTop = chatArea.value.scrollHeight;
    }
  });
});

// Scroll to bottom when changing sub-tabs
watch(currentSubTab, () => {
  nextTick(() => {
    if (chatArea.value) {
      chatArea.value.scrollTop = chatArea.value.scrollHeight;
    }
  });
});
</script>

<style scoped>
.chat-log-pane {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: rgba(0, 136, 136, 0.03);
}

.chat-subtabs {
  display: flex;
  gap: 0.3rem;
  padding: 0.5rem;
  background-color: rgba(0, 136, 136, 0.05);
  border-bottom: 1px solid rgba(0, 136, 136, 0.3);
  flex-wrap: wrap;
}

.subtab {
  position: relative;
  padding: 0.3rem 0.8rem;
  background: transparent;
  border: 1px solid rgba(0, 136, 136, 0.3);
  color: var(--text-dim);
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.subtab:hover {
  color: var(--text-bright);
  border-color: rgba(0, 136, 136, 0.6);
}

.subtab.active {
  color: var(--text-cyan);
  background-color: rgba(0, 136, 136, 0.1);
  border-color: var(--text-cyan);
}

.unread-count {
  margin-left: 0.3rem;
  padding: 0 0.3rem;
  background-color: var(--text-accent);
  color: var(--bg-black);
  border-radius: 10px;
  font-size: 14px;
  font-weight: bold;
}

.chat-area {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  font-family: 'VT323', 'Source Code Pro', monospace;
}

.empty-message {
  color: var(--text-dim);
  font-size: 16px;
  text-align: center;
  padding: 2rem;
  opacity: 0.6;
}

.chat-message {
  margin-bottom: 0.4rem;
  font-size: 16px;
  line-height: 1.4;
}

.chat-timestamp {
  color: var(--text-dim);
  font-size: 14px;
  margin-right: 0.5rem;
}

.chat-user {
  color: var(--text-bright);
  margin-right: 0.5rem;
  font-weight: bold;
}

.chat-text {
  color: var(--text-cyan);
}

/* Special styling for different chat types */
.party-chat .chat-text {
  color: #4da6ff; /* Light blue */
}

.guild-chat .chat-text {
  color: #9966ff; /* Purple */
}

.world-alert {
  background-color: rgba(255, 165, 0, 0.1);
  padding: 0.5rem;
  border-left: 3px solid var(--text-accent);
  animation: highlight 2s ease-in-out;
}

.world-alert .chat-text {
  color: var(--text-accent);
  font-weight: bold;
  text-shadow: 0 0 5px currentColor;
}

@keyframes highlight {
  0%, 100% {
    background-color: rgba(255, 165, 0, 0.1);
  }
  50% {
    background-color: rgba(255, 165, 0, 0.2);
  }
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .chat-subtabs {
    padding: 0.3rem;
    gap: 0.2rem;
  }

  .subtab {
    padding: 0.2rem 0.5rem;
    font-size: 14px;
  }

  .chat-area {
    padding: 0.5rem;
  }

  .chat-message {
    font-size: 14px;
  }

  .chat-timestamp {
    font-size: 12px;
  }
}
</style>
