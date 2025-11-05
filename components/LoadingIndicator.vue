<template>
  <div v-if="isLoading" class="loading-overlay" :class="{ inline: inline }">
    <div class="loading-spinner">
      <div class="spinner-text">{{ text }}</div>
      <div class="spinner-animation">
        <span class="spinner-char">|</span>
        <span class="spinner-char">/</span>
        <span class="spinner-char">-</span>
        <span class="spinner-char">\</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isLoading: boolean;
  text?: string;
  inline?: boolean;
}

withDefaults(defineProps<Props>(), {
  text: 'Đang tải...',
  inline: false
});
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  font-family: 'VT323', 'Source Code Pro', monospace;
}

.loading-overlay.inline {
  position: relative;
  background-color: transparent;
  min-height: 100px;
}

.loading-spinner {
  text-align: center;
  color: var(--text-accent);
}

.spinner-text {
  font-size: 24px;
  margin-bottom: 1rem;
  color: var(--text-bright);
}

.spinner-animation {
  font-size: 32px;
  color: var(--text-accent);
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.spinner-char {
  animation: spin 0.8s linear infinite;
}

.spinner-char:nth-child(2) {
  animation-delay: 0.2s;
}

.spinner-char:nth-child(3) {
  animation-delay: 0.4s;
}

.spinner-char:nth-child(4) {
  animation-delay: 0.6s;
}

@keyframes spin {
  0%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .spinner-text {
    font-size: 20px;
  }
  
  .spinner-animation {
    font-size: 28px;
  }
}
</style>
