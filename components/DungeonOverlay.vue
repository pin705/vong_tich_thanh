<template>
  <FullscreenOverlay :isOpen="isOpen" @close="$emit('close')" size="medium" title="Hầm Ngục">
    <div class="dungeon-container">
      <!-- Header Stats -->
      <div class="dungeon-header">
        <div class="dungeon-stat-box">
          <div class="stat-label">Tầng Hiện Tại</div>
          <div class="stat-value">{{ dungeonStatus.currentFloor }}</div>
        </div>
        <div class="dungeon-stat-box">
          <div class="stat-label">Tầng Cao Nhất</div>
          <div class="stat-value">{{ dungeonStatus.highestFloor }}</div>
        </div>
        <div class="dungeon-stat-box">
          <div class="stat-label">Xu Hầm Ngục</div>
          <div class="stat-value">🎫 {{ dungeonStatus.dungeonCoin }}</div>
        </div>
      </div>

      <!-- Weekly Reset Timer -->
      <div class="dungeon-reset-info">
        <div class="reset-label">Reset hàng tuần:</div>
        <div class="reset-time">{{ getResetTime() }}</div>
      </div>

      <!-- Description -->
      <div class="dungeon-description">
        <p>
          Hầm Ngục là thử thách đặc biệt nơi bạn phải chiến đấu với các quái vật ngày càng mạnh hơn.
          Mỗi tầng sẽ xuất hiện một quái vật, và bạn phải đánh bại nó để tiến lên tầng tiếp theo.
        </p>
        <p>
          <strong>Phần thưởng:</strong> Vàng và Xu Hầm Ngục. Xu Hầm Ngục có thể dùng để mua vật phẩm đặc biệt.
        </p>
        <p>
          <strong>Reset:</strong> Tiến độ sẽ được reset về tầng 1 vào Chủ Nhật hàng tuần.
        </p>
      </div>

      <!-- Floor Progress -->
      <div class="dungeon-progress">
        <div class="progress-header">Tiến Độ Tầng</div>
        <div class="progress-bar-container">
          <div 
            class="progress-bar" 
            :style="{ width: getProgressPercent() + '%' }"
          ></div>
        </div>
        <div class="progress-text">
          {{ dungeonStatus.currentFloor }} / {{ dungeonStatus.highestFloor }}
        </div>
      </div>

      <!-- Actions -->
      <div class="dungeon-actions">
        <button 
          class="dungeon-btn dungeon-btn-primary"
          @click="enterDungeon"
          :disabled="loading"
        >
          {{ loading ? '⏳ Đang tải...' : '⚔️ VÀO KHIÊU CHIẾN' }}
        </button>
        <button 
          class="dungeon-btn dungeon-btn-secondary"
          @click="openShop"
        >
          🏪 MỞ CỬA HÀNG
        </button>
      </div>

      <!-- Rewards Table -->
      <div class="dungeon-rewards">
        <div class="rewards-header">Phần Thưởng Theo Tầng</div>
        <table class="rewards-table">
          <thead>
            <tr>
              <th>Tầng</th>
              <th>Loại</th>
              <th>Vàng</th>
              <th>Xu Hầm Ngục</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="floor in sampleFloors" :key="floor" :class="{ current: floor === dungeonStatus.currentFloor }">
              <td>{{ floor }}</td>
              <td>
                <span v-if="floor % 10 === 0" class="boss-badge">Boss</span>
                <span v-else-if="floor % 5 === 0" class="elite-badge">Tinh Anh</span>
                <span v-else>Thường</span>
              </td>
              <td>{{ calculateReward(floor, 'gold') }}</td>
              <td>{{ calculateReward(floor, 'coin') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </FullscreenOverlay>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import FullscreenOverlay from './FullscreenOverlay.vue';

interface Props {
  isOpen: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
}>();

const loading = ref(false);
const dungeonStatus = ref({
  currentFloor: 1,
  highestFloor: 1,
  dungeonCoin: 0,
  lastWeeklyReset: new Date(),
});

const sampleFloors = [1, 5, 10, 15, 20, 25, 30];

// Fetch dungeon status when opened
onMounted(async () => {
  if (props.isOpen) {
    await fetchDungeonStatus();
  }
});

async function fetchDungeonStatus() {
  try {
    // In a real implementation, this would call an API
    // For now, we'll use placeholder data
    console.log('Fetching dungeon status...');
  } catch (error) {
    console.error('Error fetching dungeon status:', error);
  }
}

function getResetTime() {
  const now = new Date();
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + ((7 - now.getDay()) % 7 || 7));
  nextSunday.setHours(0, 0, 0, 0);
  
  const diff = nextSunday.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  return `${days} ngày ${hours} giờ`;
}

function getProgressPercent() {
  if (dungeonStatus.value.highestFloor === 0) return 0;
  return (dungeonStatus.value.currentFloor / dungeonStatus.value.highestFloor) * 100;
}

function calculateReward(floor: number, type: 'gold' | 'coin') {
  if (type === 'gold') {
    return Math.floor(50 * floor * 1.2);
  } else {
    return Math.floor(1 * Math.max(1, floor / 5));
  }
}

async function enterDungeon() {
  loading.value = true;
  try {
    // Send command to enter dungeon
    const ws = (window as any).gameWs;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'command',
        payload: { action: 'dungeon', target: 'enter' }
      }));
    }
    emit('close');
  } catch (error) {
    console.error('Error entering dungeon:', error);
  } finally {
    loading.value = false;
  }
}

function openShop() {
  // Send command to talk to dungeon merchant
  const ws = (window as any).gameWs;
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'command',
      payload: { action: 'talk', target: 'Thương Nhân Hầm Ngục' }
    }));
  }
  emit('close');
}
</script>

<style scoped>
.dungeon-container {
  padding: 20px;
  color: #e0e0e0;
}

.dungeon-header {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  justify-content: space-around;
}

.dungeon-stat-box {
  flex: 1;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid #4a4a4a;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
}

.stat-label {
  font-size: 0.9rem;
  color: #888;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #ffd700;
}

.dungeon-reset-info {
  background: rgba(139, 69, 19, 0.2);
  border: 1px solid #8b4513;
  border-radius: 5px;
  padding: 10px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.reset-label {
  font-weight: bold;
  color: #ff8c00;
}

.reset-time {
  color: #ffa500;
}

.dungeon-description {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid #4a4a4a;
  border-radius: 5px;
  padding: 15px;
  margin-bottom: 20px;
  line-height: 1.6;
}

.dungeon-description p {
  margin-bottom: 10px;
}

.dungeon-progress {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #4a4a4a;
  border-radius: 5px;
  padding: 15px;
  margin-bottom: 20px;
}

.progress-header {
  font-weight: bold;
  margin-bottom: 10px;
  color: #fff;
}

.progress-bar-container {
  width: 100%;
  height: 20px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 5px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #ff4500, #ffd700);
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  font-size: 0.9rem;
  color: #ccc;
}

.dungeon-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.dungeon-btn {
  flex: 1;
  padding: 15px;
  font-size: 1.1rem;
  font-weight: bold;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.2s;
}

.dungeon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dungeon-btn-primary {
  background: linear-gradient(135deg, #dc143c, #8b0000);
  color: white;
  border: 2px solid #ff4500;
}

.dungeon-btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #ff4500, #dc143c);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(220, 20, 60, 0.4);
}

.dungeon-btn-secondary {
  background: linear-gradient(135deg, #2e7d32, #1b5e20);
  color: white;
  border: 2px solid #4caf50;
}

.dungeon-btn-secondary:hover {
  background: linear-gradient(135deg, #4caf50, #2e7d32);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.4);
}

.dungeon-rewards {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #4a4a4a;
  border-radius: 5px;
  padding: 15px;
}

.rewards-header {
  font-weight: bold;
  margin-bottom: 15px;
  color: #fff;
  font-size: 1.1rem;
}

.rewards-table {
  width: 100%;
  border-collapse: collapse;
}

.rewards-table th,
.rewards-table td {
  padding: 10px;
  text-align: center;
  border: 1px solid #4a4a4a;
}

.rewards-table th {
  background: rgba(255, 215, 0, 0.2);
  color: #ffd700;
  font-weight: bold;
}

.rewards-table tr.current {
  background: rgba(255, 69, 0, 0.2);
  border: 2px solid #ff4500;
}

.boss-badge {
  background: #8b0000;
  color: #ffd700;
  padding: 2px 8px;
  border-radius: 3px;
  font-weight: bold;
  font-size: 0.85rem;
}

.elite-badge {
  background: #4b0082;
  color: #da70d6;
  padding: 2px 8px;
  border-radius: 3px;
  font-weight: bold;
  font-size: 0.85rem;
}
</style>
