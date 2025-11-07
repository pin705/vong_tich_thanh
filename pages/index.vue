<template>
  <div class="terminal-container" @click="focusInput">
    <!-- Player Status Header -->
    <PlayerStatusHeader
      :name="playerState?.name"
      :level="playerState.level"
      :hp="playerState.hp"
      :maxHp="playerState.maxHp"
      :resource="playerState.resource"
      :maxResource="playerState.maxResource"
      :currency="playerState.gold"
      :premiumCurrency="playerState.premiumCurrency"
    />

    <!-- Main Content Area with Side Panel for Desktop -->
    <div class="main-content-wrapper">
      <!-- Main Output Area with Channel Tabs -->
      <div class="main-output-pane">
        <!-- Tab Selector -->
        <TabSelector
          :tabs="channelTabs"
          :currentTab="currentChannel"
          @tabChange="handleChannelChange"
        />
        
        <!-- Content Area for Active Tab -->
        <div class="channel-content">
          <MainLogPane v-if="currentChannel === 'main'" :messages="mainLog" @clickElement="handleClickableElement" />
          <CombatLogPane v-else-if="currentChannel === 'combat'" :messages="combatLog" />
          <ChatLogPane 
            v-else-if="currentChannel === 'chat'" 
            :messages="chatLog" 
            @sendChatCommand="handleChatCommand"
          />

            <!-- Combat View (shown when in combat) -->
          <!-- <CombatView
            v-if="isInCombat && currentChannel === 'combat'"
            :player="{
              name: playerState.name,
              hp: playerState.hp,
              maxHp: playerState.maxHp,
              resource: playerState.resource,
              maxResource: playerState.maxResource
            }"
            :target="combatTarget"
            :combatStatus="combatStatusText"
            :skills="playerCombatSkills"
            :cooldowns="playerCooldowns"
          /> -->
        </div>
      </div>

      <!-- Side Panel for Occupants (Desktop Only) -->
      <div v-if="isDesktop" class="side-panel">
        <RoomOccupantsPane
          :players="roomOccupants.players"
          :npcs="roomOccupants.npcs"
          :mobs="roomOccupants.mobs"
          :respawns="roomOccupants.respawns"
          :selectedTarget="selectedTarget"
          @selectTarget="handleEntitySelect"
        />
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
        @keydown.tab.prevent="handleTabCompletion"
        @input="resetTabCompletion"
        @keydown.ctrl.h.prevent="toggleHelp"
        @keydown.meta.h.prevent="toggleHelp"
        @keydown.f1.prevent="toggleHelp"
        @focus="commandInputFocus = true"
        @blur="commandInputFocus = false"
        autocomplete="off"
        spellcheck="false"
      />
    </div>

    <!-- Footer Tab Bar (5-10%) -->
    <FooterTabBar @tabClick="handleTabClick" :hasUnreadMail="playerState.hasUnreadMail" />

    <!-- Mobile Floating Action Menu (Mobile/Tablet Only) -->
    <MobileFloatingMenu
      :isMobileOrTablet="isMobile || isTablet"
      @openOccupants="occupantsPopupOpen = true"
      @openMap="handleTabClick('map')"
      @openInventory="inventoryPopupOpen = true"
    />

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
    
    <!-- Character Menu Overlay -->
    <CharacterMenuOverlay
      :isOpen="characterMenuOpen"
      :playerName="playerState.name"
      :level="playerState.level"
      :exp="playerState.exp"
      :nextLevelExp="playerState.nextLevelExp"
      :hp="playerState.hp"
      :maxHp="playerState.maxHp"
      :resource="playerState.resource"
      :maxResource="playerState.maxResource"
      :gold="playerState.gold"
      :premiumCurrency="playerState.premiumCurrency"
      :profession="playerState.profession"
      :stats="playerState.stats"
      :skills="playerSkills"
      :branches="talentBranches"
      :allocatedTalents="allocatedTalents"
      :talentPoints="playerState.talentPoints || 0"
      :inventoryItems="playerState.inventoryItems"
      @close="characterMenuOpen = false"
      @assignSkill="handleAssignSkill"
      @allocateTalent="handleAllocateTalent"
      @openProfessionChoice="handleOpenProfessionChoice"
      @inventoryAction="handleInventoryAction"
    />
    
    <!-- Settings Overlay -->
    <SettingsOverlay
      :isOpen="settingsOpen"
      :autoCombat="playerAutoCombat"
      :aliases="playerCustomAliases"
      @close="settingsOpen = false"
      @themeChange="handleThemeChange"
      @fontSizeChange="handleFontSizeChange"
      @autoCombatChange="handleAutoCombatChange"
      @aliasesChange="handleAliasesChange"
    />



    <!-- Quest Tracker Overlay -->
    <QuestTrackerOverlay
      :isOpen="questsOpen"
      :quests="playerQuests"
      @close="questsOpen = false"
      @acceptQuest="handleAcceptQuest"
      @completeQuest="handleCompleteQuest"
      @abandonQuest="handleAbandonQuest"
      @repeatQuest="handleRepeatQuest"
      @trackQuest="handleTrackQuest"
    />

    <!-- Leaderboard Overlay -->
    <LeaderboardOverlay
      :isOpen="leaderboardOpen"
      @close="leaderboardOpen = false"
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

    <!-- Guild Invitation Popup -->
    <Popover
      :isOpen="guildInvitationPopupOpen"
      title="Lời Mời Bang Hội"
      width="450px"
      @close="declineGuildInvitation"
    >
      <GuildInvitationPopup
        :guildName="guildInvitationData.guildName"
        :guildTag="guildInvitationData.guildTag"
        :inviterName="guildInvitationData.inviterName"
        @accept="acceptGuildInvitation"
        @decline="declineGuildInvitation"
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

    <!-- Mail Popup -->
    <MailPopup
      :isOpen="mailPopupOpen"
      @close="mailPopupOpen = false"
      @mailUpdated="handleMailUpdated"
    />

    <!-- Pet Popup -->
    <PetOverlay
      :isOpen="petPopupOpen"
      @close="petPopupOpen = false"
    />

    <!-- Crafting Popup -->
    <CraftingPopup
      :isOpen="craftingPopupOpen"
      :knownRecipes="craftingData.knownRecipes"
      :inventory="playerState.inventoryItems"
      :loading="craftingData.loading"
      @close="craftingPopupOpen = false"
      @craft="handleCraft"
    />

    <!-- Shop Popup (Phase 25: Vendor System) -->
    <ShopPopup
      ref="shopPopupRef"
      :isOpen="shopPopupOpen"
      :vendorId="shopData.vendorId"
      :vendorName="shopData.vendorName"
      :shopType="shopData.shopType"
      :playerGold="playerState.gold"
      :playerPremiumCurrency="playerState.premiumCurrency"
      :playerInventory="playerState.inventoryItems"
      @close="shopPopupOpen = false"
      @sendCommand="sendCommandFromShop"
      @itemPurchased="handleShopTransaction"
    />

    <!-- Loading Indicator -->
    <LoadingIndicator :isLoading="isLoading" :text="loadingText" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue';
import type { Message, ChatMessage, PlayerState, TargetState, ExitsState, RoomOccupantsState, SelectedTarget, Skill } from '~/types';

// Recipe interface for crafting
interface Recipe {
  id: string;
  name: string;
  description: string;
  quality?: string;
  resultName: string;
  materials: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;
}

import PlayerStatusHeader from '~/components/PlayerStatusHeader.vue';
import InventoryPane from '~/components/InventoryPane.vue';
import HelpOverlay from '~/components/HelpOverlay.vue';
import CharacterMenuOverlay from '~/components/CharacterMenuOverlay.vue';
import SettingsOverlay from '~/components/SettingsOverlay.vue';
import FooterTabBar from '~/components/FooterTabBar.vue';
import Popover from '~/components/Popover.vue';
import OccupantsListPopup from '~/components/OccupantsListPopup.vue';
import ContextualPopup from '~/components/ContextualPopup.vue';
import MapWorldOverlay from '~/components/MapWorldOverlay.vue';
import QuestTrackerOverlay from '~/components/QuestTrackerOverlay.vue';
import ProfessionChoiceOverlay from '~/components/ProfessionChoiceOverlay.vue';
import TradingPopup from '~/components/TradingPopup.vue';
import CraftingPopup from '~/components/CraftingPopup.vue';
import PremiumShopPopup from '~/components/PremiumShopPopup.vue';
import ShopPopup from '~/components/ShopPopup.vue';
import MailPopup from '~/components/MailPopup.vue';
import PetOverlay from '~/components/PetOverlay.vue';
import LeaderboardOverlay from '~/components/LeaderboardOverlay.vue';
import TabSelector from '~/components/TabSelector.vue';
import MainLogPane from '~/components/MainLogPane.vue';
import CombatLogPane from '~/components/CombatLogPane.vue';
import ChatLogPane from '~/components/ChatLogPane.vue';
import RoomOccupantsPane from '~/components/RoomOccupantsPane.vue';
import LoadingIndicator from '~/components/LoadingIndicator.vue';
import CombatView from '~/components/CombatView.vue';
import MobileFloatingMenu from '~/components/MobileFloatingMenu.vue';

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

// Channel tabs state (Phase 27)
const currentChannel = ref<'main' | 'combat' | 'chat'>('main');
const mainLog = ref<Message[]>([]);
const combatLog = ref<Message[]>([]);
const chatLog = ref<Message[]>([]);
const mainUnread = ref(false);
const combatUnread = ref(false);
const chatUnread = ref(false);

// Chat persistence constants
const CHAT_STORAGE_KEY = 'vong-tich-thanh-chat-log';
const MAX_CHAT_MESSAGES = 200; // Limit stored messages to prevent localStorage overflow

// Command history constants
const COMMAND_HISTORY_STORAGE_KEY = 'vong-tich-thanh-command-history';
const MAX_COMMAND_HISTORY = 100; // Limit stored commands

// Message limits to prevent accumulation
const MAX_MAIN_LOG_MESSAGES = 500; // Keep last 500 messages in main log
const MAX_COMBAT_LOG_MESSAGES = 100; // Keep last 100 messages in combat log for better performance

// Load chat messages from localStorage
const loadChatFromStorage = () => {
  if (typeof window === 'undefined') return;
  
  try {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Restore messages with Date objects
      chatLog.value = parsed.map((msg: Message) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
    }
  } catch (error) {
    console.error('Failed to load chat from storage:', error);
  }
};

// Save chat messages to localStorage
const saveChatToStorage = () => {
  if (typeof window === 'undefined') return;
  
  try {
    // Keep only the most recent messages
    const messagesToSave = chatLog.value.slice(-MAX_CHAT_MESSAGES);
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messagesToSave));
  } catch (error) {
    console.error('Failed to save chat to storage:', error);
  }
};

// Load command history from localStorage
const loadCommandHistoryFromStorage = () => {
  if (typeof window === 'undefined') return;
  
  try {
    const stored = localStorage.getItem(COMMAND_HISTORY_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      commandHistory.value = Array.isArray(parsed) ? parsed : [];
    }
  } catch (error) {
    console.error('Failed to load command history from storage:', error);
  }
};

// Save command history to localStorage
const saveCommandHistoryToStorage = () => {
  if (typeof window === 'undefined') return;
  
  try {
    // Keep only the most recent commands
    const commandsToSave = commandHistory.value.slice(-MAX_COMMAND_HISTORY);
    localStorage.setItem(COMMAND_HISTORY_STORAGE_KEY, JSON.stringify(commandsToSave));
  } catch (error) {
    console.error('Failed to save command history to storage:', error);
  }
};

// Channel tabs configuration
const channelTabs = computed(() => [
  { id: 'main', label: 'Chính', hasUnread: mainUnread.value },
  { id: 'combat', label: 'Chiến Đấu', hasUnread: combatUnread.value },
  { id: 'chat', label: 'Chat', hasUnread: chatUnread.value }
]);

// Combat status text
const combatStatusText = computed(() => {
  if (!isInCombat.value) return '';
  if (commandInputFocus.value) {
    return 'Đang chờ lệnh... (Gõ "auto" để bật tự động tấn công)';
  }
  return 'Tự động tấn công đang hoạt động';
});

// Handle channel tab change
const handleChannelChange = (channelId: string) => {
  currentChannel.value = channelId as 'main' | 'combat' | 'chat';
  
  // Clear unread indicator for the selected channel
  if (channelId === 'main') {
    mainUnread.value = false;
  } else if (channelId === 'combat') {
    combatUnread.value = false;
  } else if (channelId === 'chat') {
    chatUnread.value = false;
  }
};

// State
const messages = ref<Message[]>([]);
const chatMessages = ref<ChatMessage[]>([]);
const currentInput = ref('');
const commandHistory = ref<string[]>([]);
const historyIndex = ref(-1);
const tempInput = ref(''); // Store current input when navigating history

// Tab completion state
const tabCompletionMatches = ref<string[]>([]);
const tabCompletionIndex = ref(-1);
const tabCompletionPrefix = ref('');

const outputArea = ref<HTMLElement | null>(null);
const inputField = ref<HTMLInputElement | null>(null);
const ws = ref<WebSocket | null>(null);
const isConnected = ref(false);
const helpOpen = ref(false);
const characterMenuOpen = ref(false);
const settingsOpen = ref(false);
const worldMapOpen = ref(false);
const questsOpen = ref(false);
const professionChoiceOpen = ref(false);
const leaderboardOpen = ref(false);

// Player settings state
const playerAutoCombat = ref(false);
const playerCustomAliases = ref<Record<string, string>>({});

// Popup states
const inventoryPopupOpen = ref(false);
const mapPopupOpen = ref(false);
const occupantsPopupOpen = ref(false);
const contextualPopupOpen = ref(false);
const tradingPopupOpen = ref(false);
const partyPopupOpen = ref(false);
const partyInvitationPopupOpen = ref(false);
const guildPopupOpen = ref(false);
const guildInvitationPopupOpen = ref(false);
const auctionHousePopupOpen = ref(false);
const premiumShopPopupOpen = ref(false);
const craftingPopupOpen = ref(false);
const shopPopupOpen = ref(false);
const mailPopupOpen = ref(false);
const petPopupOpen = ref(false);
const shopPopupRef = ref<InstanceType<typeof ShopPopup> | null>(null);

// Loading state
const isLoading = ref(false);
const loadingText = ref('Đang tải...');

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

// Shop popup state (Phase 25: Vendor System)
const shopData = ref<{
  vendorId: string;
  vendorName: string;
  shopType: 'gold' | 'premium';
}>({
  vendorId: '',
  vendorName: '',
  shopType: 'gold'
});

// Crafting state
const craftingData = ref<{
  knownRecipes: Recipe[];
  loading: boolean;
}>({
  knownRecipes: [],
  loading: false
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

// Guild invitation data
const guildInvitationData = ref<{
  guildId: string;
  guildName: string;
  guildTag: string;
  inviterId: string;
  inviterName: string;
}>({
  guildId: '',
  guildName: '',
  guildTag: '',
  inviterId: '',
  inviterName: ''
});

// Skills and talents state
const playerSkills = ref<Skill[]>([]);
const talentBranches = ref<any[]>([]);
const allocatedTalents = ref<Record<string, number>>({});

// Room occupants state
const roomOccupants = ref<RoomOccupantsState>({
  players: [],
  npcs: [],
  mobs: [],
  respawns: []
});

// Selected target for actions
const selectedTarget = ref<SelectedTarget | null>(null);

// Combat state
const isInCombat = ref(false);
const combatTarget = ref<any>(null);
const playerCombatSkills = ref<Skill[]>([]);
const playerCooldowns = ref<any[]>([]);
const commandInputFocus = ref(false);

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

// Generate unique message ID
const generateId = () => `msg-${Date.now()}-${Math.random()}`;

// Add message to appropriate channel
const addMessage = (text: string, type: Message['type'] = 'normal', user?: string, channel?: 'main' | 'combat' | 'chat', category?: string) => {
  const message: Message = {
    id: generateId(),
    text,
    type,
    timestamp: new Date(),
    user,
    channel,
    category
  };
  
  // Route to appropriate log based on channel
  if (channel === 'combat') {
    combatLog.value.push(message);
    // Trim combat log if it exceeds limit
    if (combatLog.value.length > MAX_COMBAT_LOG_MESSAGES) {
      combatLog.value = combatLog.value.slice(-MAX_COMBAT_LOG_MESSAGES);
    }
    // Set unread indicator if not on combat tab
    if (currentChannel.value !== 'combat') {
      combatUnread.value = true;
    }
  } else if (channel === 'chat' || type === 'chat_log') {
    chatLog.value.push(message);
    // Trim chat log if it exceeds limit
    if (chatLog.value.length > MAX_CHAT_MESSAGES) {
      chatLog.value = chatLog.value.slice(-MAX_CHAT_MESSAGES);
    }
    // Save chat to localStorage
    saveChatToStorage();
    // Set unread indicator if not on chat tab
    if (currentChannel.value !== 'chat') {
      chatUnread.value = true;
    }
  } else {
    // Default to main channel
    mainLog.value.push(message);
    // Trim main log if it exceeds limit
    if (mainLog.value.length > MAX_MAIN_LOG_MESSAGES) {
      mainLog.value = mainLog.value.slice(-MAX_MAIN_LOG_MESSAGES);
    }
    // Set unread indicator if not on main tab
    if (currentChannel.value !== 'main') {
      mainUnread.value = true;
    }
  }
  
  // Keep legacy messages array for backward compatibility
  messages.value.push(message);
};

// Get CSS class for message type
const getMessageClass = (message: Message) => {
  return `message message-${message.type}`;
};

// Render clickable items in loot messages
const renderClickableItems = (text: string): string => {
  // Match item names in brackets like [Cỏ Chữa Lành] or [Đuôi Chuột]
  const itemRegex = /\[([^\]]+)\]/g;
  let counter = 0;
  return text.replace(itemRegex, (match, itemName) => {
    // Sanitize item name to prevent XSS
    const sanitizedName = itemName.replace(/[<>"'&]/g, (char) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '&': '&amp;'
      };
      return entities[char] || char;
    });
    // Create a clickable span with unique ID for event handling
    const itemId = `clickable-item-${Date.now()}-${counter++}`;
    // Store the item name for event handling
    setTimeout(() => {
      const element = document.getElementById(itemId);
      if (element) {
        element.addEventListener('click', () => handleItemClick(sanitizedName));
      }
    }, 0);
    return `<span id="${itemId}" class="clickable-item">[${sanitizedName}]</span>`;
  });
};

// Handle item click from loot messages
const handleItemClick = async (itemName: string) => {
  // Check if item is in player's inventory
  const item = playerState.value.inventoryItems.find(i => i && i.name === itemName);
  
  if (!item) {
    addMessage(`Vật phẩm [${itemName}] không có trong túi đồ.`, 'system');
    return;
  }
  
  // Open contextual popup for the item
  const actions = [
    { label: 'Xem Xét (Look)', command: `look ${itemName}`, disabled: false },
    { label: 'Sử Dụng (Use)', command: `use ${itemName}`, disabled: item.type !== 'consumable' },
    { label: 'Vứt Bỏ (Drop)', command: `drop ${itemName}`, disabled: false }
  ];
  
  contextualPopupData.value = {
    title: `${itemName} (${item.type})`,
    entityType: null,
    entityData: {
      description: item.description,
      stats: item.stats
    },
    actions
  };
  
  contextualPopupOpen.value = true;
};

// Focus input field (but not when clicking on certain elements)
const focusInput = (event?: MouseEvent) => {
  // Don't focus if clicking on input elements, buttons, or interactive elements
  if (event && event.target) {
    const target = event.target as HTMLElement;
    // Check if clicked element or any parent is an input, button, or has contenteditable
    if (target.closest && target.closest('input, textarea, button, select, [contenteditable="true"], .chat-input-area')) {
      return;
    }
  }
  
  if (inputField.value) {
    inputField.value.focus();
  }
};

// Handle tab bar clicks
const handleTabClick = async (tabId: string) => {
  try {
    switch (tabId) {
      case 'map':
      case 'worldmap':
        // Load world map data before opening
        isLoading.value = true;
        loadingText.value = 'Đang tải bản đồ...';
        await loadWorldMap();
        mapPopupOpen.value = true;
        break;
      case 'occupants':
        occupantsPopupOpen.value = true;
        break;
      case 'party':
        partyPopupOpen.value = true;
        break;
      case 'guild':
        guildPopupOpen.value = true;
        break;
      case 'mail':
        mailPopupOpen.value = true;
        break;
      case 'auction':
        auctionHousePopupOpen.value = true;
        break;
      case 'character':
        // Load skills and talents data before opening
        isLoading.value = true;
        loadingText.value = 'Đang tải thông tin nhân vật...';
        await loadSkills();
        await loadTalents();
        characterMenuOpen.value = true;
        break;
      case 'leaderboard':
        leaderboardOpen.value = true;
        break;
      case 'settings':
        settingsOpen.value = true;
        break;
      case 'quests':
        isLoading.value = true;
        loadingText.value = 'Đang tải nhiệm vụ...';
        await loadQuests();
        questsOpen.value = true;
        break;
      case 'pet':
        petPopupOpen.value = true;
        break;
    }
  } finally {
    isLoading.value = false;
  }
};

// Handle entity selection from occupants list
const handleEntitySelect = (type: 'player' | 'npc' | 'mob', entity: { id: string; name: string }) => {
  if (!entity || !entity.id) return;
  console.log('Entity selected:', type, entity);
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
  } else if (action.command.startsWith('__vendor_shop__:')) {
    // Phase 25: Vendor System - Open vendor shop
    const parts = action.command.split(':');
    const vendorId = parts[1];
    const vendorName = parts[2];
    const shopType = parts[3] as 'gold' | 'premium';
    
    shopData.value = {
      vendorId,
      vendorName,
      shopType
    };
    shopPopupOpen.value = true;
  } else if (action.command.startsWith('__crafting__:')) {
    // Open crafting menu
    isLoading.value = true;
    loadingText.value = 'Đang tải công thức chế tạo...';
    await loadCraftingRecipes();
    craftingPopupOpen.value = true;
    isLoading.value = false;
  } else if (action.command.startsWith('__pet_menu__:')) {
    // Open pet menu
    petPopupOpen.value = true;
  } else if (action.command.startsWith('__arena__:')) {
    // Open arena (could add arena popup in the future)
    addMessage('Tính năng đấu trường đang được phát triển.', 'system');
  } else if (action.command.startsWith('__guild_menu__:')) {
    // Open guild menu
    guildPopupOpen.value = true;
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
        { label: 'Xem Xét (Look)', command: `look ${name}`, disabled: false }
      ];
      
      // Add specific actions based on NPC name
      // Vendors and shops
      if (name === 'Thương Gia') {
        actions.push({ 
          label: 'Xem Cửa Hàng (Shop)', 
          command: `__vendor_shop__:${entityId}:${name}:gold`, 
          disabled: false 
        });
      }
      
      if (name === 'Thương Gia Bí Ẩn') {
        actions.push({ 
          label: 'Cửa Hàng Cao Cấp', 
          command: `__vendor_shop__:${entityId}:${name}:premium`, 
          disabled: false 
        });
      }
      
      if (name === 'Thợ Rèn') {
        actions.push({ 
          label: 'Chế Tạo (Craft)', 
          command: `__crafting__:${entityId}:${name}`, 
          disabled: false 
        });
      }
      
      // Pet related NPCs
      if (name === 'Huấn Luyện Sư Kito' || name.includes('Huấn Luyện')) {
        actions.push({ 
          label: 'Quản Lý Thú Cưng', 
          command: `__pet_menu__:${entityId}:${name}`, 
          disabled: false 
        });
      }
      
      // Arena manager
      if (name === 'Quản Lý Đấu Trường' || name.includes('Arena')) {
        actions.push({ 
          label: 'Tham Gia Đấu Trường', 
          command: `__arena__:${entityId}:${name}`, 
          disabled: false 
        });
      }
      
      // Guild related NPCs
      if (name === 'Già Làng' || name.includes('Guild')) {
        actions.push({ 
          label: 'Quản Lý Bang Hội', 
          command: `__guild_menu__:${entityId}:${name}`, 
          disabled: false 
        });
      }
      
      // Add trade and attack as default options for most NPCs
      actions.push({ label: 'Giao Dịch (Trade)', command: `__trade__:${entityId}:${name}`, disabled: false });
      actions.push({ label: 'Tấn Công (Attack)', command: `attack ${name}`, disabled: false });
      
      return actions;
    case 'mob':
      return [
        { label: 'Tấn Công (Attack)', command: `attack ${name}`, disabled: false },
        { label: 'Xem Xét (Look)', command: `look ${name}`, disabled: false }
      ];
    case 'player':
      const playerActions = [
        { label: 'Nói Chuyện (Say)', command: `say Xin chào ${name}!`, disabled: false },
        { label: 'Xem Xét (Look)', command: `look ${name}`, disabled: false },
        { label: 'Giao Dịch (Trade)', command: `trade ${name}`, disabled: true },
        { label: 'Mời Vào Nhóm (Party)', command: `party invite ${name}`, disabled: false }
      ];
      
      // Add guild invite action if player is in a guild and has permission
      // We'll need to check this from playerState
      if (playerState.value.guild) {
        playerActions.push({
          label: 'Mời Vào Bang (Guild)',
          command: `guild invite ${name}`,
          disabled: false
        });
      }
      
      return playerActions;
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

// Handle clickable elements in main log
const handleClickableElement = (element: string, type: 'direction' | 'entity' | 'item') => {
  console.log('Clicked element:', element, 'type:', type);
  
  if (type === 'direction') {
    // Map Vietnamese directions to commands
    const directionMap: Record<string, string> = {
      'bắc': 'n',
      'nam': 's',
      'đông': 'e',
      'tây': 'w',
      'lên': 'u',
      'xuống': 'd',
      'north': 'n',
      'south': 's',
      'east': 'e',
      'west': 'w',
      'up': 'u',
      'down': 'd'
    };
    
    const command = directionMap[element.toLowerCase()] || element;
    currentInput.value = command;
    sendCommand();
  } else if (type === 'entity') {
    // For NPCs, mobs, players - open contextual menu
    const entityName = element;
    const playersInRoom = roomOccupants.value.players;
    const npcsInRoom = roomOccupants.value.npcs;
    const mobsInRoom = roomOccupants.value.mobs;
    
    // Check if it's an NPC
    const npc = npcsInRoom.find((n: any) => n.name === entityName);
    if (npc) {
      handleEntitySelect('npc', { id: npc.id, name: npc.name });
      return;
    }
    
    // Check if it's a mob
    const mob = mobsInRoom.find((m: any) => m.name === entityName);
    if (mob) {
      handleEntitySelect('mob', { id: mob.id, name: mob.name });
      return;
    }
    
    // Check if it's a player
    const player = playersInRoom.find((p: any) => p.name === entityName);
    if (player) {
      handleEntitySelect('player', { id: player.id, name: player.name });
      return;
    }
    
    // If not found in current room data, just look at it
    currentInput.value = `look ${entityName}`;
    sendCommand();
  } else if (type === 'item') {
    // For items, try to get or look at them
    currentInput.value = `look ${element}`;
    sendCommand();
  }
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
  isLoading.value = true;
  loadingText.value = 'Đang cộng điểm thiên phú...';
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
  } finally {
    isLoading.value = false;
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

// Load crafting recipes
const loadCraftingRecipes = async () => {
  craftingData.value.loading = true;
  try {
    const response = await $fetch('/api/player/crafting/recipes');
    if (response.success) {
      craftingData.value.knownRecipes = response.recipes || [];
    }
  } catch (error) {
    console.error('Error loading crafting recipes:', error);
    addMessage('Không thể tải công thức chế tạo.', 'error');
    craftingData.value.knownRecipes = [];
  } finally {
    craftingData.value.loading = false;
  }
};

// Handle crafting
const handleCraft = async (recipeId: string) => {
  isLoading.value = true;
  loadingText.value = 'Đang chế tạo...';
  try {
    const response = await $fetch('/api/player/crafting/craft', {
      method: 'POST',
      body: { recipeId }
    });
    
    if (response.success) {
      addMessage(`Đã chế tạo thành công: ${response.itemName}`, 'system');
      await loadCraftingRecipes();
      // Refresh inventory
      if (ws.value && ws.value.readyState === WebSocket.OPEN) {
        ws.value.send(JSON.stringify({ type: 'command', command: 'inventory' }));
      }
    }
  } catch (error: any) {
    console.error('Error crafting:', error);
    const errorMsg = error?.data?.message || error?.message || 'Không thể chế tạo vật phẩm.';
    addMessage(errorMsg, 'error');
  } finally {
    isLoading.value = false;
  }
};

// Handle quest acceptance
const handleAcceptQuest = async (questId: string) => {
  isLoading.value = true;
  loadingText.value = 'Đang nhận nhiệm vụ...';
  try {
    const response = await $fetch('/api/player/quests/accept', {
      method: 'POST',
      body: { questId }
    });
    
    if (response.success) {
      addMessage(response.message || 'Đã nhận nhiệm vụ!', 'system');
      await loadQuests();
    } else {
      addMessage(response.message || 'Không thể nhận nhiệm vụ.', 'error');
    }
  } catch (error: any) {
    console.error('Error accepting quest:', error);
    const errorMsg = error.data?.message || 'Không thể nhận nhiệm vụ.';
    addMessage(errorMsg, 'error');
  } finally {
    isLoading.value = false;
  }
};

// Handle quest completion
const handleCompleteQuest = async (questId: string) => {
  isLoading.value = true;
  loadingText.value = 'Đang hoàn thành nhiệm vụ...';
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
  } finally {
    isLoading.value = false;
  }
};

// Handle quest abandonment
const handleAbandonQuest = async (questId: string) => {
  isLoading.value = true;
  loadingText.value = 'Đang hủy nhiệm vụ...';
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
  } finally {
    isLoading.value = false;
  }
};

// Handle repeating quest
const handleRepeatQuest = async (questId: string) => {
  isLoading.value = true;
  loadingText.value = 'Đang nhận nhiệm vụ...';
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
  } finally {
    isLoading.value = false;
  }
};

// Handle quest tracking
const handleTrackQuest = (questId: string) => {
  addMessage(`Đang theo dõi nhiệm vụ: ${questId}`, 'system');
};

// Handle profession choice
const handleChooseProfession = async (professionId: string) => {
  isLoading.value = true;
  loadingText.value = 'Đang chọn nghề nghiệp...';
  try {
    const response = await $fetch('/api/player/profession', {
      method: 'POST',
      body: { profession: professionId }
    });
    
    if (response.success) {
      addMessage(`Đã chọn nghề nghiệp: ${professionId}!`, 'system');
      professionChoiceOpen.value = false;
      // Update player state profession
      playerState.value.profession = professionId;
      // Reload quests to show the starting quest completion
      await loadQuests();
    }
  } catch (error: any) {
    console.error('Error choosing profession:', error);
    const errorMsg = error.data?.message || 'Không thể chọn nghề nghiệp.';
    addMessage(errorMsg, 'error');
  } finally {
    isLoading.value = false;
  }
};

// Handle opening profession choice from character menu
const handleOpenProfessionChoice = () => {
  characterMenuOpen.value = false;
  professionChoiceOpen.value = true;
};

// Load merchant shop data
const loadMerchantShop = async (merchantId: string, merchantName: string) => {
  tradingData.value = {
    merchantName,
    merchantId,
    merchantItems: [] // Will be populated via WebSocket response
  };
  
  // Send WebSocket message to get shop data
  if (ws.value && ws.value.readyState === WebSocket.OPEN) {
    ws.value.send(JSON.stringify({
      type: 'get_shop',
      payload: {
        vendorId: merchantId
      }
    }));
  }
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

// Handle mail updates (Phase 27: Mail System)
const handleMailUpdated = async () => {
  // Check if there are any unread mails
  try {
    const response = await $fetch('/api/mail/inbox');
    if (response.success) {
      const hasUnread = response.mails.some((mail: any) => !mail.isRead);
      playerState.value.hasUnreadMail = hasUnread;
    }
  } catch (error) {
    console.error('Error checking unread mails:', error);
  }
};

// Phase 25: Vendor System - Shop handlers
const sendCommandFromShop = (command: string) => {
  currentInput.value = command;
  sendCommand();
};

const handleShopTransaction = () => {
  // Refresh inventory after buying/selling
  setTimeout(() => {
    currentInput.value = 'i';
    sendCommand();
  }, 300);
};

// Navigate command history
const navigateHistory = (direction: number) => {
  if (commandHistory.value.length === 0) return;
  
  // Save current input when first navigating up from typing
  if (historyIndex.value === -1 && direction === -1) {
    tempInput.value = currentInput.value;
  }
  
  historyIndex.value += direction;
  
  // Going down past the end - restore temp input and reset index
  if (historyIndex.value < -1) {
    historyIndex.value = -1;
    currentInput.value = tempInput.value;
    return;
  }
  
  // Going up past the beginning - stay at first command
  if (historyIndex.value >= commandHistory.value.length) {
    historyIndex.value = commandHistory.value.length - 1;
    return;
  }
  
  // At position -1 (no history selected) - show temp input
  if (historyIndex.value === -1) {
    currentInput.value = tempInput.value;
    return;
  }
  
  // Show command from history (newest = 0, oldest = length-1)
  currentInput.value = commandHistory.value[commandHistory.value.length - 1 - historyIndex.value];
};

// Handle tab completion
const handleTabCompletion = (event: KeyboardEvent) => {
  event.preventDefault();
  
  const input = currentInput.value.trim();
  if (!input) return;
  
  // Parse the input to get command and target prefix
  const parts = input.split(' ');
  if (parts.length < 2) return; // Need at least "command target"
  
  const command = parts[0];
  const targetPrefix = parts[parts.length - 1].toLowerCase();
  
  // If this is a new tab press (different prefix or first time)
  if (tabCompletionPrefix.value !== targetPrefix) {
    // Collect all possible targets from the room
    const targets: string[] = [];
    
    // Add players
    roomOccupants.value.players.forEach((player: any) => {
      if (player.name.toLowerCase().startsWith(targetPrefix)) {
        targets.push(player.name);
      }
    });
    
    // Add NPCs
    roomOccupants.value.npcs.forEach((npc: any) => {
      if (npc.name.toLowerCase().startsWith(targetPrefix)) {
        targets.push(npc.name);
      }
    });
    
    // Add mobs
    roomOccupants.value.mobs.forEach((mob: any) => {
      if (mob.name.toLowerCase().startsWith(targetPrefix)) {
        targets.push(mob.name);
      }
    });
    
    // Add items from inventory if command is "use", "drop", or "equip"
    if (['use', 'sử', 'dụng', 'drop', 'vứt', 'equip', 'trang'].includes(command.toLowerCase())) {
      playerState.value.inventoryItems.forEach((item: any) => {
        if (item?.name?.toLowerCase().startsWith(targetPrefix)) {
          targets.push(item.name);
        }
      });
    }
    
    // Remove duplicates and sort
    tabCompletionMatches.value = [...new Set(targets)].sort();
    tabCompletionIndex.value = 0;
    tabCompletionPrefix.value = targetPrefix;
  } else if (tabCompletionMatches.value.length > 0) {
    // Cycle to next match (only if we have matches)
    tabCompletionIndex.value = (tabCompletionIndex.value + 1) % tabCompletionMatches.value.length;
  }
  
  // Apply completion if we have matches
  if (tabCompletionMatches.value.length > 0) {
    const completedTarget = tabCompletionMatches.value[tabCompletionIndex.value];
    // Replace the last word with the completed target
    const commandParts = parts.slice(0, -1);
    commandParts.push(completedTarget);
    currentInput.value = commandParts.join(' ');
  }
};

// Reset tab completion state when user types
const resetTabCompletion = (event: Event) => {
  // Only reset on actual text input changes
  const inputEvent = event as InputEvent;
  const inputType = inputEvent.inputType;
  
  // Reset only for text insertion or deletion events
  if (inputType && (inputType === 'insertText' || inputType === 'deleteContentBackward' || inputType === 'deleteContentForward')) {
    tabCompletionMatches.value = [];
    tabCompletionIndex.value = -1;
    tabCompletionPrefix.value = '';
  }
};

// Handle chat command from chat panel
const handleChatCommand = (command: string) => {
  currentInput.value = command;
  sendCommand();
};

// Send command via WebSocket
const sendCommand = async () => {
  let input = currentInput.value.trim();
  if (!input) return;

  // Apply custom aliases before processing
  const firstWord = input.split(' ')[0];
  if (playerCustomAliases.value[firstWord]) {
    const remainder = input.slice(firstWord.length).trim();
    input = remainder ? `${playerCustomAliases.value[firstWord]} ${remainder}` : playerCustomAliases.value[firstWord];
  }

  // Add to command history (store original command, not alias-expanded)
  const originalInput = currentInput.value.trim();
  if (commandHistory.value[commandHistory.value.length - 1] !== originalInput) {
    commandHistory.value.push(originalInput);
    // Limit history size
    if (commandHistory.value.length > MAX_COMMAND_HISTORY) {
      commandHistory.value = commandHistory.value.slice(-MAX_COMMAND_HISTORY);
    }
    // Save to localStorage
    saveCommandHistoryToStorage();
  }
  historyIndex.value = -1;
  tempInput.value = '';

  // Echo command (show expanded version if alias was used)
  if (input !== originalInput) {
    addMessage(`> ${originalInput} → ${input}`, 'system');
  } else {
    addMessage(`> ${input}`, 'system');
  }

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
    // Show improved welcome banner
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
      const { type, message, payload, channel, category } = data;

      switch (type) {
        case 'normal':
          addMessage(message || payload, 'normal', undefined, channel || 'main', category);
          break;
        case 'action':
          addMessage(message || payload, 'action', undefined, channel || 'main', category);
          break;
        case 'accent':
          addMessage(message || payload, 'accent', undefined, channel || 'main', category);
          break;
        case 'error':
          addMessage(message || payload, 'error', undefined, channel || 'main', category);
          break;
        case 'system':
          addMessage(message || payload, 'system', undefined, channel || 'main', category);
          break;
        case 'combat_log':
          addMessage(message || payload, 'combat_log', undefined, 'combat', category);
          break;
        // Combat-specific message types
        case 'damage_in':
          addMessage(message || payload, 'damage_in', undefined, channel || 'combat', category);
          break;
        case 'damage_out':
          addMessage(message || payload, 'damage_out', undefined, channel || 'combat', category);
          break;
        case 'heal':
          addMessage(message || payload, 'heal', undefined, channel || 'combat', category);
          break;
        case 'critical':
          addMessage(message || payload, 'critical', undefined, channel || 'combat', category);
          break;
        case 'xp':
          addMessage(message || payload, 'xp', undefined, channel || 'combat', category);
          break;
        case 'loot':
          addMessage(message || payload, 'loot', undefined, channel || 'combat', category);
          break;
        case 'chat_log':
          addMessage(message || payload.message, 'chat_log', payload.user, 'chat', category);
          break;
        case 'room':
          if (payload.name) {
            addMessage('', 'normal', undefined, 'main', 'room-description');
            addMessage(`[${payload.name}]`, 'accent', undefined, 'main', 'room-description');
          }
          if (payload.description) {
            addMessage(payload.description, 'normal', undefined, 'main', 'room-description');
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
              profession: payload.profession ?? playerState.value.profession,
              inCombat: payload.inCombat ?? playerState.value.inCombat,
              hasUnreadMail: payload.hasUnreadMail ?? playerState.value.hasUnreadMail ?? false,
              guild: payload.guild ?? playerState.value.guild,
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
              mobs: payload.mobs || [],
              respawns: payload.respawns || []
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
        case 'guild_invitation':
          // Received guild invitation
          if (payload) {
            guildInvitationData.value = {
              guildId: payload.guildId,
              guildName: payload.guildName,
              guildTag: payload.guildTag,
              inviterId: payload.inviterId,
              inviterName: payload.inviterName
            };
            guildInvitationPopupOpen.value = true;
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
        case 'new_mail':
          // Handle new mail notification
          playerState.value.hasUnreadMail = true;
          addMessage('[!] Bạn có thư mới!', 'system', undefined, 'main', 'system');
          break;
        case 'shop_data':
          // Handle merchant shop data for trading popup
          if (payload && payload.success) {
            tradingData.value.merchantItems = (payload.items || []).map((item: any) => ({
              id: item._id,
              name: item.name,
              description: item.description,
              type: item.type,
              value: item.price || 0,
              stats: item.stats,
              levelRequirement: item.requiredLevel,
              equipped: false
            }));
            tradingData.value.merchantName = payload.vendor?.name || tradingData.value.merchantName;
            tradingData.value.merchantId = payload.vendor?.id || tradingData.value.merchantId;
          }
          break;
        case 'chat':
          // Handle chat messages with categories - route to chat channel
          addMessage(data.message || payload, 'chat_log', data.user, 'chat', data.category || 'say');
          break;
        case 'combat-start':
          // Handle combat start
          if (payload || data) {
            isInCombat.value = true;
            combatTarget.value = data.targetData || payload.targetData || null;
            playerCombatSkills.value = data.playerSkills || payload.playerSkills || [];
            playerCooldowns.value = data.playerCooldowns || payload.playerCooldowns || [];
          }
          break;
        case 'combat-end':
          // Handle combat end
          isInCombat.value = false;
          combatTarget.value = null;
          playerCombatSkills.value = [];
          playerCooldowns.value = [];
          break;
        case 'skill-cooldown-update':
          // Update skill cooldowns
          if (data.cooldowns || payload?.cooldowns) {
            playerCooldowns.value = data.cooldowns || payload.cooldowns;
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

// Handle auto-combat setting change
const handleAutoCombatChange = (enabled: boolean) => {
  playerAutoCombat.value = enabled;
};

// Handle custom aliases change
const handleAliasesChange = (aliases: Record<string, string>) => {
  playerCustomAliases.value = aliases;
};

// Load player settings from server
const loadPlayerSettings = async () => {
  try {
    const response = await $fetch('/api/player/info');
    if (response.success && response.player) {
      playerAutoCombat.value = response.player.autoCombat || false;
      playerCustomAliases.value = response.player.customAliases || {};
    }
  } catch (error) {
    console.error('Failed to load player settings:', error);
  }
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

const acceptGuildInvitation = async () => {
  isLoading.value = true;
  loadingText.value = 'Đang xử lý...';
  try {
    const response = await $fetch('/api/guild/accept', {
      method: 'POST',
    });
    if (response.success) {
      guildInvitationPopupOpen.value = false;
      addMessage('Bạn đã gia nhập bang hội!', 'system');
      await loadGuildInfo();
    }
  } catch (error: any) {
    console.error('Failed to accept guild invitation:', error);
    addMessage(error.data?.statusMessage || 'Lỗi khi chấp nhận lời mời.', 'error');
  } finally {
    isLoading.value = false;
  }
};

const declineGuildInvitation = async () => {
  isLoading.value = true;
  loadingText.value = 'Đang xử lý...';
  try {
    await $fetch('/api/guild/decline', {
      method: 'POST',
    });
    guildInvitationPopupOpen.value = false;
  } catch (error) {
    console.error('Failed to decline guild invitation:', error);
    guildInvitationPopupOpen.value = false;
  } finally {
    isLoading.value = false;
  }
};

// Lifecycle hooks
onMounted(() => {
  focusInput();
  connectWebSocket();
  
  // Load chat history from localStorage
  loadChatFromStorage();
  
  // Load command history from localStorage
  loadCommandHistoryFromStorage();
  
  // Load player settings
  loadPlayerSettings();
  
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
  /* Center and limit max width */
  max-width: 1024px;
  margin: 0 auto;
}

.main-content-wrapper {
  flex: 1;
  display: flex;
  overflow: hidden;
  margin: 0.5rem;
  margin-bottom: 0;
  gap: 0.5rem;
}

.main-output-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(0, 136, 0, 0.3);
  overflow: hidden;
  min-width: 0; /* Important for flex shrinking */
}

.side-panel {
  width: 280px;
  min-width: 280px;
  max-width: 350px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.channel-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: rgba(0, 136, 0, 0.03);
}

/* Clickable items in loot messages */
.clickable-item {
  cursor: pointer;
  text-decoration: underline;
  color: var(--text-accent);
  transition: color 0.2s;
}

.clickable-item:hover {
  color: var(--text-bright);
  text-shadow: 0 0 3px currentColor;
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

/* Mobile and Tablet - hide side panel */
@media (max-width: 1023px) {
  .side-panel {
    display: none;
  }

  .main-content-wrapper {
    margin: 0.25rem;
  }
}

/* Desktop - optimize for wide screens */
@media (min-width: 1024px) {
  .main-content-wrapper {
    max-width: none; /* Remove any max-width constraints */
  }

  .main-output-pane {
    max-width: none;
  }

  /* Wider side panel on large screens */
  @media (min-width: 1440px) {
    .side-panel {
      width: 320px;
      min-width: 320px;
    }
  }

  /* Even wider on ultra-wide screens */
  @media (min-width: 1920px) {
    .side-panel {
      width: 380px;
      min-width: 380px;
    }
  }
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .main-content-wrapper {
    margin: 0.25rem;
  }

  .main-output-pane {
    margin: 0;
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
