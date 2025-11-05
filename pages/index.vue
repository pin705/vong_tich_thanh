<template>
  <div class="terminal-container" @click="focusInput">
    <!-- Player Status Header -->
    <PlayerStatusHeader
      :hp="playerState.hp"
      :maxHp="playerState.maxHp"
      :resource="playerState.resource"
      :maxResource="playerState.maxResource"
      :currency="playerState.gold"
      :premiumCurrency="playerState.premiumCurrency"
    />

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

    <MapWorldOverlay
      :isOpen="mapPopupOpen"
      :exits="exits"
      :currentRoomName="currentRoomName"
      :rooms="worldRooms"
      @close="mapPopupOpen = false"
      @navigate="handleMapNavigation"
      @navigateTo="handleWorldMapNavigation"
    />

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



    <!-- Quest Tracker Overlay -->
    <QuestTrackerOverlay
      :isOpen="questsOpen"
      :quests="playerQuests"
      @close="questsOpen = false"
      @completeQuest="handleCompleteQuest"
      @abandonQuest="handleAbandonQuest"
      @repeatQuest="handleRepeatQuest"
      @trackQuest="handleTrackQuest"
    />

    <!-- Profession Choice Overlay -->
    <ProfessionChoiceOverlay
      :isOpen="professionChoiceOpen"
      @close="professionChoiceOpen = false"
      @chooseProfession="handleChooseProfession"
    />

    <!-- Trading Popup -->
    <TradingPopup
      :isOpen="tradingPopupOpen"
      :merchantName="tradingData.merchantName"
      :merchantItems="tradingData.merchantItems"
      :playerItems="playerState.inventoryItems"
      :playerGold="playerState.gold"
      @close="tradingPopupOpen = false"
      @buy="handleBuyItem"
      @sell="handleSellItem"
    />

    <!-- Party Popup -->
    <Popover
      :isOpen="partyPopupOpen"
      title="Quản Lý Nhóm"
      width="600px"
      @close="partyPopupOpen = false"
    >
      <PartyPopup
        :hasParty="partyState.hasParty"
        :partyMembers="partyState.members"
        :lootRule="partyState.lootRule"
        :currentPlayerId="user?.id || ''"
        :isLeader="partyState.isLeader"
        @memberClick="handlePartyMemberClick"
        @lootRuleChange="handleLootRuleChange"
        @leaveParty="handleLeaveParty"
      />
    </Popover>

    <!-- Party Invitation Popup -->
    <Popover
      :isOpen="partyInvitationPopupOpen"
      title="Lời Mời Nhóm"
      width="400px"
      @close="declinePartyInvitation"
    >
      <PartyInvitationPopup
        :inviterName="partyInvitationData.inviterName"
        :inviterClass="partyInvitationData.inviterClass"
        @accept="acceptPartyInvitation"
        @decline="declinePartyInvitation"
      />
    </Popover>

    <!-- Guild Popup -->
    <Popover
      :isOpen="guildPopupOpen"
      title="Bang Hội"
      width="700px"
      @close="guildPopupOpen = false"
    >
      <GuildOverlay
        @close="guildPopupOpen = false"
        @refresh="loadGuildInfo"
      />
    </Popover>

    <!-- Auction House Popup -->
    <Popover
      :isOpen="auctionHousePopupOpen"
      title="Chợ Đấu Giá"
      width="800px"
      @close="auctionHousePopupOpen = false"
    >
      <AuctionHouseOverlay
        :currentPlayerId="user?.id || ''"
        @close="auctionHousePopupOpen = false"
      />
    </Popover>

    <!-- Premium Shop Popup -->
    <PremiumShopPopup
      :isOpen="premiumShopPopupOpen"
      :playerPremiumCurrency="playerState.premiumCurrency"
      @close="premiumShopPopupOpen = false"
      @itemPurchased="handlePremiumItemPurchased"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue';
import type { Message, ChatMessage, PlayerState, TargetState, ExitsState, RoomOccupantsState, SelectedTarget, Skill } from '~/types';
import PlayerStatusHeader from '~/components/PlayerStatusHeader.vue';
import InventoryPane from '~/components/InventoryPane.vue';
import HelpOverlay from '~/components/HelpOverlay.vue';
import SkillbookOverlay from '~/components/SkillbookOverlay.vue';
import TalentTreeOverlay from '~/components/TalentTreeOverlay.vue';
import SettingsOverlay from '~/components/SettingsOverlay.vue';
import FooterTabBar from '~/components/FooterTabBar.vue';
import Popover from '~/components/Popover.vue';
import OccupantsListPopup from '~/components/OccupantsListPopup.vue';
import ContextualPopup from '~/components/ContextualPopup.vue';
import MapWorldOverlay from '~/components/MapWorldOverlay.vue';
import QuestTrackerOverlay from '~/components/QuestTrackerOverlay.vue';
import ProfessionChoiceOverlay from '~/components/ProfessionChoiceOverlay.vue';
import TradingPopup from '~/components/TradingPopup.vue';
import PremiumShopPopup from '~/components/PremiumShopPopup.vue';

definePageMeta({
  middleware: 'auth'
});

const { user, clear } = useUserSession();
const router = useRouter();

// Responsive layout detection (Phase 15.1)
const isMobile = ref(false);
const isTablet = ref(false);
const isDesktop = ref(false);

// Detect device type
const updateDeviceType = () => {
  if (typeof window !== 'undefined') {
    const width = window.innerWidth;
    isMobile.value = width < 768;
    isTablet.value = width >= 768 && width < 1024;
    isDesktop.value = width >= 1024;
  }
};

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
const worldMapOpen = ref(false);
const questsOpen = ref(false);
const professionChoiceOpen = ref(false);

// Popup states
const inventoryPopupOpen = ref(false);
const mapPopupOpen = ref(false);
const occupantsPopupOpen = ref(false);
const contextualPopupOpen = ref(false);
const tradingPopupOpen = ref(false);
const partyPopupOpen = ref(false);
const partyInvitationPopupOpen = ref(false);
const guildPopupOpen = ref(false);
const auctionHousePopupOpen = ref(false);
const premiumShopPopupOpen = ref(false);
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

// Trading popup state
const tradingData = ref<{
  merchantName: string;
  merchantId: string;
  merchantItems: any[];
}>({
  merchantName: '',
  merchantId: '',
  merchantItems: []
});

// Party state
const partyState = ref<{
  hasParty: boolean;
  members: any[];
  lootRule: 'leader-only' | 'round-robin';
  isLeader: boolean;
}>({
  hasParty: false,
  members: [],
  lootRule: 'round-robin',
  isLeader: false
});

// Party invitation data
const partyInvitationData = ref<{
  inviterId: string;
  inviterName: string;
  inviterClass: string;
  partyId: string;
}>({
  inviterId: '',
  inviterName: '',
  inviterClass: 'mutant_warrior',
  partyId: ''
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
  premiumCurrency: 0,
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

// World map state
const currentRoomName = ref('Không rõ');
const worldRooms = ref<any[]>([]);

// Quest state
const playerQuests = ref<any[]>([]);

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
    case 'worldmap':
      // Load world map data before opening
      await loadWorldMap();
      mapPopupOpen.value = true;
      break;
    case 'occupants':
      occupantsPopupOpen.value = true;
      break;
    case 'inventory':
      inventoryPopupOpen.value = true;
      break;
    case 'party':
      partyPopupOpen.value = true;
      break;
    case 'guild':
      guildPopupOpen.value = true;
      break;
    case 'auction':
      auctionHousePopupOpen.value = true;
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
    case 'quests':
      await loadQuests();
      questsOpen.value = true;
      break;
  }
};

// Handle entity selection from occupants list
const handleEntitySelect = (type: 'player' | 'npc' | 'mob', entity: { id: string; name: string }) => {
  selectedTarget.value = { type, id: entity.id, name: entity.name };
  
  // Prepare contextual popup data
  const actions = getActionsForEntity(type, entity.name, entity.id);
  
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
const handleContextualAction = async (action: { command: string }) => {
  // Check if this is a trade action
  if (action.command.startsWith('__trade__:')) {
    const parts = action.command.split(':');
    const merchantId = parts[1];
    const merchantName = parts[2];
    
    // Load merchant shop data
    await loadMerchantShop(merchantId, merchantName);
    tradingPopupOpen.value = true;
  } else if (action.command.startsWith('__premium_shop__:')) {
    // Open premium shop
    premiumShopPopupOpen.value = true;
  } else {
    // Execute normal command
    currentInput.value = action.command;
    sendCommand();
  }
};

// Get actions for entity type
const getActionsForEntity = (type: 'player' | 'npc' | 'mob', name: string, entityId: string) => {
  switch (type) {
    case 'npc':
      const actions = [
        { label: 'Nói Chuyện (Talk)', command: `talk ${name}`, disabled: false },
        { label: 'Xem Xét (Look)', command: `look ${name}`, disabled: false },
        { label: 'Giao Dịch (Trade)', command: `__trade__:${entityId}:${name}`, disabled: false },
        { label: 'Tấn Công (Attack)', command: `attack ${name}`, disabled: false }
      ];
      
      // Add premium shop action for "Thương Gia Bí Ẩn"
      if (name === 'Thương Gia Bí Ẩn') {
        actions.splice(2, 0, { 
          label: '💎 Cửa Hàng Cao Cấp', 
          command: `__premium_shop__:${entityId}:${name}`, 
          disabled: false 
        });
      }
      
      return actions;
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
        { label: 'Mời Vào Nhóm (Party)', command: `party invite ${name}`, disabled: false }
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

// Load world map
const loadWorldMap = async () => {
  try {
    const response = await $fetch('/api/world/map');
    if (response.success) {
      worldRooms.value = response.rooms || [];
      currentRoomName.value = response.currentRoomName || 'Không rõ';
    }
  } catch (error) {
    console.error('Error loading world map:', error);
    addMessage('Không thể tải bản đồ thế giới.', 'error');
    // Provide some default rooms so the UI doesn't break
    worldRooms.value = [];
  }
};

// Handle world map navigation
const handleWorldMapNavigation = (roomId: string) => {
  currentInput.value = `goto ${roomId}`;
  sendCommand();
};

// Load quests
const loadQuests = async () => {
  try {
    const response = await $fetch('/api/player/quests');
    if (response.success) {
      playerQuests.value = response.quests || [];
    }
  } catch (error) {
    console.error('Error loading quests:', error);
    addMessage('Không thể tải danh sách nhiệm vụ.', 'error');
    playerQuests.value = [];
  }
};

// Load guild information (placeholder for future functionality)
const loadGuildInfo = async () => {
  // This is called when guild overlay refreshes
  // Could be used to update guild-related UI elements in the future
};

// Handle quest completion
const handleCompleteQuest = async (questId: string) => {
  try {
    const response = await $fetch('/api/player/quests/complete', {
      method: 'POST',
      body: { questId }
    });
    
    if (response.success) {
      addMessage('Đã hoàn thành nhiệm vụ!', 'system');
      await loadQuests();
    }
  } catch (error: any) {
    console.error('Error completing quest:', error);
    const errorMsg = error.data?.message || 'Không thể hoàn thành nhiệm vụ.';
    addMessage(errorMsg, 'error');
  }
};

// Handle quest abandonment
const handleAbandonQuest = async (questId: string) => {
  try {
    const response = await $fetch('/api/player/quests/abandon', {
      method: 'POST',
      body: { questId }
    });
    
    if (response.success) {
      addMessage('Đã hủy bỏ nhiệm vụ.', 'system');
      await loadQuests();
    }
  } catch (error: any) {
    console.error('Error abandoning quest:', error);
    const errorMsg = error.data?.message || 'Không thể hủy bỏ nhiệm vụ.';
    addMessage(errorMsg, 'error');
  }
};

// Handle repeating quest
const handleRepeatQuest = async (questId: string) => {
  try {
    const response = await $fetch('/api/player/quests/repeat', {
      method: 'POST',
      body: { questId }
    });
    
    if (response.success) {
      addMessage('Đã nhận lại nhiệm vụ.', 'system');
      await loadQuests();
    }
  } catch (error: any) {
    console.error('Error repeating quest:', error);
    const errorMsg = error.data?.message || 'Không thể nhận lại nhiệm vụ.';
    addMessage(errorMsg, 'error');
  }
};

// Handle quest tracking
const handleTrackQuest = (questId: string) => {
  addMessage(`Đang theo dõi nhiệm vụ: ${questId}`, 'system');
};

// Handle profession choice
const handleChooseProfession = async (professionId: string) => {
  try {
    const response = await $fetch('/api/player/profession', {
      method: 'POST',
      body: { profession: professionId }
    });
    
    if (response.success) {
      addMessage(`Đã chọn nghề nghiệp: ${professionId}!`, 'system');
      professionChoiceOpen.value = false;
      // Reload quests to show the starting quest completion
      await loadQuests();
    }
  } catch (error: any) {
    console.error('Error choosing profession:', error);
    const errorMsg = error.data?.message || 'Không thể chọn nghề nghiệp.';
    addMessage(errorMsg, 'error');
  }
};

// Load merchant shop data
// TODO: Create dedicated API endpoint for merchant shop data
// Current workaround uses WebSocket "list" command which has limitations:
// - Side effects from command execution
// - No direct return of shop item data
// - Coupling with WebSocket protocol
const loadMerchantShop = async (merchantId: string, merchantName: string) => {
  tradingData.value = {
    merchantName,
    merchantId,
    merchantItems: [] // Will be populated via WebSocket response
  };
  
  // Temporary: Send list command via WebSocket
  // Future: Replace with: const items = await $fetch(`/api/merchant/${merchantId}/shop`)
  currentInput.value = 'list';
};

// Handle buy item
const handleBuyItem = (itemId: string) => {
  // Find the item name from merchant items
  const item = tradingData.value.merchantItems.find(i => i.id === itemId);
  if (item) {
    currentInput.value = `buy ${item.name}`;
    sendCommand();
    tradingPopupOpen.value = false;
  }
};

// Handle sell item
const handleSellItem = (itemId: string) => {
  // Find the item name from player inventory
  const item = playerState.value.inventoryItems.find(i => i && i.id === itemId);
  if (item) {
    currentInput.value = `sell ${item.name}`;
    sendCommand();
    tradingPopupOpen.value = false;
  }
};

// Handle premium item purchased
const handlePremiumItemPurchased = () => {
  // Refresh player state - will be updated via WebSocket
  // Force a refresh by sending a look command
  currentInput.value = 'look';
  sendCommand();
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
              mp: payload.mp ?? payload.resource ?? playerState.value.mp,
              maxMp: payload.maxMp ?? payload.maxResource ?? playerState.value.maxMp,
              resource: payload.resource ?? playerState.value.resource ?? 0,
              maxResource: payload.maxResource ?? playerState.value.maxResource ?? 100,
              level: payload.level ?? playerState.value.level,
              exp: payload.exp ?? playerState.value.exp,
              nextLevelExp: payload.nextLevelExp ?? playerState.value.nextLevelExp,
              gold: payload.currency ?? payload.gold ?? playerState.value.gold,
              premiumCurrency: payload.premiumCurrency ?? playerState.value.premiumCurrency,
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
        case 'party_invitation':
          // Received party invitation
          if (payload) {
            partyInvitationData.value = {
              inviterId: payload.inviterId,
              inviterName: payload.inviterName,
              inviterClass: payload.inviterClass || 'mutant_warrior',
              partyId: payload.partyId
            };
            partyInvitationPopupOpen.value = true;
          }
          break;
        case 'party_state':
          // Update party state
          if (payload) {
            partyState.value = {
              hasParty: payload.hasParty || false,
              members: payload.members || [],
              lootRule: payload.lootRule || 'round-robin',
              isLeader: payload.isLeader || false
            };
          }
          break;
        case 'chat':
          // Handle chat messages with categories
          if (data.category === 'party') {
            // Party chat - display in main output with special formatting
            addMessage(`[Nhóm][${data.user}]: ${data.message}`, 'party_chat');
          } else {
            // Other chat types
            addMessage(data.message || payload, 'chat_log', data.user);
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

// Theme and font size constants
const THEME_IDS = ['vong-tich', 'ho-phach', 'co-ngu'] as const;
const FONT_SIZE_IDS = ['small', 'medium', 'large'] as const;
const DEFAULT_THEME = 'vong-tich';
const DEFAULT_FONT_SIZE = 'medium';

// Handle theme change
const handleThemeChange = (themeId: string) => {
  // Remove all theme classes
  THEME_IDS.forEach(id => document.body.classList.remove(`theme-${id}`));
  // Add new theme class
  document.body.classList.add(`theme-${themeId}`);
};

// Handle font size change
const handleFontSizeChange = (sizeId: string) => {
  // Remove all font size classes
  FONT_SIZE_IDS.forEach(id => document.body.classList.remove(`font-size-${id}`));
  // Add new font size class
  document.body.classList.add(`font-size-${sizeId}`);
};

// Party handlers
const handlePartyMemberClick = (member: any) => {
  // Open contextual popup for party member
  const actions = [
    { label: 'Thăng Nhóm Trưởng', command: `party promote ${member.name}`, disabled: !partyState.value.isLeader },
    { label: 'Mời Khỏi Nhóm', command: `party kick ${member.name}`, disabled: !partyState.value.isLeader },
    { label: 'Chat Riêng', command: `say Xin chào ${member.name}!`, disabled: false }
  ];
  
  contextualPopupData.value = {
    title: `${member.name} (Thành viên nhóm)`,
    entityType: 'player',
    entityData: {
      description: `Thành viên nhóm - Level ${member.level || 1}`,
      hp: member.hp,
      maxHp: member.maxHp
    },
    actions
  };
  
  partyPopupOpen.value = false;
  contextualPopupOpen.value = true;
};

const handleLootRuleChange = (rule: 'leader-only' | 'round-robin') => {
  currentInput.value = `party loot ${rule}`;
  sendCommand();
};

const handleLeaveParty = () => {
  currentInput.value = 'party leave';
  sendCommand();
  partyPopupOpen.value = false;
};

const acceptPartyInvitation = () => {
  currentInput.value = 'party accept';
  sendCommand();
  partyInvitationPopupOpen.value = false;
};

const declinePartyInvitation = () => {
  currentInput.value = 'party decline';
  sendCommand();
  partyInvitationPopupOpen.value = false;
};

// Lifecycle hooks
onMounted(() => {
  focusInput();
  connectWebSocket();
  
  // Initialize device type detection
  updateDeviceType();
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateDeviceType);
  }
  
  // Load saved theme and font size
  if (typeof window !== 'undefined') {
    try {
      const savedTheme = localStorage.getItem('game-theme');
      const savedFontSize = localStorage.getItem('game-font-size');
      
      // Apply saved theme or default
      handleThemeChange(savedTheme || DEFAULT_THEME);
      
      // Apply saved font size or default
      handleFontSizeChange(savedFontSize || DEFAULT_FONT_SIZE);
    } catch (error) {
      console.warn('Failed to load preferences, using defaults:', error);
      handleThemeChange(DEFAULT_THEME);
      handleFontSizeChange(DEFAULT_FONT_SIZE);
    }
  }
  
  // Always keep focus on input
  document.addEventListener('click', focusInput);
});

onUnmounted(() => {
  document.removeEventListener('click', focusInput);
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateDeviceType);
  }
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
  color: var(--theme-text-error);
}

.message-system {
  color: var(--theme-text-system);
}

.message-combat_log {
  color: var(--text-bright);
}

.message-party_chat {
  color: #4da6ff; /* Light blue for party chat */
}

/* Semantic Message Types (Phase 15) */
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

.message-loot {
  color: var(--theme-text-loot);
}

.message-xp {
  color: var(--theme-text-xp);
}

.message-critical {
  color: var(--theme-text-critical);
  font-weight: bold;
  text-shadow: 0 0 5px currentColor;
}

.message-chat_say {
  color: var(--theme-text-chat-say);
}

.message-chat_guild {
  color: var(--theme-text-chat-guild);
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
