<template>
  <FullscreenOverlay :isOpen="isOpen" @close="$emit('close')">
    <div class="shortcuts-overlay">
      <h2 class="shortcuts-title">Phím Tắt</h2>
      
      <div class="shortcuts-sections">
        <!-- General shortcuts -->
        <div class="shortcut-section">
          <h3 class="section-title">Chung</h3>
          <div class="shortcut-list">
            <div v-for="shortcut in generalShortcuts" :key="shortcut.keys" class="shortcut-item">
              <div class="shortcut-keys">
                <kbd v-for="(key, index) in shortcut.keys.split('+')" :key="index" class="key">
                  {{ key }}
                </kbd>
              </div>
              <div class="shortcut-description">{{ shortcut.description }}</div>
            </div>
          </div>
        </div>

        <!-- Navigation shortcuts -->
        <div class="shortcut-section">
          <h3 class="section-title">Di Chuyển</h3>
          <div class="shortcut-list">
            <div v-for="shortcut in navigationShortcuts" :key="shortcut.keys" class="shortcut-item">
              <div class="shortcut-keys">
                <kbd v-for="(key, index) in shortcut.keys.split('+')" :key="index" class="key">
                  {{ key }}
                </kbd>
              </div>
              <div class="shortcut-description">{{ shortcut.description }}</div>
            </div>
          </div>
        </div>

        <!-- Combat shortcuts -->
        <div class="shortcut-section">
          <h3 class="section-title">Chiến Đấu</h3>
          <div class="shortcut-list">
            <div v-for="shortcut in combatShortcuts" :key="shortcut.keys" class="shortcut-item">
              <div class="shortcut-keys">
                <kbd v-for="(key, index) in shortcut.keys.split('+')" :key="index" class="key">
                  {{ key }}
                </kbd>
              </div>
              <div class="shortcut-description">{{ shortcut.description }}</div>
            </div>
          </div>
        </div>

        <!-- Interface shortcuts -->
        <div class="shortcut-section">
          <h3 class="section-title">Giao Diện</h3>
          <div class="shortcut-list">
            <div v-for="shortcut in interfaceShortcuts" :key="shortcut.keys" class="shortcut-item">
              <div class="shortcut-keys">
                <kbd v-for="(key, index) in shortcut.keys.split('+')" :key="index" class="key">
                  {{ key }}
                </kbd>
              </div>
              <div class="shortcut-description">{{ shortcut.description }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="shortcuts-footer">
        <p class="footer-note">💡 Mẹo: Bạn có thể tạo alias tùy chỉnh trong phần Cài Đặt</p>
      </div>
    </div>
  </FullscreenOverlay>
</template>

<script setup lang="ts">
import FullscreenOverlay from './FullscreenOverlay.vue';

interface Props {
  isOpen: boolean;
}

defineProps<Props>();
defineEmits<{
  (e: 'close'): void;
}>();

const generalShortcuts = [
  { keys: 'F1', description: 'Mở trợ giúp' },
  { keys: 'Ctrl+H', description: 'Mở trợ giúp (Mac: Cmd+H)' },
  { keys: 'ESC', description: 'Đóng overlay/popup' },
  { keys: '↑', description: 'Lệnh trước trong lịch sử' },
  { keys: '↓', description: 'Lệnh sau trong lịch sử' },
  { keys: 'Tab', description: 'Tự động hoàn thành tên' },
  { keys: 'Enter', description: 'Gửi lệnh' },
  { keys: 'Ctrl+K', description: 'Mở phím tắt (overlay này)' },
];

const navigationShortcuts = [
  { keys: 'n', description: 'Di chuyển về phía Bắc' },
  { keys: 's', description: 'Di chuyển về phía Nam' },
  { keys: 'e', description: 'Di chuyển về phía Đông' },
  { keys: 'w', description: 'Di chuyển về phía Tây' },
  { keys: 'u', description: 'Di chuyển lên trên' },
  { keys: 'd', description: 'Di chuyển xuống dưới' },
];

const combatShortcuts = [
  { keys: 'a', description: 'Tấn công (attack)' },
  { keys: 'flee', description: 'Chạy trốn khỏi chiến đấu' },
  { keys: 'auto', description: 'Bật/tắt tự động chiến đấu' },
];

const interfaceShortcuts = [
  { keys: 'i', description: 'Mở túi đồ (inventory)' },
  { keys: 'l', description: 'Xem xét (look)' },
  { keys: 'help', description: 'Hiển thị trợ giúp chi tiết' },
];
</script>

<style scoped>
.shortcuts-overlay {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
  color: var(--text-bright);
  font-family: 'VT323', 'Source Code Pro', monospace;
}

.shortcuts-title {
  font-size: 32px;
  color: var(--text-accent);
  text-align: center;
  margin-bottom: 2rem;
  border-bottom: 2px solid var(--text-bright);
  padding-bottom: 0.5rem;
}

.shortcuts-sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.shortcut-section {
  background-color: rgba(0, 136, 0, 0.1);
  border: 1px solid rgba(0, 255, 0, 0.3);
  border-radius: 4px;
  padding: 1.5rem;
}

.section-title {
  font-size: 24px;
  color: var(--text-accent);
  margin-bottom: 1rem;
  border-bottom: 1px solid rgba(0, 255, 0, 0.3);
  padding-bottom: 0.5rem;
}

.shortcut-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.shortcut-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
  transition: background-color 0.2s;
}

.shortcut-item:hover {
  background-color: rgba(0, 136, 0, 0.2);
}

.shortcut-keys {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

.key {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background-color: rgba(0, 0, 0, 0.5);
  border: 1px solid var(--text-bright);
  border-radius: 3px;
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 16px;
  color: var(--text-bright);
  min-width: 2rem;
  text-align: center;
  box-shadow: 0 2px 0 rgba(0, 255, 0, 0.3);
}

.shortcut-description {
  flex: 1;
  font-size: 16px;
  color: var(--text-dim);
  text-align: right;
}

.shortcuts-footer {
  text-align: center;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(0, 255, 0, 0.3);
}

.footer-note {
  font-size: 18px;
  color: var(--text-accent);
  margin: 0;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .shortcuts-overlay {
    padding: 1rem;
  }

  .shortcuts-title {
    font-size: 24px;
    margin-bottom: 1.5rem;
  }

  .shortcuts-sections {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .shortcut-section {
    padding: 1rem;
  }

  .section-title {
    font-size: 20px;
  }

  .shortcut-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .shortcut-description {
    text-align: left;
  }

  .key {
    font-size: 14px;
    padding: 0.2rem 0.4rem;
  }
}

@media (max-width: 480px) {
  .shortcuts-sections {
    grid-template-columns: 1fr;
  }

  .shortcuts-title {
    font-size: 20px;
  }

  .section-title {
    font-size: 18px;
  }

  .shortcut-description {
    font-size: 14px;
  }
}
</style>
