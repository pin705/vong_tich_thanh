<template>
  <div class="admin-dashboard">
    <h1 class="page-title">📊 Admin Dashboard</h1>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-info">
          <div class="stat-label">Tổng Người Chơi</div>
          <div class="stat-value">{{ stats.totalPlayers }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">🎮</div>
        <div class="stat-info">
          <div class="stat-label">Đang Online</div>
          <div class="stat-value">{{ stats.onlinePlayers }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-info">
          <div class="stat-label">Tổng Vật Phẩm</div>
          <div class="stat-value">{{ stats.totalItems }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">🗺️</div>
        <div class="stat-info">
          <div class="stat-label">Tổng Phòng</div>
          <div class="stat-value">{{ stats.totalRooms }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">👹</div>
        <div class="stat-info">
          <div class="stat-label">Tổng NPC & Mob</div>
          <div class="stat-value">{{ stats.totalAgents }}</div>
        </div>
      </div>
    </div>

    <div class="quick-actions">
      <h2 class="section-title">Thao Tác Nhanh</h2>
      <div class="actions-grid">
        <NuxtLink to="/admin/mail" class="action-card">
          <div class="action-icon">📬</div>
          <div class="action-label">Gửi Thư Hệ Thống</div>
        </NuxtLink>

        <NuxtLink to="/admin/giftcode" class="action-card">
          <div class="action-icon">🎁</div>
          <div class="action-label">Tạo Gift Code</div>
        </NuxtLink>

        <NuxtLink to="/admin/world" class="action-card">
          <div class="action-icon">🌍</div>
          <div class="action-label">Quản Lý Thế Giới</div>
        </NuxtLink>

        <NuxtLink to="/admin/players" class="action-card">
          <div class="action-icon">👥</div>
          <div class="action-label">Quản Lý Người Chơi</div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'admin'
});

const stats = ref({
  totalPlayers: 0,
  onlinePlayers: 0,
  totalItems: 0,
  totalRooms: 0,
  totalAgents: 0
});

const loadStats = async () => {
  try {
    const response = await $fetch('/api/admin/stats');
    if (response.success) {
      stats.value = response.stats;
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
};

onMounted(async () => {
  await loadStats();
});
</script>

<style scoped>
.admin-dashboard {
  max-width: 1200px;
}

.page-title {
  color: #00ff00;
  font-size: 32px;
  margin-bottom: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background-color: #2a2a2a;
  border: 1px solid #3a3a3a;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s;
}

.stat-card:hover {
  border-color: #00ff00;
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.2);
}

.stat-icon {
  font-size: 48px;
}

.stat-info {
  flex: 1;
}

.stat-label {
  color: #a0a0a0;
  font-size: 14px;
  margin-bottom: 0.5rem;
}

.stat-value {
  color: #00ff00;
  font-size: 32px;
  font-weight: bold;
}

.quick-actions {
  margin-top: 3rem;
}

.section-title {
  color: #00ff00;
  font-size: 24px;
  margin-bottom: 1.5rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.action-card {
  background-color: #2a2a2a;
  border: 1px solid #3a3a3a;
  padding: 2rem;
  text-align: center;
  text-decoration: none;
  color: #e0e0e0;
  transition: all 0.2s;
  cursor: pointer;
}

.action-card:hover {
  border-color: #00ff00;
  background-color: rgba(0, 255, 0, 0.05);
  transform: translateY(-2px);
}

.action-icon {
  font-size: 48px;
  margin-bottom: 1rem;
}

.action-label {
  font-size: 16px;
  font-weight: bold;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
