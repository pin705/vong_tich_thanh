<template>
  <div class="admin-players">
    <h1 class="page-title">👥 Quản Lý Người Chơi</h1>

    <div class="content-section">
      <p class="info-text">
        Chức năng quản lý người chơi (xem danh sách, chỉnh sửa, cấm,...) sẽ được triển khai sau.<br>
        Hiện tại, bạn có thể truy cập trực tiếp vào database MongoDB để quản lý người chơi.
      </p>

      <div class="feature-list">
        <h3 class="subsection-title">Các tính năng sẽ có:</h3>
        <ul class="features">
          <li>✅ Xem danh sách người chơi</li>
          <li>✅ Tìm kiếm người chơi</li>
          <li>✅ Chỉnh sửa thông tin người chơi</li>
          <li>✅ Cấm/Mở cấm người chơi</li>
          <li>✅ Thay đổi role (player/admin)</li>
          <li>✅ Reset mật khẩu</li>
          <li>✅ Xem lịch sử hoạt động</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'admin'
});
</script>

<style scoped>
.admin-players {
  max-width: 1200px;
}

.page-title {
  color: #00ff00;
  font-size: 32px;
  margin-bottom: 2rem;
}

.content-section {
  background-color: #2a2a2a;
  border: 1px solid #3a3a3a;
  padding: 3rem;
  text-align: center;
}

.info-text {
  color: #a0a0a0;
  font-size: 16px;
  line-height: 1.8;
  margin-bottom: 2rem;
}

.feature-list {
  margin-top: 3rem;
  text-align: left;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.subsection-title {
  color: #00ff00;
  font-size: 20px;
  margin-bottom: 1rem;
}

.features {
  list-style: none;
  padding: 0;
}

.features li {
  color: #e0e0e0;
  font-size: 16px;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background-color: rgba(0, 255, 0, 0.05);
  border-left: 2px solid #00ff00;
}
</style>
