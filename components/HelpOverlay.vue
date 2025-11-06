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
  { id: 'mechanics', name: 'Cơ Chế Game' },
  { id: 'basic', name: 'Lệnh cơ bản' },
  { id: 'movement', name: 'Di chuyển' },
  { id: 'combat', name: 'Chiến đấu' },
  { id: 'interaction', name: 'Tương tác' },
  { id: 'inventory', name: 'Túi đồ' },
  { id: 'social', name: 'Xã hội' },
  { id: 'guild', name: 'Bang hội' },
  { id: 'party', name: 'Nhóm' },
  { id: 'quest', name: 'Nhiệm vụ' },
  { id: 'advanced', name: 'Nâng cao' },
];

const allCommands: Command[] = [
  // Game Mechanics Guide
  {
    name: 'Hướng Dẫn Chơi Game',
    shortDesc: 'Giới thiệu tổng quan về game',
    description: 'Vong Tích Thành là một game nhập vai văn bản (MUD) nơi bạn khám phá thế giới, chiến đấu với quái vật, hoàn thành nhiệm vụ, và tương tác với người chơi khác. Sử dụng lệnh từ bàn phím để điều khiển nhân vật của bạn. Click vào các nút ở cuối màn hình để mở các menu nhanh.',
    category: 'mechanics',
    usage: ['Gõ lệnh vào ô nhập liệu', 'Nhấn Enter để thực hiện', 'Sử dụng mũi tên lên/xuống để xem lịch sử lệnh'],
    examples: ['look - Xem xung quanh', 'n - Di chuyển về hướng bắc', 'attack Goblin - Tấn công Goblin']
  },
  {
    name: 'Phẩm Chất Vật Phẩm',
    shortDesc: 'Hiểu về độ hiếm của vật phẩm',
    description: 'Vật phẩm trong game có các phẩm chất khác nhau ảnh hưởng đến sức mạnh và giá trị. Phẩm chất cao hơn thường có chỉ số tốt hơn và màu sắc đặc biệt khi hiển thị.',
    category: 'mechanics',
    usage: [
      'Thô (Xám) - Phẩm chất thấp nhất',
      'Thường (Xanh) - Phẩm chất cơ bản',
      'Tốt (Xanh Lá) - Phẩm chất tốt',
      'Hiếm (Xanh Dương) - Phẩm chất hiếm',
      'Sử Thi (Tím) - Phẩm chất cao nhất'
    ],
    examples: ['Kiếm Gỉ [Thô] - Damage: +2', 'Kiếm Thép [Tốt] - Damage: +8, Crit: +2%']
  },
  {
    name: 'Hệ Thống Trang Bị',
    shortDesc: 'Cách trang bị và nâng cấp đồ',
    description: 'Nhân vật có thể trang bị vũ khí và giáp để tăng sức mạnh. Mỗi món đồ có các chỉ số như Damage (Sát thương), Defense (Phòng thủ), Crit (Chí mạng), Lifesteal (Hút máu), và Dodge (Né tránh). Click vào [Nhân Vật] ở menu dưới để xem trang bị hiện tại.',
    category: 'mechanics',
    usage: [
      'equip [tên đồ] - Trang bị vật phẩm',
      'Mở menu [Nhân Vật] để xem chi tiết',
      'Click vào item trong túi đồ để trang bị nhanh'
    ],
    examples: ['equip Kiếm Thép', 'equip Áo Giáp Sắt']
  },
  {
    name: 'Set Đồ (Equipment Sets)',
    shortDesc: 'Bonus khi mặc cùng bộ',
    description: 'Khi trang bị nhiều món đồ cùng một bộ (set), bạn sẽ nhận được bonus đặc biệt. Ví dụ: Set Chiến Binh (2 món: +10 HP, 4 món: +15 Damage). Càng nhiều món trong set, bonus càng mạnh!',
    category: 'mechanics',
    usage: [
      'Thu thập các món đồ cùng tên set',
      'Trang bị ít nhất 2 món để kích hoạt bonus',
      'Xem bonus đang có ở menu [Nhân Vật]'
    ],
    examples: ['Set Chiến Binh: Mũ Chiến Binh + Giáp Chiến Binh + Găng Chiến Binh']
  },
  {
    name: 'Hệ Thống Chế Tạo',
    shortDesc: 'Tạo vật phẩm từ nguyên liệu',
    description: 'Thu thập công thức chế tạo từ quái vật hoặc NPC. Dùng nguyên liệu để chế tạo vật phẩm mới. Click nút [Chế Tạo] ở menu dưới để mở giao diện chế tạo.',
    category: 'mechanics',
    usage: [
      'Thu thập [Công Thức] từ rơi hoặc mua',
      'Mở menu [Chế Tạo]',
      'Chọn công thức và nhấn [CHẾ TẠO]',
      'Cần đủ nguyên liệu mới chế tạo được'
    ],
    examples: ['Công Thức: Bình Máu Lớn = 2x Bình Máu Nhỏ + 1x Thảo Dược']
  },
  {
    name: 'Chỉ Số Nhân Vật',
    shortDesc: 'Hiểu các chỉ số quan trọng',
    description: 'Nhân vật có nhiều chỉ số ảnh hưởng đến chiến đấu. HP (Máu), Damage (Sát thương cơ bản), Defense (Giảm sát thương nhận), Crit (% Chí mạng gây x2 sát thương), Lifesteal (% Hồi máu khi đánh), Dodge (% Né đòn).',
    category: 'mechanics',
    usage: [
      'HP: Máu của bạn, về 0 = chết',
      'Damage: Sát thương mỗi đòn đánh',
      'Defense: Giảm sát thương nhận vào',
      'Crit: % Đánh chí mạng (x2 damage)',
      'Lifesteal: % Hồi máu khi tấn công',
      'Dodge: % Né tránh đòn tấn công'
    ],
    examples: ['Damage 20 + Crit 10% = Trung bình 22 sát thương']
  },
  {
    name: 'Hệ Thống Kinh Tế',
    shortDesc: 'Kiếm và sử dụng tiền',
    description: 'Có 2 loại tiền: Gold (Vàng - kiếm từ quái và bán đồ) và Premium Currency (Kim Cương - mua bằng tiền thật). Dùng vàng để mua đồ từ NPC, sửa chữa, và giao dịch với người chơi.',
    category: 'mechanics',
    usage: [
      'Đánh quái để kiếm vàng',
      'Bán đồ không cần cho NPC (50% giá trị)',
      'Mua đồ từ thương nhân',
      'Dùng Chợ Đấu Giá để giao dịch với người chơi'
    ],
    examples: ['buy Bình Máu Nhỏ', 'sell Đuôi Chuột', 'Giá bán = 50% giá mua']
  },
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
  },
  {
    name: 'skills',
    shortDesc: 'Xem kỹ năng',
    description: 'Hiển thị danh sách kỹ năng và phân bổ điểm kỹ năng',
    category: 'advanced',
    aliases: ['sk'],
    usage: ['skills'],
    examples: ['skills', 'sk']
  },
  {
    name: 'talents',
    shortDesc: 'Xem thiên phú',
    description: 'Hiển thị cây thiên phú và phân bổ điểm thiên phú',
    category: 'advanced',
    aliases: ['thienphu'],
    usage: ['talents'],
    examples: ['talents', 'thienphu']
  },
  {
    name: 'goto',
    shortDesc: 'Dịch chuyển nhanh',
    description: 'Dịch chuyển nhanh đến một địa điểm đã biết',
    category: 'movement',
    usage: ['goto [tên địa điểm]'],
    examples: ['goto Quảng Trường Trung Tâm', 'goto Khu Rừng']
  },
  {
    name: 'party',
    shortDesc: 'Quản lý nhóm',
    description: 'Mời người chơi vào nhóm, chấp nhận lời mời, hoặc rời khỏi nhóm',
    category: 'party',
    aliases: ['p', 'moi', 'roi'],
    usage: [
      'party invite [tên người chơi] - Mời vào nhóm',
      'party accept - Chấp nhận lời mời',
      'party decline - Từ chối lời mời',
      'party leave - Rời khỏi nhóm',
      'party kick [tên người chơi] - Đuổi khỏi nhóm (chỉ trưởng nhóm)',
      'party promote [tên người chơi] - Chuyển trưởng nhóm',
      'party loot [free-for-all|round-robin|leader-only] - Đặt quy tắc nhặt đồ'
    ],
    examples: ['party invite John', 'party accept', 'party leave', 'party loot round-robin']
  },
  {
    name: 'guild',
    shortDesc: 'Quản lý bang hội',
    description: 'Tương tác với hệ thống bang hội',
    category: 'guild',
    aliases: ['g'],
    usage: [
      'guild deposit [số vàng] - Gửi vàng vào kho bang',
      'guild withdraw [số vàng] - Rút vàng từ kho bang'
    ],
    examples: ['guild deposit 1000', 'guild withdraw 500']
  },
  {
    name: 'world',
    shortDesc: 'Chat toàn server',
    description: 'Gửi tin nhắn đến tất cả người chơi trên server',
    category: 'social',
    aliases: ['w'],
    usage: ['world [tin nhắn]'],
    examples: ['world Có ai muốn đi đánh boss không?', 'w Xin chào mọi người!']
  },
  {
    name: 'trade',
    shortDesc: 'Giao dịch với người chơi',
    description: 'Mở giao dịch trực tiếp với người chơi khác để trao đổi vật phẩm và vàng',
    category: 'social',
    usage: [
      'trade invite [tên người chơi] - Mời giao dịch',
      'trade accept - Chấp nhận giao dịch',
      'trade decline - Từ chối giao dịch',
      'trade add [vật phẩm] - Thêm vật phẩm vào giao dịch',
      'trade gold [số vàng] - Thêm vàng vào giao dịch',
      'trade lock - Khóa giao dịch',
      'trade confirm - Xác nhận giao dịch',
      'trade cancel - Hủy giao dịch'
    ],
    examples: ['trade invite John', 'trade add Kiếm Thép', 'trade gold 100', 'trade confirm']
  },
  {
    name: 'pvp',
    shortDesc: 'Chiến đấu PvP',
    description: 'Thách đấu người chơi khác (đang phát triển)',
    category: 'combat',
    usage: ['pvp [tên người chơi]'],
    examples: ['pvp John']
  },
  {
    name: 'alias',
    shortDesc: 'Tạo lệnh tắt',
    description: 'Tạo lệnh tắt tùy chỉnh cho các lệnh thường dùng',
    category: 'advanced',
    usage: [
      'alias add [tên tắt] [lệnh] - Tạo lệnh tắt mới',
      'alias remove [tên tắt] - Xóa lệnh tắt',
      'alias list - Xem danh sách lệnh tắt'
    ],
    examples: ['alias add atk attack Goblin', 'alias remove atk', 'alias list']
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

/* Mobile responsiveness */
@media (max-width: 768px) {
  .help-content {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto 1fr;
  }

  .categories-sidebar {
    border-right: none;
    border-bottom: 1px solid var(--text-dim);
    padding-right: 0;
    padding-bottom: 1rem;
    overflow-y: visible;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .category-item {
    display: inline-block;
    border: 1px solid var(--text-dim);
    border-radius: 4px;
    padding: 0.25rem 0.5rem;
    margin-bottom: 0;
  }

  .commands-list {
    border-right: none;
    border-bottom: 1px solid var(--text-dim);
    padding-right: 0;
    padding-bottom: 1rem;
    max-height: 200px;
  }

  .command-detail {
    padding-left: 0;
    padding-top: 1rem;
  }

  .search-input {
    font-size: 16px;
  }
}
</style>
