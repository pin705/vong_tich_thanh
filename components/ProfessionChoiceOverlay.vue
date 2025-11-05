<template>
  <FullscreenOverlay :isOpen="isOpen" @close="$emit('close')" size="large" title="Chọn Nghề Nghiệp">
    <div class="profession-choice-container">
      <!-- Header -->
      <div class="profession-header">
        <h2>--- CHỌN NGHỀ NGHIỆP ---</h2>
        <p class="profession-subtitle">Chọn một nghề nghiệp để bắt đầu hành trình của bạn!</p>
      </div>

      <!-- Professions Grid -->
      <div class="professions-grid">
        <div
          v-for="profession in professions"
          :key="profession.id"
          :class="['profession-card', { selected: selectedProfession === profession.id }]"
          @click="selectProfession(profession.id)"
        >
          <div class="profession-icon">{{ profession.icon }}</div>
          <div class="profession-name">{{ profession.name }}</div>
          <div class="profession-description">{{ profession.description }}</div>
          <div class="profession-bonuses">
            <div class="bonus-title">Thưởng ban đầu:</div>
            <div v-for="bonus in profession.bonuses" :key="bonus" class="bonus-item">
              • {{ bonus }}
            </div>
          </div>
        </div>
      </div>

      <!-- Profession Detail -->
      <div v-if="selectedProfessionData" class="profession-detail">
        <div class="detail-header">{{ selectedProfessionData.name }}</div>
        <div class="detail-body">
          <p>{{ selectedProfessionData.fullDescription }}</p>
          
          <div class="detail-section">
            <h4>Kỹ năng nghề nghiệp:</h4>
            <div v-for="skill in selectedProfessionData.skills" :key="skill" class="detail-item">
              • {{ skill }}
            </div>
          </div>

          <div class="detail-section">
            <h4>Phần thưởng khởi đầu:</h4>
            <div v-for="reward in selectedProfessionData.startingRewards" :key="reward" class="detail-item reward">
              ✓ {{ reward }}
            </div>
          </div>

          <div class="detail-actions">
            <button
              class="action-button confirm"
              @click="confirmChoice"
            >
              [✓] XÁC NHẬN CHỌN NGHỀ
            </button>
            <button
              class="action-button cancel"
              @click="selectedProfession = null"
            >
              [←] QUAY LẠI
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="profession-footer">
        <div class="warning">⚠️ Lưu ý: Bạn chỉ có thể chọn nghề nghiệp một lần duy nhất!</div>
      </div>
    </div>
  </FullscreenOverlay>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import FullscreenOverlay from './FullscreenOverlay.vue';

interface Profession {
  id: string;
  name: string;
  icon: string;
  description: string;
  fullDescription: string;
  bonuses: string[];
  skills: string[];
  startingRewards: string[];
}

interface Props {
  isOpen: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(['close', 'chooseProfession']);

const selectedProfession = ref<string | null>(null);

const professions: Profession[] = [
  {
    id: 'blacksmith',
    name: 'Thợ Rèn',
    icon: '⚒️',
    description: 'Chuyên chế tạo vũ khí và giáp, sửa chữa trang bị.',
    fullDescription: 'Thợ Rèn là những người thành thạo nghệ thuật rèn kim loại. Họ có thể chế tạo vũ khí và giáp mạnh mẽ, cũng như sửa chữa trang bị hư hỏng. Đây là nghề không thể thiếu trong thế giới đầy nguy hiểm này.',
    bonuses: ['+5 Defense', '+10% Repair efficiency'],
    skills: ['Rèn vũ khí', 'Rèn giáp', 'Sửa chữa trang bị'],
    startingRewards: ['Búa rèn bạc', 'Găng tay da', 'Công thức: Kiếm sắt']
  },
  {
    id: 'alchemist',
    name: 'Nhà Giả Kim',
    icon: '🧪',
    description: 'Pha chế thuốc, độc dược và các loại potion.',
    fullDescription: 'Nhà Giả Kim nghiên cứu và pha chế các loại thuốc từ nguyên liệu thiên nhiên. Họ có thể tạo ra các loại potion hồi máu, hồi mana, và thậm chí cả độc dược nguy hiểm.',
    bonuses: ['+20 HP', '+2 Bình máu nhỏ'],
    skills: ['Pha chế potion', 'Tạo độc dược', 'Chiết xuất tinh chất'],
    startingRewards: ['Bộ dụng cụ giả kim', 'Bình máu trung', 'Công thức: Bình máu lớn']
  },
  {
    id: 'enchanter',
    name: 'Phù Phép Sư',
    icon: '✨',
    description: 'Phù phép trang bị, tạo ma thuật và bùa chú.',
    fullDescription: 'Phù Phép Sư sử dụng ma pháp cổ xưa để tăng cường sức mạnh của vật phẩm. Họ có thể thêm các thuộc tính đặc biệt vào vũ khí và giáp, biến chúng thành những vật phẩm huyền thoại.',
    bonuses: ['+10 MP', '+5% Magic damage'],
    skills: ['Phù phép vũ khí', 'Phù phép giáp', 'Tạo scroll phép thuật'],
    startingRewards: ['Gậy phép sư', 'Đá mana', 'Công thức: Scroll lửa']
  },
  {
    id: 'hunter',
    name: 'Thợ Săn',
    icon: '🏹',
    description: 'Săn bắn, thu thập da thú và nguyên liệu từ quái vật.',
    fullDescription: 'Thợ Săn là những chuyên gia trong việc săn bắt quái vật. Họ biết cách lấy nguyên liệu quý hiếm từ sinh vật và có khả năng phát hiện điểm yếu của kẻ thù.',
    bonuses: ['+8 Damage', '+10% Drop rate'],
    skills: ['Lấy da thú', 'Săn bắt', 'Phát hiện điểm yếu'],
    startingRewards: ['Dao săn', 'Bẫy săn', 'Túi da lớn']
  },
  {
    id: 'miner',
    name: 'Thợ Mỏ',
    icon: '⛏️',
    description: 'Khai thác khoáng sản, đá quý và tài nguyên.',
    fullDescription: 'Thợ Mỏ dành cả cuộc đời để khai thác khoáng sản từ lòng đất. Họ có thể tìm thấy những tài nguyên quý hiếm và biết cách phát hiện các mạch khoáng.',
    bonuses: ['+15 HP', '+5% Resource yield'],
    skills: ['Khai thác khoáng', 'Tìm mạch quặng', 'Chế tác báu vật'],
    startingRewards: ['Cuốc mỏ thép', 'Mũ mỏ', 'Đèn công ty']
  },
  {
    id: 'herbalist',
    name: 'Thảo Dược Gia',
    icon: '🌿',
    description: 'Thu thập thảo mộc, chế biến dược liệu.',
    fullDescription: 'Thảo Dược Gia hiểu biết sâu rộng về thực vật và cách sử dụng chúng. Họ có thể thu thập và chế biến các loại thảo mộc để tạo ra thuốc chữa bệnh và buff đặc biệt.',
    bonuses: ['+10 HP', '+10 MP', '+5% Herb yield'],
    skills: ['Thu thập thảo mộc', 'Chế biến dược liệu', 'Nhận diện thảo mộc'],
    startingRewards: ['Liềm thu hoạch', 'Túi thảo mộc', 'Cẩm nang thảo dược']
  }
];

const selectedProfessionData = computed(() => {
  if (!selectedProfession.value) return null;
  return professions.find(p => p.id === selectedProfession.value);
});

function selectProfession(id: string) {
  selectedProfession.value = id;
}

function confirmChoice() {
  if (selectedProfession.value) {
    emit('chooseProfession', selectedProfession.value);
    emit('close');
  }
}
</script>

<style scoped>
.profession-choice-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: #00ff00;
  font-family: 'VT323', 'Source Code Pro', monospace;
}

.profession-header {
  padding: 1rem;
  border-bottom: 1px solid #008800;
  text-align: center;
}

.profession-header h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: #00ff00;
}

.profession-subtitle {
  font-size: 1rem;
  color: #ffb000;
}

.professions-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  padding: 1rem;
  overflow-y: auto;
}

.profession-card {
  border: 1px solid #008800;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  background: rgba(0, 136, 0, 0.05);
}

.profession-card:hover {
  background: rgba(0, 255, 0, 0.1);
  border-color: #00ff00;
  transform: translateY(-2px);
}

.profession-card.selected {
  border-color: #ffb000;
  background: rgba(255, 176, 0, 0.1);
  border-width: 2px;
}

.profession-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.profession-name {
  font-size: 1.2rem;
  font-weight: bold;
  color: #ffb000;
  margin-bottom: 0.5rem;
}

.profession-description {
  font-size: 0.9rem;
  color: #00aaaa;
  margin-bottom: 0.75rem;
  line-height: 1.4;
}

.profession-bonuses {
  text-align: left;
  border-top: 1px solid #008800;
  padding-top: 0.5rem;
}

.bonus-title {
  font-size: 0.85rem;
  color: #ffb000;
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.bonus-item {
  font-size: 0.85rem;
  color: #00ff00;
  margin-bottom: 0.15rem;
}

.profession-detail {
  position: fixed;
  right: 1rem;
  top: 8rem;
  width: 28rem;
  border: 2px solid #00ff00;
  background: #000000;
  padding: 1rem;
  max-height: 65%;
  overflow-y: auto;
  z-index: 10;
}

.detail-header {
  font-size: 1.4rem;
  font-weight: bold;
  color: #ffb000;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #008800;
}

.detail-body p {
  margin-bottom: 1rem;
  line-height: 1.5;
  color: #00aaaa;
}

.detail-section {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: rgba(0, 136, 0, 0.1);
  border: 1px solid #008800;
}

.detail-section h4 {
  color: #ffb000;
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.detail-item {
  color: #00ff00;
  margin-bottom: 0.25rem;
  padding-left: 0.5rem;
}

.detail-item.reward {
  color: #ffd700;
}

.detail-actions {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #008800;
  display: flex;
  gap: 0.5rem;
  flex-direction: column;
}

.action-button {
  width: 100%;
  background: #008800;
  border: 1px solid #00ff00;
  color: #000000;
  padding: 0.75rem;
  cursor: pointer;
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 1rem;
  font-weight: bold;
  transition: all 0.2s;
}

.action-button:hover {
  background: #00ff00;
  transform: scale(1.02);
}

.action-button.confirm {
  background: #ffb000;
  border-color: #ffd700;
}

.action-button.confirm:hover {
  background: #ffd700;
}

.action-button.cancel {
  background: #880000;
  border-color: #ff0000;
}

.action-button.cancel:hover {
  background: #ff0000;
}

.profession-footer {
  padding: 1rem;
  border-top: 1px solid #008800;
  text-align: center;
}

.warning {
  color: #ff8800;
  font-weight: bold;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .profession-header h2 {
    font-size: 1.2rem;
  }

  .profession-subtitle {
    font-size: 0.9rem;
  }

  .professions-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
    padding: 0.75rem;
  }

  .profession-card {
    padding: 0.75rem;
  }

  .profession-icon {
    font-size: 2.5rem;
  }

  .profession-name {
    font-size: 1.1rem;
  }

  .profession-description {
    font-size: 0.85rem;
  }

  .bonus-title,
  .bonus-item {
    font-size: 0.8rem;
  }

  .profession-detail {
    position: fixed;
    left: 0.5rem;
    right: 0.5rem;
    top: auto;
    bottom: 0.5rem;
    width: auto;
    max-height: 55vh;
  }

  .detail-header {
    font-size: 1.2rem;
  }

  .detail-body p {
    font-size: 0.9rem;
  }

  .detail-section {
    padding: 0.5rem;
  }

  .detail-section h4 {
    font-size: 0.95rem;
  }

  .detail-item {
    font-size: 0.85rem;
  }

  .action-button {
    padding: 0.6rem;
    font-size: 0.9rem;
  }

  .profession-footer {
    padding: 0.75rem;
  }

  .warning {
    font-size: 0.85rem;
  }
}
</style>
