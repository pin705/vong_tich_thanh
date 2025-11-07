<template>
  <Transition name="quick-menu">
    <div v-if="isOpen" class="quick-actions-menu">
      <div class="menu-header">
        <h3 class="menu-title">Hành Động Nhanh</h3>
        <button class="close-btn" @click="$emit('close')" aria-label="Đóng">[X]</button>
      </div>

      <div class="menu-content">
        <!-- Common actions -->
        <div class="action-group">
          <h4 class="group-title">Thông Dụng</h4>
          <button
            v-for="action in commonActions"
            :key="action.command"
            class="action-btn"
            @click="executeAction(action.command)"
          >
            <span class="action-icon">{{ action.icon }}</span>
            <span class="action-label">{{ action.label }}</span>
            <span class="action-key" v-if="action.key">{{ action.key }}</span>
          </button>
        </div>

        <!-- Combat actions -->
        <div class="action-group" v-if="inCombat">
          <h4 class="group-title">Chiến Đấu</h4>
          <button
            v-for="action in combatActions"
            :key="action.command"
            class="action-btn combat-action"
            @click="executeAction(action.command)"
          >
            <span class="action-icon">{{ action.icon }}</span>
            <span class="action-label">{{ action.label }}</span>
            <span class="action-key" v-if="action.key">{{ action.key }}</span>
          </button>
        </div>

        <!-- Social actions -->
        <div class="action-group">
          <h4 class="group-title">Xã Hội</h4>
          <button
            v-for="action in socialActions"
            :key="action.command"
            class="action-btn"
            @click="executeAction(action.command)"
          >
            <span class="action-icon">{{ action.icon }}</span>
            <span class="action-label">{{ action.label }}</span>
            <span class="action-key" v-if="action.key">{{ action.key }}</span>
          </button>
        </div>

        <!-- Quick travel -->
        <div class="action-group" v-if="favoriteLocations.length > 0">
          <h4 class="group-title">Địa Điểm Yêu Thích</h4>
          <button
            v-for="location in favoriteLocations"
            :key="location.id"
            class="action-btn"
            @click="executeAction(`goto ${location.id}`)"
          >
            <span class="action-icon">[Go]</span>
            <span class="action-label">{{ location.name }}</span>
          </button>
        </div>
      </div>

      <div class="menu-footer">
        <button class="footer-btn" @click="openSettings">
          [Cfg] Tùy Chỉnh Menu
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Action {
  command: string;
  label: string;
  icon: string;
  key?: string;
}

interface Location {
  id: string;
  name: string;
}

interface Props {
  isOpen: boolean;
  inCombat?: boolean;
  favoriteLocations?: Location[];
}

const props = withDefaults(defineProps<Props>(), {
  inCombat: false,
  favoriteLocations: () => []
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'executeCommand', command: string): void;
  (e: 'openSettings'): void;
}>();

const commonActions: Action[] = [
  { command: 'look', label: 'Xem Xét', icon: '[Xem]', key: 'l' },
  { command: 'inventory', label: 'Túi Đồ', icon: '[Túi]', key: 'i' },
  { command: 'rest', label: 'Nghỉ Ngơi', icon: '[Rest]' },
  { command: 'meditate', label: 'Thiền Định', icon: '[Med]' },
  { command: 'status', label: 'Trạng Thái', icon: '[Stat]' },
];

const combatActions: Action[] = [
  { command: 'attack', label: 'Tấn Công', icon: '[ATK]', key: 'a' },
  { command: 'flee', label: 'Chạy Trốn', icon: '[Flee]' },
  { command: 'auto', label: 'Auto Combat', icon: '[Auto]' },
  { command: 'use potion', label: 'Dùng Thuốc', icon: '[Pot]' },
];

const socialActions: Action[] = [
  { command: 'say Hello!', label: 'Chào Hỏi', icon: '[Say]' },
  { command: 'party list', label: 'Nhóm', icon: '[Pty]' },
  { command: 'guild', label: 'Bang Hội', icon: '[Hội]' },
  { command: 'who', label: 'Người Chơi', icon: '[Who]' },
];

const executeAction = (command: string) => {
  emit('executeCommand', command);
  emit('close');
};

const openSettings = () => {
  emit('openSettings');
  emit('close');
};
</script>

<style scoped>
.quick-actions-menu {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  background-color: rgba(0, 0, 0, 0.95);
  border: 2px solid var(--text-bright);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 255, 0, 0.3);
  z-index: 9999;
  font-family: 'VT323', 'Source Code Pro', monospace;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background-color: rgba(0, 136, 0, 0.2);
  border-bottom: 1px solid var(--text-bright);
}

.menu-title {
  font-size: 24px;
  color: var(--text-accent);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-bright);
  font-size: 32px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: transform 0.2s;
}

.close-btn:hover {
  transform: scale(1.2);
  color: var(--text-accent);
}

.menu-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.action-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.group-title {
  font-size: 18px;
  color: var(--text-accent);
  margin: 0 0 0.5rem 0;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid rgba(0, 255, 0, 0.3);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background-color: rgba(0, 136, 0, 0.1);
  border: 1px solid rgba(0, 255, 0, 0.3);
  border-radius: 4px;
  color: var(--text-bright);
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.action-btn:hover {
  background-color: rgba(0, 136, 0, 0.3);
  border-color: var(--text-bright);
  transform: translateX(4px);
}

.action-btn.combat-action {
  border-color: rgba(255, 0, 0, 0.5);
  background-color: rgba(136, 0, 0, 0.1);
}

.action-btn.combat-action:hover {
  background-color: rgba(136, 0, 0, 0.3);
  border-color: #ff0000;
}

.action-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.action-label {
  flex: 1;
}

.action-key {
  font-size: 14px;
  padding: 0.2rem 0.4rem;
  background-color: rgba(0, 0, 0, 0.5);
  border: 1px solid var(--text-dim);
  border-radius: 3px;
  color: var(--text-dim);
}

.menu-footer {
  padding: 1rem 1.5rem;
  background-color: rgba(0, 136, 0, 0.1);
  border-top: 1px solid rgba(0, 255, 0, 0.3);
}

.footer-btn {
  width: 100%;
  padding: 0.75rem;
  background-color: rgba(0, 136, 0, 0.2);
  border: 1px solid var(--text-bright);
  border-radius: 4px;
  color: var(--text-bright);
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
}

.footer-btn:hover {
  background-color: rgba(0, 136, 0, 0.4);
  transform: scale(1.02);
}

/* Animations */
.quick-menu-enter-active,
.quick-menu-leave-active {
  transition: all 0.3s ease;
}

.quick-menu-enter-from,
.quick-menu-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.9);
}

/* Custom scrollbar */
.menu-content::-webkit-scrollbar {
  width: 8px;
}

.menu-content::-webkit-scrollbar-track {
  background-color: rgba(0, 0, 0, 0.3);
}

.menu-content::-webkit-scrollbar-thumb {
  background-color: rgba(0, 255, 0, 0.3);
  border-radius: 4px;
}

.menu-content::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 255, 0, 0.5);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .quick-actions-menu {
    width: 95%;
    max-height: 85vh;
  }

  .menu-header {
    padding: 0.75rem 1rem;
  }

  .menu-title {
    font-size: 20px;
  }

  .menu-content {
    padding: 1rem;
    gap: 1rem;
  }

  .action-btn {
    padding: 0.6rem 0.8rem;
    font-size: 16px;
  }

  .action-icon {
    font-size: 20px;
  }
}
</style>
