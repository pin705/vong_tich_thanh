<template>
  <FullscreenOverlay :isOpen="isOpen" @close="$emit('close')" size="large" title="Thám Hiểm Di Tích">
    <div class="dungeon-finder-container">
      <!-- Description -->
      <div class="dungeon-description">
        <p>
          Di Tích là hầm ngục đặc biệt yêu cầu một nhóm người chơi (Party) để hoàn thành.
          Phần thưởng bao gồm trang bị hiếm và vật liệu quý giá.
        </p>
      </div>

      <!-- Dungeon List -->
      <div class="dungeon-list">
        <div class="section-title">Danh Sách Di Tích</div>
        
        <div
          v-for="dungeon in dungeons"
          :key="dungeon.id"
          class="dungeon-card"
          :class="{ 
            selected: selectedDungeon === dungeon.id,
            locked: !dungeon.unlocked
          }"
          @click="dungeon.unlocked && (selectedDungeon = dungeon.id)"
        >
          <div class="dungeon-header">
            <div class="dungeon-name">{{ dungeon.name }}</div>
            <div class="dungeon-difficulty" :class="'difficulty-' + dungeon.difficulty.toLowerCase()">
              {{ dungeon.difficulty }}
            </div>
          </div>
          
          <div class="dungeon-info">
            <div class="info-row">
              <span class="info-label">Yêu cầu cấp:</span>
              <span class="info-value">{{ dungeon.levelRequirement }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Số người:</span>
              <span class="info-value">{{ dungeon.minPlayers }}-{{ dungeon.maxPlayers }} người</span>
            </div>
            <div class="info-row">
              <span class="info-label">Thời gian:</span>
              <span class="info-value">~{{ dungeon.estimatedTime }} phút</span>
            </div>
          </div>

          <div class="dungeon-rewards">
            <div class="rewards-title">Phần thưởng:</div>
            <div class="rewards-list">{{ dungeon.rewards }}</div>
          </div>

          <div v-if="!dungeon.unlocked" class="dungeon-locked">
            [KHÓA] Hoàn thành {{ dungeon.unlockRequirement }}
          </div>
        </div>
      </div>

      <!-- Selected Dungeon Details -->
      <div v-if="selectedDungeonData" class="dungeon-detail">
        <div class="detail-header">{{ selectedDungeonData.name }}</div>
        <div class="detail-description">{{ selectedDungeonData.description }}</div>
        
        <div class="detail-bosses">
          <div class="bosses-title">Boss:</div>
          <div class="bosses-list">
            <div v-for="boss in selectedDungeonData.bosses" :key="boss" class="boss-item">
              • {{ boss }}
            </div>
          </div>
        </div>
      </div>

      <!-- Party Status -->
      <div class="party-status">
        <div class="section-title">Trạng Thái Nhóm</div>
        
        <div v-if="isInParty">
          <div class="party-info">
            <div class="info-row">
              <span class="info-label">Thành viên:</span>
              <span class="info-value">{{ partyMembers }}/{{ maxPartySize }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Trạng thái:</span>
              <span class="info-value">{{ isLeader ? 'Bạn là Trưởng nhóm' : 'Thành viên' }}</span>
            </div>
          </div>
        </div>
        <div v-else class="no-party">
          Bạn chưa có nhóm. Hãy tạo nhóm hoặc tìm nhóm để tham gia Di Tích!
        </div>
      </div>

      <!-- Actions -->
      <div class="dungeon-actions">
        <button
          v-if="isLeader"
          class="dungeon-btn dungeon-btn-primary"
          :disabled="!canEnter"
          @click="enterDungeon"
        >
          {{ loading ? 'Đang tải...' : 'VÀO DI TÍCH' }}
        </button>
        
        <button
          v-if="!isInParty"
          class="dungeon-btn dungeon-btn-create"
          @click="createParty"
        >
          TẠO NHÓM
        </button>
        
        <button
          class="dungeon-btn dungeon-btn-secondary"
          @click="findParty"
        >
          TÌM NHÓM
        </button>
      </div>

      <!-- Info -->
      <div class="dungeon-info-box">
        <div class="info-title">[Lưu Ý]</div>
        <ul class="info-list">
          <li>Di Tích yêu cầu nhóm từ {{ minRequiredPlayers }} người trở lên</li>
          <li>Chỉ Trưởng nhóm mới có thể bắt đầu Di Tích</li>
          <li>Tất cả thành viên phải đạt yêu cầu cấp độ</li>
          <li>Phần thưởng được phân phối tự động cho toàn bộ nhóm</li>
          <li>Nếu thất bại, có thể thử lại sau {{ retryTime }} phút</li>
        </ul>
      </div>
    </div>
  </FullscreenOverlay>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import FullscreenOverlay from './FullscreenOverlay.vue';

interface Dungeon {
  id: string;
  name: string;
  difficulty: 'Dễ' | 'Trung Bình' | 'Khó' | 'Cực Khó';
  levelRequirement: number;
  minPlayers: number;
  maxPlayers: number;
  estimatedTime: number;
  rewards: string;
  unlocked: boolean;
  unlockRequirement?: string;
  description: string;
  bosses: string[];
}

interface Props {
  isOpen: boolean;
  isInParty?: boolean;
  isLeader?: boolean;
  partyMembers?: number;
  maxPartySize?: number;
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  isInParty: false,
  isLeader: false,
  partyMembers: 0,
  maxPartySize: 5
});

const emit = defineEmits<{
  close: [];
}>();

const selectedDungeon = ref<string | null>(null);
const loading = ref(false);
const minRequiredPlayers = 3;
const retryTime = 30;

const dungeons: Dungeon[] = [
  {
    id: 'crypt',
    name: 'Hầm Mộ Cổ',
    difficulty: 'Dễ',
    levelRequirement: 10,
    minPlayers: 3,
    maxPlayers: 5,
    estimatedTime: 20,
    rewards: 'Trang bị Hiếm, Vàng',
    unlocked: true,
    description: 'Hầm mộ cổ đại đầy xác sống và bẫy. Boss cuối là Vua Xác Sống.',
    bosses: ['Vua Xác Sống']
  },
  {
    id: 'temple',
    name: 'Đền Thờ Quỷ',
    difficulty: 'Trung Bình',
    levelRequirement: 20,
    minPlayers: 3,
    maxPlayers: 5,
    estimatedTime: 30,
    rewards: 'Trang bị Sử Thi, Đá Quý',
    unlocked: true,
    description: 'Đền thờ bị phong ấn với các con quỷ hung tợn. Boss cuối là Ma Vương Đen.',
    bosses: ['Ma Vương Đen']
  },
  {
    id: 'fortress',
    name: 'Pháo Đài Rồng',
    difficulty: 'Khó',
    levelRequirement: 30,
    minPlayers: 4,
    maxPlayers: 5,
    estimatedTime: 45,
    rewards: 'Trang bị Huyền Thoại, Vảy Rồng',
    unlocked: true,
    unlockRequirement: 'Đền Thờ Quỷ',
    description: 'Pháo đài cổ xưa bảo vệ bởi rồng lửa. Boss cuối là Rồng Lửa Cổ Đại.',
    bosses: ['Rồng Lửa Cổ Đại']
  },
  {
    id: 'abyss',
    name: 'Vực Thẳm Vô Tận',
    difficulty: 'Cực Khó',
    levelRequirement: 40,
    minPlayers: 5,
    maxPlayers: 5,
    estimatedTime: 60,
    rewards: 'Trang bị Thần Thoại, Linh Hồn Cổ Đại',
    unlocked: false,
    unlockRequirement: 'Pháo Đài Rồng',
    description: 'Vực thẳm tối tăm với những sinh vật từ thế giới khác. Nhiều Boss mạnh mẽ.',
    bosses: ['Cổ Thần Bóng Tối', 'Quỷ Vương', 'Ma Hoàng Tối Thượng']
  }
];

const selectedDungeonData = computed(() => {
  return dungeons.find(d => d.id === selectedDungeon.value);
});

const canEnter = computed(() => {
  if (!props.isInParty || !props.isLeader) return false;
  if (!selectedDungeon.value) return false;
  const dungeon = selectedDungeonData.value;
  if (!dungeon) return false;
  return props.partyMembers >= dungeon.minPlayers;
});

const enterDungeon = () => {
  if (!canEnter.value) return;
  
  loading.value = true;
  const ws = (window as any).gameWs;
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'command',
      payload: { action: 'party-dungeon', target: 'enter', dungeonId: selectedDungeon.value }
    }));
  }
  emit('close');
  loading.value = false;
};

const createParty = () => {
  const ws = (window as any).gameWs;
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'command',
      payload: { action: 'party', target: 'create' }
    }));
  }
};

const findParty = () => {
  const ws = (window as any).gameWs;
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'command',
      payload: { action: 'party-dungeon', target: 'find', dungeonId: selectedDungeon.value }
    }));
  }
  emit('close');
};
</script>

<style scoped>
.dungeon-finder-container {
  padding: 1.5rem;
  color: var(--text-bright);
}

.dungeon-description {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(0, 136, 0, 0.3);
  padding: 1rem;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.section-title {
  color: var(--text-accent);
  font-weight: bold;
  margin-bottom: 1rem;
  font-size: 18px;
}

.dungeon-list {
  margin-bottom: 1.5rem;
}

.dungeon-card {
  background: rgba(0, 136, 0, 0.05);
  border: 2px solid rgba(0, 136, 0, 0.3);
  padding: 1rem;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.dungeon-card:hover:not(.locked) {
  background: rgba(0, 136, 0, 0.1);
  border-color: var(--text-bright);
}

.dungeon-card.selected {
  background: rgba(0, 136, 0, 0.2);
  border-color: var(--text-accent);
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
}

.dungeon-card.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.dungeon-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(0, 136, 0, 0.3);
}

.dungeon-name {
  font-size: 20px;
  font-weight: bold;
  color: var(--text-bright);
}

.dungeon-difficulty {
  padding: 0.25rem 0.75rem;
  font-size: 14px;
  font-weight: bold;
  border: 1px solid currentColor;
}

.difficulty-dễ {
  color: #00ff00;
  background: rgba(0, 255, 0, 0.1);
}

.difficulty-trung-bình {
  color: #ffaa00;
  background: rgba(255, 170, 0, 0.1);
}

.difficulty-khó {
  color: #ff4444;
  background: rgba(255, 68, 68, 0.1);
}

.difficulty-cực-khó {
  color: #ff00ff;
  background: rgba(255, 0, 255, 0.1);
}

.dungeon-info {
  margin-bottom: 0.75rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
  font-size: 14px;
}

.info-label {
  color: var(--text-dim);
}

.info-value {
  color: var(--text-bright);
}

.dungeon-rewards {
  padding: 0.5rem;
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.rewards-title {
  color: #ffd700;
  font-weight: bold;
  margin-bottom: 0.25rem;
  font-size: 14px;
}

.rewards-list {
  color: var(--text-bright);
  font-size: 13px;
}

.dungeon-locked {
  margin-top: 0.75rem;
  padding: 0.5rem;
  background: rgba(136, 0, 0, 0.2);
  border: 1px solid rgba(136, 0, 0, 0.5);
  color: var(--text-damage);
  text-align: center;
  font-weight: bold;
}

.dungeon-detail {
  background: rgba(0, 136, 0, 0.1);
  border: 2px solid rgba(0, 136, 0, 0.5);
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.detail-header {
  font-size: 20px;
  font-weight: bold;
  color: var(--text-accent);
  margin-bottom: 0.75rem;
}

.detail-description {
  color: var(--text-bright);
  margin-bottom: 1rem;
  line-height: 1.6;
}

.detail-bosses {
  padding: 0.75rem;
  background: rgba(136, 0, 0, 0.15);
  border-left: 3px solid #ff4444;
}

.bosses-title {
  color: #ff4444;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.bosses-list {
  color: var(--text-bright);
}

.boss-item {
  margin-bottom: 0.25rem;
}

.party-status {
  margin-bottom: 1.5rem;
}

.party-info {
  padding: 1rem;
  background: rgba(0, 136, 136, 0.1);
  border: 1px solid rgba(0, 136, 136, 0.3);
}

.no-party {
  padding: 1rem;
  background: rgba(136, 0, 0, 0.1);
  border: 1px solid rgba(136, 0, 0, 0.3);
  color: var(--text-damage);
  text-align: center;
}

.dungeon-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.dungeon-btn {
  flex: 1;
  padding: 1rem;
  font-size: 16px;
  font-weight: bold;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.dungeon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dungeon-btn-primary {
  background: linear-gradient(135deg, #8b0000, #dc143c);
  color: white;
  border: 2px solid #ff4500;
}

.dungeon-btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #dc143c, #8b0000);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(220, 20, 60, 0.4);
}

.dungeon-btn-create {
  background: linear-gradient(135deg, #0099ff, #0066cc);
  color: white;
  border: 2px solid #0099ff;
}

.dungeon-btn-create:hover {
  background: linear-gradient(135deg, #00aaff, #0099ff);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 153, 255, 0.4);
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

.dungeon-info-box {
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
  .dungeon-finder-container {
    padding: 1rem;
  }

  .dungeon-actions {
    flex-direction: column;
  }

  .dungeon-name {
    font-size: 18px;
  }
}
</style>
