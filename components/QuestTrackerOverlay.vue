<template>
  <FullscreenOverlay :isOpen="isOpen" @close="$emit('close')" size="large" title="Nhiệm Vụ">
    <div class="quest-tracker-container">
      <!-- Header -->
      <div class="quest-header">
        <h2>--- NHIỆM VỤ ---</h2>
        <div class="quest-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="['tab-btn', { active: activeTab === tab.id }]"
            @click="activeTab = tab.id"
          >
            {{ tab.label }} ({{ getQuestCount(tab.id) }})
          </button>
        </div>
      </div>

      <!-- Quest List -->
      <div class="quest-content">
        <div class="quest-list">
          <div v-if="filteredQuests.length === 0" class="empty-message">
            {{ getEmptyMessage() }}
          </div>
          <div
            v-for="quest in filteredQuests"
            :key="quest.id"
            :class="['quest-item', { selected: selectedQuest?.id === quest.id, completed: quest.status === 'completed' }]"
            @click="selectQuest(quest)"
          >
            <div class="quest-item-header">
              <span class="quest-type-badge" :class="`type-${quest.type}`">
                {{ getQuestTypeName(quest.type) }}
              </span>
              <span class="quest-name">{{ quest.name }}</span>
            </div>
            <div class="quest-item-progress">
              <div v-if="quest.status === 'active'" class="progress-text">
                {{ getQuestProgress(quest) }}
              </div>
              <div v-else-if="quest.status === 'completed'" class="completed-badge">
                ✓ Hoàn thành
              </div>
            </div>
          </div>
        </div>

        <!-- Quest Detail Panel -->
        <div v-if="selectedQuest" class="quest-detail">
          <div class="detail-header">
            <div class="quest-title">{{ selectedQuest.name }}</div>
            <div class="quest-giver">Người giao: {{ selectedQuest.questGiver }}</div>
          </div>

          <div class="detail-body">
            <p class="quest-description">{{ selectedQuest.description }}</p>

            <!-- Objectives -->
            <div class="detail-section">
              <h4>Mục tiêu:</h4>
              <div
                v-for="(objective, index) in selectedQuest.objectives"
                :key="index"
                :class="['objective-item', { completed: isObjectiveCompleted(objective) }]"
              >
                <span class="objective-checkbox">{{ isObjectiveCompleted(objective) ? '☑' : '☐' }}</span>
                {{ getObjectiveText(objective) }}
                <span class="objective-progress">({{ objective.progress }}/{{ objective.count }})</span>
              </div>
            </div>

            <!-- Rewards -->
            <div class="detail-section rewards-section">
              <h4>Phần thưởng:</h4>
              <div v-if="selectedQuest.rewards.exp" class="reward-item">
                ✦ {{ selectedQuest.rewards.exp }} Kinh nghiệm
              </div>
              <div v-if="selectedQuest.rewards.gold" class="reward-item">
                ✦ {{ selectedQuest.rewards.gold }} Vàng
              </div>
              <div v-if="selectedQuest.rewards.items && selectedQuest.rewards.items.length > 0" class="reward-item">
                ✦ {{ selectedQuest.rewards.items.length }} Vật phẩm
              </div>
            </div>

            <!-- Requirements -->
            <div v-if="hasRequirements(selectedQuest)" class="detail-section requirements-section">
              <h4>Yêu cầu:</h4>
              <div v-if="selectedQuest.levelRequirement && selectedQuest.levelRequirement > 1" class="requirement-item">
                • Cấp độ: {{ selectedQuest.levelRequirement }}
              </div>
              <div v-if="selectedQuest.professionRequirement" class="requirement-item">
                • Nghề nghiệp: {{ getProfessionName(selectedQuest.professionRequirement) }}
              </div>
            </div>

            <!-- Actions -->
            <div class="detail-actions">
              <button
                v-if="selectedQuest.status === 'available'"
                class="action-button accept"
                @click="acceptQuest(selectedQuest)"
              >
                [+] NHẬN NHIỆM VỤ
              </button>
              <button
                v-if="selectedQuest.status === 'active' && isQuestComplete(selectedQuest)"
                class="action-button complete"
                @click="completeQuest(selectedQuest)"
              >
                [✓] HOÀN THÀNH NHIỆM VỤ
              </button>
              <button
                v-else-if="selectedQuest.status === 'active'"
                class="action-button track"
                @click="trackQuest(selectedQuest)"
              >
                [*] THEO DÕI NHIỆM VỤ
              </button>
              <button
                v-if="selectedQuest.status === 'completed' && selectedQuest.isRepeatable"
                class="action-button repeat"
                @click="repeatQuest(selectedQuest)"
              >
                [↻] LÀM LẠI NHIỆM VỤ
              </button>
              <button
                v-if="selectedQuest.status === 'active'"
                class="action-button abandon"
                @click="abandonQuest(selectedQuest)"
              >
                [✗] HỦY BỎ NHIỆM VỤ
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="quest-footer">
        <div class="hint">💡 Nhấn ESC để đóng | Nhấp vào nhiệm vụ để xem chi tiết</div>
      </div>
    </div>
  </FullscreenOverlay>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import FullscreenOverlay from './FullscreenOverlay.vue';

interface QuestObjective {
  type: 'kill' | 'talk' | 'collect' | 'visit' | 'profession';
  target: string;
  count: number;
  progress: number;
}

interface Quest {
  id: string;
  name: string;
  description: string;
  type: 'main' | 'daily' | 'side';
  questGiver: string;
  objectives: QuestObjective[];
  rewards: {
    exp?: number;
    gold?: number;
    items?: string[];
  };
  status: 'active' | 'completed' | 'available';
  levelRequirement?: number;
  professionRequirement?: string;
  isRepeatable?: boolean;
}

interface Props {
  isOpen: boolean;
  quests: Quest[];
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  quests: () => []
});

const emit = defineEmits(['close', 'acceptQuest', 'completeQuest', 'abandonQuest', 'repeatQuest', 'trackQuest']);

const activeTab = ref<'active' | 'completed' | 'available'>('active');
const selectedQuest = ref<Quest | null>(null);

const tabs: Array<{ id: 'active' | 'completed' | 'available', label: string }> = [
  { id: 'active', label: 'Đang làm' },
  { id: 'available', label: 'Có thể nhận' },
  { id: 'completed', label: 'Hoàn thành' }
];

const filteredQuests = computed(() => {
  return props.quests.filter(q => q.status === activeTab.value);
});

function getQuestCount(tab: string): number {
  return props.quests.filter(q => q.status === tab).length;
}

function getEmptyMessage(): string {
  const messages = {
    active: 'Bạn chưa có nhiệm vụ nào đang làm.',
    available: 'Không có nhiệm vụ nào có thể nhận lúc này.',
    completed: 'Bạn chưa hoàn thành nhiệm vụ nào.'
  };
  return messages[activeTab.value as keyof typeof messages];
}

function getQuestTypeName(type: string): string {
  const names = {
    main: 'Chính',
    daily: 'Hàng ngày',
    side: 'Phụ'
  };
  return names[type as keyof typeof names] || type;
}

function getProfessionName(profession: string): string {
  const names: Record<string, string> = {
    blacksmith: 'Thợ Rèn',
    alchemist: 'Nhà Giả Kim',
    enchanter: 'Phù Phép Sư',
    hunter: 'Thợ Săn',
    miner: 'Thợ Mỏ',
    herbalist: 'Thảo Dược Gia'
  };
  return names[profession] || profession;
}

function getQuestProgress(quest: Quest): string {
  const completed = quest.objectives.filter(o => o.progress >= o.count).length;
  const total = quest.objectives.length;
  return `${completed}/${total} mục tiêu`;
}

function getObjectiveText(objective: QuestObjective): string {
  const types: Record<string, string> = {
    kill: 'Tiêu diệt',
    talk: 'Nói chuyện với',
    collect: 'Thu thập',
    visit: 'Đến',
    profession: 'Chọn nghề nghiệp'
  };
  const action = types[objective.type] || objective.type;
  return `${action} ${objective.target}`;
}

function isObjectiveCompleted(objective: QuestObjective): boolean {
  return objective.progress >= objective.count;
}

function isQuestComplete(quest: Quest): boolean {
  return quest.objectives.every(o => isObjectiveCompleted(o));
}

function hasRequirements(quest: Quest): boolean {
  return (quest.levelRequirement && quest.levelRequirement > 1) || !!quest.professionRequirement;
}

function selectQuest(quest: Quest) {
  selectedQuest.value = quest;
}

function acceptQuest(quest: Quest) {
  emit('acceptQuest', quest.id);
}

function completeQuest(quest: Quest) {
  emit('completeQuest', quest.id);
}

function abandonQuest(quest: Quest) {
  emit('abandonQuest', quest.id);
}

function repeatQuest(quest: Quest) {
  emit('repeatQuest', quest.id);
}

function trackQuest(quest: Quest) {
  emit('trackQuest', quest.id);
}
</script>

<style scoped>
.quest-tracker-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: #00ff00;
  font-family: 'VT323', 'Source Code Pro', monospace;
}

.quest-header {
  padding: 1rem;
  border-bottom: 1px solid #008800;
}

.quest-header h2 {
  font-size: 1.5rem;
  margin-bottom: 0.75rem;
  color: #00ff00;
  text-align: center;
}

.quest-tabs {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.tab-btn {
  background: transparent;
  border: 1px solid #008800;
  color: #008800;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 1rem;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: rgba(0, 136, 0, 0.2);
}

.tab-btn.active {
  background: #008800;
  color: #000000;
  border-color: #00ff00;
}

.quest-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 1rem;
  padding: 1rem;
  overflow: hidden;
}

.quest-list {
  border: 1px solid #008800;
  padding: 0.75rem;
  overflow-y: auto;
}

.empty-message {
  color: #008800;
  font-style: italic;
  text-align: center;
  padding: 2rem 1rem;
}

.quest-item {
  border: 1px solid #008800;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(0, 136, 0, 0.05);
}

.quest-item:hover {
  background: rgba(0, 255, 0, 0.1);
  border-color: #00ff00;
}

.quest-item.selected {
  border-color: #ffb000;
  background: rgba(255, 176, 0, 0.1);
  border-width: 2px;
}

.quest-item.completed {
  opacity: 0.7;
}

.quest-item-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.quest-type-badge {
  padding: 0.2rem 0.5rem;
  font-size: 0.75rem;
  border: 1px solid;
  font-weight: bold;
}

.quest-type-badge.type-main {
  color: #ffd700;
  border-color: #ffd700;
  background: rgba(255, 215, 0, 0.1);
}

.quest-type-badge.type-daily {
  color: #00aaff;
  border-color: #00aaff;
  background: rgba(0, 170, 255, 0.1);
}

.quest-type-badge.type-side {
  color: #888888;
  border-color: #888888;
  background: rgba(136, 136, 136, 0.1);
}

.quest-name {
  color: #00ff00;
  font-weight: bold;
  flex: 1;
}

.quest-item-progress {
  font-size: 0.85rem;
}

.progress-text {
  color: #00aaaa;
}

.completed-badge {
  color: #ffd700;
  font-weight: bold;
}

.quest-detail {
  border: 1px solid #00ff00;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.detail-header {
  padding-bottom: 1rem;
  border-bottom: 1px solid #008800;
  margin-bottom: 1rem;
}

.quest-title {
  font-size: 1.3rem;
  font-weight: bold;
  color: #ffb000;
  margin-bottom: 0.5rem;
}

.quest-giver {
  font-size: 0.9rem;
  color: #00aaaa;
}

.detail-body {
  flex: 1;
}

.quest-description {
  margin-bottom: 1rem;
  line-height: 1.5;
  color: #00ff00;
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

.objective-item {
  color: #00ff00;
  margin-bottom: 0.5rem;
  padding: 0.25rem 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.objective-item.completed {
  color: #00aaaa;
  text-decoration: line-through;
}

.objective-checkbox {
  font-size: 1.2rem;
}

.objective-progress {
  margin-left: auto;
  color: #ffb000;
}

.rewards-section {
  border-color: #ffb000;
  background: rgba(255, 176, 0, 0.05);
}

.reward-item {
  color: #ffd700;
  margin-bottom: 0.25rem;
  padding-left: 0.5rem;
}

.requirements-section {
  border-color: #ff8800;
  background: rgba(255, 136, 0, 0.05);
}

.requirement-item {
  color: #ff8800;
  margin-bottom: 0.25rem;
  padding-left: 0.5rem;
}

.detail-actions {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #008800;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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

.action-button.accept {
  background: #00aa00;
  border-color: #00ff00;
}

.action-button.accept:hover {
  background: #00ff00;
}

.action-button.complete {
  background: #ffb000;
  border-color: #ffd700;
}

.action-button.complete:hover {
  background: #ffd700;
}

.action-button.track {
  background: #0088aa;
  border-color: #00aaff;
}

.action-button.track:hover {
  background: #00aaff;
}

.action-button.repeat {
  background: #8800aa;
  border-color: #aa00ff;
}

.action-button.repeat:hover {
  background: #aa00ff;
}

.action-button.abandon {
  background: #880000;
  border-color: #ff0000;
}

.action-button.abandon:hover {
  background: #ff0000;
}

.quest-footer {
  padding: 1rem;
  border-top: 1px solid #008800;
  text-align: center;
}

.hint {
  color: #008800;
  font-size: 0.9rem;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .quest-header h2 {
    font-size: 1.2rem;
  }

  .quest-tabs {
    flex-wrap: wrap;
  }

  .tab-btn {
    padding: 0.4rem 0.75rem;
    font-size: 0.9rem;
    flex: 1;
    min-width: 0;
  }

  .quest-content {
    grid-template-columns: 1fr;
    gap: 0.75rem;
    padding: 0.75rem;
  }

  .quest-list {
    max-height: 40vh;
  }

  .quest-item {
    padding: 0.6rem;
  }

  .quest-type-badge {
    font-size: 0.7rem;
    padding: 0.15rem 0.4rem;
  }

  .quest-name {
    font-size: 0.95rem;
  }

  .quest-detail {
    max-height: 50vh;
  }

  .quest-title {
    font-size: 1.1rem;
  }

  .quest-giver {
    font-size: 0.85rem;
  }

  .quest-description {
    font-size: 0.9rem;
  }

  .detail-section {
    padding: 0.6rem;
  }

  .detail-section h4 {
    font-size: 0.95rem;
  }

  .objective-item,
  .reward-item,
  .requirement-item {
    font-size: 0.85rem;
  }

  .action-button {
    padding: 0.6rem;
    font-size: 0.9rem;
  }

  .quest-footer {
    padding: 0.75rem;
  }

  .hint {
    font-size: 0.8rem;
  }
}
</style>
