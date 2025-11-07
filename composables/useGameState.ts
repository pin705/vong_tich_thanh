import { ref, computed } from 'vue';
import type { ExitsState, RoomOccupantsState, SelectedTarget } from '~/types';

export interface Recipe {
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

export function useGameState() {
  // Device detection
  const isMobile = ref(false);
  const isTablet = ref(false);
  const isDesktop = ref(false);

  const updateDeviceType = () => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      isMobile.value = width < 768;
      isTablet.value = width >= 768 && width < 1024;
      isDesktop.value = width >= 1024;
    }
  };

  // Room state
  const exits = ref<ExitsState>({
    north: false,
    south: false,
    east: false,
    west: false,
    up: false,
    down: false
  });

  const currentRoomName = ref('Không rõ');
  const worldRooms = ref<any[]>([]);

  // Room occupants
  const roomOccupants = ref<RoomOccupantsState>({
    players: [],
    npcs: [],
    mobs: [],
    respawns: []
  });

  const selectedTarget = ref<SelectedTarget | null>(null);

  // Combat state
  const isInCombat = ref(false);
  const combatTarget = ref<any>(null);
  const playerCombatSkills = ref<any[]>([]);
  const playerCooldowns = ref<any[]>([]);
  const commandInputFocus = ref(false);

  const combatStatusText = computed(() => {
    if (!isInCombat.value) return '';
    if (commandInputFocus.value) {
      return 'Đang chờ lệnh... (Gõ "auto" để bật tự động tấn công)';
    }
    return 'Tự động tấn công đang hoạt động';
  });

  // Player settings
  const playerAutoCombat = ref(false);
  const playerCustomAliases = ref<Record<string, string>>({});

  // Skills and talents
  const playerSkills = ref<any[]>([]);
  const talentBranches = ref<any[]>([]);
  const allocatedTalents = ref<Record<string, number>>({});

  // Quests
  const playerQuests = ref<any[]>([]);

  // Trading data
  const tradingData = ref<{
    merchantName: string;
    merchantId: string;
    merchantItems: any[];
  }>({
    merchantName: '',
    merchantId: '',
    merchantItems: []
  });

  // Shop data
  const shopData = ref<{
    vendorId: string;
    vendorName: string;
    shopType: 'gold' | 'premium';
  }>({
    vendorId: '',
    vendorName: '',
    shopType: 'gold'
  });

  // Crafting data
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

  // Contextual popup data
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

  // Loading state
  const isLoading = ref(false);
  const loadingText = ref('Đang tải...');

  // Popup references
  const petPopupOpen = ref(false);
  const blacksmithPopupOpen = ref(false);
  const leaderboardOpen = ref(false);
  const guildInvitationPopupOpen = ref(false);

  return {
    // Device
    isMobile,
    isTablet,
    isDesktop,
    updateDeviceType,
    
    // Room
    exits,
    currentRoomName,
    worldRooms,
    roomOccupants,
    selectedTarget,
    
    // Combat
    isInCombat,
    combatTarget,
    playerCombatSkills,
    playerCooldowns,
    commandInputFocus,
    combatStatusText,
    
    // Settings
    playerAutoCombat,
    playerCustomAliases,
    
    // Skills & Talents
    playerSkills,
    talentBranches,
    allocatedTalents,
    
    // Quests
    playerQuests,
    
    // Trading & Shopping
    tradingData,
    shopData,
    craftingData,
    
    // Party & Guild
    partyState,
    partyInvitationData,
    guildInvitationData,
    
    // Contextual
    contextualPopupData,
    
    // Loading
    isLoading,
    loadingText,
    
    // Additional popups
    petPopupOpen,
    blacksmithPopupOpen,
    leaderboardOpen,
    guildInvitationPopupOpen
  };
}
