<template>
  <div class="terminal-container" @click="focusInput">
    <!-- Main Output Area (85-90%) -->
    <div class="main-output-pane">
      <div ref="outputArea" class="output-area">
        <div v-for="message in mainMessages" :key="message.id" :class="getMessageClass(message)">
          {{ message.text }}
        </div>
      </div>
    </div>

    <!-- Input area (5%) -->
    <div class="input-area">
      <span class="prompt">&gt;</span>
      <input
        ref="inputField"
        v-model="currentInput"
        type="text"
        class="input-field"
        placeholder="Gõ lệnh..."
        @keydown.enter="sendCommand"
        @keydown.up="navigateHistory(-1)"
        @keydown.down="navigateHistory(1)"
        @keydown.ctrl.h.prevent="toggleHelp"
        @keydown.meta.h.prevent="toggleHelp"
        @keydown.f1.prevent="toggleHelp"
        autocomplete="off"
        spellcheck="false"
      />
    </div>

    <!-- Footer Tab Bar (5-10%) -->
    <FooterTabBar @tabClick="handleTabClick" />

    <!-- Popups/Modals -->
    <Popover
      :isOpen="inventoryPopupOpen"
      title="Túi Đồ & Thông Tin"
      width="600px"
      @close="inventoryPopupOpen = false"
    >
      <InventoryPane
        :playerName="playerState.name"
        :level="playerState.level"
        :exp="playerState.exp"
        :nextLevelExp="playerState.nextLevelExp"
        :gold="playerState.gold"
        :stats="playerState.stats"
        :inventoryItems="playerState.inventoryItems"
        @executeAction="handleInventoryAction"
      />
    </Popover>

    <Popover
      :isOpen="mapPopupOpen"
      title="Bản Đồ"
      width="400px"
      @close="mapPopupOpen = false"
    >
      <MapPane :exits="exits" @navigate="handleMapNavigation" />
    </Popover>

    <OccupantsListPopup
      :isOpen="occupantsPopupOpen"
      :players="roomOccupants.players"
      :npcs="roomOccupants.npcs"
      :mobs="roomOccupants.mobs"
      @close="occupantsPopupOpen = false"
      @selectEntity="handleEntitySelect"
    />

    <ContextualPopup
      :isOpen="contextualPopupOpen"
      :title="contextualPopupData.title"
      :entityType="contextualPopupData.entityType"
      :entityData="contextualPopupData.entityData"
      :actions="contextualPopupData.actions"
      @close="contextualPopupOpen = false"
      @executeAction="handleContextualAction"
    />

    <!-- Help Overlay -->
    <HelpOverlay :isOpen="helpOpen" @close="helpOpen = false" />
    
    <!-- Skills Overlay -->
    <SkillbookOverlay 
      :isOpen="skillsOpen" 
      :skills="playerSkills"
      :playerClass="playerState.class"
      @close="skillsOpen = false"
      @assignSkill="handleAssignSkill"
    />
    
    <!-- Talents Overlay -->
    <TalentTreeOverlay
      :isOpen="talentsOpen"
      :playerClass="playerState.class || 'mutant_warrior'"
      :playerLevel="playerState.level"
      :talentPoints="playerState.talentPoints || 0"
      :branches="talentBranches"
      :allocatedTalents="allocatedTalents"
      @close="talentsOpen = false"
      @allocateTalent="handleAllocateTalent"
    />
    
    <!-- Settings Overlay -->
    <SettingsOverlay
      :isOpen="settingsOpen"
      @close="settingsOpen = false"
      @themeChange="handleThemeChange"
      @fontSizeChange="handleFontSizeChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue';
import type { Message, ChatMessage, PlayerState, TargetState, ExitsState, RoomOccupantsState, SelectedTarget, Skill } from '~/types';
import MapPane from '~/components/MapPane.vue';
import InventoryPane from '~/components/InventoryPane.vue';
import HelpOverlay from '~/components/HelpOverlay.vue';
import SkillbookOverlay from '~/components/SkillbookOverlay.vue';
import TalentTreeOverlay from '~/components/TalentTreeOverlay.vue';
import SettingsOverlay from '~/components/SettingsOverlay.vue';
import FooterTabBar from '~/components/FooterTabBar.vue';
import Popover from '~/components/Popover.vue';
import OccupantsListPopup from '~/components/OccupantsListPopup.vue';
import ContextualPopup from '~/components/ContextualPopup.vue';

definePageMeta({
  middleware: 'auth'
});

const { user, clear } = useUserSession();
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
const helpOpen = ref(false);
const skillsOpen = ref(false);
const talentsOpen = ref(false);
const settingsOpen = ref(false);

// Popup states
const inventoryPopupOpen = ref(false);
const mapPopupOpen = ref(false);
const occupantsPopupOpen = ref(false);
const contextualPopupOpen = ref(false);
const contextualPopupData = ref<{
  title: string;
  entityType: 'npc' | 'mob' | 'player' | null;
  entityData?: any;
  actions?: any[];
}>({
  title: '',
  entityType: null,
  entityData: {},
  actions: []
});

// Skills and talents state
const playerSkills = ref<Skill[]>([]);
const talentBranches = ref<any[]>([]);
const allocatedTalents = ref<Record<string, number>>({});

// Room occupants state
const roomOccupants = ref<RoomOccupantsState>({
  players: [],
  npcs: [],
  mobs: []
});

// Selected target for actions
const selectedTarget = ref<SelectedTarget | null>(null);

// Player state
const playerState = ref<PlayerState>({
  name: user.value?.username || 'Player',
  hp: 100,
  maxHp: 100,
  mp: 50,
  maxMp: 50,
  level: 1,
  exp: 0,
  nextLevelExp: 100,
  gold: 0,
  inCombat: false,
  stats: {
    damage: 5,
    defense: 0,
    critChance: 5,
    critDamage: 150,
    lifesteal: 0,
    dodge: 5
  },
  inventoryItems: Array(20).fill(null)
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

// Handle tab bar clicks
const handleTabClick = async (tabId: string) => {
  switch (tabId) {
    case 'map':
      mapPopupOpen.value = true;
      break;
    case 'occupants':
      occupantsPopupOpen.value = true;
      break;
    case 'inventory':
      inventoryPopupOpen.value = true;
      break;
    case 'party':
      addMessage('Chức năng nhóm đang được phát triển...', 'system');
      break;
    case 'skills':
      await loadSkills();
      skillsOpen.value = true;
      break;
    case 'talents':
      await loadTalents();
      talentsOpen.value = true;
      break;
    case 'settings':
      settingsOpen.value = true;
      break;
  }
};

// Handle entity selection from occupants list
const handleEntitySelect = (type: 'player' | 'npc' | 'mob', entity: { id: string; name: string }) => {
  selectedTarget.value = { type, id: entity.id, name: entity.name };
  
  // Prepare contextual popup data
  const actions = getActionsForEntity(type, entity.name);
  
  contextualPopupData.value = {
    title: `${entity.name} (${getEntityTypeLabel(type)})`,
    entityType: type,
    entityData: {
      description: getEntityDescription(type, entity.name),
      status: getEntityStatus(type)
    },
    actions
  };
  
  contextualPopupOpen.value = true;
};

// Handle contextual action execution
const handleContextualAction = (action: { command: string }) => {
  currentInput.value = action.command;
  sendCommand();
};

// Get actions for entity type
const getActionsForEntity = (type: 'player' | 'npc' | 'mob', name: string) => {
  switch (type) {
    case 'npc':
      return [
        { label: 'Nói Chuyện (Talk)', command: `talk ${name}`, disabled: false },
        { label: 'Xem Xét (Look)', command: `look ${name}`, disabled: false },
        { label: 'Giao Dịch (Trade)', command: `list`, disabled: false },
        { label: 'Tấn Công (Attack)', command: `attack ${name}`, disabled: false }
      ];
    case 'mob':
      return [
        { label: 'Tấn Công (Attack)', command: `attack ${name}`, disabled: false },
        { label: 'Xem Xét (Look)', command: `look ${name}`, disabled: false }
      ];
    case 'player':
      return [
        { label: 'Nói Chuyện (Say)', command: `say Xin chào ${name}!`, disabled: false },
        { label: 'Xem Xét (Look)', command: `look ${name}`, disabled: false },
        { label: 'Giao Dịch (Trade)', command: `trade ${name}`, disabled: true },
        { label: 'Mời Vào Nhóm (Party)', command: `party invite ${name}`, disabled: true }
      ];
    default:
      return [];
  }
};

// Get entity type label
const getEntityTypeLabel = (type: 'player' | 'npc' | 'mob') => {
  const labels = {
    player: 'Người chơi',
    npc: 'NPC',
    mob: 'Quái vật'
  };
  return labels[type];
};

// Get entity description
const getEntityDescription = (type: 'player' | 'npc' | 'mob', name: string) => {
  // This would come from the server in a real implementation
  if (type === 'npc') {
    return `Một NPC tên ${name}. Có vẻ như họ có thể giao dịch hoặc trò chuyện.`;
  } else if (type === 'mob') {
    return `Một quái vật tên ${name}. Trông có vẻ nguy hiểm!`;
  } else {
    return `Một người chơi khác tên ${name}.`;
  }
};

// Get entity status
const getEntityStatus = (type: 'player' | 'npc' | 'mob') => {
  if (type === 'npc') {
    return '(Thân thiện)';
  } else if (type === 'mob') {
    return '(Thù địch)';
  }
  return '';
};

// Execute action from actions pane
const executeAction = (command: string) => {
  // Set the command in input field and send it
  currentInput.value = command;
  sendCommand();
};

// Handle inventory actions
const handleInventoryAction = (action: string, itemId: string) => {
  const commandMap: Record<string, string> = {
    use: `use ${itemId}`,
    equip: `equip ${itemId}`,
    drop: `drop ${itemId}`
  };
  
  const command = commandMap[action];
  if (command) {
    currentInput.value = command;
    sendCommand();
  }
};

// Handle map navigation
const handleMapNavigation = (direction: string) => {
  const directionMap: Record<string, string> = {
    north: 'n',
    south: 's',
    east: 'e',
    west: 'w',
    up: 'u',
    down: 'd'
  };
  
  currentInput.value = directionMap[direction] || direction;
  sendCommand();
};

// Toggle help overlay
const toggleHelp = () => {
  helpOpen.value = !helpOpen.value;
};

// Load player skills
const loadSkills = async () => {
  try {
    const response = await $fetch('/api/player/skills');
    if (response.success) {
      playerSkills.value = response.skills || [];
      if (response.playerClass) {
        playerState.value.class = response.playerClass;
      }
    }
  } catch (error) {
    console.error('Error loading skills:', error);
    addMessage('Không thể tải danh sách kỹ năng.', 'error');
  }
};

// Load player talents
const loadTalents = async () => {
  try {
    const response = await $fetch('/api/player/talents');
    if (response.success) {
      talentBranches.value = response.branches || [];
      allocatedTalents.value = response.allocatedTalents || {};
      playerState.value.class = response.playerClass;
      playerState.value.level = response.playerLevel;
      playerState.value.talentPoints = response.talentPoints;
    }
  } catch (error) {
    console.error('Error loading talents:', error);
    addMessage('Không thể tải bảng thiên phú.', 'error');
  }
};

// Handle skill assignment to hotkey
const handleAssignSkill = (skill: Skill) => {
  addMessage(`Đã gán kỹ năng [${skill.name}] (Tính năng hotkey đang phát triển)`, 'system');
};

// Handle talent allocation
const handleAllocateTalent = async (talentId: string) => {
  try {
    const response = await $fetch('/api/player/talents', {
      method: 'POST',
      body: { talentId }
    });
    
    if (response.success) {
      allocatedTalents.value = response.allocatedTalents;
      playerState.value.talentPoints = response.talentPoints;
      addMessage('Đã cộng điểm thiên phú thành công!', 'system');
      // Reload talents to update UI
      await loadTalents();
    }
  } catch (error: any) {
    console.error('Error allocating talent:', error);
    const errorMsg = error.data?.message || 'Không thể cộng điểm thiên phú.';
    addMessage(errorMsg, 'error');
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
    await clear();
    await router.push('/login');
    return;
  }

  // Handle help command
  if (input.toLowerCase() === 'help') {
    helpOpen.value = true;
    currentInput.value = '';
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
    // Show banner
    addMessage('═══════════════════════════════════════════════════', 'system');
    addMessage('    VONG TÍCH THÀNH - MUD', 'accent');
    addMessage('═══════════════════════════════════════════════════', 'system');
    addMessage('', 'normal');

    // Authenticate with user session - server will send actual room data
    ws.value?.send(JSON.stringify({
      type: 'auth',
      payload: {
        playerId: user.value?.id || 'demo-player',
        username: user.value?.username || 'Player'
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
              exp: payload.exp ?? playerState.value.exp,
              nextLevelExp: payload.nextLevelExp ?? playerState.value.nextLevelExp,
              gold: payload.gold ?? playerState.value.gold,
              inCombat: payload.inCombat ?? playerState.value.inCombat,
              stats: payload.stats ? {
                damage: payload.stats.damage ?? playerState.value.stats.damage,
                defense: payload.stats.defense ?? playerState.value.stats.defense,
                critChance: payload.stats.critChance ?? playerState.value.stats.critChance,
                critDamage: payload.stats.critDamage ?? playerState.value.stats.critDamage,
                lifesteal: payload.stats.lifesteal ?? playerState.value.stats.lifesteal,
                dodge: payload.stats.dodge ?? playerState.value.stats.dodge
              } : playerState.value.stats,
              inventoryItems: payload.inventoryItems || playerState.value.inventoryItems
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
        case 'room_occupants':
          // Update room occupants
          if (payload) {
            roomOccupants.value = {
              players: payload.players || [],
              npcs: payload.npcs || [],
              mobs: payload.mobs || []
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

// Handle theme change
const handleThemeChange = (themeId: string) => {
  // Remove all theme classes
  document.body.classList.remove('theme-vong-tich', 'theme-ho-phach', 'theme-co-ngu');
  // Add new theme class
  document.body.classList.add(`theme-${themeId}`);
};

// Handle font size change
const handleFontSizeChange = (sizeId: string) => {
  // Remove all font size classes
  document.body.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
  // Add new font size class
  document.body.classList.add(`font-size-${sizeId}`);
};

// Lifecycle hooks
onMounted(() => {
  focusInput();
  connectWebSocket();
  
  // Load saved theme
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem('game-theme');
    const savedFontSize = localStorage.getItem('game-font-size');
    
    if (savedTheme) {
      handleThemeChange(savedTheme);
    } else {
      // Default theme
      handleThemeChange('vong-tich');
    }
    
    if (savedFontSize) {
      handleFontSizeChange(savedFontSize);
    } else {
      // Default font size
      handleFontSizeChange('medium');
    }
  }
  
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

.main-output-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: rgba(0, 136, 0, 0.03);
  border: 1px solid rgba(0, 136, 0, 0.3);
  overflow: hidden;
  margin: 0.5rem;
  margin-bottom: 0;
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

.message-combat_log {
  color: var(--text-bright);
}

.input-area {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: var(--bg-black);
  border-top: 1px solid rgba(0, 136, 0, 0.3);
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

.input-field::placeholder {
  color: var(--text-dim);
  opacity: 0.6;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .main-output-pane {
    margin: 0.25rem;
  }

  .output-area {
    padding: 0.5rem;
    font-size: 16px;
  }

  .message {
    font-size: 16px;
    line-height: 1.3;
  }

  .input-area {
    padding: 0.4rem 0.75rem;
  }

  .prompt {
    font-size: 18px;
    margin-right: 0.4rem;
  }

  .input-field {
    font-size: 16px;
  }
}
</style>
