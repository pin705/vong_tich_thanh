<template>
  <Transition name="fab">
    <div v-if="isVisible" class="fab-container">
      <!-- Main FAB Button -->
      <button
        class="fab-main"
        :class="{ active: isExpanded }"
        @click="toggleExpanded"
        :aria-expanded="isExpanded"
        aria-label="Menu hành động nhanh"
      >
        <span class="fab-icon">{{ isExpanded ? '×' : '⚡' }}</span>
      </button>

      <!-- Expanded Action Buttons -->
      <Transition name="fab-actions">
        <div v-if="isExpanded" class="fab-actions">
          <button
            v-for="(action, index) in actions"
            :key="action.id"
            class="fab-action"
            :style="{ transitionDelay: `${index * 50}ms` }"
            @click="handleAction(action)"
            :aria-label="action.label"
          >
            <span class="fab-action-icon">{{ action.icon }}</span>
            <span class="fab-action-label">{{ action.label }}</span>
          </button>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

export interface FABAction {
  id: string;
  icon: string;
  label: string;
  action: () => void;
  requiresCombat?: boolean;
  requiresNoCombat?: boolean;
}

interface Props {
  actions: FABAction[];
  hideInCombat?: boolean;
  hideWhenScrolling?: boolean;
  inCombat?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  hideInCombat: false,
  hideWhenScrolling: true,
  inCombat: false
});

const emit = defineEmits<{
  (e: 'actionClick', actionId: string): void;
}>();

const isExpanded = ref(false);
const isScrolling = ref(false);
let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

const isVisible = computed(() => {
  if (props.hideInCombat && props.inCombat) return false;
  if (props.hideWhenScrolling && isScrolling.value) return false;
  return true;
});

const filteredActions = computed(() => {
  return props.actions.filter(action => {
    if (action.requiresCombat && !props.inCombat) return false;
    if (action.requiresNoCombat && props.inCombat) return false;
    return true;
  });
});

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value;
};

const handleAction = (action: FABAction) => {
  action.action();
  emit('actionClick', action.id);
  isExpanded.value = false;
};

const handleScroll = () => {
  isScrolling.value = true;
  
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }
  
  scrollTimeout = setTimeout(() => {
    isScrolling.value = false;
  }, 1000);
};

const handleClickOutside = (event: MouseEvent) => {
  if (!isExpanded.value) return;
  
  const target = event.target as HTMLElement;
  if (!target.closest('.fab-container')) {
    isExpanded.value = false;
  }
};

onMounted(() => {
  if (props.hideWhenScrolling) {
    window.addEventListener('scroll', handleScroll, { passive: true });
  }
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  document.removeEventListener('click', handleClickOutside);
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }
});
</script>

<style scoped>
.fab-container {
  position: fixed;
  bottom: 5rem;
  right: 1.5rem;
  z-index: 1000;
}

.fab-main {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(0, 136, 0, 0.9), rgba(0, 255, 0, 0.9));
  border: 2px solid var(--text-bright);
  color: var(--bg-black);
  font-size: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 255, 0, 0.4);
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  position: relative;
  z-index: 1001;
}

.fab-main:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(0, 255, 0, 0.6);
}

.fab-main.active {
  transform: rotate(45deg);
  background: linear-gradient(135deg, rgba(136, 0, 0, 0.9), rgba(255, 0, 0, 0.9));
}

.fab-icon {
  display: block;
  line-height: 1;
  font-weight: bold;
}

.fab-actions {
  position: absolute;
  bottom: 70px;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 200px;
}

.fab-action {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background-color: rgba(0, 136, 0, 0.95);
  border: 1px solid var(--text-bright);
  border-radius: 28px;
  color: var(--text-bright);
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 16px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
  animation: slideInRight 0.3s ease-out;
  white-space: nowrap;
}

.fab-action:hover {
  background-color: rgba(0, 255, 0, 0.3);
  transform: translateX(-4px);
  box-shadow: 0 6px 16px rgba(0, 255, 0, 0.4);
}

.fab-action-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.fab-action-label {
  flex: 1;
  text-align: left;
}

/* Animations */
.fab-enter-active,
.fab-leave-active {
  transition: all 0.3s ease;
}

.fab-enter-from,
.fab-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}

.fab-actions-enter-active,
.fab-actions-leave-active {
  transition: opacity 0.2s ease;
}

.fab-actions-enter-from,
.fab-actions-leave-to {
  opacity: 0;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Pulse animation when not expanded */
.fab-main:not(.active) {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 4px 12px rgba(0, 255, 0, 0.4);
  }
  50% {
    box-shadow: 0 4px 20px rgba(0, 255, 0, 0.7);
  }
}

/* Mobile specific adjustments */
@media (max-width: 768px) {
  .fab-container {
    bottom: 6rem;
    right: 1rem;
  }

  .fab-main {
    width: 52px;
    height: 52px;
    font-size: 24px;
  }

  .fab-actions {
    bottom: 65px;
    min-width: 180px;
  }

  .fab-action {
    padding: 10px 14px;
    font-size: 14px;
  }

  .fab-action-icon {
    font-size: 18px;
  }
}

/* Tablet adjustments */
@media (min-width: 769px) and (max-width: 1023px) {
  .fab-container {
    bottom: 5.5rem;
    right: 1.25rem;
  }
}

/* Desktop - hide on large screens if not needed */
@media (min-width: 1024px) {
  .fab-container {
    display: none;
  }
}
</style>
