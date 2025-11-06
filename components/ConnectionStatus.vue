<template>
  <Transition name="connection-status">
    <div v-if="shouldShow" class="connection-status" :class="statusClass">
      <div class="status-content">
        <span class="status-icon">{{ statusIcon }}</span>
        <span class="status-text">{{ statusText }}</span>
        <button
          v-if="showReconnectButton"
          class="reconnect-btn"
          @click="$emit('reconnect')"
          aria-label="Kết nối lại"
        >
          🔄 Thử lại
        </button>
      </div>
      <div v-if="showProgress" class="progress-bar" :style="{ animationDuration: `${reconnectDelay}ms` }"></div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed';

interface Props {
  state: ConnectionState;
  reconnectAttempt?: number;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  hideWhenConnected?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  reconnectAttempt: 0,
  maxReconnectAttempts: 10,
  reconnectDelay: 3000,
  hideWhenConnected: true
});

defineEmits<{
  (e: 'reconnect'): void;
}>();

const shouldShow = computed(() => {
  if (props.hideWhenConnected && props.state === 'connected') {
    return false;
  }
  return true;
});

const statusClass = computed(() => {
  return `status-${props.state}`;
});

const statusIcon = computed(() => {
  switch (props.state) {
    case 'connected':
      return '✓';
    case 'connecting':
      return '◌';
    case 'reconnecting':
      return '◷';
    case 'disconnected':
      return '⚠';
    case 'failed':
      return '✕';
    default:
      return '◌';
  }
});

const statusText = computed(() => {
  switch (props.state) {
    case 'connected':
      return 'Đã kết nối';
    case 'connecting':
      return 'Đang kết nối...';
    case 'reconnecting':
      return `Đang kết nối lại... (${props.reconnectAttempt}/${props.maxReconnectAttempts})`;
    case 'disconnected':
      return 'Mất kết nối';
    case 'failed':
      return 'Không thể kết nối';
    default:
      return 'Không rõ trạng thái';
  }
});

const showReconnectButton = computed(() => {
  return props.state === 'failed' || props.state === 'disconnected';
});

const showProgress = computed(() => {
  return props.state === 'reconnecting';
});
</script>

<style scoped>
.connection-status {
  position: fixed;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  min-width: 250px;
  max-width: 400px;
  background-color: rgba(0, 0, 0, 0.95);
  border: 1px solid var(--text-bright);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  z-index: 10001;
  font-family: 'VT323', 'Source Code Pro', monospace;
  overflow: hidden;
}

.status-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
}

.status-icon {
  font-size: 20px;
  font-weight: bold;
  flex-shrink: 0;
  animation: pulse 2s ease-in-out infinite;
}

.status-text {
  flex: 1;
  font-size: 16px;
  color: var(--text-bright);
}

.reconnect-btn {
  background-color: rgba(0, 136, 0, 0.3);
  border: 1px solid var(--text-bright);
  border-radius: 3px;
  color: var(--text-bright);
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 14px;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.reconnect-btn:hover {
  background-color: rgba(0, 136, 0, 0.5);
  transform: scale(1.05);
}

.progress-bar {
  height: 3px;
  background-color: var(--text-bright);
  animation: progress linear forwards;
  transform-origin: left;
}

/* State-specific styles */
.status-connected {
  border-color: #00ff00;
  background-color: rgba(0, 136, 0, 0.95);
}

.status-connected .status-icon {
  color: #00ff00;
  animation: none;
}

.status-connecting,
.status-reconnecting {
  border-color: #ffb000;
  background-color: rgba(136, 68, 0, 0.95);
}

.status-connecting .status-icon,
.status-reconnecting .status-icon {
  color: #ffb000;
}

.status-disconnected,
.status-failed {
  border-color: #ff0000;
  background-color: rgba(136, 0, 0, 0.95);
}

.status-disconnected .status-icon,
.status-failed .status-icon,
.status-disconnected .status-text,
.status-failed .status-text {
  color: #ff0000;
}

/* Animations */
.connection-status-enter-active,
.connection-status-leave-active {
  transition: all 0.3s ease;
}

.connection-status-enter-from {
  opacity: 0;
  transform: translate(-50%, -100%);
}

.connection-status-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(0.9);
  }
}

@keyframes progress {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .connection-status {
    min-width: calc(100vw - 2rem);
    max-width: calc(100vw - 2rem);
    top: 0.5rem;
  }

  .status-content {
    padding: 0.6rem 0.8rem;
  }

  .status-icon {
    font-size: 18px;
  }

  .status-text {
    font-size: 14px;
  }

  .reconnect-btn {
    font-size: 12px;
    padding: 0.2rem 0.4rem;
  }
}
</style>
