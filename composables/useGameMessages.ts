import { ref, type Ref } from 'vue';

export interface Message {
  text: string;
  type: string;
  category?: string;
  clickable?: boolean;
  entityType?: string;
  entityId?: string;
  timestamp: string;
}

const MAX_MAIN_LOG_MESSAGES = 500;
const MAX_COMBAT_LOG_MESSAGES = 300;

export function useGameMessages() {
  const mainLog = ref<Message[]>([]);
  const combatLog = ref<Message[]>([]);
  const chatLog = ref<Message[]>([]);
  
  const mainUnread = ref(false);
  const combatUnread = ref(false);
  const chatUnread = ref(false);
  
  const currentChannel = ref<'main' | 'combat' | 'chat'>('main');
  
  function addMessage(
    text: string,
    type: string,
    category?: string,
    channel: 'main' | 'combat' | 'chat' = 'main',
    messageCategory?: string
  ) {
    const message: Message = {
      text,
      type,
      category: messageCategory || category,
      timestamp: new Date().toISOString()
    };
    
    if (channel === 'combat') {
      combatLog.value.push(message);
      if (combatLog.value.length > MAX_COMBAT_LOG_MESSAGES) {
        combatLog.value.shift();
      }
      if (currentChannel.value !== 'combat') {
        combatUnread.value = true;
      }
    } else if (channel === 'chat') {
      chatLog.value.push(message);
      // Chat has unlimited history (limited by storage)
      if (currentChannel.value !== 'chat') {
        chatUnread.value = true;
      }
    } else {
      mainLog.value.push(message);
      if (mainLog.value.length > MAX_MAIN_LOG_MESSAGES) {
        mainLog.value.shift();
      }
      if (currentChannel.value !== 'main') {
        mainUnread.value = true;
      }
    }
  }
  
  function addClickableMessage(
    text: string,
    type: string,
    entityType: string,
    entityId: string,
    channel: 'main' | 'combat' | 'chat' = 'main'
  ) {
    const message: Message = {
      text,
      type,
      clickable: true,
      entityType,
      entityId,
      timestamp: new Date().toISOString()
    };
    
    if (channel === 'combat') {
      combatLog.value.push(message);
      if (combatLog.value.length > MAX_COMBAT_LOG_MESSAGES) {
        combatLog.value.shift();
      }
      if (currentChannel.value !== 'combat') {
        combatUnread.value = true;
      }
    } else {
      mainLog.value.push(message);
      if (mainLog.value.length > MAX_MAIN_LOG_MESSAGES) {
        mainLog.value.shift();
      }
      if (currentChannel.value !== 'main') {
        mainUnread.value = true;
      }
    }
  }
  
  function clearChannelUnread(channel: 'main' | 'combat' | 'chat') {
    if (channel === 'main') {
      mainUnread.value = false;
    } else if (channel === 'combat') {
      combatUnread.value = false;
    } else if (channel === 'chat') {
      chatUnread.value = false;
    }
  }
  
  return {
    mainLog,
    combatLog,
    chatLog,
    mainUnread,
    combatUnread,
    chatUnread,
    currentChannel,
    addMessage,
    addClickableMessage,
    clearChannelUnread
  };
}
