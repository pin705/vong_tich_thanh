<template>
  <div class="popover-container" v-if="isOpen" @click.self="close">
    <div class="popover-backdrop" @click="close"></div>
    <div class="popover-content" :style="positionStyle">
      <div class="popover-header" v-if="title">
        <span class="popover-title">{{ title }}</span>
        <button class="popover-close" @click="close">[X]</button>
      </div>
      <div class="popover-body">
        <slot></slot>
      </div>
      <div class="popover-footer" v-if="$slots.footer">
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
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
  z-index: 1001;
}

.popover-content {
  position: relative;
  z-index: 1002;
  background-color: var(--bg-black);
  border: 1px solid var(--text-bright);
  font-family: 'VT323', 'Source Code Pro', monospace;
  max-height: 80vh;
  max-width: 100%;
  overflow-y: auto;
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
}

.popover-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid var(--text-dim);
}

.popover-title {
  color: var(--text-accent);
  font-size: 18px;
  font-weight: bold;
}

.popover-close {
  color: var(--text-danger);
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  padding: 0 0.5rem;
  transition: color 0.2s;
}

.popover-close:hover {
  color: var(--text-bright);
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
}

/* Custom scrollbar for popover */
.popover-content::-webkit-scrollbar {
  width: 8px;
}

.popover-content::-webkit-scrollbar-track {
  background: var(--bg-black);
}

.popover-content::-webkit-scrollbar-thumb {
  background: var(--text-dim);
  border: 1px solid var(--bg-black);
}

.popover-content::-webkit-scrollbar-thumb:hover {
  background: var(--text-bright);
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .popover-container {
    padding: 0.5rem;
  }

  .popover-content {
    max-height: 90vh;
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
