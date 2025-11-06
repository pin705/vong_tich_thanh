<template>
  <Transition name="tutorial">
    <div v-if="isVisible" class="tutorial-overlay">
      <div class="tutorial-content" :style="tutorialPosition">
        <!-- Tutorial header -->
        <div class="tutorial-header">
          <h3 class="tutorial-title">{{ currentStep.title }}</h3>
          <div class="tutorial-progress">
            {{ currentStepIndex + 1 }} / {{ steps.length }}
          </div>
        </div>

        <!-- Tutorial body -->
        <div class="tutorial-body">
          <p class="tutorial-text">{{ currentStep.description }}</p>
          
          <!-- Optional image/gif -->
          <div v-if="currentStep.image" class="tutorial-image">
            <img :src="currentStep.image" :alt="currentStep.title" />
          </div>

          <!-- Code example -->
          <div v-if="currentStep.example" class="tutorial-example">
            <code>{{ currentStep.example }}</code>
          </div>

          <!-- Tips -->
          <div v-if="currentStep.tips && currentStep.tips.length > 0" class="tutorial-tips">
            <div class="tips-title">💡 Mẹo:</div>
            <ul class="tips-list">
              <li v-for="(tip, index) in currentStep.tips" :key="index">{{ tip }}</li>
            </ul>
          </div>
        </div>

        <!-- Tutorial footer -->
        <div class="tutorial-footer">
          <button
            v-if="currentStepIndex > 0"
            class="tutorial-btn tutorial-btn-back"
            @click="previousStep"
          >
            ← Quay Lại
          </button>
          
          <button
            class="tutorial-btn tutorial-btn-skip"
            @click="skip"
          >
            Bỏ Qua
          </button>
          
          <button
            v-if="currentStepIndex < steps.length - 1"
            class="tutorial-btn tutorial-btn-next"
            @click="nextStep"
          >
            Tiếp Theo →
          </button>
          
          <button
            v-else
            class="tutorial-btn tutorial-btn-complete"
            @click="complete"
          >
            ✓ Hoàn Thành
          </button>
        </div>

        <!-- Optional: Don't show again checkbox -->
        <div class="tutorial-options">
          <label class="tutorial-checkbox">
            <input
              type="checkbox"
              v-model="dontShowAgain"
            />
            <span>Không hiển thị lại</span>
          </label>
        </div>
      </div>

      <!-- Highlight overlay for specific element -->
      <div v-if="currentStep.highlightElement" class="tutorial-highlight"></div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  example?: string;
  image?: string;
  tips?: string[];
  highlightElement?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface Props {
  steps: TutorialStep[];
  tutorialId: string;
  autoStart?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  autoStart: false
});

const emit = defineEmits<{
  (e: 'complete'): void;
  (e: 'skip'): void;
  (e: 'stepChange', step: number): void;
}>();

const isVisible = ref(false);
const currentStepIndex = ref(0);
const dontShowAgain = ref(false);

const currentStep = computed(() => {
  return props.steps[currentStepIndex.value] || props.steps[0];
});

const tutorialPosition = computed(() => {
  const position = currentStep.value.position || 'center';
  
  const positions: Record<string, any> = {
    center: {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    },
    top: {
      top: '20%',
      left: '50%',
      transform: 'translateX(-50%)'
    },
    bottom: {
      bottom: '20%',
      left: '50%',
      transform: 'translateX(-50%)'
    },
    left: {
      top: '50%',
      left: '20%',
      transform: 'translateY(-50%)'
    },
    right: {
      top: '50%',
      right: '20%',
      transform: 'translateY(-50%)'
    }
  };

  return positions[position];
});

const start = () => {
  currentStepIndex.value = 0;
  isVisible.value = true;
  highlightElement();
};

const nextStep = () => {
  if (currentStepIndex.value < props.steps.length - 1) {
    currentStepIndex.value++;
    emit('stepChange', currentStepIndex.value);
    highlightElement();
  }
};

const previousStep = () => {
  if (currentStepIndex.value > 0) {
    currentStepIndex.value--;
    emit('stepChange', currentStepIndex.value);
    highlightElement();
  }
};

const skip = () => {
  isVisible.value = false;
  if (dontShowAgain.value) {
    saveTutorialState();
  }
  emit('skip');
};

const complete = () => {
  isVisible.value = false;
  saveTutorialState();
  emit('complete');
};

const highlightElement = () => {
  if (!currentStep.value.highlightElement) return;

  nextTick(() => {
    const element = document.querySelector(currentStep.value.highlightElement!);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add highlight class
      element.classList.add('tutorial-highlighted');
      
      // Remove highlight after a delay
      setTimeout(() => {
        element.classList.remove('tutorial-highlighted');
      }, 3000);
    }
  });
};

const saveTutorialState = () => {
  if (typeof window === 'undefined') return;
  
  const completedTutorials = JSON.parse(
    localStorage.getItem('completed-tutorials') || '[]'
  );
  
  if (!completedTutorials.includes(props.tutorialId)) {
    completedTutorials.push(props.tutorialId);
    localStorage.setItem('completed-tutorials', JSON.stringify(completedTutorials));
  }
};

const checkTutorialState = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const completedTutorials = JSON.parse(
    localStorage.getItem('completed-tutorials') || '[]'
  );
  
  return completedTutorials.includes(props.tutorialId);
};

// Auto-start if enabled and not completed
if (props.autoStart && !checkTutorialState()) {
  setTimeout(() => start(), 1000);
}

defineExpose({
  start,
  nextStep,
  previousStep,
  skip,
  complete
});
</script>

<style scoped>
.tutorial-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.85);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tutorial-content {
  position: absolute;
  width: 90%;
  max-width: 600px;
  background-color: rgba(0, 136, 0, 0.95);
  border: 2px solid var(--text-bright);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 255, 0, 0.3);
  font-family: 'VT323', 'Source Code Pro', monospace;
}

.tutorial-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--text-bright);
  background-color: rgba(0, 0, 0, 0.3);
}

.tutorial-title {
  font-size: 24px;
  color: var(--text-accent);
  margin: 0;
}

.tutorial-progress {
  font-size: 18px;
  color: var(--text-dim);
}

.tutorial-body {
  padding: 2rem;
  color: var(--text-bright);
}

.tutorial-text {
  font-size: 18px;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  color: var(--text-bright);
}

.tutorial-image {
  margin: 1.5rem 0;
  text-align: center;
}

.tutorial-image img {
  max-width: 100%;
  border: 1px solid var(--text-dim);
  border-radius: 4px;
}

.tutorial-example {
  margin: 1.5rem 0;
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.5);
  border: 1px solid var(--text-dim);
  border-radius: 4px;
}

.tutorial-example code {
  font-family: 'Source Code Pro', monospace;
  font-size: 16px;
  color: var(--text-accent);
}

.tutorial-tips {
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: rgba(0, 136, 136, 0.2);
  border-left: 3px solid var(--text-cyan);
  border-radius: 4px;
}

.tips-title {
  font-size: 18px;
  color: var(--text-cyan);
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.tips-list {
  list-style-position: inside;
  margin: 0;
  padding-left: 1rem;
}

.tips-list li {
  font-size: 16px;
  color: var(--text-bright);
  margin-bottom: 0.5rem;
}

.tutorial-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid var(--text-bright);
  background-color: rgba(0, 0, 0, 0.3);
}

.tutorial-btn {
  padding: 0.75rem 1.5rem;
  border: 1px solid var(--text-bright);
  border-radius: 4px;
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
}

.tutorial-btn-back {
  background-color: rgba(136, 136, 136, 0.3);
  color: var(--text-bright);
}

.tutorial-btn-skip {
  background-color: transparent;
  color: var(--text-dim);
}

.tutorial-btn-next,
.tutorial-btn-complete {
  background-color: rgba(0, 136, 0, 0.5);
  color: var(--text-bright);
  flex: 1;
}

.tutorial-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
}

.tutorial-btn-complete {
  background-color: rgba(0, 255, 0, 0.3);
}

.tutorial-options {
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(0, 255, 0, 0.3);
}

.tutorial-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-dim);
  font-size: 16px;
  cursor: pointer;
}

.tutorial-checkbox input {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

/* Highlight effect for elements */
:global(.tutorial-highlighted) {
  position: relative;
  z-index: 9999;
  box-shadow: 0 0 0 4px rgba(0, 255, 0, 0.5);
  animation: pulse-highlight 1s ease-in-out infinite;
}

@keyframes pulse-highlight {
  0%, 100% {
    box-shadow: 0 0 0 4px rgba(0, 255, 0, 0.5);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(0, 255, 0, 0.8);
  }
}

/* Animations */
.tutorial-enter-active,
.tutorial-leave-active {
  transition: opacity 0.3s ease;
}

.tutorial-enter-from,
.tutorial-leave-to {
  opacity: 0;
}

.tutorial-content {
  animation: slideIn 0.4s ease-out;
}

@keyframes slideIn {
  from {
    transform: translate(-50%, -60%);
    opacity: 0;
  }
  to {
    transform: translate(-50%, -50%);
    opacity: 1;
  }
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .tutorial-content {
    width: 95%;
    max-width: none;
  }

  .tutorial-header {
    padding: 1rem;
  }

  .tutorial-title {
    font-size: 20px;
  }

  .tutorial-progress {
    font-size: 16px;
  }

  .tutorial-body {
    padding: 1.5rem;
  }

  .tutorial-text {
    font-size: 16px;
  }

  .tutorial-footer {
    flex-direction: column;
    gap: 0.75rem;
  }

  .tutorial-btn {
    width: 100%;
    padding: 0.6rem 1rem;
    font-size: 16px;
  }
}
</style>
