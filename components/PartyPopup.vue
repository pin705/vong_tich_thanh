<template>
  <div class="party-popup">
    <div v-if="!hasParty" class="no-party">
      <p>Bạn hiện không ở trong nhóm nào.</p>
      <p class="hint">(Click vào người chơi khác để [Mời vào Nhóm])</p>
    </div>

    <div v-else class="party-dashboard">
      <div class="party-members">
        <div
          v-for="member in partyMembers"
          :key="member.id"
          class="party-member"
          :class="{ leader: member.isLeader, clickable: member.id !== currentPlayerId }"
          @click="handleMemberClick(member)"
        >
          <div class="member-header">
            <span class="member-badge">{{ member.isLeader ? '(L)' : '(T)' }}</span>
            <span class="member-name">[{{ member.name }}]</span>
            <span class="member-class">({{ getClassDisplay(member.class) }})</span>
          </div>

          <div class="member-stats">
            <div class="stat-bar">
              <span class="stat-label">HP:</span>
              <div class="bar-container">
                <div class="bar hp-bar" :style="{ width: getBarWidth(member.hp, member.maxHp) }"></div>
              </div>
              <span class="stat-value">{{ member.hp }}/{{ member.maxHp }}</span>
            </div>

            <div class="stat-bar">
              <span class="stat-label">{{ getResourceLabel(member.class) }}:</span>
              <div class="bar-container">
                <div class="bar resource-bar" :style="{ width: getBarWidth(member.resource, member.maxResource) }"></div>
              </div>
              <span class="stat-value">{{ member.resource }}/{{ member.maxResource }}</span>
            </div>
          </div>

          <div v-if="member.statusEffects && member.statusEffects.length > 0" class="member-status">
            <span
              v-for="effect in member.statusEffects"
              :key="effect.name"
              class="status-effect"
              :class="effect.type"
            >
              [{{ effect.name }}]
            </span>
          </div>
        </div>
      </div>

      <div class="party-controls">
        <div class="control-row">
          <span class="control-label">Quy Tắc Nhặt Đồ:</span>
          <button
            class="loot-rule-button"
            :disabled="!isLeader"
            @click="toggleLootRule"
          >
            [{{ lootRuleDisplay }}]
          </button>
        </div>

        <button class="leave-button" @click="leaveParty">
          [ RỜI NHÓM ]
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface StatusEffect {
  name: string;
  type: 'buff' | 'debuff';
}

interface PartyMember {
  id: string;
  name: string;
  class: string;
  hp: number;
  maxHp: number;
  resource: number;
  maxResource: number;
  isLeader: boolean;
  statusEffects?: StatusEffect[];
}

interface Props {
  hasParty: boolean;
  partyMembers?: PartyMember[];
  lootRule?: 'leader-only' | 'round-robin';
  currentPlayerId: string;
  isLeader?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  hasParty: false,
  partyMembers: () => [],
  lootRule: 'round-robin',
  isLeader: false
});

const emit = defineEmits<{
  memberClick: [member: PartyMember];
  lootRuleChange: [rule: 'leader-only' | 'round-robin'];
  leaveParty: [];
}>();

const lootRuleDisplay = computed(() => {
  return props.lootRule === 'leader-only' ? 'Chỉ Trưởng Nhóm' : 'Theo Lượt';
});

const getClassDisplay = (classId: string): string => {
  const classNames: Record<string, string> = {
    mutant_warrior: 'Chiến Binh',
    rune_historian: 'Sử Gia',
    stalker: 'Kẻ Lùng Sục',
    scrap_engineer: 'Kỹ Sư'
  };
  return classNames[classId] || classId;
};

const getResourceLabel = (classId: string): string => {
  const resourceLabels: Record<string, string> = {
    mutant_warrior: 'Nộ',
    rune_historian: 'Mana',
    stalker: 'Năng Lượng',
    scrap_engineer: 'Linh Kiện'
  };
  return resourceLabels[classId] || 'Resource';
};

const getBarWidth = (current: number, max: number): string => {
  if (max === 0) return '0%';
  const percentage = (current / max) * 100;
  return `${Math.max(0, Math.min(100, percentage))}%`;
};

const handleMemberClick = (member: PartyMember) => {
  if (member.id !== props.currentPlayerId) {
    emit('memberClick', member);
  }
};

const toggleLootRule = () => {
  const newRule = props.lootRule === 'leader-only' ? 'round-robin' : 'leader-only';
  emit('lootRuleChange', newRule);
};

const leaveParty = () => {
  emit('leaveParty');
};
</script>

<style scoped>
.party-popup {
  font-family: 'VT323', 'Source Code Pro', monospace;
  color: var(--text-bright);
}

.no-party {
  text-align: center;
  padding: 2rem;
}

.no-party p {
  margin: 0.5rem 0;
  color: var(--text-dim);
}

.no-party .hint {
  font-size: 0.9em;
  color: var(--text-accent);
}

.party-dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.party-members {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.party-member {
  padding: 0.75rem;
  border: 1px solid rgba(0, 136, 0, 0.3);
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  transition: all 0.2s;
}

.party-member.clickable {
  cursor: pointer;
}

.party-member.clickable:hover {
  border-color: var(--text-accent);
  background-color: rgba(0, 255, 0, 0.05);
}

.party-member.leader {
  border-color: var(--text-accent);
}

.member-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.member-badge {
  color: var(--text-accent);
  font-weight: bold;
}

.member-name {
  color: var(--text-accent);
}

.member-class {
  color: var(--text-dim);
}

.member-stats {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-left: 2rem;
}

.stat-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9em;
}

.stat-label {
  width: 5rem;
  color: var(--text-dim);
}

.bar-container {
  flex: 1;
  height: 12px;
  background-color: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(0, 136, 0, 0.5);
  border-radius: 2px;
  overflow: hidden;
}

.bar {
  height: 100%;
  transition: width 0.3s ease;
}

.hp-bar {
  background: linear-gradient(90deg, #ff0000 0%, #ff4444 100%);
}

.resource-bar {
  background: linear-gradient(90deg, #00aaff 0%, #00ddff 100%);
}

.stat-value {
  width: 5rem;
  text-align: right;
  color: var(--text-bright);
}

.member-status {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  margin-left: 2rem;
  flex-wrap: wrap;
}

.status-effect {
  padding: 0.1rem 0.5rem;
  border-radius: 2px;
  font-size: 0.85em;
}

.status-effect.buff {
  color: var(--text-system);
  border: 1px solid var(--text-system);
}

.status-effect.debuff {
  color: var(--text-error);
  border: 1px solid var(--text-error);
}

.party-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(0, 136, 0, 0.3);
}

.control-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.control-label {
  color: var(--text-dim);
}

.loot-rule-button {
  flex: 1;
  padding: 0.5rem;
  background: rgba(0, 136, 0, 0.2);
  border: 1px solid rgba(0, 136, 0, 0.5);
  color: var(--text-bright);
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 1rem;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.loot-rule-button:hover:not(:disabled) {
  background: rgba(0, 255, 0, 0.2);
  border-color: var(--text-accent);
}

.loot-rule-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.leave-button {
  padding: 0.75rem;
  background: rgba(136, 0, 0, 0.3);
  border: 1px solid rgba(255, 0, 0, 0.5);
  color: var(--text-error);
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 1rem;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.leave-button:hover {
  background: rgba(255, 0, 0, 0.2);
  border-color: var(--text-error);
}
</style>
