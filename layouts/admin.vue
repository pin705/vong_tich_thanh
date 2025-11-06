<template>
  <div class="admin-layout">
    <!-- Header -->
    <header class="admin-header">
      <div class="header-content">
        <h1 class="admin-title">🛡️ Vong Tích Thành - Admin Panel</h1>
        <div class="header-actions">
          <NuxtLink to="/" class="btn-back">← Quay lại Game</NuxtLink>
          <button @click="handleLogout" class="btn-logout">Đăng xuất</button>
        </div>
      </div>
    </header>

    <!-- Navigation -->
    <nav class="admin-nav">
      <NuxtLink to="/admin" class="nav-item" exact-active-class="active">
        📊 Dashboard
      </NuxtLink>
      <NuxtLink to="/admin/mail" class="nav-item" active-class="active">
        📬 Thư Hệ Thống
      </NuxtLink>
      <NuxtLink to="/admin/giftcode" class="nav-item" active-class="active">
        🎁 Gift Code
      </NuxtLink>
      <NuxtLink to="/admin/world" class="nav-item" active-class="active">
        🌍 Quản Lý Thế Giới
      </NuxtLink>
      <NuxtLink to="/admin/players" class="nav-item" active-class="active">
        👥 Người Chơi
      </NuxtLink>
    </nav>

    <!-- Main Content -->
    <main class="admin-content">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const { clear } = useUserSession();
const router = useRouter();

const handleLogout = async () => {
  await clear();
  router.push('/login');
};
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background-color: #1a1a1a;
  color: #e0e0e0;
  font-family: 'Source Code Pro', monospace;
}

.admin-header {
  background-color: #2a2a2a;
  border-bottom: 2px solid #3a3a3a;
  padding: 1rem 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
}

.admin-title {
  color: #00ff00;
  font-size: 24px;
  font-weight: bold;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.btn-back,
.btn-logout {
  background: transparent;
  color: #00ff00;
  border: 1px solid #00ff00;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-family: 'Source Code Pro', monospace;
  font-size: 14px;
  text-decoration: none;
  transition: all 0.2s;
}

.btn-back:hover,
.btn-logout:hover {
  background-color: #00ff00;
  color: #1a1a1a;
}

.admin-nav {
  background-color: #2a2a2a;
  border-bottom: 1px solid #3a3a3a;
  padding: 0 2rem;
  display: flex;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.nav-item {
  padding: 1rem 0;
  color: #a0a0a0;
  text-decoration: none;
  font-size: 16px;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.nav-item:hover {
  color: #00ff00;
  border-bottom-color: #00ff00;
}

.nav-item.active {
  color: #00ff00;
  border-bottom-color: #00ff00;
}

.admin-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
  }

  .admin-nav {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .nav-item {
    font-size: 14px;
  }

  .admin-content {
    padding: 1rem;
  }
}
</style>
