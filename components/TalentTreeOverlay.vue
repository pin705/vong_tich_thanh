<template>
  <FullscreenOverlay :isOpen="isOpen" @close="$emit('close')">
    <div class="talent-tree-container">
      <!-- Header -->
      <div class="talent-tree-header">
        <h2>--- BẢNG THIÊN PHÚ: {{ getClassName() }} ---</h2>
        <div class="talent-points">Điểm còn lại: {{ talentPoints }}</div>
      </div>

      <!-- Branches -->
      <div class="talent-branches">
        <div 
          v-for="branch in branches" 
          :key="branch.id"
          class="talent-branch"
        >
          <div class="branch-header">
            <div class="branch-name">[{{ branch.name }}]</div>
            <div class="branch-description">{{ branch.description }}</div>
          </div>

          <div class="talents-list">
            <div 
              v-for="talent in branch.talents" 
              :key="talent.id"
              :class="['talent-node', getTalentClass(talent)]"
              @click="selectTalent(talent)"
            >
              <div class="talent-tier">(Cấp {{ talent.tier }})</div>
              <div class="talent-name">
                [{{ talent.name }}] ({{ getCurrentRank(talent.id) }}/{{ talent.maxRank }})
              </div>
              <div v-if="talent.tier > 1" class="talent-requirement">
                (Yêu cầu: {{ talent.pointsInBranchRequired }} điểm)
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Talent Detail Panel -->
      <div v-if="selectedTalent" class="talent-detail">
        <div class="talent-detail-header">{{ selectedTalent.name }}</div>
        <div class="talent-detail-body">
          <p>{{ selectedTalent.description }}</p>
          
          <div class="talent-info">
            <div><strong>Nhánh:</strong> {{ getBranchName(selectedTalent.branch) }}</div>
            <div><strong>Cấp:</strong> {{ getCurrentRank(selectedTalent.id) }} / {{ selectedTalent.maxRank }}</div>
            <div v-if="selectedTalent.pointsInBranchRequired > 0">
              <strong>Yêu cầu điểm trong nhánh:</strong> {{ selectedTalent.pointsInBranchRequired }}
            </div>
            <div><strong>Yêu cầu cấp độ:</strong> {{ selectedTalent.levelRequired }}</div>
          </div>

          <div class="talent-requirements">
            <div v-if="!canUnlock(selectedTalent)" class="error-message">
              {{ getUnlockError(selectedTalent) }}
            </div>
          </div>

          <div class="talent-actions">
            <button 
              v-if="canAllocate(selectedTalent)"
              class="action-button allocate"
              @click="allocatePoint(selectedTalent)"
            >
              [+] CỘNG ĐIỂM
            </button>
            <button 
              class="action-button details"
              @click="showDetails = !showDetails"
            >
              [?] {{ showDetails ? 'ẨN' : 'XEM' }} CHI TIẾT
            </button>
          </div>

          <div v-if="showDetails" class="talent-effects">
            <h4>Hiệu ứng:</h4>
            <div v-for="(value, key) in selectedTalent.effects" :key="key" class="effect-item">
              {{ formatEffect(key, value) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="talent-tree-footer">
        <div class="hint">Nhấn ESC để đóng | Tìm NPC "Thầy Tẩy Điểm" để reset thiên phú</div>
      </div>
    </div>
  </FullscreenOverlay>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import FullscreenOverlay from './FullscreenOverlay.vue';

interface TalentNode {
  id: string;
  name: string;
  description: string;
  branch: string;
  tier: number;
  maxRank: number;
  pointsInBranchRequired: number;
  levelRequired: number;
  prerequisiteTalents?: string[];
  effects: Record<string, any>;
  grantsSkill?: string;
}

interface TalentBranch {
  id: string;
  name: string;
  description: string;
  talents: TalentNode[];
}

interface Props {
  isOpen: boolean;
  playerClass: string;
  playerLevel: number;
  talentPoints: number;
  branches: TalentBranch[];
  allocatedTalents: Record<string, number>; // talentId -> rank
}

const props = defineProps<Props>();
const emit = defineEmits(['close', 'allocateTalent']);

const selectedTalent = ref<TalentNode | null>(null);
const showDetails = ref(false);

function getClassName(): string {
  const classNames: Record<string, string> = {
    mutant_warrior: 'CHIẾN BINH BIẾN DỊ',
    rune_historian: 'SỬ GIA CỔ NGỮ',
    stalker: 'KẺ LÙNG SỤC',
    scrap_engineer: 'KỸ SƯ PHẾ LIỆU',
  };
  return classNames[props.playerClass] || 'CHƯA RÕ';
}

function getBranchName(branchId: string): string {
  const branch = props.branches.find(b => b.id === branchId);
  return branch ? branch.name : branchId;
}

function getCurrentRank(talentId: string): number {
  return props.allocatedTalents[talentId] || 0;
}

function getPointsInBranch(branchId: string): number {
  let total = 0;
  const branch = props.branches.find(b => b.id === branchId);
  if (branch) {
    for (const talent of branch.talents) {
      total += getCurrentRank(talent.id);
    }
  }
  return total;
}

function getTalentClass(talent: TalentNode): string {
  const currentRank = getCurrentRank(talent.id);
  if (currentRank > 0) return 'allocated';
  if (canUnlock(talent)) return 'available';
  return 'locked';
}

function canUnlock(talent: TalentNode): boolean {
  // Check level requirement
  if (props.playerLevel < talent.levelRequired) return false;
  
  // Check points in branch requirement
  const pointsInBranch = getPointsInBranch(talent.branch);
  if (pointsInBranch < talent.pointsInBranchRequired) return false;
  
  // Check prerequisite talents
  if (talent.prerequisiteTalents && talent.prerequisiteTalents.length > 0) {
    for (const prereqId of talent.prerequisiteTalents) {
      const prereq = findTalent(prereqId);
      if (prereq && getCurrentRank(prereqId) < prereq.maxRank) {
        return false;
      }
    }
  }
  
  return true;
}

function canAllocate(talent: TalentNode): boolean {
  if (props.talentPoints <= 0) return false;
  if (!canUnlock(talent)) return false;
  const currentRank = getCurrentRank(talent.id);
  return currentRank < talent.maxRank;
}

function getUnlockError(talent: TalentNode): string {
  if (props.playerLevel < talent.levelRequired) {
    return `Yêu cầu cấp độ ${talent.levelRequired}`;
  }
  
  const pointsInBranch = getPointsInBranch(talent.branch);
  if (pointsInBranch < talent.pointsInBranchRequired) {
    const branchName = getBranchName(talent.branch);
    return `Yêu cầu ${talent.pointsInBranchRequired} điểm ở Nhánh ${branchName}`;
  }
  
  if (talent.prerequisiteTalents && talent.prerequisiteTalents.length > 0) {
    for (const prereqId of talent.prerequisiteTalents) {
      const prereq = findTalent(prereqId);
      if (prereq && getCurrentRank(prereqId) < prereq.maxRank) {
        return `Yêu cầu hoàn thành: ${prereq.name}`;
      }
    }
  }
  
  const currentRank = getCurrentRank(talent.id);
  if (currentRank >= talent.maxRank) {
    return 'Đã đạt cấp tối đa';
  }
  
  return '';
}

function findTalent(talentId: string): TalentNode | null {
  for (const branch of props.branches) {
    const talent = branch.talents.find(t => t.id === talentId);
    if (talent) return talent;
  }
  return null;
}

function selectTalent(talent: TalentNode) {
  selectedTalent.value = talent;
  showDetails.value = false;
}

function allocatePoint(talent: TalentNode) {
  if (canAllocate(talent)) {
    emit('allocateTalent', talent.id);
  }
}

function formatEffect(key: string, value: any): string {
  const effectNames: Record<string, string> = {
    gunDamage: 'Sát thương súng',
    turretHp: 'HP Trụ',
    grenadeDamage: 'Sát thương lựu đạn',
    rageDamage: 'Sát thương Nộ',
    armor: 'Giáp',
    fearDuration: 'Thời gian hù dọa',
  };
  const name = effectNames[key] || key;
  return `+${value}% ${name}`;
}
</script>

<style scoped>
.talent-tree-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: #00ff00;
  font-family: 'VT323', 'Source Code Pro', monospace;
}

.talent-tree-header {
  padding: 1rem;
  border-bottom: 1px solid #008800;
  text-align: center;
}

.talent-tree-header h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: #00ff00;
}

.talent-points {
  font-size: 1.2rem;
  color: #ffb000;
  font-weight: bold;
}

.talent-branches {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  padding: 1rem;
  overflow-y: auto;
}

.talent-branch {
  border: 1px solid #008800;
  padding: 1rem;
}

.branch-header {
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #008800;
}

.branch-name {
  font-size: 1.2rem;
  font-weight: bold;
  color: #ffb000;
  margin-bottom: 0.25rem;
}

.branch-description {
  font-size: 0.9rem;
  color: #00aaaa;
}

.talents-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.talent-node {
  border: 1px solid #008800;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.talent-node:hover {
  background: rgba(0, 255, 0, 0.1);
  border-color: #00ff00;
}

.talent-node.locked {
  opacity: 0.5;
  border-color: #444444;
  color: #666666;
}

.talent-node.available {
  border-color: #00ff00;
  background: rgba(0, 255, 0, 0.05);
}

.talent-node.allocated {
  border-color: #ffb000;
  background: rgba(255, 176, 0, 0.1);
  color: #ffb000;
}

.talent-tier {
  font-size: 0.8rem;
  color: #00aaaa;
  margin-bottom: 0.25rem;
}

.talent-name {
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.talent-requirement {
  font-size: 0.8rem;
  color: #888888;
}

.talent-detail {
  position: absolute;
  right: 1rem;
  top: 5rem;
  width: 25rem;
  border: 2px solid #00ff00;
  background: #000000;
  padding: 1rem;
  max-height: 70%;
  overflow-y: auto;
}

.talent-detail-header {
  font-size: 1.3rem;
  font-weight: bold;
  color: #ffb000;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #008800;
}

.talent-detail-body p {
  margin-bottom: 1rem;
  line-height: 1.5;
}

.talent-info {
  background: rgba(0, 136, 0, 0.2);
  padding: 1rem;
  margin-bottom: 1rem;
}

.talent-info > div {
  margin-bottom: 0.5rem;
}

.talent-info strong {
  color: #ffb000;
}

.talent-requirements {
  margin-bottom: 1rem;
}

.error-message {
  color: #ff0000;
  font-weight: bold;
  padding: 0.5rem;
  border: 1px solid #ff0000;
  background: rgba(255, 0, 0, 0.1);
}

.talent-actions {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.action-button {
  flex: 1;
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

.action-button:disabled {
  background: #333333;
  color: #666666;
  border-color: #444444;
  cursor: not-allowed;
}

.action-button.allocate {
  background: #ffb000;
  border-color: #ffd700;
}

.action-button.allocate:hover {
  background: #ffd700;
}

.talent-effects {
  background: rgba(0, 136, 0, 0.2);
  padding: 1rem;
  border-top: 1px solid #008800;
}

.talent-effects h4 {
  color: #ffb000;
  margin-bottom: 0.5rem;
}

.effect-item {
  margin-bottom: 0.25rem;
  padding-left: 1rem;
}

.talent-tree-footer {
  padding: 1rem;
  border-top: 1px solid #008800;
  text-align: center;
}

.hint {
  color: #008800;
  font-size: 0.9rem;
}
</style>
