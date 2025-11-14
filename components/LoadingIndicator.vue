<template>
  <Transition name="fade">
    <div v-if="isLoading" class="loading-overlay" :class="{ inline: inline }">
      <div class="loading-spinner">
        <div class="spinner-text">{{ text }}</div>
        <div class="spinner-animation">
          <span class="spinner-char">|</span>
          <span class="spinner-char">/</span>
          <span class="spinner-char">-</span>
          <span class="spinner-char">\</span>
        </div>
        <div class="loading-dots">
          <span class="dot">.</span>
          <span class="dot">.</span>
          <span class="dot">.</span>
        </div>
      </div>
    </div>
  </Transition>
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
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  font-family: 'VT323', 'Source Code Pro', monospace;
}

.loading-overlay.inline {
  position: relative;
  background-color: transparent;
  backdrop-filter: none;
  min-height: 100px;
}

.loading-spinner {
  text-align: center;
  color: var(--text-accent);
  background-color: rgba(0, 0, 0, 0.9);
  padding: 2rem;
  border: 2px solid var(--text-bright);
  border-radius: 8px;
  box-shadow: 0 0 30px rgba(0, 255, 0, 0.4), 0 0 60px rgba(0, 255, 0, 0.2);
  min-width: 280px;
}

.loading-overlay.inline .loading-spinner {
  background-color: transparent;
  border: none;
  box-shadow: none;
  padding: 1rem;
}

.spinner-text {
  font-size: 24px;
  margin-bottom: 1.5rem;
  color: var(--text-bright);
  text-shadow: 0 0 10px rgba(0, 255, 0, 0.6);
  animation: pulse 2s ease-in-out infinite;
}

.spinner-animation {
  font-size: 36px;
  color: var(--text-accent);
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.spinner-char {
  animation: spin 0.8s linear infinite;
  text-shadow: 0 0 10px rgba(255, 176, 0, 0.8);
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

.loading-dots {
  display: flex;
  justify-content: center;
  gap: 0.3rem;
  color: var(--text-bright);
  font-size: 24px;
}

.dot {
  animation: bounce 1.4s ease-in-out infinite;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes spin {
  0%, 100% {
    opacity: 0.3;
    transform: scale(0.8) rotate(0deg);
  }
  50% {
    opacity: 1;
    transform: scale(1.2) rotate(180deg);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@keyframes bounce {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .loading-spinner {
    padding: 1.5rem;
    min-width: 220px;
  }

  .spinner-text {
    font-size: 20px;
    margin-bottom: 1rem;
  }
  
  .spinner-animation {
    font-size: 28px;
  }

  .loading-dots {
    font-size: 20px;
  }
}
</style>
