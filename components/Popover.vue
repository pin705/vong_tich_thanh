<template>
  <Transition name="popover-fade">
    <div class="popover-container" v-if="isOpen" @click.self="close">
      <Transition name="backdrop-fade">
        <div class="popover-backdrop" @click="close" v-if="isOpen"></div>
      </Transition>
      <Transition name="popover-slide">
        <div class="popover-content" :style="positionStyle" v-if="isOpen">
          <div class="popover-header" v-if="title">
            <span class="popover-title">{{ title }}</span>
            <button class="popover-close" @click="close" aria-label="Close">[X]</button>
          </div>
          <div class="popover-body">
            <slot></slot>
          </div>
          <div class="popover-footer" v-if="$slots.footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

interface Props {
  isOpen: boolean;
  title?: string;
  position?: {
    x: number;
    y: number;
  };
  width?: string;
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  width: '300px'
});

const emit = defineEmits<{
  close: [];
}>();

const close = () => {
  emit('close');
};

const positionStyle = computed(() => {
  const style: any = {
    width: props.width,
  };

  if (props.position) {
    style.position = 'fixed';
    style.left = `${props.position.x}px`;
    style.top = `${props.position.y}px`;
  }

  return style;
});

// Close on Escape key
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }
});
</script>

<style scoped>
/* Transition animations */
.popover-fade-enter-active,
.popover-fade-leave-active {
  transition: opacity 0.2s ease;
}

.popover-fade-enter-from,
.popover-fade-leave-to {
  opacity: 0;
}

.backdrop-fade-enter-active,
.backdrop-fade-leave-active {
  transition: opacity 0.3s ease;
}

.backdrop-fade-enter-from,
.backdrop-fade-leave-to {
  opacity: 0;
}

.popover-slide-enter-active,
.popover-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.popover-slide-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.popover-slide-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.popover-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.popover-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(2px);
  z-index: 1001;
}

.popover-content {
  position: relative;
  z-index: 1002;
  background-color: var(--bg-black);
  border: 2px solid var(--text-bright);
  font-family: 'VT323', 'Source Code Pro', monospace;
  max-height: 80vh;
  max-width: 100%;
  overflow-y: auto;
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.3), 0 0 40px rgba(0, 255, 0, 0.1);
  border-radius: 4px;
}

.popover-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid var(--text-dim);
  background-color: rgba(0, 136, 0, 0.08);
}

.popover-title {
  color: var(--text-accent);
  font-size: 18px;
  font-weight: bold;
  text-shadow: 0 0 5px rgba(255, 176, 0, 0.5);
}

.popover-close {
  color: var(--text-danger);
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  padding: 0.2rem 0.5rem;
  transition: all 0.2s ease;
  border-radius: 3px;
}

.popover-close:hover {
  color: var(--text-bright);
  border-color: var(--text-danger);
  background-color: rgba(255, 0, 0, 0.1);
  transform: scale(1.1);
}

.popover-close:active {
  transform: scale(0.95);
}

.popover-body {
  padding: 1rem;
  color: var(--text-bright);
  font-size: 16px;
  line-height: 1.6;
}

.popover-footer {
  padding: 0.75rem;
  border-top: 1px solid var(--text-dim);
  background-color: rgba(0, 136, 0, 0.05);
}

/* Custom scrollbar for popover */
.popover-content::-webkit-scrollbar {
  width: 10px;
}

.popover-content::-webkit-scrollbar-track {
  background: var(--bg-black);
  border-left: 1px solid var(--text-dim);
}

.popover-content::-webkit-scrollbar-thumb {
  background: var(--text-dim);
  border: 2px solid var(--bg-black);
  border-radius: 5px;
  transition: background 0.2s ease;
}

.popover-content::-webkit-scrollbar-thumb:hover {
  background: var(--text-bright);
  box-shadow: 0 0 5px rgba(0, 255, 0, 0.5);
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .popover-container {
    padding: 0.5rem;
  }

  .popover-content {
    max-height: 90vh;
    border-width: 1px;
  }

  .popover-header {
    padding: 0.5rem;
  }

  .popover-title {
    font-size: 16px;
  }

  .popover-close {
    font-size: 16px;
  }

  .popover-body {
    padding: 0.5rem;
    font-size: 14px;
  }

  .popover-footer {
    padding: 0.5rem;
  }
}
</style>
