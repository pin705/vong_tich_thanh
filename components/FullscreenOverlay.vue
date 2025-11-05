<template>
  <teleport to="body">
    <div v-if="isOpen" class="overlay-container" @keydown.esc="close">
      <div class="overlay-backdrop" @click="close"></div>
      <div class="overlay-content" :class="contentClass">
        <div class="overlay-header">
          <div class="overlay-title">{{ title }}</div>
          <button class="overlay-close" @click="close">[X] Đóng</button>
        </div>
        
        <div class="overlay-body">
          <slot></slot>
        </div>
        
        <div v-if="$slots.footer" class="overlay-footer">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue';

interface Props {
  isOpen: boolean;
  title: string;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  size: 'large'
});

const emit = defineEmits<{
  close: [];
}>();

const contentClass = `overlay-content-${props.size}`;

const close = () => {
  emit('close');
};

// Handle escape key
const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.isOpen) {
    close();
  }
};

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});

onMounted(() => {
  document.addEventListener('keydown', handleEscape);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape);
  document.body.style.overflow = '';
});
</script>

<style scoped>
.overlay-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'VT323', 'Source Code Pro', monospace;
}

.overlay-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(2px);
}

.overlay-content {
  position: relative;
  background-color: var(--bg-black);
  border: 2px solid var(--text-bright);
  box-shadow: 0 0 30px rgba(0, 255, 0, 0.4);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow: hidden;
}

.overlay-content-small {
  width: 400px;
  max-height: 300px;
}

.overlay-content-medium {
  width: 600px;
  max-height: 500px;
}

.overlay-content-large {
  width: 80vw;
  max-height: 85vh;
}

.overlay-content-fullscreen {
  width: 95vw;
  height: 95vh;
  max-height: 95vh;
}

.overlay-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--text-bright);
  background-color: rgba(0, 136, 0, 0.05);
}

.overlay-title {
  color: var(--text-accent);
  font-size: 24px;
  font-weight: bold;
  text-transform: uppercase;
}

.overlay-close {
  background: transparent;
  color: var(--text-danger);
  border: 1px solid var(--text-danger);
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.2s;
}

.overlay-close:hover {
  background-color: var(--text-danger);
  color: var(--bg-black);
}

.overlay-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  color: var(--text-bright);
  font-size: 18px;
  line-height: 1.6;
}

.overlay-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--text-dim);
  background-color: rgba(0, 136, 0, 0.05);
}

/* Custom scrollbar */
.overlay-body::-webkit-scrollbar {
  width: 12px;
}

.overlay-body::-webkit-scrollbar-track {
  background: var(--bg-black);
}

.overlay-body::-webkit-scrollbar-thumb {
  background: var(--text-dim);
  border: 2px solid var(--bg-black);
}

.overlay-body::-webkit-scrollbar-thumb:hover {
  background: var(--text-bright);
}
</style>
