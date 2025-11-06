<template>
  <FullscreenOverlay :isOpen="isOpen" @close="$emit('close')" title="Cấu Hình Kỹ Năng Tự Động">
    <div class="auto-skill-container">
      <!-- Header -->
      <div class="auto-skill-header">
        <h2>CẤU HÌNH KỸ NĂNG TỰ ĐỘNG</h2>
        <div class="info-text">
          Thiết lập kỹ năng sẽ được tự động sử dụng khi điều kiện phù hợp
        </div>
      </div>

      <!-- Content -->
      <div class="auto-skill-content">
        <!-- Available Skills -->
        <div class="skills-panel">
          <h3>KỸ NĂNG CÓ SẴN</h3>
          <div class="skills-list">
            <div v-if="availableSkills.length === 0" class="empty-message">
              Không có kỹ năng
            </div>
            <div 
              v-for="skill in availableSkills" 
              :key="skill._id"
              class="skill-item"
              draggable="true"
              @dragstart="dragStart(skill)"
              @click="selectSkill(skill)"
            >
              <div class="skill-icon">[S]</div>
              <div class="skill-info">
                <div class="skill-name">{{ skill.name }}</div>
                <div class="skill-cost">
                  {{ skill.resourceCost }} {{ getResourceName() }}
                  <span v-if="skill.cooldown > 0"> | {{ skill.cooldown }}s</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Auto-Skill Slots -->
        <div class="auto-slots-panel">
          <h3>SLOT TỰ ĐỘNG (Ưu Tiên Cao → Thấp)</h3>
          <div class="auto-slots">
            <div 
              v-for="(slot, index) in autoSlots" 
              :key="index"
              class="auto-slot"
              @dragover.prevent
              @drop="dropSkill(index)"
            >
              <div v-if="slot.skill" class="slot-content">
                <div class="slot-header">
                  <span class="slot-number">[{{ index + 1 }}]</span>
                  <span class="slot-skill-name">{{ slot.skill.name }}</span>
                  <button class="remove-btn" @click="removeSlot(index)">✕</button>
                </div>
                <div class="slot-conditions">
                  <div class="condition-label">Điều Kiện:</div>
                  <div class="condition-list">
                    <div 
                      v-for="(cond, cidx) in slot.conditions" 
                      :key="cidx"
                      class="condition-item"
                    >
                      {{ formatCondition(cond) }}
                      <button class="remove-condition" @click="removeCondition(index, cidx)">✕</button>
                    </div>
                  </div>
                  <button class="add-condition-btn" @click="openConditionDialog(index)">
                    [+ Thêm Điều Kiện]
                  </button>
                </div>
              </div>
              <div v-else class="slot-empty">
                [Kéo Kỹ Năng Vào Đây]
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Condition Dialog -->
      <div v-if="showConditionDialog" class="condition-dialog">
        <div class="dialog-overlay" @click="closeConditionDialog"></div>
        <div class="dialog-content">
          <h3>THÊM ĐIỀU KIỆN</h3>
          <div class="dialog-body">
            <div class="form-group">
              <label>Loại Điều Kiện:</label>
              <select v-model="newCondition.type">
                <option value="hp_below">HP Dưới %</option>
                <option value="hp_above">HP Trên %</option>
                <option value="resource_below">Tài Nguyên Dưới</option>
                <option value="resource_above">Tài Nguyên Trên</option>
                <option value="in_combat">Trong Chiến Đấu</option>
                <option value="target_hp_below">HP Mục Tiêu Dưới %</option>
              </select>
            </div>
            <div class="form-group">
              <label>Giá Trị:</label>
              <input 
                v-if="needsValueInput" 
                v-model.number="newCondition.value" 
                type="number"
                min="0"
                max="100"
              />
              <select v-else v-model="newCondition.value">
                <option :value="true">Có</option>
                <option :value="false">Không</option>
              </select>
            </div>
          </div>
          <div class="dialog-footer">
            <button class="dialog-btn confirm" @click="addCondition">
              [Xác Nhận]
            </button>
            <button class="dialog-btn cancel" @click="closeConditionDialog">
              [Hủy]
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="auto-skill-footer">
        <button class="save-button" @click="saveConfiguration">
          [Lưu Cấu Hình]
        </button>
        <div class="hint">Nhấn ESC để đóng</div>
      </div>
    </div>
  </FullscreenOverlay>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Skill } from '~/types';
import FullscreenOverlay from './FullscreenOverlay.vue';

interface AutoSkillSlot {
  skill: Skill | null;
  conditions: Array<{ type: string; value: any }>;
}

interface Props {
  isOpen: boolean;
  skills: Skill[];
  playerClass?: string;
  currentConfig?: any[];
}

const props = defineProps<Props>();
const emit = defineEmits(['close', 'save']);

const MAX_SLOTS = 5;
const autoSlots = ref<AutoSkillSlot[]>(
  Array(MAX_SLOTS).fill(null).map(() => ({ skill: null, conditions: [] }))
);

const showConditionDialog = ref(false);
const activeSlotIndex = ref(0);
const newCondition = ref({ type: 'hp_below', value: 50 });
const selectedSkill = ref<Skill | null>(null);

const availableSkills = computed(() => {
  return props.skills.filter(s => s.type === 'active');
});

const needsValueInput = computed(() => {
  return newCondition.value.type !== 'in_combat';
});

function getResourceName(): string {
  const resourceNames: Record<string, string> = {
    mutant_warrior: 'Nộ',
    rune_historian: 'Mana',
    stalker: 'Năng Lượng',
    scrap_engineer: 'Linh Kiện',
  };
  return resourceNames[props.playerClass || ''] || 'Tài Nguyên';
}

function dragStart(skill: Skill) {
  selectedSkill.value = skill;
}

function dropSkill(slotIndex: number) {
  if (selectedSkill.value) {
    autoSlots.value[slotIndex].skill = selectedSkill.value;
    selectedSkill.value = null;
  }
}

function removeSlot(slotIndex: number) {
  autoSlots.value[slotIndex] = { skill: null, conditions: [] };
}

function selectSkill(skill: Skill) {
  selectedSkill.value = skill;
}

function openConditionDialog(slotIndex: number) {
  activeSlotIndex.value = slotIndex;
  showConditionDialog.value = true;
  newCondition.value = { type: 'hp_below', value: 50 };
}

function closeConditionDialog() {
  showConditionDialog.value = false;
}

function addCondition() {
  autoSlots.value[activeSlotIndex.value].conditions.push({
    type: newCondition.value.type,
    value: newCondition.value.value,
  });
  closeConditionDialog();
}

function removeCondition(slotIndex: number, conditionIndex: number) {
  autoSlots.value[slotIndex].conditions.splice(conditionIndex, 1);
}

function formatCondition(cond: { type: string; value: any }): string {
  const labels: Record<string, string> = {
    hp_below: `HP < ${cond.value}%`,
    hp_above: `HP > ${cond.value}%`,
    resource_below: `Tài Nguyên < ${cond.value}`,
    resource_above: `Tài Nguyên > ${cond.value}`,
    in_combat: cond.value ? 'Trong Chiến Đấu' : 'Ngoài Chiến Đấu',
    target_hp_below: `HP Mục Tiêu < ${cond.value}%`,
  };
  return labels[cond.type] || cond.type;
}

function saveConfiguration() {
  const config = autoSlots.value
    .filter(slot => slot.skill !== null)
    .map((slot, index) => ({
      skillId: slot.skill!._id,
      priority: MAX_SLOTS - index, // Higher index = higher priority
      conditions: slot.conditions,
    }));
  
  emit('save', config);
}

// Initialize from current config
if (props.currentConfig) {
  // Load existing configuration
  // This would be implemented based on the server data structure
}
</script>

<style scoped>
.auto-skill-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: #00ff00;
  font-family: 'VT323', 'Source Code Pro', monospace;
}

.auto-skill-header {
  padding: 1rem;
  border-bottom: 1px solid #008800;
  text-align: center;
}

.auto-skill-header h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.info-text {
  font-size: 0.9rem;
  color: #00aaaa;
}

.auto-skill-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1rem;
  padding: 1rem;
  overflow-y: auto;
}

.skills-panel,
.auto-slots-panel {
  border: 1px solid #008800;
  padding: 1rem;
  overflow-y: auto;
}

.skills-panel h3,
.auto-slots-panel h3 {
  color: #ffb000;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.skills-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skill-item {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 1px solid #008800;
  cursor: grab;
  transition: all 0.2s;
}

.skill-item:hover {
  border-color: #00ff00;
  background: rgba(0, 255, 0, 0.1);
}

.skill-item:active {
  cursor: grabbing;
}

.skill-icon {
  color: #ffb000;
  font-weight: bold;
  min-width: 2rem;
}

.skill-info {
  flex: 1;
}

.skill-name {
  font-weight: bold;
  color: #00ff00;
}

.skill-cost {
  font-size: 0.85rem;
  color: #00aaaa;
}

.auto-slots {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.auto-slot {
  border: 2px dashed #008800;
  padding: 1rem;
  min-height: 80px;
  transition: all 0.2s;
}

.auto-slot:hover {
  border-color: #00ff00;
  background: rgba(0, 255, 0, 0.05);
}

.slot-empty {
  text-align: center;
  color: #008800;
  padding: 1.5rem;
  font-style: italic;
}

.slot-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.slot-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #008800;
}

.slot-number {
  color: #ffb000;
  font-weight: bold;
}

.slot-skill-name {
  flex: 1;
  color: #00ff00;
  font-weight: bold;
}

.remove-btn {
  background: transparent;
  border: 1px solid #ff0000;
  color: #ff0000;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  font-family: 'VT323', monospace;
}

.remove-btn:hover {
  background: #ff0000;
  color: #000000;
}

.slot-conditions {
  font-size: 0.9rem;
}

.condition-label {
  color: #ffb000;
  margin-bottom: 0.25rem;
}

.condition-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.condition-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0.5rem;
  background: rgba(0, 136, 0, 0.2);
}

.remove-condition {
  background: transparent;
  border: 1px solid #ff6600;
  color: #ff6600;
  padding: 0.1rem 0.3rem;
  cursor: pointer;
  font-family: 'VT323', monospace;
  font-size: 0.8rem;
}

.remove-condition:hover {
  background: #ff6600;
  color: #000000;
}

.add-condition-btn {
  width: 100%;
  background: transparent;
  border: 1px solid #00aaaa;
  color: #00aaaa;
  padding: 0.5rem;
  cursor: pointer;
  font-family: 'VT323', monospace;
  font-size: 0.9rem;
}

.add-condition-btn:hover {
  background: rgba(0, 170, 170, 0.2);
}

.condition-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
}

.dialog-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
}

.dialog-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #000000;
  border: 2px solid #00ff00;
  padding: 1.5rem;
  min-width: 300px;
  max-width: 90%;
}

.dialog-content h3 {
  color: #ffb000;
  margin-bottom: 1rem;
  text-align: center;
}

.dialog-body {
  margin-bottom: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  color: #00ff00;
  margin-bottom: 0.25rem;
}

.form-group select,
.form-group input {
  width: 100%;
  background: #000000;
  border: 1px solid #008800;
  color: #00ff00;
  padding: 0.5rem;
  font-family: 'VT323', monospace;
  font-size: 1rem;
}

.dialog-footer {
  display: flex;
  gap: 0.5rem;
}

.dialog-btn {
  flex: 1;
  padding: 0.5rem;
  cursor: pointer;
  font-family: 'VT323', monospace;
  font-size: 1rem;
  font-weight: bold;
}

.dialog-btn.confirm {
  background: #008800;
  border: 1px solid #00ff00;
  color: #000000;
}

.dialog-btn.confirm:hover {
  background: #00ff00;
}

.dialog-btn.cancel {
  background: transparent;
  border: 1px solid #ff6600;
  color: #ff6600;
}

.dialog-btn.cancel:hover {
  background: #ff6600;
  color: #000000;
}

.auto-skill-footer {
  padding: 1rem;
  border-top: 1px solid #008800;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.save-button {
  background: #008800;
  border: 1px solid #00ff00;
  color: #000000;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-family: 'VT323', monospace;
  font-size: 1.1rem;
  font-weight: bold;
}

.save-button:hover {
  background: #00ff00;
}

.hint {
  color: #008800;
  font-size: 0.9rem;
}

.empty-message {
  color: #008800;
  font-style: italic;
  text-align: center;
  padding: 1rem;
}

@media (max-width: 768px) {
  .auto-skill-content {
    grid-template-columns: 1fr;
  }
  
  .dialog-content {
    min-width: auto;
  }
}
</style>
