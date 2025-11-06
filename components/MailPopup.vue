<template>
  <FullscreenOverlay :isOpen="isOpen" title="HÒM THƯ" size="large" @close="close">
    <div class="mail-container">
      <!-- Mail list -->
      <div v-if="!selectedMail" class="mail-list">
        <div v-if="loading" class="loading-message">Đang tải thư...</div>
        <div v-else-if="mails.length === 0" class="empty-message">
          Hòm thư trống.
        </div>
        <div v-else>
          <div
            v-for="mail in mails"
            :key="mail.id"
            class="mail-item"
            :class="{ unread: !mail.isRead, 'has-attachments': mail.hasAttachments }"
            @click="selectMail(mail)"
          >
            <div class="mail-header-row">
              <span class="mail-status">{{ mail.isRead ? '[ ]' : '[!]' }}</span>
              <span class="mail-sender">{{ mail.senderName }}</span>
              <span v-if="mail.hasAttachments" class="mail-attachment-icon">[📦]</span>
            </div>
            <div class="mail-subject">{{ mail.subject }}</div>
            <div class="mail-date">{{ formatDate(mail.createdAt) }}</div>
          </div>
        </div>
      </div>

      <!-- Mail detail -->
      <div v-else class="mail-detail">
        <button class="back-button" @click="selectedMail = null">[←] Quay lại</button>
        
        <div class="mail-detail-header">
          <div class="mail-detail-from">Từ: {{ selectedMail.senderName }}</div>
          <div class="mail-detail-subject">{{ selectedMail.subject }}</div>
          <div class="mail-detail-date">{{ formatDate(selectedMail.createdAt) }}</div>
        </div>

        <div class="mail-detail-body">
          {{ selectedMail.body }}
        </div>

        <!-- Attachments -->
        <div v-if="selectedMail.hasAttachments" class="mail-attachments">
          <div class="attachment-title">Phần thưởng đính kèm:</div>
          <div class="attachment-list">
            <div v-if="selectedMail.attachedGold > 0" class="attachment-item">
              [V] {{ selectedMail.attachedGold }} Vàng
            </div>
            <div v-if="selectedMail.attachedPremium > 0" class="attachment-item">
              [G] {{ selectedMail.attachedPremium }} Kim Cương
            </div>
            <div v-for="item in selectedMail.attachedItems" :key="item.id" class="attachment-item">
              [I] {{ item.name }} x{{ item.quantity }}
            </div>
          </div>
          <button class="claim-button" @click="claimRewards">
            [Nhận Thưởng]
          </button>
        </div>

        <!-- Actions -->
        <div class="mail-actions">
          <button class="delete-button" @click="deleteMail" :disabled="selectedMail.hasAttachments">
            [Xóa Thư]
          </button>
          <span v-if="selectedMail.hasAttachments" class="delete-hint">
            (Nhận thưởng trước khi xóa)
          </span>
        </div>

        <!-- Status message -->
        <div v-if="statusMessage" class="status-message" :class="statusType">
          {{ statusMessage }}
        </div>
      </div>
    </div>
  </FullscreenOverlay>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import FullscreenOverlay from './FullscreenOverlay.vue';

interface Props {
  isOpen: boolean;
}

interface Mail {
  id: string;
  senderName: string;
  subject: string;
  body: string;
  isRead: boolean;
  attachedItems: Array<{ id: string; name: string; quantity: number }>;
  attachedGold: number;
  attachedPremium: number;
  hasAttachments: boolean;
  expiresAt: string;
  createdAt: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  mailUpdated: [];
}>();

const mails = ref<Mail[]>([]);
const selectedMail = ref<Mail | null>(null);
const loading = ref(false);
const statusMessage = ref('');
const statusType = ref<'success' | 'error'>('success');

const close = () => {
  emit('close');
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins} phút trước`;
  } else if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  } else if (diffDays < 7) {
    return `${diffDays} ngày trước`;
  } else {
    return date.toLocaleDateString('vi-VN');
  }
};

const loadMails = async () => {
  loading.value = true;
  try {
    const response = await $fetch('/api/mail/inbox');
    if (response.success) {
      mails.value = response.mails;
    }
  } catch (error) {
    console.error('Error loading mails:', error);
  } finally {
    loading.value = false;
  }
};

const selectMail = async (mail: Mail) => {
  selectedMail.value = mail;
  statusMessage.value = '';
  
  // Mark as read if unread
  if (!mail.isRead) {
    try {
      await $fetch(`/api/mail/read/${mail.id}`, { method: 'POST' });
      mail.isRead = true;
      emit('mailUpdated');
    } catch (error) {
      console.error('Error marking mail as read:', error);
    }
  }
};

const claimRewards = async () => {
  if (!selectedMail.value) return;
  
  try {
    const response = await $fetch(`/api/mail/claim/${selectedMail.value.id}`, { method: 'POST' });
    if (response.success) {
      statusMessage.value = response.message;
      statusType.value = 'success';
      
      // Update mail state
      selectedMail.value.attachedItems = [];
      selectedMail.value.attachedGold = 0;
      selectedMail.value.attachedPremium = 0;
      selectedMail.value.hasAttachments = false;
      
      // Update in list
      const mailInList = mails.value.find(m => m.id === selectedMail.value!.id);
      if (mailInList) {
        mailInList.hasAttachments = false;
      }
      
      emit('mailUpdated');
    }
  } catch (error: any) {
    statusMessage.value = error.data?.statusMessage || 'Không thể nhận thưởng.';
    statusType.value = 'error';
  }
};

const deleteMail = async () => {
  if (!selectedMail.value) return;
  
  try {
    const response = await $fetch(`/api/mail/${selectedMail.value.id}`, { method: 'DELETE' });
    if (response.success) {
      // Remove from list
      mails.value = mails.value.filter(m => m.id !== selectedMail.value!.id);
      selectedMail.value = null;
      statusMessage.value = response.message;
      statusType.value = 'success';
      emit('mailUpdated');
    }
  } catch (error: any) {
    statusMessage.value = error.data?.statusMessage || 'Không thể xóa thư.';
    statusType.value = 'error';
  }
};

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    loadMails();
    selectedMail.value = null;
    statusMessage.value = '';
  }
});

onMounted(() => {
  if (props.isOpen) {
    loadMails();
  }
});
</script>

<style scoped>
.mail-container {
  min-height: 400px;
}

.loading-message,
.empty-message {
  text-align: center;
  padding: 2rem;
  color: var(--text-dim);
  font-style: italic;
}

.mail-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.mail-item {
  padding: 1rem;
  border: 1px solid var(--text-dim);
  cursor: pointer;
  transition: all 0.2s;
}

.mail-item:hover {
  background-color: rgba(0, 255, 0, 0.05);
  border-color: var(--text-bright);
}

.mail-item.unread {
  background-color: rgba(0, 255, 0, 0.1);
  border-color: var(--text-accent);
}

.mail-item.has-attachments {
  border-left: 3px solid var(--text-accent);
}

.mail-header-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.mail-status {
  color: var(--text-accent);
  font-weight: bold;
}

.mail-sender {
  color: var(--text-bright);
  font-weight: bold;
}

.mail-attachment-icon {
  margin-left: auto;
  color: var(--text-accent);
}

.mail-subject {
  color: var(--text-bright);
  margin-bottom: 0.25rem;
}

.mail-date {
  color: var(--text-dim);
  font-size: 14px;
}

/* Mail detail */
.mail-detail {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.back-button {
  background: transparent;
  color: var(--text-bright);
  border: 1px solid var(--text-dim);
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 16px;
  align-self: flex-start;
}

.back-button:hover {
  background-color: rgba(0, 255, 0, 0.1);
  border-color: var(--text-bright);
}

.mail-detail-header {
  border: 1px solid var(--text-dim);
  padding: 1rem;
  background-color: rgba(0, 136, 0, 0.05);
}

.mail-detail-from {
  color: var(--text-accent);
  margin-bottom: 0.5rem;
}

.mail-detail-subject {
  color: var(--text-bright);
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.mail-detail-date {
  color: var(--text-dim);
  font-size: 14px;
}

.mail-detail-body {
  border: 1px solid var(--text-dim);
  padding: 1rem;
  min-height: 150px;
  white-space: pre-wrap;
  line-height: 1.6;
}

.mail-attachments {
  border: 2px solid var(--text-accent);
  padding: 1rem;
  background-color: rgba(0, 255, 0, 0.05);
}

.attachment-title {
  color: var(--text-accent);
  font-weight: bold;
  margin-bottom: 0.75rem;
}

.attachment-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.attachment-item {
  color: var(--text-bright);
  padding: 0.5rem;
  background-color: rgba(0, 136, 0, 0.1);
  border-left: 2px solid var(--text-accent);
}

.claim-button {
  background: transparent;
  color: var(--text-accent);
  border: 2px solid var(--text-accent);
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  width: 100%;
}

.claim-button:hover {
  background-color: var(--text-accent);
  color: var(--bg-black);
}

.mail-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.delete-button {
  background: transparent;
  color: var(--text-danger);
  border: 1px solid var(--text-danger);
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 16px;
}

.delete-button:hover:not(:disabled) {
  background-color: var(--text-danger);
  color: var(--bg-black);
}

.delete-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.delete-hint {
  color: var(--text-dim);
  font-size: 14px;
  font-style: italic;
}

.status-message {
  padding: 0.75rem;
  border-left: 3px solid;
  margin-top: 0.5rem;
}

.status-message.success {
  background-color: rgba(0, 255, 0, 0.1);
  border-color: var(--text-accent);
  color: var(--text-accent);
}

.status-message.error {
  background-color: rgba(255, 0, 0, 0.1);
  border-color: var(--text-danger);
  color: var(--text-danger);
}
</style>
