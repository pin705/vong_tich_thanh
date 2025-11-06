<template>
  <BaseInvitationPopup 
    title="LỜI MỜI NHÓM"
    @accept="acceptInvitation"
    @decline="declineInvitation"
  >
    <p class="invitation-message">
      <span class="inviter-name">[{{ inviterName }}]</span>
      <span class="inviter-class">({{ getClassDisplay(inviterClass) }})</span>
      đã mời bạn vào nhóm.
    </p>
  </BaseInvitationPopup>
</template>

<script setup lang="ts">
import BaseInvitationPopup from './BaseInvitationPopup.vue';

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
.invitation-message {
  font-size: 1.1em;
  line-height: 1.6;
  margin: 0;
}

.inviter-name {
  color: var(--text-accent);
  font-weight: bold;
}

.inviter-class {
  color: var(--text-dim);
}
</style>
