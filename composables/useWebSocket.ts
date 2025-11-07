import { ref, computed } from 'vue';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed';

interface ReconnectionConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

interface WebSocketOptions {
  url?: string;
  reconnection?: ReconnectionConfig;
  heartbeatInterval?: number;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  onMessage?: (data: any) => void;
}

const defaultReconnectionConfig: ReconnectionConfig = {
  maxAttempts: 10,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 1.5
};

export const useWebSocket = (options: WebSocketOptions = {}) => {
  const ws = ref<WebSocket | null>(null);
  const connectionState = ref<ConnectionState>('disconnected');
  const reconnectAttempts = ref(0);
  const lastConnectedTime = ref<number>(0);
  
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let isManualDisconnect = false;

  const reconnectionConfig = { ...defaultReconnectionConfig, ...options.reconnection };
  const heartbeatInterval = options.heartbeatInterval || 30000;

  const isConnected = computed(() => connectionState.value === 'connected');
  const isReconnecting = computed(() => connectionState.value === 'reconnecting');
  const canReconnect = computed(() => reconnectAttempts.value < reconnectionConfig.maxAttempts);

  const calculateReconnectDelay = (): number => {
    const delay = reconnectionConfig.initialDelay * 
      Math.pow(reconnectionConfig.backoffFactor, reconnectAttempts.value);
    return Math.min(delay, reconnectionConfig.maxDelay);
  };

  const startHeartbeat = () => {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    
    heartbeatTimer = setInterval(() => {
      if (ws.value && ws.value.readyState === WebSocket.OPEN) {
        try {
          ws.value.send(JSON.stringify({ type: 'ping' }));
        } catch (error) {
          console.error('Heartbeat failed:', error);
        }
      }
    }, heartbeatInterval);
  };

  const stopHeartbeat = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  };

  const clearReconnectTimer = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const connect = (url?: string) => {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    const wsUrl = url || options.url || (() => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${window.location.host}/ws`;
    })();

    try {
      connectionState.value = reconnectAttempts.value > 0 ? 'reconnecting' : 'connecting';
      ws.value = new WebSocket(wsUrl);

      ws.value.onopen = () => {
        connectionState.value = 'connected';
        reconnectAttempts.value = 0;
        lastConnectedTime.value = Date.now();
        clearReconnectTimer();
        startHeartbeat();
        
        if (options.onOpen) {
          options.onOpen();
        }
      };

      ws.value.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle pong for heartbeat
          if (data.type === 'pong') {
            return;
          }

          if (options.onMessage) {
            options.onMessage(data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.value.onerror = (error) => {
        console.error('WebSocket error:', error);
        
        if (options.onError) {
          options.onError(error);
        }
      };

      ws.value.onclose = () => {
        stopHeartbeat();
        
        if (!isManualDisconnect) {
          connectionState.value = 'disconnected';
          
          if (options.onClose) {
            options.onClose();
          }

          // Attempt reconnection
          if (canReconnect.value) {
            const delay = calculateReconnectDelay();
            console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.value + 1}/${reconnectionConfig.maxAttempts})`);
            
            connectionState.value = 'reconnecting';
            reconnectAttempts.value++;
            
            reconnectTimer = setTimeout(() => {
              connect();
            }, delay);
          } else {
            connectionState.value = 'failed';
            console.error('Max reconnection attempts reached');
          }
        } else {
          connectionState.value = 'disconnected';
          isManualDisconnect = false;
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      connectionState.value = 'failed';
    }
  };

  const disconnect = () => {
    isManualDisconnect = true;
    clearReconnectTimer();
    stopHeartbeat();
    
    if (ws.value) {
      if (ws.value.readyState === WebSocket.OPEN || ws.value.readyState === WebSocket.CONNECTING) {
        ws.value.close();
      }
      ws.value = null;
    }
    
    connectionState.value = 'disconnected';
    reconnectAttempts.value = 0;
  };

  const send = (data: any): boolean => {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      try {
        const message = typeof data === 'string' ? data : JSON.stringify(data);
        ws.value.send(message);
        return true;
      } catch (error) {
        console.error('Failed to send message:', error);
        return false;
      }
    }
    console.warn('WebSocket not connected. Message not sent.');
    return false;
  };

  const reconnect = () => {
    disconnect();
    reconnectAttempts.value = 0;
    setTimeout(() => connect(), 100);
  };

  const getConnectionInfo = () => {
    return {
      state: connectionState.value,
      reconnectAttempts: reconnectAttempts.value,
      maxReconnectAttempts: reconnectionConfig.maxAttempts,
      lastConnectedTime: lastConnectedTime.value,
      uptime: lastConnectedTime.value > 0 ? Date.now() - lastConnectedTime.value : 0
    };
  };

  return {
    ws,
    connectionState,
    isConnected,
    isReconnecting,
    canReconnect,
    reconnectAttempts,
    connect,
    disconnect,
    send,
    reconnect,
    getConnectionInfo
  };
};
