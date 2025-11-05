<template>
  <div class="map-pane">
    <div class="map-title">[ Bản Đồ ]</div>
    <div class="map-container">
      <div class="map-row">
        <span class="map-cell"></span>
        <span 
          class="map-cell map-direction" 
          :class="{ 'has-exit': exits.north, 'clickable': exits.north }"
          @click="exits.north && goDirection('north')"
        >
          {{ exits.north ? '[Bắc]' : '' }}
        </span>
        <span class="map-cell"></span>
      </div>
      <div class="map-row">
        <span class="map-cell map-connector" :class="{ 'has-exit': exits.north }">
          {{ exits.north ? '|' : '' }}
        </span>
        <span class="map-cell"></span>
        <span class="map-cell"></span>
      </div>
      <div class="map-row">
        <span 
          class="map-cell map-direction" 
          :class="{ 'has-exit': exits.west, 'clickable': exits.west }"
          @click="exits.west && goDirection('west')"
        >
          {{ exits.west ? '[Tây]' : '' }}
        </span>
        <span class="map-cell map-connector" :class="{ 'has-west': exits.west, 'has-east': exits.east }">
          {{ exits.west && exits.east ? '-' : (exits.west || exits.east ? '-' : '') }}
        </span>
        <span class="map-cell current-room">[Đây]</span>
        <span class="map-cell map-connector" :class="{ 'has-east': exits.east }">
          {{ exits.east ? '-' : '' }}
        </span>
        <span 
          class="map-cell map-direction" 
          :class="{ 'has-exit': exits.east, 'clickable': exits.east }"
          @click="exits.east && goDirection('east')"
        >
          {{ exits.east ? '[Đông]' : '' }}
        </span>
      </div>
      <div class="map-row">
        <span class="map-cell"></span>
        <span class="map-cell map-connector" :class="{ 'has-exit': exits.south }">
          {{ exits.south ? '|' : '' }}
        </span>
        <span class="map-cell"></span>
      </div>
      <div class="map-row">
        <span class="map-cell"></span>
        <span 
          class="map-cell map-direction" 
          :class="{ 'has-exit': exits.south, 'clickable': exits.south }"
          @click="exits.south && goDirection('south')"
        >
          {{ exits.south ? '[Nam]' : '' }}
        </span>
        <span class="map-cell"></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Exits {
  north?: boolean;
  south?: boolean;
  east?: boolean;
  west?: boolean;
  up?: boolean;
  down?: boolean;
}

const props = defineProps<{
  exits: Exits;
}>();

const emit = defineEmits<{
  navigate: [direction: string];
}>();

const goDirection = (direction: string) => {
  emit('navigate', direction);
};
</script>

<style scoped>
.map-pane {
  padding: 0.75rem;
  background-color: rgba(0, 136, 0, 0.03);
  border: 1px solid rgba(0, 136, 0, 0.3);
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 14px;
  line-height: 1.4;
  overflow-y: auto;
}

.map-title {
  color: var(--text-accent);
  font-weight: bold;
  margin-bottom: 0.5rem;
  font-size: 16px;
}

.map-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--text-dim);
}

.map-row {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 20px;
}

.map-cell {
  min-width: 50px;
  text-align: center;
  color: var(--text-dim);
}

.map-cell.has-exit {
  color: var(--text-bright);
}

.map-cell.current-room {
  color: var(--text-accent);
  font-weight: bold;
}

.map-connector {
  min-width: 20px;
  color: var(--text-dim);
}

.map-connector.has-exit,
.map-connector.has-west,
.map-connector.has-east,
.map-connector.has-north,
.map-connector.has-south {
  color: var(--text-bright);
}

.map-direction.clickable {
  cursor: pointer;
  transition: all 0.2s;
}

.map-direction.clickable:hover {
  color: var(--text-accent);
  text-decoration: underline;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .map-pane {
    font-size: 12px;
    padding: 0.5rem;
  }

  .map-cell {
    min-width: 40px;
    font-size: 12px;
  }

  .map-row {
    height: 18px;
  }
}
</style>
