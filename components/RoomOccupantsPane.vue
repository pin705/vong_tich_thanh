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
      <div v-if="players.length === 0 && npcs.length === 0 && mobs.length === 0" class="occupant-empty">
        (Không có ai)
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Occupant {
  id: string;
  name: string;
}

interface SelectedTarget {
  type: 'player' | 'npc' | 'mob';
  id: string;
  name: string;
}

const props = defineProps<{
  players: Occupant[];
  npcs: Occupant[];
  mobs: Occupant[];
  selectedTarget: SelectedTarget | null;
}>();

const emit = defineEmits<{
  selectTarget: [type: 'player' | 'npc' | 'mob', id: string, name: string];
}>();

const selectTarget = (type: 'player' | 'npc' | 'mob', id: string, name: string) => {
  emit('selectTarget', type, id, name);
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

.occupant-empty {
  color: var(--text-dim);
  font-style: italic;
}
</style>
