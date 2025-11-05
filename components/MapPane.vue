<template>
  <div class="map-pane">
    <div class="map-title">[ Bản Đồ ]</div>
    <div class="map-container">
      <div class="map-row">
        <span class="map-cell"></span>
        <span class="map-cell" :class="{ 'has-exit': exits.north }">
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
        <span class="map-cell" :class="{ 'has-exit': exits.west }">
          {{ exits.west ? '[Tây]' : '' }}
        </span>
        <span class="map-cell map-connector" :class="{ 'has-west': exits.west, 'has-east': exits.east }">
          {{ exits.west && exits.east ? '-' : (exits.west || exits.east ? '-' : '') }}
        </span>
        <span class="map-cell current-room">[Đây]</span>
        <span class="map-cell map-connector" :class="{ 'has-east': exits.east }">
          {{ exits.east ? '-' : '' }}
        </span>
        <span class="map-cell" :class="{ 'has-exit': exits.east }">
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
        <span class="map-cell" :class="{ 'has-exit': exits.south }">
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
</script>

<style scoped>
.map-pane {
  padding: 0.75rem;
  background-color: rgba(0, 136, 0, 0.05);
  border: 1px solid var(--text-dim);
  border-radius: 4px;
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
</style>
