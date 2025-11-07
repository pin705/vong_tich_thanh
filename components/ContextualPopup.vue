<template>
  <teleport to="body">
    <div v-if="isOpen" class="contextual-popup-container" @click.self="close">
      <div class="contextual-popup-backdrop" @click="close"></div>
      <div class="contextual-popup-content">
        <div class="popup-header">
          <span class="popup-title">{{ title }}</span>
          <button class="popup-close" @click="close">[X]</button>
        </div>
        
        <div class="popup-body">
          <!-- Entity HP/Status -->
          <div v-if="entityData?.hp !== undefined" class="entity-status">
            <div class="hp-label">HP:</div>
            <div class="hp-bar-container">
              <div 
                class="hp-bar-fill" 
                :style="{ width: hpPercentage + '%' }"
              ></div>
            </div>
            <div class="hp-text">{{ entityData.hp }}/{{ entityData.maxHp }}</div>
          </div>

          <div v-if="entityData?.status" class="entity-status-text">
            {{ entityData.status }}
          </div>

          <!-- Entity Description -->
          <div v-if="entityData?.description" class="entity-description">
            {{ entityData.description }}
          </div>

          <!-- Guild Information (Phase 20.2) -->
          <div v-if="entityData?.guild" class="entity-guild-info">
            <span class="guild-label">Bang hội:</span>
            <span class="guild-value">[{{ entityData.guild.tag }}] {{ entityData.guild.name }}</span>
          </div>

          <!-- Pet Information -->
          <div v-if="entityData?.pet" class="entity-pet-info">
            <span class="pet-label">Pet triệu hồi:</span>
            <span class="pet-value">{{ entityData.pet.name }} (Lv.{{ entityData.pet.level }})</span>
          </div>

          <!-- Custom Content Slot -->
          <div v-if="$slots.default" class="popup-custom-content">
            <slot></slot>
          </div>

          <!-- Actions List -->
          <div v-if="actions && actions.length > 0" class="actions-section">
            <div class="actions-title">--- Hành Động ---</div>
            <div
              v-for="(action, index) in actions"
              :key="index"
              class="action-item"
              :class="{ disabled: action.disabled }"
              @click="!action.disabled && executeAction(action)"
            >
              [{{ index + 1 }}] {{ action.label }}{{ action.disabled ? ' (không thể)' : '' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface EntityData {
  hp?: number;
  maxHp?: number;
  status?: string;
  description?: string;
  guild?: {
    name: string;
    tag: string;
  };
  pet?: {
    name: string;
    level: number;
  };
}

interface Action {
  label: string;
  command: string;
  disabled?: boolean;
}

interface Props {
  isOpen: boolean;
  title: string;
  entityType?: 'npc' | 'mob' | 'player' | null;
  entityData?: EntityData;
  actions?: Action[];
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  entityType: null,
  actions: () => []
});

const emit = defineEmits<{
  close: [];
  executeAction: [action: Action];
}>();

const close = () => {
  emit('close');
};

const executeAction = (action: Action) => {
  emit('executeAction', action);
  close();
};

const hpPercentage = computed(() => {
  if (!props.entityData?.hp || !props.entityData?.maxHp) return 0;
  return Math.floor((props.entityData.hp / props.entityData.maxHp) * 100);
});
</script>

<style scoped>
.contextual-popup-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.contextual-popup-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.75);
  z-index: 2001;
}

.contextual-popup-content {
  position: relative;
  z-index: 2002;
  width: 90%;
  max-width: 500px;
  background-color: var(--bg-black);
  border: 2px solid var(--text-bright);
  box-shadow: 0 0 25px rgba(0, 255, 0, 0.4);
  font-family: 'VT323', 'Source Code Pro', monospace;
  max-height: 80vh;
  overflow-y: auto;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--text-bright);
  background-color: rgba(0, 136, 0, 0.05);
}

.popup-title {
  color: var(--text-accent);
  font-size: 20px;
  font-weight: bold;
}

.popup-close {
  color: var(--text-danger);
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  padding: 0 0.5rem;
  transition: color 0.2s;
}

.popup-close:hover {
  color: var(--text-bright);
}

.popup-body {
  padding: 1rem;
  color: var(--text-bright);
  font-size: 16px;
  line-height: 1.6;
}

.entity-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.hp-label {
  color: var(--text-dim);
  min-width: 30px;
}

.hp-bar-container {
  flex: 1;
  height: 20px;
  background-color: rgba(136, 0, 0, 0.3);
  border: 1px solid var(--text-dim);
  position: relative;
}

.hp-bar-fill {
  height: 100%;
  background-color: var(--text-bright);
  transition: width 0.3s ease;
}

.hp-text {
  color: var(--text-bright);
  min-width: 80px;
  text-align: right;
  font-size: 14px;
}

.entity-status-text {
  color: var(--text-cyan);
  margin-bottom: 0.75rem;
  font-style: italic;
}

.entity-description {
  color: var(--text-dim);
  margin-bottom: 1rem;
  padding: 0.75rem;
  background-color: rgba(0, 136, 0, 0.05);
  border-left: 2px solid var(--text-dim);
  white-space: pre-wrap;
}

.entity-guild-info {
  color: var(--text-bright);
  margin-bottom: 1rem;
  padding: 0.75rem;
  background-color: rgba(0, 136, 136, 0.1);
  border-left: 2px solid var(--text-cyan);
}

.guild-label {
  color: var(--text-dim);
  margin-right: 0.5rem;
}

.guild-value {
  color: var(--text-accent);
  font-weight: bold;
}

.entity-pet-info {
  color: var(--text-bright);
  margin-bottom: 1rem;
  padding: 0.75rem;
  background-color: rgba(147, 112, 219, 0.1);
  border-left: 2px solid #9370DB;
}

.pet-label {
  color: var(--text-dim);
  margin-right: 0.5rem;
}

.pet-value {
  color: #9370DB;
  font-weight: bold;
}

.popup-custom-content {
  margin-bottom: 1rem;
}

.actions-section {
  border-top: 1px solid var(--text-dim);
  padding-top: 0.75rem;
}

.actions-title {
  color: var(--text-accent);
  font-weight: bold;
  margin-bottom: 0.5rem;
  font-size: 16px;
  text-align: center;
}

.action-item {
  color: var(--text-bright);
  cursor: pointer;
  padding: 0.5rem;
  margin-bottom: 0.25rem;
  transition: background-color 0.2s;
  border: 1px solid transparent;
}

.action-item:hover:not(.disabled) {
  background-color: rgba(0, 255, 0, 0.15);
  border-color: var(--text-bright);
}

.action-item.disabled {
  color: var(--text-dim);
  cursor: not-allowed;
  opacity: 0.5;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .contextual-popup-content {
    width: 95%;
    max-height: 85vh;
  }

  .popup-title {
    font-size: 18px;
  }

  .popup-body {
    padding: 0.75rem;
    font-size: 15px;
  }
}
</style>
