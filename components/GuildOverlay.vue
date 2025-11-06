<template>
  <div class="guild-overlay">
    <!-- No Guild State - Show Creation Form or Pending Invitation -->
    <div v-if="!hasGuild" class="no-guild-container">
      <div v-if="!showCreateForm" class="no-guild-info">
        <div class="info-box">
          <p class="title">Bạn chưa có bang hội.</p>
          <p class="hint">Chi phí tạo bang: <span class="gold">100,000 Vàng 💰</span></p>
        </div>
        
        <button class="create-guild-btn" @click="showCreateForm = true">
          [ TẠO BANG HỘI MỚI ]
        </button>
        
        <div class="info-text">
          <p>Hoặc chờ lời mời từ bang khác...</p>
        </div>
      </div>

      <!-- Create Guild Form -->
      <div v-else class="create-guild-form">
        <h3 class="form-title">TẠO BANG HỘI MỚI</h3>
        
        <div class="form-group">
          <label class="form-label">Tên Bang Hội:</label>
          <input
            v-model="createForm.name"
            type="text"
            class="form-input"
            placeholder="Nhập tên bang hội..."
            maxlength="30"
          />
          <span class="form-hint">Tối đa 30 ký tự</span>
        </div>

        <div class="form-group">
          <label class="form-label">Tag (Viết Tắt):</label>
          <input
            v-model="createForm.tag"
            type="text"
            class="form-input"
            placeholder="Nhập tag 3-5 ký tự..."
            maxlength="5"
            @input="createForm.tag = createForm.tag.toUpperCase()"
          />
          <span class="form-hint">3-5 ký tự, VD: ABC, GAMER</span>
        </div>

        <div class="form-actions">
          <button class="action-btn create" @click="handleCreateGuild">
            [ TẠO BANG ]
          </button>
          <button class="action-btn cancel" @click="showCreateForm = false">
            [ HỦY BỎ ]
          </button>
        </div>

        <div class="form-cost">
          <p>Chi phí: <span class="gold">100,000 Vàng 💰</span></p>
        </div>
      </div>
    </div>

    <!-- Guild Dashboard - Tabbed Interface -->
    <div v-else class="guild-dashboard">
      <!-- Guild Header -->
      <div class="guild-header">
        <h2 class="guild-name">[{{ guildData.tag }}] {{ guildData.name }}</h2>
        <div class="guild-info">
          <span class="info-item">Cấp {{ guildData.level }}</span>
          <span class="separator">|</span>
          <span class="info-item">{{ totalMembers }} Thành viên</span>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="tab-nav">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-btn"
          :class="{ active: currentTab === tab.id }"
          @click="currentTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Tab 1: Thông Tin -->
        <div v-if="currentTab === 'info'" class="tab-pane">
          <div class="guild-stats">
            <div class="stat-row">
              <span class="stat-label">Kinh Nghiệm:</span>
              <div class="stat-bar">
                <div class="bar-fill" :style="{ width: guildExpPercent + '%' }"></div>
              </div>
              <span class="stat-value">{{ guildData.experience }} / {{ nextLevelExp }}</span>
            </div>
            
            <div class="stat-row">
              <span class="stat-label">Bang Chủ:</span>
              <span class="stat-value highlight">{{ guildData.leader?.username || 'N/A' }}</span>
            </div>
            
            <div class="stat-row">
              <span class="stat-label">Ngày Thành Lập:</span>
              <span class="stat-value">{{ formatDate(guildData.createdAt) }}</span>
            </div>
          </div>

          <!-- Announcements -->
          <div v-if="guildData.announcements?.length" class="announcements-section">
            <h4 class="section-subtitle">Thông Báo Gần Đây</h4>
            <div v-for="(announcement, idx) in guildData.announcements" :key="idx" class="announcement">
              <span class="announcement-time">{{ formatTime(announcement.timestamp) }}</span>
              <span class="announcement-text">{{ announcement.message }}</span>
            </div>
          </div>
        </div>

        <!-- Tab 2: Thành Viên -->
        <div v-if="currentTab === 'members'" class="tab-pane">
          <div class="member-list">
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
              <div class="member-actions" v-if="isLeader">
                <button class="action-btn-small demote" @click="demoteOfficer(officer._id)">
                  [Giáng]
                </button>
                <button class="action-btn-small kick" @click="kickMember(officer._id)">
                  [Đuổi]
                </button>
              </div>
            </div>

            <!-- Regular Members -->
            <div v-for="member in regularMembers" :key="member._id" class="member-item">
              <span class="member-rank">[Thành Viên]</span>
              <span class="member-name">{{ member.username }}</span>
              <span class="member-level">Lv.{{ member.level }}</span>
              <div class="member-actions" v-if="isLeader || isOfficer">
                <button v-if="isLeader" class="action-btn-small promote" @click="promoteMember(member._id)">
                  [Thăng]
                </button>
                <button class="action-btn-small kick" @click="kickMember(member._id)">
                  [Đuổi]
                </button>
              </div>
            </div>
          </div>

          <div class="member-hint">
            <p>Sử dụng lệnh <span class="cmd">guild invite [tên người chơi]</span> để mời thành viên mới.</p>
          </div>
        </div>

        <!-- Tab 3: Kho Bãi -->
        <div v-if="currentTab === 'warehouse'" class="tab-pane">
          <div class="warehouse-section">
            <!-- Currency Display -->
            <div class="currency-display">
              <span class="currency-label">Kho Vàng Bang Hội:</span>
              <span class="currency-value">{{ guildData.currency || 0 }} 💰</span>
            </div>

            <!-- Items Grid -->
            <div class="warehouse-items">
              <h4 class="section-subtitle">Vật Phẩm Trong Kho</h4>
              <div v-if="bankItems.length > 0" class="items-grid">
                <div v-for="(item, idx) in bankItems" :key="idx" class="item-slot">
                  <div class="item-info">
                    <span class="item-name">{{ item.name }}</span>
                    <span class="item-quantity">x{{ item.quantity }}</span>
                  </div>
                </div>
              </div>
              <div v-else class="empty-warehouse">
                <p>Kho bang hội đang trống.</p>
              </div>
            </div>

            <!-- Warehouse Commands -->
            <div class="warehouse-commands">
              <p class="command-hint">
                <span class="cmd">guild deposit item [tên vật phẩm]</span> - Gửi vật phẩm vào kho
              </p>
              <p class="command-hint">
                <span class="cmd">guild withdraw item [tên vật phẩm]</span> - Rút vật phẩm từ kho
              </p>
              <p class="command-hint">
                <span class="cmd">guild deposit gold [số lượng]</span> - Gửi vàng vào kho
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Guild Actions -->
      <div class="guild-footer">
        <button class="footer-btn leave" @click="leaveGuild">
          [ RỜI BANG HỘI ]
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

interface BankItem {
  name: string;
  quantity: number;
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
  currency?: number;
  bankItems?: BankItem[];
  createdAt?: Date;
  announcements?: Array<{ message: string; timestamp: Date }>;
  isLeader?: boolean;
  isOfficer?: boolean;
}

const hasGuild = ref(false);
const showCreateForm = ref(false);
const currentTab = ref('info');

const createForm = ref({
  name: '',
  tag: '',
});

const guildData = ref<GuildData>({
  id: '',
  name: '',
  tag: '',
  level: 1,
  experience: 0,
  officers: [],
  members: [],
  currency: 0,
  bankItems: [],
});

const tabs = [
  { id: 'info', label: '[Thông Tin]' },
  { id: 'members', label: '[Thành Viên]' },
  { id: 'warehouse', label: '[Kho Bãi]' },
];

const isLeader = computed(() => guildData.value.isLeader || false);
const isOfficer = computed(() => guildData.value.isOfficer || false);

const nextLevelExp = computed(() => {
  return guildData.value.level * 1000;
});

const guildExpPercent = computed(() => {
  if (nextLevelExp.value === 0) return 0;
  return Math.min(100, (guildData.value.experience / nextLevelExp.value) * 100);
});

const totalMembers = computed(() => {
  return 1 + (guildData.value.officers?.length || 0) + (guildData.value.members?.length || 0);
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

const bankItems = computed(() => {
  return guildData.value.bankItems || [];
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
      guildData.value = {
        ...response.guild,
        currency: response.guild.currency || 0,
        bankItems: response.guild.bankItems || [],
      };
    } else {
      hasGuild.value = false;
    }
  } catch (error) {
    console.error('Failed to load guild info:', error);
  }
}

async function handleCreateGuild() {
  if (!createForm.value.name || !createForm.value.tag) {
    alert('Vui lòng nhập đầy đủ tên và tag.');
    return;
  }

  if (createForm.value.tag.length < 3 || createForm.value.tag.length > 5) {
    alert('Tag phải có từ 3 đến 5 ký tự.');
    return;
  }

  try {
    const response = await $fetch('/api/guild/create', {
      method: 'POST',
      body: {
        name: createForm.value.name,
        tag: createForm.value.tag,
      },
    });

    if (response.success) {
      showCreateForm.value = false;
      createForm.value = { name: '', tag: '' };
      await loadGuildInfo();
    }
  } catch (error: any) {
    console.error('Failed to create guild:', error);
    alert(error.data?.statusMessage || 'Lỗi khi tạo bang hội.');
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

function formatDate(date: Date | undefined): string {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('vi-VN');
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
  padding: 0.5rem;
  max-height: 70vh;
  overflow-y: auto;
}

/* No Guild State */
.no-guild-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
}

.no-guild-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  width: 100%;
}

.info-box {
  text-align: center;
  padding: 1.5rem;
  border: 2px solid rgba(0, 136, 0, 0.3);
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  width: 100%;
  max-width: 400px;
}

.info-box .title {
  font-size: 1.3em;
  color: var(--text-bright);
  margin-bottom: 1rem;
}

.info-box .hint {
  color: var(--text-dim);
  margin: 0.5rem 0;
}

.gold {
  color: var(--text-accent);
  font-weight: bold;
}

.create-guild-btn {
  padding: 1rem 2rem;
  background: rgba(0, 136, 0, 0.2);
  border: 2px solid var(--text-system);
  color: var(--text-system);
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 1.2em;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  letter-spacing: 1px;
}

.create-guild-btn:hover {
  background: rgba(0, 255, 0, 0.2);
  box-shadow: 0 0 15px rgba(0, 255, 0, 0.3);
}

.info-text {
  text-align: center;
  color: var(--text-dim);
}

/* Create Guild Form */
.create-guild-form {
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  border: 2px solid var(--text-accent);
  background: rgba(0, 0, 0, 0.4);
  border-radius: 4px;
}

.form-title {
  font-size: 1.4em;
  color: var(--text-accent);
  margin: 0;
  text-align: center;
  letter-spacing: 2px;
  border-bottom: 2px solid var(--text-accent);
  padding-bottom: 0.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  color: var(--text-bright);
  font-size: 1.1em;
}

.form-input {
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(0, 136, 0, 0.5);
  color: var(--text-bright);
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 1.1em;
  border-radius: 2px;
}

.form-input:focus {
  border-color: var(--text-system);
  outline: none;
  box-shadow: 0 0 5px rgba(0, 255, 0, 0.3);
}

.form-hint {
  font-size: 0.9em;
  color: var(--text-dim);
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.action-btn {
  padding: 0.75rem 1.5rem;
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 1.1em;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  letter-spacing: 1px;
}

.action-btn.create {
  background: rgba(0, 170, 0, 0.2);
  border: 2px solid rgba(0, 170, 0, 0.6);
  color: var(--text-system);
}

.action-btn.create:hover {
  background: rgba(0, 255, 0, 0.3);
  border-color: var(--text-system);
}

.action-btn.cancel {
  background: rgba(136, 0, 0, 0.2);
  border: 2px solid rgba(170, 0, 0, 0.6);
  color: var(--text-danger);
}

.action-btn.cancel:hover {
  background: rgba(255, 0, 0, 0.2);
  border-color: var(--text-danger);
}

.form-cost {
  text-align: center;
  padding: 1rem;
  background: rgba(255, 176, 0, 0.1);
  border: 1px solid rgba(255, 176, 0, 0.3);
  border-radius: 4px;
}

/* Guild Dashboard */
.guild-dashboard {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.guild-header {
  border-bottom: 2px solid var(--text-accent);
  padding-bottom: 0.5rem;
}

.guild-name {
  font-size: 1.5em;
  color: var(--text-accent);
  margin: 0 0 0.5rem 0;
  letter-spacing: 1px;
}

.guild-info {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.info-item {
  color: var(--text-dim);
}

.separator {
  color: var(--text-dim);
}

/* Tab Navigation */
.tab-nav {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid rgba(0, 136, 0, 0.3);
  padding-bottom: 0.5rem;
}

.tab-btn {
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  color: var(--text-dim);
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 1.1em;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
}

.tab-btn:hover {
  color: var(--text-bright);
}

.tab-btn.active {
  color: var(--text-accent);
  border-bottom-color: var(--text-accent);
}

/* Tab Content */
.tab-content {
  min-height: 300px;
}

.tab-pane {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Guild Stats */
.guild-stats {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 136, 0, 0.3);
  border-radius: 4px;
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.stat-label {
  min-width: 10rem;
  color: var(--text-dim);
}

.stat-bar {
  flex: 1;
  height: 14px;
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
  min-width: 8rem;
  text-align: right;
  color: var(--text-bright);
}

.stat-value.highlight {
  color: var(--text-accent);
  font-weight: bold;
}

/* Announcements */
.announcements-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.section-subtitle {
  font-size: 1.1em;
  color: var(--text-accent);
  margin: 0;
  border-bottom: 1px solid rgba(0, 136, 0, 0.3);
  padding-bottom: 0.25rem;
}

.announcement {
  display: flex;
  gap: 0.75rem;
  padding: 0.5rem;
  background: rgba(0, 136, 0, 0.1);
  border-left: 2px solid var(--text-accent);
}

.announcement-time {
  color: var(--text-dim);
  min-width: 7rem;
  font-size: 0.9em;
}

.announcement-text {
  flex: 1;
  color: var(--text-bright);
}

/* Member List */
.member-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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
  min-width: 7.5rem;
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

.member-actions {
  display: flex;
  gap: 0.25rem;
}

.action-btn-small {
  padding: 0.25rem 0.5rem;
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 0.9em;
  cursor: pointer;
  border-radius: 2px;
  transition: all 0.2s;
}

.action-btn-small.promote {
  background: rgba(0, 170, 0, 0.2);
  border: 1px solid rgba(0, 170, 0, 0.5);
  color: var(--text-system);
}

.action-btn-small.promote:hover {
  background: rgba(0, 255, 0, 0.2);
}

.action-btn-small.demote {
  background: rgba(170, 170, 0, 0.2);
  border: 1px solid rgba(170, 170, 0, 0.5);
  color: var(--text-accent);
}

.action-btn-small.demote:hover {
  background: rgba(255, 176, 0, 0.2);
}

.action-btn-small.kick {
  background: rgba(170, 0, 0, 0.2);
  border: 1px solid rgba(170, 0, 0, 0.5);
  color: var(--text-danger);
}

.action-btn-small.kick:hover {
  background: rgba(255, 0, 0, 0.2);
}

.member-hint {
  padding: 0.75rem;
  background: rgba(0, 136, 0, 0.1);
  border: 1px solid rgba(0, 136, 0, 0.2);
  border-radius: 4px;
  margin-top: 0.5rem;
}

.member-hint p {
  margin: 0;
  color: var(--text-dim);
  font-size: 0.95em;
}

.cmd {
  color: var(--text-accent);
  font-weight: bold;
}

/* Warehouse */
.warehouse-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.currency-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 176, 0, 0.1);
  border: 2px solid rgba(255, 176, 0, 0.3);
  border-radius: 4px;
}

.currency-label {
  color: var(--text-bright);
  font-size: 1.1em;
}

.currency-value {
  color: var(--text-accent);
  font-size: 1.3em;
  font-weight: bold;
}

.warehouse-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.5rem;
}

.item-slot {
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 136, 0, 0.3);
  border-radius: 4px;
}

.item-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-name {
  color: var(--text-bright);
}

.item-quantity {
  color: var(--text-accent);
}

.empty-warehouse {
  text-align: center;
  padding: 2rem;
  color: var(--text-dim);
}

.warehouse-commands {
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 136, 0, 0.3);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.command-hint {
  margin: 0;
  color: var(--text-dim);
  font-size: 0.95em;
}

/* Guild Footer */
.guild-footer {
  display: flex;
  justify-content: center;
  padding-top: 1rem;
  border-top: 1px solid rgba(0, 136, 0, 0.3);
}

.footer-btn.leave {
  padding: 0.75rem 1.5rem;
  background: rgba(136, 0, 0, 0.3);
  border: 1px solid rgba(255, 0, 0, 0.5);
  color: var(--text-danger);
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 1rem;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.footer-btn.leave:hover {
  background: rgba(255, 0, 0, 0.2);
  border-color: var(--text-danger);
}
</style>
