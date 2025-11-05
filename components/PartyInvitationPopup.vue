<template>
  <div class="party-invitation-popup">
    <div class="invitation-content">
      <p class="invitation-message">
        <span class="inviter-name">[{{ inviterName }}]</span>
        <span class="inviter-class">({{ getClassDisplay(inviterClass) }})</span>
        đã mời bạn vào nhóm.
      </p>

      <div class="invitation-actions">
        <button class="accept-button" @click="acceptInvitation">
          [ CHẤP NHẬN ]
        </button>
        <button class="decline-button" @click="declineInvitation">
          [ TỪ CHỐI ]
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  inviterName: string;
  inviterClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  inviterClass: 'mutant_warrior'
});

const emit = defineEmits<{
  accept: [];
  decline: [];
}>();

const getClassDisplay = (classId: string): string => {
  const classNames: Record<string, string> = {
    mutant_warrior: 'Chiến Binh',
    rune_historian: 'Sử Gia',
    stalker: 'Kẻ Lùng Sục',
    scrap_engineer: 'Kỹ Sư'
  };
  return classNames[classId] || classId;
};

const acceptInvitation = () => {
  emit('accept');
};

const declineInvitation = () => {
  emit('decline');
};
</script>

<style scoped>
.party-invitation-popup {
  font-family: 'VT323', 'Source Code Pro', monospace;
  color: var(--text-bright);
}

.invitation-content {
  padding: 1rem;
  text-align: center;
}

.invitation-message {
  margin-bottom: 1.5rem;
  font-size: 1.1em;
  line-height: 1.6;
}

.inviter-name {
  color: var(--text-accent);
  font-weight: bold;
}

.inviter-class {
  color: var(--text-dim);
}

.invitation-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.accept-button,
.decline-button {
  padding: 0.75rem 1.5rem;
  border: 1px solid;
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 1rem;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.accept-button {
  background: rgba(0, 136, 0, 0.3);
  border-color: rgba(0, 255, 0, 0.5);
  color: var(--text-bright);
}

.accept-button:hover {
  background: rgba(0, 255, 0, 0.2);
  border-color: var(--text-accent);
}

.decline-button {
  background: rgba(136, 0, 0, 0.3);
  border-color: rgba(255, 0, 0, 0.5);
  color: var(--text-error);
}

.decline-button:hover {
  background: rgba(255, 0, 0, 0.2);
  border-color: var(--text-error);
}
</style>
