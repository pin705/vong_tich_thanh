<template>
  <div class="occupants-pane">
    <div class="occupants-title">[ Xung Quanh ]</div>
    <div class="occupants-list">
      <div
        v-for="player in players"
        :key="'player-' + player.id"
        class="occupant-item"
        :class="{ selected: selectedTarget?.id === player.id && selectedTarget?.type === 'player' }"
        @click="selectTarget('player', player.id, player.name)"
      >
        (P) {{ player.name }}
      </div>
      <div
        v-for="pet in pets"
        :key="'pet-' + pet.id"
        class="occupant-item pet-item"
        :class="{ selected: selectedTarget?.id === pet.id && selectedTarget?.type === 'pet' }"
        @click="selectTarget('pet', pet.id, pet.name)"
      >
        (Pet) {{ pet.name }} <span class="pet-owner">của [{{ pet.ownerName }}]</span>
      </div>
      <div
        v-for="npc in npcs"
        :key="'npc-' + npc.id"
        class="occupant-item"
        :class="{ selected: selectedTarget?.id === npc.id && selectedTarget?.type === 'npc' }"
        @click="selectTarget('npc', npc.id, npc.name)"
      >
        (N) {{ npc.name }}
      </div>
      <div
        v-for="mob in mobs"
        :key="'mob-' + mob.id"
        class="occupant-item"
        :class="{ selected: selectedTarget?.id === mob.id && selectedTarget?.type === 'mob' }"
        @click="selectTarget('mob', mob.id, mob.name)"
      >
        (M) {{ mob.name }}
      </div>
      <div v-if="respawns && respawns.length > 0" class="respawns-section">
        <div class="respawns-title">[ Hồi Sinh ]</div>
        <div
          v-for="(respawn, index) in respawns"
          :key="'respawn-' + index"
          class="respawn-item"
          :title="formatRespawnTooltip(respawn)"
        >
          ({{ respawn.type === 'mob' ? 'M' : 'N' }}) {{ respawn.name }} - {{ formatRespawnTime(respawn.respawnTime) }}
        </div>
      </div>
      <div v-if="players.length === 0 && npcs.length === 0 && mobs.length === 0 && pets?.length === 0 && (!respawns || respawns.length === 0)" class="occupant-empty">
        (Không có ai)
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Occupant {
  id: string;
  name: string;
}

interface Pet {
  id: string;
  name: string;
  ownerName: string;
}

interface Respawn {
  name: string;
  respawnTime: string;
  type: string;
}

interface SelectedTarget {
  type: 'player' | 'npc' | 'mob' | 'pet';
  id: string;
  name: string;
}

const props = defineProps<{
  players: Occupant[];
  npcs: Occupant[];
  mobs: Occupant[];
  pets?: Pet[];
  respawns?: Respawn[];
  selectedTarget: SelectedTarget | null;
}>();

const emit = defineEmits<{
  selectTarget: [type: 'player' | 'npc' | 'mob' | 'pet', id: string, name: string];
}>();

const selectTarget = (type: 'player' | 'npc' | 'mob' | 'pet', id: string, name: string) => {
  emit('selectTarget', type, id, name);
};

// Format respawn time to show countdown
const formatRespawnTime = (respawnTimeStr: string): string => {
  const respawnTime = new Date(respawnTimeStr);
  const now = new Date();
  const diffMs = respawnTime.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return 'sắp...';
  }
  
  const diffSeconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(diffSeconds / 60);
  const seconds = diffSeconds % 60;
  
  if (minutes > 0) {
    return `${minutes}p ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

// Format tooltip with full timestamp
const formatRespawnTooltip = (respawn: Respawn): string => {
  const respawnTime = new Date(respawn.respawnTime);
  return `${respawn.name} sẽ hồi sinh lúc ${respawnTime.toLocaleTimeString()}`;
};
</script>

<style scoped>
.occupants-pane {
  padding: 0.75rem;
  background-color: rgba(0, 136, 0, 0.03);
  border: 1px solid rgba(0, 136, 0, 0.3);
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 16px;
  line-height: 1.4;
  overflow-y: auto;
}

.occupants-title {
  color: var(--text-accent);
  font-weight: bold;
  margin-bottom: 0.5rem;
  font-size: 16px;
}

.occupants-list {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.occupant-item {
  color: var(--text-bright);
  cursor: pointer;
  padding: 0.15rem 0.25rem;
  transition: background-color 0.2s;
}

.occupant-item:hover {
  background-color: rgba(0, 255, 0, 0.1);
}

.occupant-item.selected {
  background-color: rgba(0, 255, 0, 0.2);
  color: var(--text-accent);
}

.pet-item {
  color: rgba(255, 200, 100, 0.9);
}

.pet-owner {
  color: var(--text-dim);
  font-size: 0.9em;
}

.occupant-empty {
  color: var(--text-dim);
  font-style: italic;
}

.respawns-section {
  margin-top: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(0, 136, 0, 0.2);
}

.respawns-title {
  color: var(--text-accent);
  font-weight: bold;
  margin-bottom: 0.3rem;
  font-size: 14px;
  opacity: 0.8;
}

.respawn-item {
  color: var(--text-dim);
  padding: 0.15rem 0.25rem;
  font-size: 14px;
  font-style: italic;
  cursor: help;
}

.respawn-item:hover {
  color: var(--text-bright);
  background-color: rgba(0, 255, 0, 0.05);
}
</style>
