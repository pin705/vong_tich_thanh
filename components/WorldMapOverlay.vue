<template>
  <FullscreenOverlay :isOpen="isOpen" @close="$emit('close')" size="large" title="Bản Đồ Thế Giới">
    <div class="world-map-container">
      <!-- Map Header -->
      <div class="map-header">
        <h2>--- BẢN ĐỒ THẾ GIỚI ---</h2>
        <div class="current-location">Vị trí hiện tại: {{ currentRoomName }}</div>
      </div>

      <!-- Search/Filter -->
      <div class="map-controls">
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="Tìm kiếm phòng, NPC, boss..."
        />
        <div class="filter-buttons">
          <button
            v-for="filter in filters"
            :key="filter.id"
            :class="['filter-btn', { active: activeFilter === filter.id }]"
            @click="activeFilter = filter.id"
          >
            {{ filter.label }}
          </button>
        </div>
      </div>

      <!-- Map Grid -->
      <div class="map-content">
        <div
          v-for="room in filteredRooms"
          :key="room.id"
          :class="['room-card', { current: room.isCurrent, visited: room.visited }]"
          @click="selectRoom(room)"
        >
          <div class="room-name">{{ room.name }}</div>
          <div class="room-info">
            <div v-if="room.npcs && room.npcs.length > 0" class="room-npcs">
              <span class="info-icon">👤</span> {{ room.npcs.length }} NPC
            </div>
            <div v-if="room.mobs && room.mobs.length > 0" class="room-mobs">
              <span class="info-icon">⚔️</span> {{ room.mobs.length }} Quái vật
            </div>
            <div v-if="room.boss" class="room-boss">
              <span class="info-icon">👹</span> Boss: {{ room.boss }}
            </div>
            <div v-if="room.shop" class="room-shop">
              <span class="info-icon">🏪</span> Cửa hàng
            </div>
          </div>
          <div v-if="room.connections" class="room-connections">
            Lối đi: {{ room.connections.join(', ') }}
          </div>
        </div>
      </div>

      <!-- Room Detail Panel -->
      <div v-if="selectedRoom" class="room-detail">
        <div class="detail-header">{{ selectedRoom.name }}</div>
        <div class="detail-body">
          <p>{{ selectedRoom.description }}</p>
          
          <!-- NPCs -->
          <div v-if="selectedRoom.npcs && selectedRoom.npcs.length > 0" class="detail-section">
            <h4>NPCs:</h4>
            <div v-for="npc in selectedRoom.npcs" :key="npc" class="detail-item">
              • {{ npc }}
            </div>
          </div>

          <!-- Mobs -->
          <div v-if="selectedRoom.mobs && selectedRoom.mobs.length > 0" class="detail-section">
            <h4>Quái vật:</h4>
            <div v-for="mob in selectedRoom.mobs" :key="mob" class="detail-item">
              • {{ mob }}
            </div>
          </div>

          <!-- Boss -->
          <div v-if="selectedRoom.boss" class="detail-section boss-section">
            <h4>Boss:</h4>
            <div class="detail-item boss-name">⚠️ {{ selectedRoom.boss }}</div>
          </div>

          <!-- Actions -->
          <div class="detail-actions">
            <button
              v-if="!selectedRoom.isCurrent"
              class="action-button navigate"
              @click="navigateToRoom(selectedRoom)"
            >
              [→] DI CHUYỂN ĐẾN ĐÂY
            </button>
            <button
              v-else
              class="action-button current"
              disabled
            >
              [✓] VỊ TRÍ HIỆN TẠI
            </button>
          </div>
        </div>
      </div>

      <!-- Map Footer -->
      <div class="map-footer">
        <div class="legend">
          <span class="legend-item current">■ Vị trí hiện tại</span>
          <span class="legend-item visited">■ Đã khám phá</span>
          <span class="legend-item unexplored">■ Chưa khám phá</span>
        </div>
      </div>
    </div>
  </FullscreenOverlay>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import FullscreenOverlay from './FullscreenOverlay.vue';

interface Room {
  id: string;
  name: string;
  description: string;
  npcs?: string[];
  mobs?: string[];
  boss?: string;
  shop?: boolean;
  connections?: string[];
  isCurrent?: boolean;
  visited?: boolean;
}

interface Props {
  isOpen: boolean;
  currentRoomName: string;
  rooms: Room[];
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  currentRoomName: 'Không rõ',
  rooms: () => []
});

const emit = defineEmits(['close', 'navigateTo']);

const searchQuery = ref('');
const activeFilter = ref('all');
const selectedRoom = ref<Room | null>(null);

const filters = [
  { id: 'all', label: 'Tất cả' },
  { id: 'npcs', label: 'NPC' },
  { id: 'mobs', label: 'Quái vật' },
  { id: 'boss', label: 'Boss' },
  { id: 'shop', label: 'Cửa hàng' }
];

const filteredRooms = computed(() => {
  let result = props.rooms;

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(room => 
      room.name.toLowerCase().includes(query) ||
      room.description.toLowerCase().includes(query) ||
      room.npcs?.some(npc => npc.toLowerCase().includes(query)) ||
      room.mobs?.some(mob => mob.toLowerCase().includes(query)) ||
      room.boss?.toLowerCase().includes(query)
    );
  }

  // Apply category filter
  if (activeFilter.value !== 'all') {
    result = result.filter(room => {
      switch (activeFilter.value) {
        case 'npcs':
          return room.npcs && room.npcs.length > 0;
        case 'mobs':
          return room.mobs && room.mobs.length > 0;
        case 'boss':
          return !!room.boss;
        case 'shop':
          return !!room.shop;
        default:
          return true;
      }
    });
  }

  return result;
});

function selectRoom(room: Room) {
  selectedRoom.value = room;
}

function navigateToRoom(room: Room) {
  emit('navigateTo', room.id);
  emit('close');
}
</script>

<style scoped>
.world-map-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: #00ff00;
  font-family: 'VT323', 'Source Code Pro', monospace;
}

.map-header {
  padding: 1rem;
  border-bottom: 1px solid #008800;
  text-align: center;
}

.map-header h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: #00ff00;
}

.current-location {
  font-size: 1rem;
  color: #ffb000;
}

.map-controls {
  padding: 1rem;
  border-bottom: 1px solid #008800;
}

.search-input {
  width: 100%;
  background: rgba(0, 136, 0, 0.1);
  border: 1px solid #008800;
  color: #00ff00;
  padding: 0.5rem;
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 1rem;
  margin-bottom: 0.75rem;
}

.search-input:focus {
  outline: none;
  border-color: #00ff00;
}

.search-input::placeholder {
  color: #008800;
}

.filter-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-btn {
  background: transparent;
  border: 1px solid #008800;
  color: #008800;
  padding: 0.4rem 0.75rem;
  cursor: pointer;
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: rgba(0, 136, 0, 0.2);
}

.filter-btn.active {
  background: #008800;
  color: #000000;
  border-color: #00ff00;
}

.map-content {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  padding: 1rem;
  overflow-y: auto;
}

.room-card {
  border: 1px solid #008800;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(0, 136, 0, 0.05);
}

.room-card:hover {
  background: rgba(0, 255, 0, 0.1);
  border-color: #00ff00;
  transform: translateY(-2px);
}

.room-card.current {
  border-color: #ffb000;
  background: rgba(255, 176, 0, 0.1);
}

.room-card.visited {
  opacity: 0.8;
}

.room-name {
  font-weight: bold;
  color: #ffb000;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.room-info {
  font-size: 0.9rem;
  color: #00aaaa;
  margin-bottom: 0.5rem;
}

.room-info > div {
  margin-bottom: 0.25rem;
}

.info-icon {
  display: inline-block;
  margin-right: 0.25rem;
}

.room-npcs {
  color: #00aaaa;
}

.room-mobs {
  color: #ff8800;
}

.room-boss {
  color: #ff0000;
  font-weight: bold;
}

.room-shop {
  color: #ffb000;
}

.room-connections {
  font-size: 0.85rem;
  color: #008800;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #008800;
}

.room-detail {
  position: fixed;
  right: 1rem;
  top: 8rem;
  width: 25rem;
  border: 2px solid #00ff00;
  background: #000000;
  padding: 1rem;
  max-height: 60%;
  overflow-y: auto;
  z-index: 10;
}

.detail-header {
  font-size: 1.3rem;
  font-weight: bold;
  color: #ffb000;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #008800;
}

.detail-body p {
  margin-bottom: 1rem;
  line-height: 1.5;
  color: #00aaaa;
}

.detail-section {
  margin-bottom: 1rem;
}

.detail-section h4 {
  color: #ffb000;
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.detail-item {
  color: #00ff00;
  margin-bottom: 0.25rem;
  padding-left: 1rem;
}

.boss-section {
  border: 1px solid #ff0000;
  padding: 0.5rem;
  background: rgba(255, 0, 0, 0.05);
}

.boss-name {
  color: #ff0000;
  font-weight: bold;
}

.detail-actions {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #008800;
}

.action-button {
  width: 100%;
  background: #008800;
  border: 1px solid #00ff00;
  color: #000000;
  padding: 0.75rem;
  cursor: pointer;
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 1rem;
  font-weight: bold;
  transition: all 0.2s;
}

.action-button:hover:not(:disabled) {
  background: #00ff00;
  transform: scale(1.02);
}

.action-button.current {
  background: #ffb000;
  border-color: #ffd700;
  cursor: default;
}

.action-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.map-footer {
  padding: 1rem;
  border-top: 1px solid #008800;
}

.legend {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.legend-item {
  font-size: 0.9rem;
}

.legend-item.current {
  color: #ffb000;
}

.legend-item.visited {
  color: #00aaaa;
}

.legend-item.unexplored {
  color: #008800;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .map-header h2 {
    font-size: 1.2rem;
  }

  .current-location {
    font-size: 0.9rem;
  }

  .map-controls {
    padding: 0.75rem;
  }

  .search-input {
    font-size: 0.9rem;
    padding: 0.4rem;
  }

  .filter-btn {
    padding: 0.35rem 0.6rem;
    font-size: 0.85rem;
  }

  .map-content {
    grid-template-columns: 1fr;
    gap: 0.75rem;
    padding: 0.75rem;
  }

  .room-card {
    padding: 0.6rem;
  }

  .room-name {
    font-size: 1rem;
  }

  .room-info {
    font-size: 0.85rem;
  }

  .room-connections {
    font-size: 0.8rem;
  }

  .room-detail {
    position: fixed;
    left: 0.5rem;
    right: 0.5rem;
    top: auto;
    bottom: 0.5rem;
    width: auto;
    max-height: 50vh;
  }

  .detail-header {
    font-size: 1.1rem;
  }

  .detail-body p {
    font-size: 0.9rem;
  }

  .detail-section h4 {
    font-size: 0.95rem;
  }

  .detail-item {
    font-size: 0.9rem;
  }

  .action-button {
    padding: 0.6rem;
    font-size: 0.9rem;
  }

  .map-footer {
    padding: 0.75rem;
  }

  .legend {
    gap: 1rem;
  }

  .legend-item {
    font-size: 0.8rem;
  }
}
</style>
