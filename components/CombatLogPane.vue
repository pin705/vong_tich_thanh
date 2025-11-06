<template>
  <div ref="logArea" class="combat-log-pane">
    <div v-for="message in messages" :key="message.id" :class="getMessageClass(message)">
      <span v-if="shouldShowIcon(message)" class="combat-icon">{{ getCombatIcon(message) }}</span>
      <span class="message-text">{{ message.text }}</span>
    </div>
    <div v-if="messages.length === 0" class="empty-message">
      --- Không có hoạt động chiến đấu nào ---
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import type { Message } from '~/types';

const props = defineProps<{
  messages: Message[];
}>();

const logArea = ref<HTMLElement | null>(null);

// Auto-scroll to bottom when new messages arrive
watch(() => props.messages.length, () => {
  nextTick(() => {
    if (logArea.value) {
      logArea.value.scrollTop = logArea.value.scrollHeight;
    }
  });
});

// Get CSS class for message type
const getMessageClass = (message: Message) => {
  return `message message-${message.type}`;
};

// Determine if icon should be shown
const shouldShowIcon = (message: Message) => {
  const iconTypes = ['damage_in', 'damage_out', 'heal', 'critical', 'xp', 'loot'];
  return iconTypes.includes(message.type);
};

// Get appropriate icon for message type
const getCombatIcon = (message: Message) => {
  const icons: Record<string, string> = {
    'damage_in': '<<',
    'damage_out': '>>',
    'heal': '+',
    'critical': '!!',
    'xp': '*',
    'loot': '$'
  };
  return icons[message.type] || '';
};
</script>

<style scoped>
.combat-log-pane {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  padding-bottom: 0.5rem;
  white-space: pre-wrap;
  word-wrap: break-word;
  background-color: rgba(136, 0, 0, 0.03);
  /* Add subtle combat atmosphere */
  background-image: 
    linear-gradient(rgba(136, 0, 0, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(136, 0, 0, 0.02) 1px, transparent 1px);
  background-size: 50px 50px;
}

.empty-message {
  color: var(--text-dim);
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 18px;
  text-align: center;
  padding: 2rem;
  opacity: 0.6;
}

.message {
  margin-bottom: 0.3rem;
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 18px;
  line-height: 1.5;
  padding: 0.2rem 0.5rem;
  border-left: 3px solid transparent;
  transition: all 0.2s;
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.combat-icon {
  font-size: 16px;
  flex-shrink: 0;
  display: inline-block;
  animation: fadeIn 0.3s ease-in;
}

.message-text {
  flex: 1;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.message-combat_log {
  color: var(--text-bright);
  border-left-color: rgba(255, 255, 255, 0.2);
}

.message-damage_in {
  color: var(--theme-text-damage-in);
  font-weight: bold;
  border-left-color: var(--theme-text-damage-in);
  background-color: rgba(255, 0, 0, 0.05);
  animation: damageFlash 0.3s ease-out;
}

.message-damage_out {
  color: var(--theme-text-damage-out);
  border-left-color: var(--theme-text-damage-out);
  background-color: rgba(255, 176, 0, 0.05);
}

.message-heal {
  color: var(--theme-text-heal);
  border-left-color: var(--theme-text-heal);
  background-color: rgba(0, 255, 0, 0.05);
  animation: healPulse 0.5s ease-out;
}

.message-critical {
  color: var(--theme-text-critical);
  font-weight: bold;
  text-shadow: 0 0 5px currentColor;
  border-left-color: var(--theme-text-critical);
  background-color: rgba(255, 136, 0, 0.1);
  animation: criticalShake 0.3s ease-out;
}

.message-xp {
  color: var(--theme-text-xp);
  border-left-color: var(--theme-text-xp);
  background-color: rgba(0, 255, 170, 0.05);
  animation: xpGlow 0.5s ease-out;
}

.message-loot {
  color: var(--theme-text-loot);
  border-left-color: var(--theme-text-loot);
  background-color: rgba(255, 0, 255, 0.05);
  animation: lootShimmer 0.6s ease-out;
}

.message-error {
  color: var(--theme-text-error);
  border-left-color: var(--theme-text-error);
}

.message-system {
  color: var(--theme-text-system);
  border-left-color: var(--theme-text-system);
}

/* Animations */
@keyframes damageFlash {
  0%, 100% { background-color: rgba(255, 0, 0, 0.05); }
  50% { background-color: rgba(255, 0, 0, 0.15); }
}

@keyframes healPulse {
  0%, 100% { background-color: rgba(0, 255, 0, 0.05); }
  50% { background-color: rgba(0, 255, 0, 0.12); }
}

@keyframes criticalShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

@keyframes xpGlow {
  0% { text-shadow: 0 0 0px currentColor; }
  50% { text-shadow: 0 0 8px currentColor; }
  100% { text-shadow: 0 0 0px currentColor; }
}

@keyframes lootShimmer {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .combat-log-pane {
    padding: 0.5rem;
  }

  .message {
    font-size: 16px;
    line-height: 1.3;
    padding: 0.15rem 0.3rem;
  }

  .combat-icon {
    font-size: 14px;
  }

  .empty-message {
    font-size: 16px;
    padding: 1rem;
  }
}
</style>
