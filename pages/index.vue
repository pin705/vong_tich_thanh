<template>
  <div class="terminal-container" @click="focusInput">
    <!-- Main Grid Layout -->
    <div class="game-layout">
      <!-- Left Panel: Main Output -->
      <div class="main-output-pane">
        <div ref="outputArea" class="output-area">
          <div v-for="message in mainMessages" :key="message.id" :class="getMessageClass(message)">
            {{ message.text }}
          </div>
        </div>
      </div>

      <!-- Right Panel: Info Panes -->
      <div class="side-panel">
        <!-- Player/Target Info -->
        <div class="info-pane">
          <StatusPane
            :playerName="playerState.name"
            :hp="playerState.hp"
            :maxHp="playerState.maxHp"
            :mp="playerState.mp"
            :maxMp="playerState.maxMp"
            :level="playerState.level"
            :gold="playerState.gold"
            :inCombat="playerState.inCombat"
            :targetName="targetState.name"
            :targetHp="targetState.hp"
            :targetMaxHp="targetState.maxHp"
          />
        </div>

        <!-- Mini-Map -->
        <div class="map-pane-container">
          <MapPane :exits="exits" />
        </div>

        <!-- Chat Log -->
        <div class="chat-pane-container">
          <ChatPane :messages="chatMessages" />
        </div>
      </div>
    </div>

    <!-- Input area (bottom) -->
    <div class="input-area">
      <span class="prompt">&gt;</span>
      <input
        ref="inputField"
        v-model="currentInput"
        type="text"
        class="input-field"
        @keydown.enter="sendCommand"
        @keydown.up="navigateHistory(-1)"
        @keydown.down="navigateHistory(1)"
        autocomplete="off"
        spellcheck="false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue';
import type { Message, ChatMessage, PlayerState, TargetState, ExitsState } from '~/types';
import StatusPane from '~/components/StatusPane.vue';
import MapPane from '~/components/MapPane.vue';
import ChatPane from '~/components/ChatPane.vue';

definePageMeta({
  middleware: 'auth'
});

const { user, logout } = useAuth();
const router = useRouter();

// State
const messages = ref<Message[]>([]);
const chatMessages = ref<ChatMessage[]>([]);
const currentInput = ref('');
const commandHistory = ref<string[]>([]);
const historyIndex = ref(-1);
const outputArea = ref<HTMLElement | null>(null);
const inputField = ref<HTMLInputElement | null>(null);
const ws = ref<WebSocket | null>(null);
const isConnected = ref(false);

// Player state
const playerState = ref<PlayerState>({
  name: user.value?.username || 'Player',
  hp: 100,
  maxHp: 100,
  mp: 50,
  maxMp: 50,
  level: 1,
  gold: 0,
  inCombat: false
});

// Target state
const targetState = ref<TargetState>({
  name: '',
  hp: 0,
  maxHp: 0
});

// Exits state
const exits = ref<ExitsState>({
  north: false,
  south: false,
  east: false,
  west: false,
  up: false,
  down: false
});

// Separate main output messages (room descriptions, combat, etc.) from chat
const mainMessages = computed(() => {
  return messages.value.filter(m => m.type !== 'chat_log');
});

// Generate unique message ID
const generateId = () => `msg-${Date.now()}-${Math.random()}`;

// Add message to appropriate output
const addMessage = (text: string, type: Message['type'] = 'normal', user?: string) => {
  if (type === 'chat_log') {
    // Add to chat pane
    chatMessages.value.push({
      id: generateId(),
      user,
      text,
      timestamp: new Date(),
    });
  } else {
    // Add to main output
    messages.value.push({
      id: generateId(),
      text,
      type,
      timestamp: new Date(),
      user
    });
  }
  
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

// Navigate command history
const navigateHistory = (direction: number) => {
  if (commandHistory.value.length === 0) return;
  
  historyIndex.value += direction;
  
  // Clamp history index
  if (historyIndex.value < 0) {
    historyIndex.value = 0;
    return;
  }
  if (historyIndex.value >= commandHistory.value.length) {
    historyIndex.value = commandHistory.value.length - 1;
  }
  
  currentInput.value = commandHistory.value[commandHistory.value.length - 1 - historyIndex.value];
};

// Send command via WebSocket
const sendCommand = async () => {
  const input = currentInput.value.trim();
  if (!input) return;

  // Add to command history
  commandHistory.value.push(input);
  historyIndex.value = -1;

  // Echo command
  addMessage(`> ${input}`, 'system');

  // Handle quit command
  if (input.toLowerCase() === 'quit') {
    addMessage('Đang đăng xuất...', 'system');
    await logout();
    await router.push('/login');
    return;
  }

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
    addMessage(`Chào mừng ${user.value?.username || 'Player'} đến với Vong Tích Thành!`, 'action');
    addMessage('', 'normal');
    addMessage('[Cổng Thành Cũ]', 'accent');
    addMessage('Bạn đang đứng trước một cổng thành bằng đá đã sụp đổ một nửa.', 'normal');
    addMessage('Rêu và dây leo phủ kín. Gió rít qua những khe hở. Về phía bắc,', 'normal');
    addMessage('bạn thấy ánh đèn leo lét của khu chợ.', 'normal');
    addMessage('', 'normal');
    addMessage('Lối ra: [bắc]', 'normal');
    addMessage('Một [Lính Gác] đang đứng đây.', 'accent');
    addMessage('', 'normal');
    addMessage('Gõ "help" để xem danh sách lệnh, hoặc "quit" để thoát.', 'system');
    addMessage('', 'normal');

    // Authenticate with user session
    ws.value?.send(JSON.stringify({
      type: 'auth',
      payload: {
        playerId: user.value?.id || 'demo-player',
        username: user.value?.username || 'Player',
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
        case 'combat_log':
          addMessage(message || payload, 'combat_log');
          break;
        case 'chat_log':
          addMessage(message || payload.message, 'chat_log', payload.user);
          break;
        case 'room':
          if (payload.name) {
            addMessage('', 'normal');
            addMessage(`[${payload.name}]`, 'accent');
          }
          if (payload.description) {
            addMessage(payload.description, 'normal');
          }
          // Update exits if provided
          if (payload.exits) {
            exits.value = {
              north: !!payload.exits.north,
              south: !!payload.exits.south,
              east: !!payload.exits.east,
              west: !!payload.exits.west,
              up: !!payload.exits.up,
              down: !!payload.exits.down
            };
          }
          break;
        case 'player_state':
          // Update player state
          if (payload) {
            playerState.value = {
              name: payload.name || playerState.value.name,
              hp: payload.hp ?? playerState.value.hp,
              maxHp: payload.maxHp ?? playerState.value.maxHp,
              mp: payload.mp ?? playerState.value.mp,
              maxMp: payload.maxMp ?? playerState.value.maxMp,
              level: payload.level ?? playerState.value.level,
              gold: payload.gold ?? playerState.value.gold,
              inCombat: payload.inCombat ?? playerState.value.inCombat
            };
          }
          break;
        case 'target_state':
          // Update target state
          if (payload && payload.name) {
            targetState.value = {
              name: payload.name,
              hp: payload.hp || 0,
              maxHp: payload.maxHp || 0
            };
          } else {
            // Clear target
            targetState.value = { name: '', hp: 0, maxHp: 0 };
          }
          break;
        case 'exits':
          // Update exits
          if (payload) {
            exits.value = {
              north: !!payload.north,
              south: !!payload.south,
              east: !!payload.east,
              west: !!payload.west,
              up: !!payload.up,
              down: !!payload.down
            };
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

.game-layout {
  flex: 1;
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 0.5rem;
  padding: 0.5rem;
  overflow: hidden;
}

.main-output-pane {
  display: flex;
  flex-direction: column;
  background-color: rgba(0, 136, 0, 0.05);
  border: 1px solid var(--text-dim);
  border-radius: 4px;
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

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow: hidden;
}

.info-pane {
  flex: 0 0 auto;
  min-height: 180px;
}

.map-pane-container {
  flex: 0 0 auto;
  min-height: 150px;
}

.chat-pane-container {
  flex: 1;
  min-height: 120px;
  overflow: hidden;
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

.message-combat_log {
  color: var(--text-bright);
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
