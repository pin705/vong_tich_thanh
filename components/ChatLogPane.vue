<template>
  <div class="chat-log-pane">
    <!-- Collapsed mode - show last 2 messages -->
    <div v-if="!expanded" class="chat-collapsed">
      <div class="chat-mini-header">
        <span class="chat-title">💬 Chat</span>
        <button class="expand-button" @click="expanded = true">[+] Mở rộng</button>
      </div>
      <div class="chat-mini-messages">
        <div v-for="msg in lastTwoMessages" :key="msg.id" :class="getMessageClass(msg)">
          <span class="chat-timestamp">{{ formatTime(msg.timestamp) }}</span>
          <span class="chat-user" v-if="msg.user">[{{ msg.user }}]:</span>
          <span class="chat-text">{{ msg.text }}</span>
        </div>
        <div v-if="filteredMessages.length === 0" class="empty-message-mini">
          Chưa có tin nhắn.
        </div>
      </div>
      <div class="chat-input-mini">
        <input
          v-model="chatInput"
          type="text"
          class="chat-input"
          placeholder="Chat nhanh..."
          @keydown.enter="sendChatMessage"
          autocomplete="off"
        />
      </div>
    </div>

    <!-- Expanded mode - full chat popup -->
    <Teleport to="body">
      <div v-if="expanded" class="chat-overlay" @click="expanded = false">
        <div class="chat-popup" @click.stop>
          <div class="chat-popup-header">
            <h3>💬 Trò Chuyện</h3>
            <button class="close-button" @click="expanded = false">✕</button>
          </div>

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

          <!-- Chat input area -->
          <div class="chat-input-area">
            <input
              v-model="chatInput"
              type="text"
              class="chat-input"
              :placeholder="getChatPlaceholder()"
              @keydown.enter="sendChatMessage"
              autocomplete="off"
            />
            <button class="send-button" @click="sendChatMessage">Gửi</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import type { Message } from '~/types';

const props = defineProps<{
  messages: Message[];
}>();

const emit = defineEmits<{
  sendChatCommand: [command: string];
}>();

const currentSubTab = ref('world');
const chatArea = ref<HTMLElement | null>(null);
const chatInput = ref('');
const expanded = ref(false);

const subtabs = [
  { id: 'world', label: 'Thế Giới' },
  { id: 'party', label: 'Nhóm' },
  { id: 'guild', label: 'Guild' },
  { id: 'say', label: 'Lân Cận' }
];

// Get chat command based on current sub-tab
const getChatCommand = () => {
  switch (currentSubTab.value) {
    case 'world':
      return 'world';
    case 'party':
      return 'party_chat';
    case 'guild':
      return 'guild_chat';
    case 'say':
    default:
      return 'say';
  }
};

// Get placeholder text based on current sub-tab
const getChatPlaceholder = () => {
  switch (currentSubTab.value) {
    case 'world':
      return 'Gửi tin nhắn đến toàn thế giới...';
    case 'party':
      return 'Chat với nhóm...';
    case 'guild':
      return 'Chat với bang hội...';
    case 'say':
    default:
      return 'Nói với mọi người xung quanh...';
  }
};

// Send chat message
const sendChatMessage = () => {
  if (!chatInput.value.trim()) return;
  
  const command = getChatCommand();
  const message = chatInput.value.trim();
  
  // Emit command to parent
  emit('sendChatCommand', `${command} ${message}`);
  
  // Clear input
  chatInput.value = '';
};

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

// Get last 2 messages for collapsed view
const lastTwoMessages = computed(() => {
  return filteredMessages.value.slice(-2);
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

/* Collapsed Chat Mode */
.chat-collapsed {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-mini-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background-color: rgba(0, 136, 136, 0.1);
  border-bottom: 1px solid rgba(0, 136, 136, 0.3);
}

.chat-title {
  color: var(--text-cyan);
  font-weight: bold;
  font-size: 16px;
}

.expand-button {
  padding: 0.2rem 0.5rem;
  background: rgba(0, 136, 136, 0.2);
  border: 1px solid var(--text-cyan);
  color: var(--text-cyan);
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.expand-button:hover {
  background: var(--text-cyan);
  color: var(--bg-black);
}

.chat-mini-messages {
  flex: 1;
  padding: 0.5rem;
  overflow-y: auto;
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 14px;
}

.chat-input-mini {
  padding: 0.5rem;
  border-top: 1px solid rgba(0, 136, 136, 0.3);
  background-color: rgba(0, 136, 136, 0.05);
}

.empty-message-mini {
  color: var(--text-dim);
  font-size: 14px;
  text-align: center;
  padding: 1rem;
  opacity: 0.6;
}

/* Expanded Chat Popup */
.chat-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.chat-popup {
  width: 90%;
  max-width: 800px;
  height: 80%;
  max-height: 600px;
  background-color: var(--bg-black);
  border: 2px solid var(--text-cyan);
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
}

.chat-popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: rgba(0, 136, 136, 0.1);
  border-bottom: 2px solid var(--text-cyan);
}

.chat-popup-header h3 {
  color: var(--text-cyan);
  margin: 0;
  font-size: 1.5rem;
}

.close-button {
  padding: 0.3rem 0.8rem;
  background: transparent;
  border: 1px solid var(--text-cyan);
  color: var(--text-cyan);
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s;
}

.close-button:hover {
  background: var(--text-cyan);
  color: var(--bg-black);
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

.chat-input-area {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem;
  border-top: 1px solid rgba(0, 136, 136, 0.3);
  background-color: rgba(0, 136, 136, 0.05);
}

.chat-input {
  flex: 1;
  padding: 0.5rem;
  background-color: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 136, 136, 0.3);
  color: var(--text-bright);
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 16px;
}

.chat-input:focus {
  border-color: var(--text-cyan);
  outline: none;
}

.send-button {
  padding: 0.5rem 1rem;
  background-color: var(--text-cyan);
  color: var(--bg-black);
  border: 1px solid var(--text-cyan);
  cursor: pointer;
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.2s;
}

.send-button:hover {
  background-color: var(--text-bright);
  border-color: var(--text-bright);
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
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

  .chat-input-area {
    padding: 0.5rem;
    gap: 0.3rem;
  }

  .chat-input {
    font-size: 14px;
    padding: 0.4rem;
  }

  .send-button {
    font-size: 14px;
    padding: 0.4rem 0.75rem;
  }
}
</style>
