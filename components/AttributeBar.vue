<template>
  <div class="attribute-bar-container">
    <span v-if="label" class="attribute-label">{{ label }}:</span>
    <div class="attribute-bar-wrapper">
      <div 
        class="attribute-bar-fill" 
        :class="colorClass"
        :style="{ width: percentage + '%' }"
      ></div>
    </div>
    <span class="attribute-text">{{ currentValue }}/{{ maxValue }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  label?: string;
  currentValue: number;
  maxValue: number;
  color?: 'hp' | 'mp' | 'resource' | 'xp';
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  currentValue: 0,
  maxValue: 100,
  color: 'hp'
});

const percentage = computed(() => {
  if (props.maxValue === 0) return 0;
  return Math.min(100, Math.floor((props.currentValue / props.maxValue) * 100));
});

const colorClass = computed(() => {
  return `bar-color-${props.color}`;
});
</script>

<style scoped>
.attribute-bar-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'VT323', 'Source Code Pro', monospace;
}

.attribute-label {
  color: var(--text-dim);
  font-size: 16px;
  min-width: 35px;
}

.attribute-bar-wrapper {
  flex: 1;
  height: 18px;
  background-color: rgba(136, 0, 0, 0.3);
  border: 1px solid var(--text-dim);
  position: relative;
  overflow: hidden;
  min-width: 100px;
}

.attribute-bar-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.bar-color-hp {
  background-color: #00ff00;
}

.bar-color-mp {
  background-color: #00aaff;
}

.bar-color-resource {
  background-color: #ffaa00;
}

.bar-color-xp {
  background: linear-gradient(90deg, #00aa00 0%, #00ff00 100%);
}

.attribute-text {
  color: var(--text-bright);
  font-size: 14px;
  min-width: 70px;
  text-align: right;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .attribute-label {
    font-size: 14px;
    min-width: 30px;
  }

  .attribute-bar-wrapper {
    min-width: 80px;
    height: 16px;
  }

  .attribute-text {
    font-size: 13px;
    min-width: 60px;
  }
}
</style>
