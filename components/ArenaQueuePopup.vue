<template>
  <FullscreenOverlay :isOpen="isOpen" @close="$emit('close')" size="medium" title="Đấu Trường PvP">
    <div class="arena-container">
      <!-- Arena Stats -->
      <div class="arena-stats">
        <div class="stat-box">
          <div class="stat-label">Điểm Vinh Quang</div>
          <div class="stat-value glory">{{ gloryPoints }}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Thắng</div>
          <div class="stat-value wins">{{ wins }}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Thua</div>
          <div class="stat-value losses">{{ losses }}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Xếp Hạng</div>
          <div class="stat-value rank">{{ rank || 'Chưa có' }}</div>
        </div>
      </div>

      <!-- Description -->
      <div class="arena-description">
        <p>
          Đấu Trường PvP là nơi thử thách kỹ năng của bạn với người chơi khác.
          Chiến thắng để nhận Điểm Vinh Quang và leo hạng!
        </p>
      </div>

      <!-- Arena Types -->
      <div class="arena-types">
        <div class="section-title">Chọn Thể Loại</div>
        
        <div
          v-for="type in arenaTypes"
          :key="type.id"
          class="arena-type-card"
          :class="{ selected: selectedType === type.id }"
          @click="selectedType = type.id"
        >
          <div class="type-header">
            <span class="type-name">{{ type.name }}</span>
            <span class="type-mode">{{ type.mode }}</span>
          </div>
          <div class="type-description">{{ type.description }}</div>
          <div class="type-rewards">
            <span class="rewards-label">Phần thưởng:</span>
            <span class="rewards-value">{{ type.rewards }}</span>
          </div>
        </div>
      </div>

      <!-- Queue Status -->
      <div v-if="isInQueue" class="queue-status">
        <div class="queue-text">Đang tìm đối thủ...</div>
        <div class="queue-timer">{{ queueTime }}s</div>
        <button class="cancel-queue-btn" @click="cancelQueue">
          HỦY TÌM TRẬN
        </button>
      </div>

      <!-- Actions -->
      <div v-else class="arena-actions">
        <button
          class="arena-btn arena-btn-primary"
          :disabled="!selectedType || loading"
          @click="joinQueue"
        >
          {{ loading ? 'Đang tải...' : 'TÌM TRẬN' }}
        </button>
        <button
          class="arena-btn arena-btn-secondary"
          @click="viewLeaderboard"
        >
          XEM BẢNG XẾP HẠNG
        </button>
      </div>

      <!-- Info -->
      <div class="arena-info">
        <div class="info-title">[Thông Tin]</div>
        <ul class="info-list">
          <li>Thắng trận để nhận Điểm Vinh Quang</li>
          <li>Điểm Vinh Quang dùng để đổi trang bị PvP đặc biệt</li>
          <li>Thua trận sẽ mất một ít Điểm Vinh Quang</li>
          <li>Xếp hạng được tính toán dựa trên Điểm Vinh Quang</li>
        </ul>
      </div>
    </div>
  </FullscreenOverlay>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import FullscreenOverlay from './FullscreenOverlay.vue';

interface ArenaType {
  id: string;
  name: string;
  mode: string;
  description: string;
  rewards: string;
}

interface Props {
  isOpen: boolean;
  gloryPoints?: number;
  wins?: number;
  losses?: number;
  rank?: string;
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  gloryPoints: 0,
  wins: 0,
  losses: 0,
  rank: ''
});

const emit = defineEmits<{
  close: [];
}>();

const selectedType = ref<string | null>(null);
const loading = ref(false);
const isInQueue = ref(false);
const queueTime = ref(0);

const arenaTypes: ArenaType[] = [
  {
    id: '1v1',
    name: 'Đấu Đơn',
    mode: '1v1',
    description: 'Đối đầu 1 vs 1 với người chơi khác',
    rewards: '10-30 Điểm Vinh Quang'
  },
  {
    id: '2v2',
    name: 'Đấu Đôi',
    mode: '2v2',
    description: 'Tìm đồng đội và đối đầu với nhóm khác',
    rewards: '15-40 Điểm Vinh Quang'
  },
  {
    id: '3v3',
    name: 'Đấu Nhóm',
    mode: '3v3',
    description: 'Chiến đấu theo nhóm 3 người',
    rewards: '20-50 Điểm Vinh Quang'
  }
];

const joinQueue = () => {
  if (!selectedType.value) return;
  
  loading.value = true;
  const ws = (window as any).gameWs;
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'command',
      payload: { action: 'arena', target: 'join', mode: selectedType.value }
    }));
  }
  
  isInQueue.value = true;
  loading.value = false;
  
  // Simulate queue timer
  const timer = setInterval(() => {
    queueTime.value++;
  }, 1000);
  
  // Store timer for cleanup
  (window as any).arenaQueueTimer = timer;
};

const cancelQueue = () => {
  const ws = (window as any).gameWs;
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'command',
      payload: { action: 'arena', target: 'cancel' }
    }));
  }
  
  isInQueue.value = false;
  queueTime.value = 0;
  
  if ((window as any).arenaQueueTimer) {
    clearInterval((window as any).arenaQueueTimer);
  }
};

const viewLeaderboard = () => {
  const ws = (window as any).gameWs;
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'command',
      payload: { action: 'arena', target: 'leaderboard' }
    }));
  }
  emit('close');
};
</script>

<style scoped>
.arena-container {
  padding: 1.5rem;
  color: var(--text-bright);
}

.arena-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-box {
  background: rgba(0, 136, 0, 0.1);
  border: 2px solid rgba(0, 136, 0, 0.3);
  padding: 1rem;
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: var(--text-dim);
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
}

.stat-value.glory {
  color: #ffd700;
}

.stat-value.wins {
  color: #00ff00;
}

.stat-value.losses {
  color: #ff4444;
}

.stat-value.rank {
  color: var(--text-accent);
}

.arena-description {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(0, 136, 0, 0.3);
  padding: 1rem;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.arena-types {
  margin-bottom: 1.5rem;
}

.section-title {
  color: var(--text-accent);
  font-weight: bold;
  margin-bottom: 1rem;
  font-size: 18px;
}

.arena-type-card {
  background: rgba(0, 136, 0, 0.05);
  border: 2px solid rgba(0, 136, 0, 0.3);
  padding: 1rem;
  margin-bottom: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.arena-type-card:hover {
  background: rgba(0, 136, 0, 0.1);
  border-color: var(--text-bright);
}

.arena-type-card.selected {
  background: rgba(0, 136, 0, 0.2);
  border-color: var(--text-accent);
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
}

.type-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.type-name {
  font-size: 18px;
  font-weight: bold;
  color: var(--text-bright);
}

.type-mode {
  background: rgba(255, 176, 0, 0.2);
  color: var(--text-accent);
  padding: 0.25rem 0.5rem;
  font-size: 14px;
  border: 1px solid var(--text-accent);
}

.type-description {
  color: var(--text-dim);
  margin-bottom: 0.5rem;
}

.type-rewards {
  display: flex;
  gap: 0.5rem;
  font-size: 14px;
}

.rewards-label {
  color: var(--text-dim);
}

.rewards-value {
  color: #ffd700;
  font-weight: bold;
}

.queue-status {
  background: rgba(255, 176, 0, 0.1);
  border: 2px solid var(--text-accent);
  padding: 2rem;
  text-align: center;
  margin-bottom: 1.5rem;
}

.queue-text {
  font-size: 20px;
  color: var(--text-accent);
  margin-bottom: 1rem;
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

.queue-timer {
  font-size: 32px;
  color: var(--text-bright);
  font-weight: bold;
  margin-bottom: 1.5rem;
}

.cancel-queue-btn {
  padding: 0.75rem 2rem;
  background: rgba(136, 0, 0, 0.8);
  color: white;
  border: 2px solid #ff4444;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-queue-btn:hover {
  background: rgba(136, 0, 0, 1);
  transform: translateY(-2px);
}

.arena-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.arena-btn {
  flex: 1;
  padding: 1rem;
  font-size: 18px;
  font-weight: bold;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.arena-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.arena-btn-primary {
  background: linear-gradient(135deg, #ff8c00, #ffa500);
  color: white;
  border: 2px solid #ff8c00;
}

.arena-btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #ffa500, #ff8c00);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(255, 140, 0, 0.4);
}

.arena-btn-secondary {
  background: linear-gradient(135deg, #2e7d32, #1b5e20);
  color: white;
  border: 2px solid #4caf50;
}

.arena-btn-secondary:hover {
  background: linear-gradient(135deg, #4caf50, #2e7d32);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.4);
}

.arena-info {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(0, 136, 0, 0.3);
  padding: 1rem;
}

.info-title {
  color: var(--text-accent);
  font-weight: bold;
  margin-bottom: 0.75rem;
}

.info-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.info-list li {
  padding: 0.25rem 0;
  color: var(--text-dim);
}

.info-list li::before {
  content: '• ';
  color: var(--text-bright);
  margin-right: 0.5rem;
}

@media (max-width: 768px) {
  .arena-container {
    padding: 1rem;
  }

  .arena-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .arena-actions {
    flex-direction: column;
  }
}
</style>
