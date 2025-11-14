<template>
  <div class="actions-panel">
    <div class="actions-header">
      <span class="actions-title">[ Hành Động ]</span>
      <button v-if="npcs.length > 0 || mobs.length > 0" @click="refresh" class="refresh-btn" title="Làm mới">
        ⟳
      </button>
    </div>
    
    <div class="actions-content">
      <!-- NPCs Section -->
      <div v-if="npcs.length > 0" class="entity-group">
        <div class="group-title">NPC:</div>
        <div class="entity-buttons">
          <button
            v-for="npc in npcs"
            :key="npc.id"
            @click="selectEntity('npc', npc)"
            class="entity-btn npc-btn"
            :title="npc.description || npc.name"
          >
            {{ npc.name }}
            <span v-if="npc.level" class="entity-level">(Lv.{{ npc.level }})</span>
          </button>
        </div>
      </div>

      <!-- Monsters Section -->
      <div v-if="mobs.length > 0" class="entity-group">
        <div class="group-title">Quái vật:</div>
        <div class="entity-buttons">
          <button
            v-for="mob in mobs"
            :key="mob.id"
            @click="selectEntity('mob', mob)"
            class="entity-btn mob-btn"
            :title="mob.description || mob.name"
          >
            {{ mob.name }}
            <span v-if="mob.level" class="entity-level">(Lv.{{ mob.level }})</span>
            <span v-if="mob.hp && mob.maxHp" class="entity-hp">
              {{ Math.round((mob.hp / mob.maxHp) * 100) }}%
            </span>
          </button>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="npcs.length === 0 && mobs.length === 0" class="empty-state">
        (Không có NPC hoặc quái vật)
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

interface Entity {
  id: string;
  name: string;
  level?: number;
  description?: string;
  hp?: number;
  maxHp?: number;
  isVendor?: boolean;
  shopType?: string;
}

const props = defineProps<{
  autoRefresh?: boolean;
}>();

const emit = defineEmits<{
  selectEntity: [type: 'npc' | 'mob', entity: Entity];
}>();

const npcs = ref<Entity[]>([]);
const mobs = ref<Entity[]>([]);

const loadOccupants = async () => {
  try {
    const response = await $fetch('/api/room/occupants');
    if (response.success) {
      npcs.value = response.npcs || [];
      mobs.value = response.mobs || [];
    }
  } catch (error) {
    console.error('Failed to load room occupants:', error);
  }
};

const selectEntity = (type: 'npc' | 'mob', entity: Entity) => {
  emit('selectEntity', type, entity);
};

const refresh = () => {
  loadOccupants();
};

// Load occupants when component is mounted
onMounted(() => {
  loadOccupants();
});

// Expose refresh method for parent component
defineExpose({
  refresh: loadOccupants
});
</script>

<style scoped>
.actions-panel {
  background-color: rgba(0, 136, 0, 0.05);
  border: 1px solid rgba(0, 136, 0, 0.3);
  border-radius: 4px;
  overflow: hidden;
  font-family: 'VT323', 'Source Code Pro', monospace;
}

.actions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background-color: rgba(0, 136, 0, 0.1);
  border-bottom: 1px solid rgba(0, 136, 0, 0.3);
}

.actions-title {
  color: var(--text-accent);
  font-weight: bold;
  font-size: 16px;
}

.refresh-btn {
  background: transparent;
  border: 1px solid rgba(0, 136, 0, 0.4);
  color: var(--text-bright);
  padding: 0.2rem 0.5rem;
  cursor: pointer;
  font-size: 18px;
  border-radius: 3px;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background-color: rgba(0, 255, 0, 0.1);
  border-color: var(--text-bright);
}

.actions-content {
  padding: 0.75rem;
  max-height: 200px;
  overflow-y: auto;
}

.entity-group {
  margin-bottom: 0.75rem;
}

.entity-group:last-child {
  margin-bottom: 0;
}

.group-title {
  color: var(--text-dim);
  font-size: 14px;
  margin-bottom: 0.4rem;
  font-weight: bold;
}

.entity-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.entity-btn {
  background-color: rgba(0, 136, 0, 0.15);
  border: 1px solid rgba(0, 136, 0, 0.4);
  color: var(--text-bright);
  padding: 0.4rem 0.8rem;
  cursor: pointer;
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 16px;
  border-radius: 4px;
  transition: all 0.2s;
  white-space: nowrap;
}

.entity-btn:hover {
  background-color: rgba(0, 255, 0, 0.2);
  border-color: var(--text-bright);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 255, 0, 0.2);
}

.entity-btn:active {
  transform: translateY(0);
  box-shadow: none;
}

.npc-btn {
  border-color: rgba(0, 200, 255, 0.5);
  color: #00ccff;
}

.npc-btn:hover {
  background-color: rgba(0, 200, 255, 0.15);
  border-color: #00ccff;
}

.mob-btn {
  border-color: rgba(255, 100, 100, 0.5);
  color: #ff6666;
}

.mob-btn:hover {
  background-color: rgba(255, 100, 100, 0.15);
  border-color: #ff6666;
}

.entity-level {
  color: var(--text-dim);
  font-size: 14px;
  margin-left: 0.3rem;
}

.entity-hp {
  color: var(--text-accent);
  font-size: 14px;
  margin-left: 0.3rem;
  font-weight: bold;
}

.empty-state {
  color: var(--text-dim);
  font-style: italic;
  text-align: center;
  padding: 1rem;
  font-size: 14px;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .actions-content {
    max-height: 150px;
    padding: 0.5rem;
  }

  .entity-btn {
    font-size: 14px;
    padding: 0.3rem 0.6rem;
  }

  .group-title {
    font-size: 13px;
  }

  .entity-level,
  .entity-hp {
    font-size: 12px;
  }
}
</style>
