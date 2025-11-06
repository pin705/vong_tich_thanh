<template>
  <div class="admin-giftcode">
    <h1 class="page-title">🎁 Quản Lý Gift Code</h1>

    <div class="form-container">
      <h2 class="section-title">Tạo Gift Code Mới</h2>
      
      <div class="form-group">
        <label class="form-label">Mã Code:</label>
        <input v-model="code" type="text" class="form-input" placeholder="VD: WELCOME2024" />
      </div>

      <div class="form-group">
        <label class="form-label">Số Lần Sử Dụng Tối Đa:</label>
        <input v-model.number="maxUses" type="number" class="form-input" min="1" placeholder="1" />
      </div>

      <div class="form-group">
        <label class="form-label">Ngày Hết Hạn:</label>
        <input v-model="expiresAt" type="datetime-local" class="form-input" />
      </div>

      <div class="rewards-section">
        <h3 class="subsection-title">Phần Thưởng:</h3>
        
        <div class="form-group">
          <label class="form-label">Vàng:</label>
          <input v-model.number="rewardGold" type="number" class="form-input" min="0" placeholder="0" />
        </div>

        <div class="form-group">
          <label class="form-label">Kim Cương:</label>
          <input v-model.number="rewardPremium" type="number" class="form-input" min="0" placeholder="0" />
        </div>
      </div>

      <button @click="createGiftCode" :disabled="creating" class="btn-submit">
        {{ creating ? 'Đang tạo...' : 'Tạo Gift Code' }}
      </button>

      <div v-if="message" class="message" :class="messageType">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'admin'
});

const code = ref('');
const maxUses = ref(1);
const expiresAt = ref('');
const rewardGold = ref(0);
const rewardPremium = ref(0);
const creating = ref(false);
const message = ref('');
const messageType = ref<'success' | 'error'>('success');

// Set default expiration date to 30 days from now
onMounted(() => {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  expiresAt.value = date.toISOString().slice(0, 16);
});

const createGiftCode = async () => {
  if (!code.value) {
    message.value = 'Vui lòng nhập mã code.';
    messageType.value = 'error';
    return;
  }

  if (!expiresAt.value) {
    message.value = 'Vui lòng chọn ngày hết hạn.';
    messageType.value = 'error';
    return;
  }

  creating.value = true;
  message.value = '';

  try {
    const response = await $fetch('/api/admin/giftcode/create', {
      method: 'POST',
      body: {
        code: code.value,
        maxUses: maxUses.value,
        expiresAt: expiresAt.value,
        rewards: {
          gold: rewardGold.value,
          premium: rewardPremium.value,
          items: []
        }
      }
    });

    if (response.success) {
      message.value = response.message;
      messageType.value = 'success';
      
      // Reset form
      code.value = '';
      maxUses.value = 1;
      rewardGold.value = 0;
      rewardPremium.value = 0;
      
      // Reset expiration date to 30 days from now
      const date = new Date();
      date.setDate(date.getDate() + 30);
      expiresAt.value = date.toISOString().slice(0, 16);
    }
  } catch (error: any) {
    message.value = error.data?.statusMessage || 'Không thể tạo Gift Code.';
    messageType.value = 'error';
  } finally {
    creating.value = false;
  }
};
</script>

<style scoped>
.admin-giftcode {
  max-width: 800px;
}

.page-title {
  color: #00ff00;
  font-size: 32px;
  margin-bottom: 2rem;
}

.form-container {
  background-color: #2a2a2a;
  border: 1px solid #3a3a3a;
  padding: 2rem;
}

.section-title {
  color: #00ff00;
  font-size: 24px;
  margin-bottom: 1.5rem;
}

.subsection-title {
  color: #00ff00;
  font-size: 18px;
  margin-bottom: 1rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  color: #00ff00;
  font-size: 16px;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  background-color: #1a1a1a;
  color: #e0e0e0;
  border: 1px solid #3a3a3a;
  padding: 0.75rem;
  font-family: 'Source Code Pro', monospace;
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: #00ff00;
}

.rewards-section {
  background-color: rgba(0, 255, 0, 0.05);
  border: 1px solid #3a3a3a;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.btn-submit {
  background-color: transparent;
  color: #00ff00;
  border: 2px solid #00ff00;
  padding: 0.75rem 2rem;
  font-family: 'Source Code Pro', monospace;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-submit:hover:not(:disabled) {
  background-color: #00ff00;
  color: #1a1a1a;
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.message {
  margin-top: 1rem;
  padding: 1rem;
  border-left: 3px solid;
}

.message.success {
  background-color: rgba(0, 255, 0, 0.1);
  border-color: #00ff00;
  color: #00ff00;
}

.message.error {
  background-color: rgba(255, 0, 0, 0.1);
  border-color: #ff0000;
  color: #ff6666;
}
</style>
