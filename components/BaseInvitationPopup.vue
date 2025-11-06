<template>
  <div class="base-invitation-popup">
    <div class="invitation-content">
      <div v-if="showIcon" class="invitation-header">
        <span class="invitation-icon">[!]</span>
        <h3 class="invitation-title">{{ title }}</h3>
      </div>
      
      <div class="invitation-message">
        <slot></slot>
      </div>

      <div class="invitation-actions">
        <button class="action-btn accept" @click="handleAccept">
          [ CHẤP NHẬN ]
        </button>
        <button class="action-btn decline" @click="handleDecline">
          [ TỪ CHỐI ]
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string;
  showIcon?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'LỜI MỜI',
  showIcon: false
});

const emit = defineEmits<{
  accept: [];
  decline: [];
}>();

function handleAccept() {
  emit('accept');
}

function handleDecline() {
  emit('decline');
}
</script>

<style scoped>
.base-invitation-popup {
  font-family: 'VT323', 'Source Code Pro', monospace;
  color: var(--text-bright);
  padding: 1rem;
}

.invitation-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.invitation-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 2px solid var(--text-accent);
  padding-bottom: 0.5rem;
}

.invitation-icon {
  font-size: 1.5em;
  color: var(--text-accent);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.invitation-title {
  font-size: 1.2em;
  color: var(--text-accent);
  margin: 0;
  letter-spacing: 1px;
}

.invitation-message {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(0, 136, 0, 0.1);
  border: 1px solid rgba(0, 136, 0, 0.3);
  border-radius: 4px;
  text-align: center;
}

.invitation-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.action-btn {
  padding: 0.75rem 1.5rem;
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 1.1em;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  letter-spacing: 1px;
  min-width: 140px;
}

.action-btn.accept {
  background: rgba(0, 170, 0, 0.2);
  border: 2px solid rgba(0, 170, 0, 0.6);
  color: var(--text-system);
}

.action-btn.accept:hover {
  background: rgba(0, 255, 0, 0.3);
  border-color: var(--text-system);
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
}

.action-btn.decline {
  background: rgba(136, 0, 0, 0.2);
  border: 2px solid rgba(170, 0, 0, 0.6);
  color: var(--text-danger);
}

.action-btn.decline:hover {
  background: rgba(255, 0, 0, 0.2);
  border-color: var(--text-danger);
  box-shadow: 0 0 10px rgba(255, 0, 0, 0.3);
}
</style>
