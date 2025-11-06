<template>
  <div class="admin-mail">
    <h1 class="page-title">📬 Gửi Thư Hệ Thống</h1>

    <div class="form-container">
      <div class="form-group">
        <label class="form-label">Người Nhận:</label>
        <select v-model="recipientType" class="form-select">
          <option value="all">Tất cả người chơi</option>
          <option value="specific">Người chơi cụ thể</option>
        </select>
      </div>

      <div v-if="recipientType === 'specific'" class="form-group">
        <label class="form-label">ID Người Chơi:</label>
        <input v-model="recipientId" type="text" class="form-input" placeholder="Player ID..." />
      </div>

      <div class="form-group">
        <label class="form-label">Tiêu Đề:</label>
        <input v-model="subject" type="text" class="form-input" placeholder="Nhập tiêu đề..." />
      </div>

      <div class="form-group">
        <label class="form-label">Nội Dung:</label>
        <textarea v-model="body" class="form-textarea" rows="6" placeholder="Nhập nội dung thư..."></textarea>
      </div>

      <div class="form-group">
        <label class="form-label">Vàng Đính Kèm:</label>
        <input v-model.number="attachedGold" type="number" class="form-input" min="0" placeholder="0" />
      </div>

      <div class="form-group">
        <label class="form-label">Kim Cương Đính Kèm:</label>
        <input v-model.number="attachedPremium" type="number" class="form-input" min="0" placeholder="0" />
      </div>

      <button @click="sendMail" :disabled="sending" class="btn-submit">
        {{ sending ? 'Đang gửi...' : 'Gửi Thư' }}
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

const recipientType = ref('all');
const recipientId = ref('');
const subject = ref('');
const body = ref('');
const attachedGold = ref(0);
const attachedPremium = ref(0);
const sending = ref(false);
const message = ref('');
const messageType = ref<'success' | 'error'>('success');

const sendMail = async () => {
  if (!subject.value || !body.value) {
    message.value = 'Vui lòng nhập tiêu đề và nội dung.';
    messageType.value = 'error';
    return;
  }

  sending.value = true;
  message.value = '';

  try {
    const response = await $fetch('/api/admin/mail/send-system', {
      method: 'POST',
      body: {
        subject: subject.value,
        message: body.value,
        rewards: {
          gold: attachedGold.value,
          premium: attachedPremium.value,
          items: []
        },
        recipientId: recipientType.value === 'all' ? null : recipientId.value
      }
    });

    if (response.success) {
      message.value = response.message;
      messageType.value = 'success';
      
      // Reset form
      subject.value = '';
      body.value = '';
      attachedGold.value = 0;
      attachedPremium.value = 0;
      recipientId.value = '';
    }
  } catch (error: any) {
    message.value = error.data?.statusMessage || 'Không thể gửi thư.';
    messageType.value = 'error';
  } finally {
    sending.value = false;
  }
};
</script>

<style scoped>
.admin-mail {
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

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  color: #00ff00;
  font-size: 16px;
  margin-bottom: 0.5rem;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  background-color: #1a1a1a;
  color: #e0e0e0;
  border: 1px solid #3a3a3a;
  padding: 0.75rem;
  font-family: 'Source Code Pro', monospace;
  font-size: 14px;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #00ff00;
}

.form-textarea {
  resize: vertical;
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
