<template>
  <div class="admin-world">
    <h1 class="page-title">🌍 Quản Lý Thế Giới</h1>

    <div class="tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="activeTab = tab.id"
        class="tab-button"
        :class="{ active: activeTab === tab.id }"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="tab-content">
      <!-- Items Tab -->
      <div v-if="activeTab === 'items'" class="content-section">
        <h2 class="section-title">Vật Phẩm</h2>
        <p class="info-text">
          Chức năng CRUD đầy đủ cho vật phẩm sẽ được triển khai sau.<br>
          Hiện tại, vui lòng sử dụng API trực tiếp hoặc chỉnh sửa file initWorld.ts.
        </p>
      </div>

      <!-- Agents Tab -->
      <div v-if="activeTab === 'agents'" class="content-section">
        <h2 class="section-title">NPC & Quái Vật</h2>
        <p class="info-text">
          Chức năng CRUD đầy đủ cho Agent sẽ được triển khai sau.<br>
          Hiện tại, vui lòng sử dụng API trực tiếp hoặc chỉnh sửa file initWorld.ts.
        </p>
      </div>

      <!-- Rooms Tab -->
      <div v-if="activeTab === 'rooms'" class="content-section">
        <h2 class="section-title">Phòng</h2>
        <p class="info-text">
          Chức năng CRUD đầy đủ cho phòng sẽ được triển khai sau.<br>
          Hiện tại, vui lòng sử dụng API trực tiếp hoặc chỉnh sửa file initWorld.ts.
        </p>
      </div>
    </div>

    <div class="api-info">
      <h3 class="subsection-title">API Endpoints:</h3>
      <div class="api-list">
        <div class="api-item">
          <strong>Items:</strong> GET /api/admin/items, POST /api/admin/items
        </div>
        <div class="api-item">
          <strong>Agents:</strong> GET /api/admin/agents, POST /api/admin/agents
        </div>
        <div class="api-item">
          <strong>Rooms:</strong> GET /api/admin/rooms, POST /api/admin/rooms
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'admin'
});

const activeTab = ref('items');

const tabs = [
  { id: 'items', label: '📦 Vật Phẩm' },
  { id: 'agents', label: '👹 NPC & Mob' },
  { id: 'rooms', label: '🗺️ Phòng' }
];
</script>

<style scoped>
.admin-world {
  max-width: 1200px;
}

.page-title {
  color: #00ff00;
  font-size: 32px;
  margin-bottom: 2rem;
}

.tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid #3a3a3a;
}

.tab-button {
  background: transparent;
  color: #a0a0a0;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 1rem 2rem;
  cursor: pointer;
  font-family: 'Source Code Pro', monospace;
  font-size: 16px;
  transition: all 0.2s;
}

.tab-button:hover {
  color: #00ff00;
}

.tab-button.active {
  color: #00ff00;
  border-bottom-color: #00ff00;
}

.tab-content {
  background-color: #2a2a2a;
  border: 1px solid #3a3a3a;
  padding: 2rem;
  min-height: 400px;
}

.content-section {
  text-align: center;
  padding: 3rem 0;
}

.section-title {
  color: #00ff00;
  font-size: 24px;
  margin-bottom: 1.5rem;
}

.info-text {
  color: #a0a0a0;
  font-size: 16px;
  line-height: 1.8;
}

.api-info {
  margin-top: 2rem;
  background-color: #2a2a2a;
  border: 1px solid #3a3a3a;
  padding: 1.5rem;
}

.subsection-title {
  color: #00ff00;
  font-size: 18px;
  margin-bottom: 1rem;
}

.api-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.api-item {
  color: #e0e0e0;
  font-size: 14px;
  font-family: 'Source Code Pro', monospace;
  padding: 0.5rem;
  background-color: rgba(0, 255, 0, 0.05);
  border-left: 2px solid #00ff00;
}

.api-item strong {
  color: #00ff00;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .tabs {
    flex-direction: column;
  }

  .tab-button {
    padding: 0.75rem 1rem;
  }
}
</style>
