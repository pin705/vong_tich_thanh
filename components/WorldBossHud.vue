<template>
  <Transition name="boss-hud">
    <div v-if="isActive" class="world-boss-hud">
      <div class="boss-header">
        <div class="boss-title">[ BOSS THẾ GIỚI ]</div>
        <div class="boss-name">{{ bossName }}</div>
      </div>
      
      <div class="boss-hp-container">
        <div class="boss-hp-bar">
          <div 
            class="boss-hp-fill" 
            :style="{ width: hpPercentage + '%' }"
          ></div>
        </div>
        <div class="boss-hp-text">
          HP: {{ currentHp }} / {{ maxHp }} ({{ hpPercentage }}%)
        </div>
      </div>

      <div class="boss-info">
        <div class="info-item">
          <span class="info-label">Thời gian còn lại:</span>
          <span class="info-value">{{ timeRemaining }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Đóng góp của bạn:</span>
          <span class="info-value contribution">{{ contributionPercentage }}%</span>
        </div>
        <div class="info-item">
          <span class="info-label">Người chơi tham gia:</span>
          <span class="info-value">{{ participantCount }}</span>
        </div>
      </div>

      <button class="boss-close" @click="$emit('minimize')">[_]</button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  isActive: boolean;
  bossName?: string;
  currentHp?: number;
  maxHp?: number;
  timeRemaining?: string;
  contributionPercentage?: number;
  participantCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false,
  bossName: 'World Boss',
  currentHp: 1000000,
  maxHp: 1000000,
  timeRemaining: '30:00',
  contributionPercentage: 0,
  participantCount: 0
});

const emit = defineEmits<{
  minimize: [];
}>();

const hpPercentage = computed(() => {
  if (props.maxHp === 0) return 0;
  return Math.max(0, Math.min(100, Math.floor((props.currentHp / props.maxHp) * 100)));
});
</script>

<style scoped>
.world-boss-hud {
  position: fixed;
  top: 5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  background: rgba(0, 0, 0, 0.95);
  border: 3px solid #8b0000;
  padding: 1rem;
  min-width: 500px;
  max-width: 800px;
  box-shadow: 0 0 30px rgba(139, 0, 0, 0.6);
  font-family: 'VT323', 'Source Code Pro', monospace;
}

.boss-header {
  text-align: center;
  margin-bottom: 1rem;
  border-bottom: 2px solid #8b0000;
  padding-bottom: 0.75rem;
}

.boss-title {
  color: #ff4444;
  font-size: 16px;
  font-weight: bold;
  letter-spacing: 2px;
}

.boss-name {
  color: #ff6666;
  font-size: 24px;
  font-weight: bold;
  margin-top: 0.5rem;
  text-shadow: 0 0 10px rgba(255, 68, 68, 0.8);
}

.boss-hp-container {
  margin-bottom: 1rem;
}

.boss-hp-bar {
  height: 40px;
  background: rgba(136, 0, 0, 0.5);
  border: 2px solid #8b0000;
  position: relative;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.boss-hp-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b0000, #ff0000);
  transition: width 0.5s ease;
  box-shadow: 0 0 20px rgba(255, 0, 0, 0.6);
  animation: pulse-hp 2s ease-in-out infinite;
}

@keyframes pulse-hp {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.boss-hp-text {
  text-align: center;
  color: var(--text-bright);
  font-size: 16px;
  font-weight: bold;
}

.boss-info {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem;
  background: rgba(136, 0, 0, 0.2);
  border: 1px solid rgba(139, 0, 0, 0.5);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  color: var(--text-dim);
  font-size: 12px;
}

.info-value {
  color: var(--text-bright);
  font-size: 18px;
  font-weight: bold;
}

.info-value.contribution {
  color: #ffd700;
}

.boss-close {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: transparent;
  color: var(--text-dim);
  border: 1px solid var(--text-dim);
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.boss-close:hover {
  color: var(--text-bright);
  border-color: var(--text-bright);
}

/* Animation */
.boss-hud-enter-active,
.boss-hud-leave-active {
  transition: all 0.3s ease;
}

.boss-hud-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

.boss-hud-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .world-boss-hud {
    min-width: 90vw;
    padding: 0.75rem;
    top: 3.5rem;
  }

  .boss-name {
    font-size: 20px;
  }

  .boss-hp-bar {
    height: 30px;
  }

  .boss-hp-text {
    font-size: 14px;
  }

  .boss-info {
    flex-direction: column;
    gap: 0.5rem;
  }

  .info-item {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .info-value {
    font-size: 16px;
  }
}

/* Tablet responsiveness */
@media (min-width: 769px) and (max-width: 1023px) {
  .world-boss-hud {
    min-width: 600px;
  }
}
</style>
