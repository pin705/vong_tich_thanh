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
        <div class="section-header">
          <h2 class="section-title">Quản Lý Vật Phẩm</h2>
          <button @click="showCreateModal('item')" class="btn-create">+ Tạo Vật Phẩm</button>
        </div>
        
        <div v-if="loading" class="loading">Đang tải...</div>
        <div v-else-if="items.length === 0" class="empty-message">
          Chưa có vật phẩm nào. Nhấn "Tạo Vật Phẩm" để bắt đầu.
        </div>
        <div v-else class="data-table">
          <table>
            <thead>
              <tr>
                <th>Tên</th>
                <th>Loại</th>
                <th>Giá</th>
                <th>Chất lượng</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="item.id">
                <td>{{ item.name }}</td>
                <td>{{ item.type }}</td>
                <td>{{ item.price || 0 }} V</td>
                <td>{{ item.quality || 'N/A' }}</td>
                <td class="actions">
                  <button @click="deleteItem(item.id)" class="btn-delete">Xóa</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Agents Tab -->
      <div v-if="activeTab === 'agents'" class="content-section">
        <div class="section-header">
          <h2 class="section-title">Quản Lý NPC & Quái Vật</h2>
          <button @click="showCreateModal('agent')" class="btn-create">+ Tạo Agent</button>
        </div>
        
        <div v-if="loading" class="loading">Đang tải...</div>
        <div v-else-if="agents.length === 0" class="empty-message">
          Chưa có agent nào. Nhấn "Tạo Agent" để bắt đầu.
        </div>
        <div v-else class="data-table">
          <table>
            <thead>
              <tr>
                <th>Tên</th>
                <th>Loại</th>
                <th>Cấp độ</th>
                <th>HP</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="agent in agents" :key="agent.id">
                <td>{{ agent.name }}</td>
                <td>{{ agent.type }}</td>
                <td>{{ agent.level }}</td>
                <td>{{ agent.hp }}/{{ agent.maxHp }}</td>
                <td class="actions">
                  <button @click="deleteAgent(agent.id)" class="btn-delete">Xóa</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Rooms Tab -->
      <div v-if="activeTab === 'rooms'" class="content-section">
        <div class="section-header">
          <h2 class="section-title">Quản Lý Phòng</h2>
          <button @click="showCreateModal('room')" class="btn-create">+ Tạo Phòng</button>
        </div>
        
        <div v-if="loading" class="loading">Đang tải...</div>
        <div v-else-if="rooms.length === 0" class="empty-message">
          Chưa có phòng nào. Nhấn "Tạo Phòng" để bắt đầu.
        </div>
        <div v-else class="data-table">
          <table>
            <thead>
              <tr>
                <th>Tên</th>
                <th>Mô tả</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="room in rooms" :key="room.id">
                <td>{{ room.name }}</td>
                <td class="description">{{ room.description }}</td>
                <td class="actions">
                  <button @click="deleteRoom(room.id)" class="btn-delete">Xóa</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="api-info">
      <h3 class="subsection-title">API Endpoints:</h3>
      <div class="api-list">
        <div class="api-item">
          <strong>Items:</strong> GET /api/admin/items, POST /api/admin/items, PUT /api/admin/items/:id, DELETE /api/admin/items/:id
        </div>
        <div class="api-item">
          <strong>Agents:</strong> GET /api/admin/agents, POST /api/admin/agents, PUT /api/admin/agents/:id, DELETE /api/admin/agents/:id
        </div>
        <div class="api-item">
          <strong>Rooms:</strong> GET /api/admin/rooms, POST /api/admin/rooms, PUT /api/admin/rooms/:id, DELETE /api/admin/rooms/:id
        </div>
        <div class="api-item">
          <strong>Shop:</strong> GET /api/shop/vendor/:id
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
const loading = ref(false);
const items = ref<any[]>([]);
const agents = ref<any[]>([]);
const rooms = ref<any[]>([]);

const tabs = [
  { id: 'items', label: '📦 Vật Phẩm' },
  { id: 'agents', label: '👹 NPC & Mob' },
  { id: 'rooms', label: '🗺️ Phòng' }
];

// Load items
const loadItems = async () => {
  loading.value = true;
  try {
    const response = await $fetch('/api/admin/items');
    if (response.success) {
      items.value = response.items;
    }
  } catch (error) {
    console.error('Error loading items:', error);
  } finally {
    loading.value = false;
  }
};

// Load agents
const loadAgents = async () => {
  loading.value = true;
  try {
    const response = await $fetch('/api/admin/agents');
    if (response.success) {
      agents.value = response.agents;
    }
  } catch (error) {
    console.error('Error loading agents:', error);
  } finally {
    loading.value = false;
  }
};

// Load rooms
const loadRooms = async () => {
  loading.value = true;
  try {
    const response = await $fetch('/api/admin/rooms');
    if (response.success) {
      rooms.value = response.rooms;
    }
  } catch (error) {
    console.error('Error loading rooms:', error);
  } finally {
    loading.value = false;
  }
};

// Delete item
const deleteItem = async (id: string) => {
  if (!confirm('Bạn có chắc muốn xóa vật phẩm này?')) return;
  
  try {
    const response = await $fetch(`/api/admin/items/${id}`, { method: 'DELETE' });
    if (response.success) {
      alert(response.message);
      await loadItems();
    }
  } catch (error: any) {
    alert('Lỗi: ' + (error.data?.message || error.message));
  }
};

// Delete agent
const deleteAgent = async (id: string) => {
  if (!confirm('Bạn có chắc muốn xóa agent này?')) return;
  
  try {
    const response = await $fetch(`/api/admin/agents/${id}`, { method: 'DELETE' });
    if (response.success) {
      alert(response.message);
      await loadAgents();
    }
  } catch (error: any) {
    alert('Lỗi: ' + (error.data?.message || error.message));
  }
};

// Delete room
const deleteRoom = async (id: string) => {
  if (!confirm('Bạn có chắc muốn xóa phòng này?')) return;
  
  try {
    const response = await $fetch(`/api/admin/rooms/${id}`, { method: 'DELETE' });
    if (response.success) {
      alert(response.message);
      await loadRooms();
    }
  } catch (error: any) {
    alert('Lỗi: ' + (error.data?.message || error.message));
  }
};

// Show create modal (placeholder for now)
const showCreateModal = (type: string) => {
  alert(`Chức năng tạo ${type} sẽ được triển khai qua API hoặc form tương tự. Hiện tại, vui lòng sử dụng API trực tiếp hoặc file initWorld.ts.`);
};

// Watch tab changes to load data
watch(activeTab, (newTab) => {
  if (newTab === 'items') {
    loadItems();
  } else if (newTab === 'agents') {
    loadAgents();
  } else if (newTab === 'rooms') {
    loadRooms();
  }
});

// Load initial data
onMounted(() => {
  loadItems();
});
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
  padding: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.section-title {
  color: #00ff00;
  font-size: 24px;
  margin: 0;
}

.btn-create {
  background-color: #00ff00;
  color: #1a1a1a;
  border: none;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-family: 'Source Code Pro', monospace;
  font-weight: bold;
  transition: all 0.2s;
}

.btn-create:hover {
  background-color: #00cc00;
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
}

.loading {
  text-align: center;
  color: #00ff00;
  padding: 2rem;
  font-size: 18px;
}

.empty-message {
  text-align: center;
  color: #a0a0a0;
  padding: 3rem;
  font-size: 16px;
}

.data-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background-color: rgba(0, 255, 0, 0.1);
}

th {
  color: #00ff00;
  text-align: left;
  padding: 1rem;
  border-bottom: 2px solid #00ff00;
}

td {
  color: #e0e0e0;
  padding: 1rem;
  border-bottom: 1px solid #3a3a3a;
}

.description {
  max-width: 400px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.actions {
  text-align: right;
}

.btn-delete {
  background-color: #ff0000;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-family: 'Source Code Pro', monospace;
  transition: all 0.2s;
}

.btn-delete:hover {
  background-color: #cc0000;
  box-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
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

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  table {
    font-size: 14px;
  }

  th, td {
    padding: 0.5rem;
  }
}
</style>
