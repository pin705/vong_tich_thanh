<template>
  <div class="status-effects" v-if="effects.length > 0">
    <div class="effects-title">[ Trạng Thái ]</div>
    <div class="effects-list">
      <div
        v-for="effect in effects"
        :key="effect.id"
        class="effect-item"
        :class="`effect-${effect.type}`"
        @click="handleEffectClick(effect)"
        :title="effect.description"
      >
        <span class="effect-icon">{{ getEffectIcon(effect.type) }}</span>
        <span class="effect-name">{{ effect.name }}</span>
        <span class="effect-duration" v-if="effect.duration">({{ formatDuration(effect.duration) }})</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface StatusEffect {
  id: string;
  name: string;
  type: 'buff' | 'debuff' | 'poison' | 'regeneration' | 'shield' | 'speed' | 'strength';
  description: string;
  duration?: number; // in seconds
  icon?: string;
}

const props = defineProps<{
  effects: StatusEffect[];
}>();

const emit = defineEmits<{
  effectClick: [effect: StatusEffect];
}>();

const getEffectIcon = (type: string): string => {
  const icons: Record<string, string> = {
    buff: '▲',
    debuff: '▼',
    poison: 'X',
    regeneration: '+',
    shield: '[',
    speed: '>',
    strength: '*'
  };
  return icons[type] || '●';
};

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
  return `${secs}s`;
};

const handleEffectClick = (effect: StatusEffect) => {
  emit('effectClick', effect);
};
</script>

<style scoped>
.status-effects {
  padding: 0.5rem 0.75rem;
  background-color: rgba(0, 136, 0, 0.03);
  border-bottom: 1px solid rgba(0, 136, 0, 0.3);
}

.effects-title {
  color: var(--text-accent);
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.effects-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.effect-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--text-dim);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.effect-item:hover {
  background-color: rgba(0, 255, 0, 0.1);
  border-color: var(--text-bright);
}

.effect-buff {
  border-color: var(--text-cyan);
}

.effect-buff .effect-icon,
.effect-buff .effect-name {
  color: var(--text-cyan);
}

.effect-debuff {
  border-color: var(--text-danger);
}

.effect-debuff .effect-icon,
.effect-debuff .effect-name {
  color: var(--text-danger);
}

.effect-icon {
  font-size: 16px;
}

.effect-name {
  font-weight: bold;
}

.effect-duration {
  color: var(--text-dim);
  font-size: 12px;
  margin-left: 0.25rem;
}
</style>
