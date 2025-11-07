<template>
  <div class="mobile-floating-menu" v-if="isMobileOrTablet">
    <!-- Floating Action Button -->
    <button 
      class="fab-button" 
      :class="{ 'fab-open': isMenuOpen }"
      @click="toggleMenu"
      aria-label="Toggle quick menu"
    >
      <span v-if="!isMenuOpen">[≡]</span>
      <span v-else>[X]</span>
    </button>

    <!-- Floating Menu Items -->
    <transition name="menu-fade">
      <div v-if="isMenuOpen" class="fab-menu">
        <button 
          class="fab-menu-item" 
          @click="openOccupants"
          title="Xem người xung quanh"
        >
          <span class="menu-icon">[Occ]</span>
          <span class="menu-label">Xung Quanh</span>
        </button>
        <button 
          class="fab-menu-item" 
          @click="openMap"
          title="Mở bản đồ"
        >
          <span class="menu-icon">[Map]</span>
          <span class="menu-label">Bản Đồ</span>
        </button>
        <button 
          class="fab-menu-item" 
          @click="openInventory"
          title="Mở túi đồ"
        >
          <span class="menu-icon">[Bag]</span>
          <span class="menu-label">Túi Đồ</span>
        </button>
      </div>
    </transition>

    <!-- Backdrop -->
    <transition name="backdrop-fade">
      <div 
        v-if="isMenuOpen" 
        class="fab-backdrop" 
        @click="closeMenu"
      ></div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  isMobileOrTablet: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  openOccupants: [];
  openMap: [];
  openInventory: [];
}>();

const isMenuOpen = ref(false);

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const closeMenu = () => {
  isMenuOpen.value = false;
};

const openOccupants = () => {
  emit('openOccupants');
  closeMenu();
};

const openMap = () => {
  emit('openMap');
  closeMenu();
};

const openInventory = () => {
  emit('openInventory');
  closeMenu();
};
</script>

<style scoped>
.mobile-floating-menu {
  position: fixed;
  bottom: 80px;
  right: 16px;
  z-index: 1000;
}

.fab-button {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: var(--text-accent);
  color: var(--bg-black);
  border: 2px solid var(--text-bright);
  box-shadow: 0 4px 12px rgba(0, 255, 0, 0.4);
  cursor: pointer;
  font-size: 24px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1002;
}

.fab-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(0, 255, 0, 0.6);
}

.fab-button.fab-open {
  background-color: var(--text-danger);
  transform: rotate(90deg);
}

.fab-menu {
  position: absolute;
  bottom: 70px;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1001;
}

.fab-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: rgba(0, 136, 0, 0.95);
  color: var(--text-bright);
  border: 1px solid var(--text-bright);
  border-radius: 24px;
  cursor: pointer;
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 16px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
  backdrop-filter: blur(5px);
}

.fab-menu-item:hover {
  background-color: rgba(0, 255, 0, 0.2);
  border-color: var(--text-accent);
  transform: translateX(-5px);
}

.menu-icon {
  font-size: 20px;
}

.menu-label {
  font-size: 14px;
  font-weight: bold;
}

.fab-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

/* Animations */
.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: all 0.3s ease;
}

.menu-fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.menu-fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.backdrop-fade-enter-active,
.backdrop-fade-leave-active {
  transition: opacity 0.3s ease;
}

.backdrop-fade-enter-from,
.backdrop-fade-leave-to {
  opacity: 0;
}

/* Tablet adjustments */
@media (min-width: 769px) and (max-width: 1023px) {
  .mobile-floating-menu {
    bottom: 90px;
    right: 20px;
  }

  .fab-button {
    width: 64px;
    height: 64px;
    font-size: 26px;
  }

  .fab-menu-item {
    padding: 12px 20px;
    font-size: 18px;
  }

  .menu-icon {
    font-size: 22px;
  }

  .menu-label {
    font-size: 16px;
  }
}

/* Small mobile adjustments */
@media (max-width: 480px) {
  .mobile-floating-menu {
    bottom: 70px;
    right: 12px;
  }

  .fab-button {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }

  .fab-menu {
    bottom: 60px;
  }

  .fab-menu-item {
    padding: 8px 12px;
    font-size: 14px;
  }

  .menu-icon {
    font-size: 18px;
  }

  .menu-label {
    font-size: 13px;
  }
}
</style>
