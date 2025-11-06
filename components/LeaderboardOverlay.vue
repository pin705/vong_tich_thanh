<template>
  <FullscreenOverlay :isOpen="isOpen" @close="$emit('close')" size="large" title="Bảng Xếp Hạng">
    <div class="leaderboard-container">
      <!-- Tab selector for different leaderboards -->
      <div class="leaderboard-tabs">
        <button
          :class="['tab-button', { active: currentTab === 'power' }]"
          @click="currentTab = 'power'"
        >
          [Sức Mạnh]
        </button>
        <button
          :class="['tab-button', { active: currentTab === 'dungeon' }]"
          @click="currentTab = 'dungeon'"
        >
          [Hầm Ngục]
        </button>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="loading-message">Đang tải bảng xếp hạng...</div>

      <!-- Power Leaderboard -->
      <div v-else-if="currentTab === 'power'" class="leaderboard-content">
        <div class="section-title">[ Top 100 Người Chơi Mạnh Nhất ]</div>
        
        <div v-if="powerLeaderboard.length === 0" class="empty-message">
          Chưa có dữ liệu xếp hạng.
        </div>
        <div v-else class="leaderboard-table">
          <div class="table-header">
            <div class="col-rank">Hạng</div>
            <div class="col-name">Tên</div>
            <div class="col-level">Cấp</div>
            <div class="col-power">Sức Mạnh</div>
            <div class="col-guild">Bang Hội</div>
          </div>
          <div
            v-for="(player, index) in powerLeaderboard"
            :key="index"
            class="table-row"
            :class="{ 'top-three': index < 3 }"
          >
            <div class="col-rank">
              <span v-if="index === 0" class="rank-medal gold">🥇</span>
              <span v-else-if="index === 1" class="rank-medal silver">🥈</span>
              <span v-else-if="index === 2" class="rank-medal bronze">🥉</span>
              <span v-else>{{ index + 1 }}</span>
            </div>
            <div class="col-name">{{ player.username }}</div>
            <div class="col-level">{{ player.level }}</div>
            <div class="col-power">{{ player.power.toLocaleString() }}</div>
            <div class="col-guild">{{ player.guild || '-' }}</div>
          </div>
        </div>
      </div>

      <!-- Dungeon Leaderboard -->
      <div v-else-if="currentTab === 'dungeon'" class="leaderboard-content">
        <div class="section-title">[ Top 100 Chinh Phục Hầm Ngục ]</div>
        
        <div v-if="dungeonLeaderboard.length === 0" class="empty-message">
          Chưa có dữ liệu xếp hạng.
        </div>
        <div v-else class="leaderboard-table">
          <div class="table-header">
            <div class="col-rank">Hạng</div>
            <div class="col-name">Tên</div>
            <div class="col-level">Cấp</div>
            <div class="col-floor">Tầng Cao Nhất</div>
            <div class="col-guild">Bang Hội</div>
          </div>
          <div
            v-for="(player, index) in dungeonLeaderboard"
            :key="index"
            class="table-row"
            :class="{ 'top-three': index < 3 }"
          >
            <div class="col-rank">
              <span v-if="index === 0" class="rank-medal gold">🥇</span>
              <span v-else-if="index === 1" class="rank-medal silver">🥈</span>
              <span v-else-if="index === 2" class="rank-medal bronze">🥉</span>
              <span v-else>{{ index + 1 }}</span>
            </div>
            <div class="col-name">{{ player.username }}</div>
            <div class="col-level">{{ player.level }}</div>
            <div class="col-floor">Tầng {{ player.highestFloor }}</div>
            <div class="col-guild">{{ player.guild || '-' }}</div>
          </div>
        </div>
      </div>
    </div>
  </FullscreenOverlay>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import FullscreenOverlay from './FullscreenOverlay.vue';

interface Props {
  isOpen: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
}>();

const currentTab = ref<'power' | 'dungeon'>('power');
const loading = ref(false);
const powerLeaderboard = ref<any[]>([]);
const dungeonLeaderboard = ref<any[]>([]);

// Load leaderboards when opened
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    await loadLeaderboards();
  }
});

async function loadLeaderboards() {
  loading.value = true;
  try {
    // Load power leaderboard
    const powerResponse = await $fetch('/api/leaderboard/power');
    if (powerResponse.success) {
      powerLeaderboard.value = powerResponse.leaderboard;
    }

    // Load dungeon leaderboard
    const dungeonResponse = await $fetch('/api/leaderboard/dungeon');
    if (dungeonResponse.success) {
      dungeonLeaderboard.value = dungeonResponse.leaderboard;
    }
  } catch (error) {
    console.error('Error loading leaderboards:', error);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.leaderboard-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  color: var(--text-bright);
  font-family: 'VT323', 'Source Code Pro', monospace;
  padding: 1rem;
  max-height: 70vh;
  overflow-y: auto;
}

.leaderboard-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  border-bottom: 2px solid rgba(0, 136, 0, 0.3);
  padding-bottom: 0.5rem;
}

.tab-button {
  padding: 0.75rem 1.5rem;
  background-color: rgba(0, 136, 0, 0.1);
  border: 1px solid rgba(0, 136, 0, 0.3);
  color: var(--text-bright);
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-button:hover {
  background-color: rgba(0, 255, 0, 0.1);
  border-color: var(--text-accent);
}

.tab-button.active {
  background-color: rgba(0, 255, 0, 0.15);
  border-color: var(--text-accent);
  border-width: 2px;
  color: var(--text-accent);
}

.section-title {
  color: var(--text-accent);
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 1rem;
  text-align: center;
}

.loading-message,
.empty-message {
  text-align: center;
  color: var(--text-dim);
  padding: 2rem;
  font-style: italic;
}

.leaderboard-content {
  flex: 1;
  overflow-y: auto;
}

.leaderboard-table {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 60px 1fr 60px 120px 150px;
  gap: 1rem;
  padding: 0.75rem;
  align-items: center;
}

.table-header {
  background-color: rgba(0, 136, 0, 0.2);
  border: 1px solid rgba(0, 136, 0, 0.3);
  font-weight: bold;
  color: var(--text-accent);
  position: sticky;
  top: 0;
  z-index: 1;
}

.table-row {
  background-color: rgba(0, 136, 0, 0.05);
  border: 1px solid rgba(0, 136, 0, 0.2);
  transition: all 0.2s;
}

.table-row:hover {
  background-color: rgba(0, 255, 0, 0.1);
  border-color: var(--text-accent);
}

.table-row.top-three {
  background-color: rgba(255, 215, 0, 0.1);
  border-color: rgba(255, 215, 0, 0.3);
}

.col-rank {
  text-align: center;
  font-weight: bold;
}

.rank-medal {
  font-size: 20px;
}

.col-name {
  font-weight: bold;
  color: var(--text-accent);
}

.col-level,
.col-power,
.col-floor {
  text-align: center;
}

.col-guild {
  text-align: right;
  color: var(--text-dim);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .table-header,
  .table-row {
    grid-template-columns: 50px 1fr 50px 100px;
    gap: 0.5rem;
    padding: 0.5rem;
    font-size: 14px;
  }

  .col-guild {
    display: none;
  }

  .leaderboard-container {
    padding: 0.5rem;
  }
}
</style>
