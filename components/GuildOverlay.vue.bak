<template>
  <div class="guild-overlay">
    <div v-if="!hasGuild" class="no-guild">
      <p>Bạn chưa có bang hội.</p>
      <p class="hint">Tạo bang mới với lệnh: <span class="cmd">guild create [tên] [tag]</span></p>
      <p class="hint">Hoặc chờ lời mời từ bang khác.</p>
      <p class="cost">Chi phí tạo bang: 1000 vàng</p>
    </div>

    <div v-else class="guild-dashboard">
      <!-- Guild Header -->
      <div class="guild-header">
        <h2 class="guild-name">[{{ guildData.tag }}] {{ guildData.name }}</h2>
        <div class="guild-info">
          <span class="info-item">Cấp: {{ guildData.level }}</span>
          <span class="info-item">Thành viên: {{ guildData.members?.length || 0 }}</span>
        </div>
      </div>

      <!-- Guild Stats -->
      <div class="guild-stats">
        <div class="stat-row">
          <span class="stat-label">EXP:</span>
          <div class="stat-bar">
            <div class="bar-fill" :style="{ width: guildExpPercent + '%' }"></div>
          </div>
          <span class="stat-value">{{ guildData.experience }} / {{ nextLevelExp }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Kho Vàng:</span>
          <span class="stat-value gold">{{ guildData.bankGold || 0 }} vàng</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Kho Vật Phẩm:</span>
          <span class="stat-value">{{ guildData.bankItemCount || 0 }} vật phẩm</span>
        </div>
      </div>

      <!-- Member List -->
      <div class="member-section">
        <h3 class="section-title">Thành Viên</h3>
        
        <!-- Leader -->
        <div v-if="guildData.leader" class="member-item leader">
          <span class="member-rank">[Bang Chủ]</span>
          <span class="member-name">{{ guildData.leader.username }}</span>
          <span class="member-level">Lv.{{ guildData.leader.level }}</span>
        </div>

        <!-- Officers -->
        <div v-for="officer in guildData.officers" :key="officer._id" class="member-item officer">
          <span class="member-rank">[Sĩ Quan]</span>
          <span class="member-name">{{ officer.username }}</span>
          <span class="member-level">Lv.{{ officer.level }}</span>
          <button v-if="isLeader" class="action-btn demote" @click="demoteOfficer(officer._id)">
            [Giáng Chức]
          </button>
          <button v-if="isLeader || isOfficer" class="action-btn kick" @click="kickMember(officer._id)">
            [Đuổi]
          </button>
        </div>

        <!-- Regular Members -->
        <div v-for="member in regularMembers" :key="member._id" class="member-item">
          <span class="member-rank">[Thành Viên]</span>
          <span class="member-name">{{ member.username }}</span>
          <span class="member-level">Lv.{{ member.level }}</span>
          <button v-if="isLeader" class="action-btn promote" @click="promoteMember(member._id)">
            [Thăng Chức]
          </button>
          <button v-if="isLeader || isOfficer" class="action-btn kick" @click="kickMember(member._id)">
            [Đuổi]
          </button>
        </div>
      </div>

      <!-- Announcements -->
      <div v-if="guildData.announcements?.length" class="announcements-section">
        <h3 class="section-title">Thông Báo</h3>
        <div v-for="(announcement, idx) in guildData.announcements" :key="idx" class="announcement">
          <span class="announcement-time">{{ formatTime(announcement.timestamp) }}</span>
          <span class="announcement-text">{{ announcement.message }}</span>
        </div>
      </div>

      <!-- Controls -->
      <div class="guild-controls">
        <button class="control-btn leave" @click="leaveGuild">
          [ RỜI BANG ]
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface GuildMember {
  _id: string;
  username: string;
  level: number;
}

interface GuildData {
  id: string;
  name: string;
  tag: string;
  level: number;
  experience: number;
  leader?: GuildMember;
  officers?: GuildMember[];
  members?: GuildMember[];
  bankGold?: number;
  bankItemCount?: number;
  announcements?: Array<{ message: string; timestamp: Date }>;
  isLeader?: boolean;
  isOfficer?: boolean;
}

const hasGuild = ref(false);
const guildData = ref<GuildData>({
  id: '',
  name: '',
  tag: '',
  level: 1,
  experience: 0,
  officers: [],
  members: [],
});

const isLeader = computed(() => guildData.value.isLeader || false);
const isOfficer = computed(() => guildData.value.isOfficer || false);

const nextLevelExp = computed(() => {
  return guildData.value.level * 1000; // Simple formula
});

const guildExpPercent = computed(() => {
  if (nextLevelExp.value === 0) return 0;
  return Math.min(100, (guildData.value.experience / nextLevelExp.value) * 100);
});

const regularMembers = computed(() => {
  if (!guildData.value.members) return [];
  const leaderIdStr = guildData.value.leader?._id?.toString();
  const officerIds = new Set(guildData.value.officers?.map(o => o._id.toString()) || []);
  
  return guildData.value.members.filter(m => {
    const idStr = m._id.toString();
    return idStr !== leaderIdStr && !officerIds.has(idStr);
  });
});

const emit = defineEmits<{
  close: [];
  refresh: [];
}>();

async function loadGuildInfo() {
  try {
    const response = await $fetch('/api/guild/info');
    if (response.success && response.hasGuild) {
      hasGuild.value = true;
      guildData.value = response.guild;
    } else {
      hasGuild.value = false;
    }
  } catch (error) {
    console.error('Failed to load guild info:', error);
  }
}

async function promoteMember(memberId: string) {
  try {
    const response = await $fetch('/api/guild/promote', {
      method: 'POST',
      body: { targetPlayerId: memberId }
    });
    if (response.success) {
      await loadGuildInfo();
    }
  } catch (error: any) {
    console.error('Failed to promote member:', error);
    alert(error.data?.statusMessage || 'Lỗi khi thăng chức.');
  }
}

async function demoteOfficer(officerId: string) {
  try {
    const response = await $fetch('/api/guild/demote', {
      method: 'POST',
      body: { targetPlayerId: officerId }
    });
    if (response.success) {
      await loadGuildInfo();
    }
  } catch (error: any) {
    console.error('Failed to demote officer:', error);
    alert(error.data?.statusMessage || 'Lỗi khi giáng chức.');
  }
}

async function kickMember(memberId: string) {
  if (!confirm('Bạn có chắc muốn đuổi thành viên này?')) return;
  
  try {
    const response = await $fetch('/api/guild/kick', {
      method: 'POST',
      body: { targetPlayerId: memberId }
    });
    if (response.success) {
      await loadGuildInfo();
    }
  } catch (error: any) {
    console.error('Failed to kick member:', error);
    alert(error.data?.statusMessage || 'Lỗi khi đuổi thành viên.');
  }
}

async function leaveGuild() {
  if (!confirm('Bạn có chắc muốn rời bang?')) return;
  
  try {
    const response = await $fetch('/api/guild/leave', {
      method: 'POST'
    });
    if (response.success) {
      hasGuild.value = false;
      emit('refresh');
    }
  } catch (error: any) {
    console.error('Failed to leave guild:', error);
    alert(error.data?.statusMessage || 'Lỗi khi rời bang.');
  }
}

function formatTime(timestamp: Date): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  return `${days} ngày trước`;
}

onMounted(() => {
  loadGuildInfo();
});

defineExpose({
  refresh: loadGuildInfo
});
</script>

<style scoped>
.guild-overlay {
  font-family: 'VT323', 'Source Code Pro', monospace;
  color: var(--text-bright);
  padding: 1rem;
}

.no-guild {
  text-align: center;
  padding: 2rem;
}

.no-guild p {
  margin: 0.5rem 0;
  color: var(--text-dim);
}

.no-guild .hint {
  font-size: 0.9em;
}

.no-guild .cmd {
  color: var(--text-accent);
  font-weight: bold;
}

.no-guild .cost {
  margin-top: 1rem;
  color: var(--text-system);
}

.guild-dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.guild-header {
  border-bottom: 2px solid var(--text-accent);
  padding-bottom: 0.5rem;
}

.guild-name {
  font-size: 1.5em;
  color: var(--text-accent);
  margin: 0 0 0.5rem 0;
}

.guild-info {
  display: flex;
  gap: 1.5rem;
}

.info-item {
  color: var(--text-dim);
}

.guild-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 136, 0, 0.3);
  border-radius: 4px;
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-label {
  width: 8rem;
  color: var(--text-dim);
}

.stat-bar {
  flex: 1;
  height: 12px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(0, 136, 0, 0.5);
  border-radius: 2px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #00aa00 0%, #00ff00 100%);
  transition: width 0.3s ease;
}

.stat-value {
  min-width: 6rem;
  text-align: right;
  color: var(--text-bright);
}

.stat-value.gold {
  color: var(--text-accent);
}

.member-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.section-title {
  font-size: 1.2em;
  color: var(--text-accent);
  margin: 0 0 0.5rem 0;
  border-bottom: 1px solid rgba(0, 136, 0, 0.3);
  padding-bottom: 0.25rem;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 1px solid rgba(0, 136, 0, 0.2);
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.member-item.leader {
  border-color: var(--text-accent);
  background: rgba(255, 176, 0, 0.05);
}

.member-item.officer {
  border-color: rgba(0, 170, 255, 0.5);
  background: rgba(0, 170, 255, 0.05);
}

.member-rank {
  color: var(--text-accent);
  min-width: 7rem;
}

.member-name {
  flex: 1;
  color: var(--text-bright);
}

.member-level {
  color: var(--text-dim);
  min-width: 3rem;
  text-align: right;
}

.action-btn {
  padding: 0.25rem 0.5rem;
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 0.9em;
  cursor: pointer;
  border-radius: 2px;
  transition: all 0.2s;
}

.action-btn.promote {
  background: rgba(0, 170, 0, 0.2);
  border: 1px solid rgba(0, 170, 0, 0.5);
  color: var(--text-system);
}

.action-btn.promote:hover {
  background: rgba(0, 255, 0, 0.2);
  border-color: var(--text-system);
}

.action-btn.demote {
  background: rgba(170, 170, 0, 0.2);
  border: 1px solid rgba(170, 170, 0, 0.5);
  color: var(--text-accent);
}

.action-btn.demote:hover {
  background: rgba(255, 176, 0, 0.2);
  border-color: var(--text-accent);
}

.action-btn.kick {
  background: rgba(170, 0, 0, 0.2);
  border: 1px solid rgba(170, 0, 0, 0.5);
  color: var(--text-error);
}

.action-btn.kick:hover {
  background: rgba(255, 0, 0, 0.2);
  border-color: var(--text-error);
}

.announcements-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.announcement {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(0, 136, 0, 0.1);
  border-left: 2px solid var(--text-accent);
}

.announcement-time {
  color: var(--text-dim);
  min-width: 8rem;
  font-size: 0.9em;
}

.announcement-text {
  flex: 1;
  color: var(--text-bright);
}

.guild-controls {
  display: flex;
  justify-content: center;
  padding-top: 1rem;
  border-top: 1px solid rgba(0, 136, 0, 0.3);
}

.control-btn.leave {
  padding: 0.75rem 1.5rem;
  background: rgba(136, 0, 0, 0.3);
  border: 1px solid rgba(255, 0, 0, 0.5);
  color: var(--text-error);
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 1rem;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.control-btn.leave:hover {
  background: rgba(255, 0, 0, 0.2);
  border-color: var(--text-error);
}
</style>
