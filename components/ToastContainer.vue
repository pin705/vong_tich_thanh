<template>
  <div class="toast-container">
    <ToastNotification
      v-for="toast in toasts"
      :key="toast.id"
      :message="toast.message"
      :type="toast.type"
      :duration="toast.duration"
      :position="toast.position"
      :dismissible="toast.dismissible"
      :show="toast.show"
      @close="removeToast(toast.id)"
    />
  </div>
</template>

<script setup lang="ts">
import ToastNotification from './ToastNotification.vue';
import { useToast } from '~/composables/useToast';

const { toasts, removeToast } = useToast();
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 10000;
}

.toast-container > * {
  pointer-events: auto;
}
</style>
