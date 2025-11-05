<template>
  <FullscreenOverlay
    :isOpen="isOpen"
    title="Trợ Giúp"
    size="large"
    @close="close"
  >
    <div class="help-container">
      <!-- Search Bar -->
      <div class="search-section">
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="Tìm kiếm lệnh..."
          @input="filterCommands"
        />
      </div>

      <div class="help-content">
        <!-- Categories Sidebar -->
        <div class="categories-sidebar">
          <div class="category-title">[ Danh Mục ]</div>
          <div
            v-for="category in categories"
            :key="category.id"
            class="category-item"
            :class="{ active: selectedCategory === category.id }"
            @click="selectCategory(category.id)"
          >
            {{ category.name }}
          </div>
        </div>

        <!-- Commands List -->
        <div class="commands-list">
          <div v-if="filteredCommands.length === 0" class="no-results">
            Không tìm thấy lệnh nào
          </div>
          <div
            v-for="command in filteredCommands"
            :key="command.name"
            class="command-item"
            @click="selectCommand(command)"
          >
            <div class="command-name">{{ command.name }}</div>
            <div class="command-short-desc">{{ command.shortDesc }}</div>
          </div>
        </div>

        <!-- Command Detail -->
        <div class="command-detail" v-if="selectedCommandDetail">
          <div class="detail-title">{{ selectedCommandDetail.name }}</div>
          <div class="detail-aliases" v-if="selectedCommandDetail.aliases">
            <span class="label">Tên khác:</span> {{ selectedCommandDetail.aliases.join(', ') }}
          </div>
          <div class="detail-description">{{ selectedCommandDetail.description }}</div>
          <div class="detail-usage">
            <div class="label">Cách dùng:</div>
            <div class="usage-line" v-for="(usage, idx) in selectedCommandDetail.usage" :key="idx">
              {{ usage }}
            </div>
          </div>
          <div class="detail-examples" v-if="selectedCommandDetail.examples">
            <div class="label">Ví dụ:</div>
            <div class="example-line" v-for="(example, idx) in selectedCommandDetail.examples" :key="idx">
              > {{ example }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </FullscreenOverlay>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import FullscreenOverlay from './FullscreenOverlay.vue';

interface Command {
  name: string;
  shortDesc: string;
  description: string;
  category: string;
  aliases?: string[];
  usage: string[];
  examples?: string[];
}

interface Category {
  id: string;
  name: string;
}

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const searchQuery = ref('');
const selectedCategory = ref('all');
const selectedCommandDetail = ref<Command | null>(null);

const categories: Category[] = [
  { id: 'all', name: 'Tất cả' },
  { id: 'basic', name: 'Lệnh cơ bản' },
  { id: 'movement', name: 'Di chuyển' },
  { id: 'combat', name: 'Chiến đấu' },
  { id: 'interaction', name: 'Tương tác' },
  { id: 'inventory', name: 'Túi đồ' },
  { id: 'social', name: 'Xã hội' },
  { id: 'guild', name: 'Bang hội' },
];

const allCommands: Command[] = [
  {
    name: 'help',
    shortDesc: 'Hiển thị trợ giúp',
    description: 'Mở cửa sổ trợ giúp với danh sách tất cả các lệnh có sẵn',
    category: 'basic',
    usage: ['help'],
    examples: ['help']
  },
  {
    name: 'look',
    shortDesc: 'Quan sát xung quanh',
    description: 'Xem mô tả phòng hiện tại, các lối ra, người chơi, NPC, và quái vật',
    category: 'basic',
    aliases: ['l'],
    usage: ['look', 'look [mục tiêu]'],
    examples: ['look', 'look Thương Gia', 'l Chuột Biến Dị']
  },
  {
    name: 'go',
    shortDesc: 'Di chuyển đến phòng khác',
    description: 'Di chuyển theo hướng đã chỉ định (bắc, nam, đông, tây, lên, xuống)',
    category: 'movement',
    aliases: ['n', 's', 'e', 'w', 'u', 'd'],
    usage: ['go [hướng]', 'n/s/e/w/u/d'],
    examples: ['go bắc', 'n', 's', 'go lên']
  },
  {
    name: 'attack',
    shortDesc: 'Tấn công mục tiêu',
    description: 'Bắt đầu chiến đấu với mục tiêu. Chiến đấu tự động diễn ra mỗi 2 giây',
    category: 'combat',
    aliases: ['a', 'kill'],
    usage: ['attack [mục tiêu]'],
    examples: ['attack Chuột Biến Dị', 'a Goblin', 'kill Sói Rừng']
  },
  {
    name: 'flee',
    shortDesc: 'Bỏ chạy khỏi chiến đấu',
    description: 'Cố gắng trốn thoát khỏi chiến đấu (tỷ lệ thành công 60%)',
    category: 'combat',
    aliases: ['run'],
    usage: ['flee'],
    examples: ['flee', 'run']
  },
  {
    name: 'inventory',
    shortDesc: 'Xem túi đồ',
    description: 'Hiển thị tất cả vật phẩm trong túi đồ của bạn',
    category: 'inventory',
    aliases: ['i'],
    usage: ['inventory'],
    examples: ['inventory', 'i']
  },
  {
    name: 'get',
    shortDesc: 'Nhặt vật phẩm',
    description: 'Nhặt vật phẩm từ mặt đất vào túi đồ',
    category: 'inventory',
    aliases: ['g'],
    usage: ['get [vật phẩm]'],
    examples: ['get Bình Máu Nhỏ', 'g Kiếm Gỉ']
  },
  {
    name: 'drop',
    shortDesc: 'Vứt vật phẩm',
    description: 'Vứt vật phẩm từ túi đồ xuống mặt đất',
    category: 'inventory',
    usage: ['drop [vật phẩm]'],
    examples: ['drop Đuôi Chuột']
  },
  {
    name: 'use',
    shortDesc: 'Sử dụng vật phẩm',
    description: 'Sử dụng vật phẩm tiêu hao (như bình máu)',
    category: 'inventory',
    usage: ['use [vật phẩm]'],
    examples: ['use Bình Máu Nhỏ']
  },
  {
    name: 'equip',
    shortDesc: 'Trang bị vật phẩm',
    description: 'Trang bị vũ khí hoặc giáp để tăng chỉ số',
    category: 'inventory',
    usage: ['equip [vật phẩm]'],
    examples: ['equip Kiếm Thép', 'equip Áo Giáp Nhẹ']
  },
  {
    name: 'say',
    shortDesc: 'Nói chuyện với người chơi',
    description: 'Gửi tin nhắn đến tất cả người chơi trong cùng phòng',
    category: 'social',
    usage: ['say [tin nhắn]'],
    examples: ['say Xin chào!', 'say Có ai muốn đi săn không?']
  },
  {
    name: 'talk',
    shortDesc: 'Nói chuyện với NPC',
    description: 'Tương tác với NPC để nhận thông tin hoặc nhiệm vụ',
    category: 'interaction',
    aliases: ['t'],
    usage: ['talk [NPC]'],
    examples: ['talk Thương Gia', 't Lính Gác']
  },
  {
    name: 'list',
    shortDesc: 'Xem danh sách cửa hàng',
    description: 'Hiển thị vật phẩm có sẵn từ thương nhân',
    category: 'interaction',
    usage: ['list'],
    examples: ['list']
  },
  {
    name: 'buy',
    shortDesc: 'Mua vật phẩm',
    description: 'Mua vật phẩm từ thương nhân',
    category: 'interaction',
    usage: ['buy [vật phẩm]'],
    examples: ['buy Bình Máu Nhỏ', 'buy Kiếm Gỉ']
  },
  {
    name: 'sell',
    shortDesc: 'Bán vật phẩm',
    description: 'Bán vật phẩm cho thương nhân (giá 50% giá trị)',
    category: 'interaction',
    usage: ['sell [vật phẩm]'],
    examples: ['sell Đuôi Chuột']
  },
  {
    name: 'quit',
    shortDesc: 'Thoát game',
    description: 'Đăng xuất và thoát khỏi trò chơi',
    category: 'basic',
    usage: ['quit'],
    examples: ['quit']
  }
];

const close = () => {
  emit('close');
};

const selectCategory = (categoryId: string) => {
  selectedCategory.value = categoryId;
  selectedCommandDetail.value = null;
};

const selectCommand = (command: Command) => {
  selectedCommandDetail.value = command;
};

const filteredCommands = computed(() => {
  let commands = allCommands;
  
  // Filter by category
  if (selectedCategory.value !== 'all') {
    commands = commands.filter(cmd => cmd.category === selectedCategory.value);
  }
  
  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    commands = commands.filter(cmd =>
      cmd.name.toLowerCase().includes(query) ||
      cmd.shortDesc.toLowerCase().includes(query) ||
      cmd.description.toLowerCase().includes(query) ||
      (cmd.aliases && cmd.aliases.some(alias => alias.toLowerCase().includes(query)))
    );
  }
  
  return commands;
});

const filterCommands = () => {
  // Trigger computed property update
};
</script>

<style scoped>
.help-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 1rem;
}

.search-section {
  margin-bottom: 1rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: rgba(0, 136, 0, 0.1);
  border: 1px solid var(--text-dim);
  color: var(--text-bright);
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 18px;
}

.search-input:focus {
  outline: none;
  border-color: var(--text-bright);
  background-color: rgba(0, 255, 0, 0.05);
}

.search-input::placeholder {
  color: var(--text-dim);
}

.help-content {
  display: grid;
  grid-template-columns: 200px 1fr 1fr;
  gap: 1rem;
  flex: 1;
  overflow: hidden;
}

.categories-sidebar {
  border-right: 1px solid var(--text-dim);
  padding-right: 1rem;
  overflow-y: auto;
}

.category-title {
  color: var(--text-accent);
  font-weight: bold;
  margin-bottom: 0.75rem;
  font-size: 18px;
}

.category-item {
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  color: var(--text-dim);
  transition: all 0.2s;
  margin-bottom: 0.25rem;
}

.category-item:hover {
  background-color: rgba(0, 255, 0, 0.1);
  color: var(--text-bright);
}

.category-item.active {
  background-color: rgba(255, 176, 0, 0.2);
  color: var(--text-accent);
  border-left: 3px solid var(--text-accent);
  padding-left: calc(0.75rem - 3px);
}

.commands-list {
  border-right: 1px solid var(--text-dim);
  padding-right: 1rem;
  overflow-y: auto;
}

.command-item {
  padding: 0.75rem;
  cursor: pointer;
  border-bottom: 1px solid rgba(0, 136, 0, 0.3);
  transition: all 0.2s;
}

.command-item:hover {
  background-color: rgba(0, 255, 0, 0.1);
}

.command-name {
  color: var(--text-bright);
  font-weight: bold;
  font-size: 18px;
  margin-bottom: 0.25rem;
}

.command-short-desc {
  color: var(--text-dim);
  font-size: 16px;
}

.no-results {
  color: var(--text-dim);
  text-align: center;
  padding: 2rem;
  font-style: italic;
}

.command-detail {
  overflow-y: auto;
  padding-left: 1rem;
}

.detail-title {
  color: var(--text-accent);
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 1rem;
  text-transform: uppercase;
}

.detail-aliases {
  color: var(--text-dim);
  margin-bottom: 1rem;
}

.detail-description {
  color: var(--text-bright);
  margin-bottom: 1.5rem;
  line-height: 1.8;
}

.detail-usage,
.detail-examples {
  margin-bottom: 1.5rem;
}

.label {
  color: var(--text-accent);
  font-weight: bold;
  display: block;
  margin-bottom: 0.5rem;
}

.usage-line,
.example-line {
  background-color: rgba(0, 136, 0, 0.1);
  padding: 0.5rem 1rem;
  margin-bottom: 0.5rem;
  border-left: 3px solid var(--text-dim);
  color: var(--text-bright);
}

.example-line {
  border-left-color: var(--text-accent);
  font-family: monospace;
}
</style>
