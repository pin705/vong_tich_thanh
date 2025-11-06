<template>
  <Transition name="toast">
    <div v-if="isVisible" class="toast-notification" :class="[`toast-${type}`, positionClass]">
      <div class="toast-content">
        <div class="toast-icon">{{ iconMap[type] }}</div>
        <div class="toast-message">{{ message }}</div>
        <button v-if="dismissible" class="toast-close" @click="close" aria-label="Đóng">×</button>
      </div>
      <div v-if="duration > 0" class="toast-progress" :style="{ animationDuration: `${duration}ms` }"></div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';

type ToastType = 'success' | 'error' | 'warning' | 'info';
type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

interface Props {
  message: string;
  type?: ToastType;
  duration?: number;
  position?: ToastPosition;
  dismissible?: boolean;
  show?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  duration: 3000,
  position: 'top-right',
  dismissible: true,
  show: false
});

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const isVisible = ref(false);
let timeoutId: ReturnType<typeof setTimeout> | null = null;

const iconMap: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ'
};

const positionClass = computed(() => `toast-${props.position}`);

const close = () => {
  isVisible.value = false;
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
  emit('close');
};

watch(() => props.show, (newVal) => {
  if (newVal) {
    isVisible.value = true;
    if (props.duration > 0) {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(close, props.duration);
    }
  } else {
    isVisible.value = false;
  }
}, { immediate: true });

onMounted(() => {
  if (props.show) {
    isVisible.value = true;
    if (props.duration > 0) {
      timeoutId = setTimeout(close, props.duration);
    }
  }
});
</script>

<style scoped>
.toast-notification {
  position: fixed;
  min-width: 250px;
  max-width: 400px;
  background-color: rgba(0, 136, 0, 0.95);
  border: 1px solid var(--text-bright);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  z-index: 10000;
  font-family: 'VT323', 'Source Code Pro', monospace;
  overflow: hidden;
}

/* Position classes */
.toast-top-right {
  top: 1rem;
  right: 1rem;
}

.toast-top-left {
  top: 1rem;
  left: 1rem;
}

.toast-bottom-right {
  bottom: 1rem;
  right: 1rem;
}

.toast-bottom-left {
  bottom: 1rem;
  left: 1rem;
}

.toast-top-center {
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
}

.toast-bottom-center {
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
}

.toast-icon {
  font-size: 24px;
  font-weight: bold;
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
  font-size: 16px;
  color: var(--text-bright);
  word-break: break-word;
}

.toast-close {
  background: none;
  border: none;
  color: var(--text-bright);
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.2s;
}

.toast-close:hover {
  transform: scale(1.2);
}

.toast-progress {
  height: 3px;
  background-color: var(--text-bright);
  animation: progress linear forwards;
  transform-origin: left;
}

/* Type-specific styles */
.toast-success {
  background-color: rgba(0, 136, 0, 0.95);
  border-color: #00ff00;
}

.toast-success .toast-icon {
  color: #00ff00;
}

.toast-error {
  background-color: rgba(136, 0, 0, 0.95);
  border-color: #ff0000;
}

.toast-error .toast-icon,
.toast-error .toast-message {
  color: #ff0000;
}

.toast-warning {
  background-color: rgba(136, 68, 0, 0.95);
  border-color: #ffb000;
}

.toast-warning .toast-icon,
.toast-warning .toast-message {
  color: #ffb000;
}

.toast-info {
  background-color: rgba(0, 136, 136, 0.95);
  border-color: #00ffff;
}

.toast-info .toast-icon {
  color: #00ffff;
}

/* Animations */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-100%);
}

.toast-top-center.toast-enter-from {
  transform: translate(-50%, -100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.toast-top-center.toast-leave-to {
  transform: translate(-50%, -20px);
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
  .toast-notification {
    min-width: calc(100vw - 2rem);
    max-width: calc(100vw - 2rem);
    left: 1rem !important;
    right: 1rem !important;
    transform: none !important;
  }

  .toast-top-right,
  .toast-top-left,
  .toast-top-center {
    top: 0.5rem;
  }

  .toast-bottom-right,
  .toast-bottom-left,
  .toast-bottom-center {
    bottom: 0.5rem;
  }

  .toast-content {
    padding: 0.6rem 0.8rem;
  }

  .toast-icon {
    font-size: 20px;
  }

  .toast-message {
    font-size: 14px;
  }
}
</style>
