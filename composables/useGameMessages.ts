import { ref, type Ref } from 'vue';

export interface Message {
  id?: string;
  text: string;
  type: string;
  category?: string;
  clickable?: boolean;
  entityType?: string;
  entityId?: string;
  timestamp: Date | string;
  user?: string;
  channel?: 'main' | 'chat';
}

const MAX_MAIN_LOG_MESSAGES = 800; // Increased to accommodate both main and combat messages
const MAX_CHAT_MESSAGES = 200;

export function useGameMessages() {
  const mainLog = ref<Message[]>([]);
  const chatLog = ref<Message[]>([]);
  
  const mainUnread = ref(false);
  const chatUnread = ref(false);
  
  const currentChannel = ref<'main' | 'chat'>('main');
  
  // Generate unique message ID
  const generateId = () => `msg-${Date.now()}-${Math.random()}`;
  
  // Helper function to add message to chat log
  function addToChatLog(message: Message) {
    chatLog.value.push(message);
    if (chatLog.value.length > MAX_CHAT_MESSAGES) {
      chatLog.value = chatLog.value.slice(-MAX_CHAT_MESSAGES);
    }
    if (currentChannel.value !== 'chat') {
      chatUnread.value = true;
    }
  }
  
  function addMessage(
    text: string,
    type: string,
    user?: string,
    channel: 'main' | 'combat' | 'chat' = 'main',
    category?: string
  ) {
    // Add category prefix based on message category
    let prefixedText = text;
    if (category && text) {
      const prefix = getCategoryPrefix(category);
      if (prefix) {
        prefixedText = `${prefix} ${text}`;
      }
    }
    
    const message: Message = {
      id: generateId(),
      text: prefixedText,
      type,
      user,
      channel: channel === 'combat' ? 'main' : channel, // Merge combat into main
      category,
      timestamp: new Date()
    };
    
    if (channel === 'chat' || type === 'chat_log') {
      // Route to chat log if explicitly specified as chat channel OR if type is chat_log (backward compatibility)
      addToChatLog(message);
    } else {
      // All main and combat messages go to mainLog
      mainLog.value.push(message);
      if (mainLog.value.length > MAX_MAIN_LOG_MESSAGES) {
        mainLog.value = mainLog.value.slice(-MAX_MAIN_LOG_MESSAGES);
      }
      if (currentChannel.value !== 'main') {
        mainUnread.value = true;
      }
    }
  }
  
  // Helper function to get category prefix
  function getCategoryPrefix(category: string): string {
    const prefixMap: Record<string, string> = {
      'npc': '[NPC]',
      'boss': '[BOSS]',
      'world-boss': '[WORLD BOSS]',
      'player': '[PLAYER]',
      'mob': '[MOB]',
      'party': '[PARTY]',
      'guild': '[GUILD]',
      'system': '[SYSTEM]',
      'quest': '[QUEST]',
      'achievement': '[ACHIEVEMENT]',
      'loot': '[LOOT]',
      'xp': '[XP]',
      'level': '[LEVEL UP]',
      'combat-player': '', // No prefix for player's own combat actions
      'combat-enemy': '[ENEMY]',
    };
    return prefixMap[category] || '';
  }
  
  function addClickableMessage(
    text: string,
    type: string,
    entityType: string,
    entityId: string,
    channel: 'main' | 'combat' | 'chat' = 'main'
  ) {
    const message: Message = {
      id: generateId(),
      text,
      type,
      clickable: true,
      entityType,
      entityId,
      timestamp: new Date(),
      channel: channel === 'combat' ? 'main' : channel // Merge combat into main
    };
    
    // All messages go to mainLog (combat merged with main)
    mainLog.value.push(message);
    if (mainLog.value.length > MAX_MAIN_LOG_MESSAGES) {
      mainLog.value = mainLog.value.slice(-MAX_MAIN_LOG_MESSAGES);
    }
    if (currentChannel.value !== 'main') {
      mainUnread.value = true;
    }
  }
  
  function clearChannelUnread(channel: 'main' | 'chat') {
    if (channel === 'main') {
      mainUnread.value = false;
    } else if (channel === 'chat') {
      chatUnread.value = false;
    }
  }
  
  function setCurrentChannel(channel: 'main' | 'chat') {
    currentChannel.value = channel;
    clearChannelUnread(channel);
  }
  
  return {
    mainLog,
    chatLog,
    mainUnread,
    chatUnread,
    currentChannel,
    addMessage,
    addClickableMessage,
    clearChannelUnread,
    setCurrentChannel
  };
}
