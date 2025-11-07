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
  channel?: 'main' | 'combat' | 'chat';
}

const MAX_MAIN_LOG_MESSAGES = 500;
const MAX_COMBAT_LOG_MESSAGES = 300;
const MAX_CHAT_MESSAGES = 200;

export function useGameMessages() {
  const mainLog = ref<Message[]>([]);
  const combatLog = ref<Message[]>([]);
  const chatLog = ref<Message[]>([]);
  
  const mainUnread = ref(false);
  const combatUnread = ref(false);
  const chatUnread = ref(false);
  
  const currentChannel = ref<'main' | 'combat' | 'chat'>('main');
  
  // Generate unique message ID
  const generateId = () => `msg-${Date.now()}-${Math.random()}`;
  
  function addMessage(
    text: string,
    type: string,
    user?: string,
    channel: 'main' | 'combat' | 'chat' = 'main',
    category?: string
  ) {
    const message: Message = {
      id: generateId(),
      text,
      type,
      user,
      channel,
      category,
      timestamp: new Date()
    };
    
    if (channel === 'combat') {
      combatLog.value.push(message);
      if (combatLog.value.length > MAX_COMBAT_LOG_MESSAGES) {
        combatLog.value = combatLog.value.slice(-MAX_COMBAT_LOG_MESSAGES);
      }
      if (currentChannel.value !== 'combat') {
        combatUnread.value = true;
      }
    } else if (channel === 'chat') {
      // Route to chat log if explicitly specified as chat channel OR if type is chat_log
      chatLog.value.push(message);
      if (chatLog.value.length > MAX_CHAT_MESSAGES) {
        chatLog.value = chatLog.value.slice(-MAX_CHAT_MESSAGES);
      }
      if (currentChannel.value !== 'chat') {
        chatUnread.value = true;
      }
    } else if (type === 'chat_log') {
      // Backward compatibility: route chat_log types to chat channel
      chatLog.value.push(message);
      if (chatLog.value.length > MAX_CHAT_MESSAGES) {
        chatLog.value = chatLog.value.slice(-MAX_CHAT_MESSAGES);
      }
      if (currentChannel.value !== 'chat') {
        chatUnread.value = true;
      }
    } else {
      mainLog.value.push(message);
      if (mainLog.value.length > MAX_MAIN_LOG_MESSAGES) {
        mainLog.value = mainLog.value.slice(-MAX_MAIN_LOG_MESSAGES);
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
      id: generateId(),
      text,
      type,
      clickable: true,
      entityType,
      entityId,
      timestamp: new Date()
    };
    
    if (channel === 'combat') {
      combatLog.value.push(message);
      if (combatLog.value.length > MAX_COMBAT_LOG_MESSAGES) {
        combatLog.value = combatLog.value.slice(-MAX_COMBAT_LOG_MESSAGES);
      }
      if (currentChannel.value !== 'combat') {
        combatUnread.value = true;
      }
    } else {
      mainLog.value.push(message);
      if (mainLog.value.length > MAX_MAIN_LOG_MESSAGES) {
        mainLog.value = mainLog.value.slice(-MAX_MAIN_LOG_MESSAGES);
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
  
  function setCurrentChannel(channel: 'main' | 'combat' | 'chat') {
    currentChannel.value = channel;
    clearChannelUnread(channel);
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
    clearChannelUnread,
    setCurrentChannel
  };
}
