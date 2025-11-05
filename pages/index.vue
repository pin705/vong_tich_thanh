<template>
  <div class="terminal-container" @click="focusInput">
    <!-- Output area (95% of screen) -->
    <div ref="outputArea" class="output-area">
      <div v-for="message in messages" :key="message.id" :class="getMessageClass(message)">
        {{ message.text }}
      </div>
    </div>

    <!-- Input area (5% of screen) -->
    <div class="input-area">
      <span class="prompt">&gt;</span>
      <input
        ref="inputField"
        v-model="currentInput"
        type="text"
        class="input-field"
        @keydown.enter="sendCommand"
        autocomplete="off"
        spellcheck="false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import type { Message } from '~/types';

// State
const messages = ref<Message[]>([]);
const currentInput = ref('');
const outputArea = ref<HTMLElement | null>(null);
const inputField = ref<HTMLInputElement | null>(null);
const ws = ref<WebSocket | null>(null);
const isConnected = ref(false);

// Generate unique message ID
const generateId = () => `msg-${Date.now()}-${Math.random()}`;

// Add message to output
const addMessage = (text: string, type: Message['type'] = 'normal') => {
  messages.value.push({
    id: generateId(),
    text,
    type,
    timestamp: new Date(),
  });
  
  // Auto-scroll to bottom
  nextTick(() => {
    if (outputArea.value) {
      outputArea.value.scrollTop = outputArea.value.scrollHeight;
    }
  });
};

// Get CSS class for message type
const getMessageClass = (message: Message) => {
  return `message message-${message.type}`;
};

// Focus input field
const focusInput = () => {
  if (inputField.value) {
    inputField.value.focus();
  }
};

// Send command via WebSocket
const sendCommand = () => {
  const input = currentInput.value.trim();
  if (!input) return;

  // Echo command
  addMessage(`> ${input}`, 'system');

  // Send to server
  if (ws.value && isConnected.value) {
    ws.value.send(JSON.stringify({
      type: 'command',
      payload: { input }
    }));
  } else {
    addMessage('Lỗi: Chưa kết nối đến server.', 'error');
  }

  // Clear input
  currentInput.value = '';
};

// WebSocket connection
const connectWebSocket = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  ws.value = new WebSocket(wsUrl);

  ws.value.onopen = () => {
    isConnected.value = true;
    addMessage('═══════════════════════════════════════════════════', 'system');
    addMessage('    VONG TÍCH THÀNH - MUD', 'accent');
    addMessage('═══════════════════════════════════════════════════', 'system');
    addMessage('', 'normal');
    addMessage('Chào mừng đến với Vong Tích Thành!', 'action');
    addMessage('', 'normal');
    addMessage('[Cổng Thành Cũ]', 'accent');
    addMessage('Bạn đang đứng trước một cổng thành bằng đá đã sụp đổ một nửa.', 'normal');
    addMessage('Rêu và dây leo phủ kín. Gió rít qua những khe hở. Về phía bắc,', 'normal');
    addMessage('bạn thấy ánh đèn leo lét của khu chợ.', 'normal');
    addMessage('', 'normal');
    addMessage('Lối ra: [bắc]', 'normal');
    addMessage('Một [Lính Gác] đang đứng đây.', 'accent');
    addMessage('', 'normal');
    addMessage('Gõ "help" để xem danh sách lệnh.', 'system');
    addMessage('', 'normal');

    // Authenticate (simplified for demo)
    ws.value?.send(JSON.stringify({
      type: 'auth',
      payload: {
        playerId: 'demo-player',
        username: 'Player',
        roomId: 'starting-room'
      }
    }));
  };

  ws.value.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      const { type, message, payload } = data;

      switch (type) {
        case 'normal':
          addMessage(message || payload, 'normal');
          break;
        case 'action':
          addMessage(message || payload, 'action');
          break;
        case 'accent':
          addMessage(message || payload, 'accent');
          break;
        case 'error':
          addMessage(message || payload, 'error');
          break;
        case 'system':
          addMessage(message || payload, 'system');
          break;
        case 'room':
          if (payload.name) {
            addMessage('', 'normal');
            addMessage(`[${payload.name}]`, 'accent');
          }
          if (payload.description) {
            addMessage(payload.description, 'normal');
          }
          break;
        default:
          console.log('Unknown message type:', type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };

  ws.value.onerror = (error) => {
    console.error('WebSocket error:', error);
    addMessage('Lỗi kết nối WebSocket.', 'error');
  };

  ws.value.onclose = () => {
    isConnected.value = false;
    addMessage('Mất kết nối với server. Đang thử kết nối lại...', 'error');
    
    // Reconnect after 3 seconds
    setTimeout(() => {
      if (!isConnected.value) {
        connectWebSocket();
      }
    }, 3000);
  };
};

// Lifecycle hooks
onMounted(() => {
  focusInput();
  connectWebSocket();
  
  // Always keep focus on input
  document.addEventListener('click', focusInput);
});

onUnmounted(() => {
  document.removeEventListener('click', focusInput);
  if (ws.value) {
    ws.value.close();
  }
});

// Watch for any changes that might lose focus
watch(messages, () => {
  nextTick(focusInput);
});
</script>

<style scoped>
.terminal-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-black);
  overflow: hidden;
}

.output-area {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  padding-bottom: 0.5rem;
  white-space: pre-wrap;
  word-wrap: break-word;
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
  color: var(--text-danger);
}

.message-system {
  color: var(--text-cyan);
}

.input-area {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border-top: 2px solid var(--text-dim);
  background-color: var(--bg-black);
}

.prompt {
  color: var(--text-bright);
  margin-right: 0.5rem;
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 20px;
  font-weight: bold;
}

.input-field {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-bright);
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 18px;
  caret-color: var(--text-bright);
}

.input-field::selection {
  background-color: var(--text-dim);
  color: var(--bg-black);
}
</style>
