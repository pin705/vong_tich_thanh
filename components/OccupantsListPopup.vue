<template>
  <teleport to="body">
    <div v-if="isOpen" class="occupants-list-popup" @click.self="close">
      <div class="popup-backdrop" @click="close"></div>
      <div class="popup-content">
        <div class="popup-header">
          <span class="popup-title">[ Xung Quanh ]</span>
          <button class="popup-close" @click="close">[X]</button>
        </div>
        
        <div class="popup-body">
          <div
            v-for="player in players"
            :key="'player-' + player.id"
            class="occupant-item"
            @click="selectEntity('player', player)"
          >
            (P) {{ player.name }}
          </div>
          <div
            v-for="npc in npcs"
            :key="'npc-' + npc.id"
            class="occupant-item"
            @click="selectEntity('npc', npc)"
          >
            (N) {{ npc.name }}
          </div>
          <div
            v-for="mob in mobs"
            :key="'mob-' + mob.id"
            class="occupant-item"
            @click="selectEntity('mob', mob)"
          >
            (M) {{ mob.name }}
          </div>
          <div v-if="players.length === 0 && npcs.length === 0 && mobs.length === 0" class="occupant-empty">
            (Không có ai)
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
interface Occupant {
  id: string;
  name: string;
}

interface Props {
  isOpen: boolean;
  players: Occupant[];
  npcs: Occupant[];
  mobs: Occupant[];
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  players: () => [],
  npcs: () => [],
  mobs: () => []
});

const emit = defineEmits<{
  close: [];
  selectEntity: [type: 'player' | 'npc' | 'mob', entity: Occupant];
}>();

const close = () => {
  emit('close');
};

const selectEntity = (type: 'player' | 'npc' | 'mob', entity: Occupant) => {
  emit('selectEntity', type, entity);
  close();
};
</script>

<style scoped>
.occupants-list-popup {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1500;
  display: flex;
  align-items: center;
  justify-content: center;
}

.popup-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 1501;
}

.popup-content {
  position: relative;
  z-index: 1502;
  width: 90%;
  max-width: 400px;
  background-color: var(--bg-black);
  border: 2px solid var(--text-bright);
  box-shadow: 0 0 25px rgba(0, 255, 0, 0.4);
  font-family: 'VT323', 'Source Code Pro', monospace;
  max-height: 70vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--text-bright);
  background-color: rgba(0, 136, 0, 0.05);
}

.popup-title {
  color: var(--text-accent);
  font-size: 18px;
  font-weight: bold;
}

.popup-close {
  color: var(--text-danger);
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  padding: 0 0.5rem;
  transition: color 0.2s;
}

.popup-close:hover {
  color: var(--text-bright);
}

.popup-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.occupant-item {
  color: var(--text-bright);
  cursor: pointer;
  padding: 0.5rem;
  margin-bottom: 0.25rem;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.occupant-item:hover {
  background-color: rgba(0, 255, 0, 0.15);
  border-color: var(--text-bright);
}

.occupant-empty {
  color: var(--text-dim);
  font-style: italic;
  text-align: center;
  padding: 1rem;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .popup-content {
    width: 95%;
    max-height: 60vh;
  }
}
</style>
