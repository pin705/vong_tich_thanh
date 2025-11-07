<template>
  <FullscreenOverlay :isOpen="true" :title="title" @close="onClose" size="medium">
    <div class="terminal-text p-4">
      <p class="text-cyan">> [HỆ THỐNG]: {{ message }}</p>
      <br>
      <p>Bạn nhận được các vật phẩm sau:</p>

      <ul class="list-none p-0 m-0 pl-4">
        <li v-for="item in items" :key="item.itemKey" 
            class="text-bright-green">
          > {{ item.name }}
        </li>
      </ul>
      <br>

      <p class="text-amber">
        Lời khuyên: Gõ 'i' (hoặc nhấn nút [Túi]) để mở túi đồ.
      </p>
      <p class="text-amber">
        Gõ 'equip [tên vật phẩm]' (ví dụ: 'equip kiếm tân thủ') để trang bị.
      </p>

      <button @click="onClose" 
              class="terminal-button mt-4 p-2 border border-green-500 text-green-500 hover:bg-green-500 hover:text-black">
        [ Đã Hiểu ]
      </button>
    </div>
  </FullscreenOverlay>
</template>

<script setup lang="ts">
interface Props {
  title: string;
  message: string;
  items: Array<{ itemKey: string; name: string }>;
}

defineProps<Props>();

const emit = defineEmits<{
  close: [];
}>();

const onClose = () => {
  emit('close');
};
</script>

<style scoped>
.terminal-text {
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 18px;
  line-height: 1.6;
}

.text-cyan {
  color: var(--text-cyan);
}

.text-bright-green {
  color: var(--text-bright);
}

.text-amber {
  color: var(--text-warning);
}

.terminal-button {
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 4px;
}

.terminal-button:hover {
  transform: scale(1.05);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .terminal-text {
    font-size: 16px;
  }
  
  .terminal-button {
    font-size: 16px;
    width: 100%;
  }
}
</style>
