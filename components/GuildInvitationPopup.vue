<template>
  <BaseInvitationPopup 
    title="LỜI MỜI GIA NHẬP BANG HỘI"
    :showIcon="true"
    @accept="handleAccept"
    @decline="handleDecline"
  >
    <p class="guild-name">[{{ guildTag }}] {{ guildName }}</p>
    <p class="invite-text">đã mời bạn gia nhập bang hội.</p>
    <p class="inviter-text">Người mời: <span class="inviter-name">{{ inviterName }}</span></p>
  </BaseInvitationPopup>
</template>

<script setup lang="ts">
import BaseInvitationPopup from './BaseInvitationPopup.vue';

interface Props {
  guildName: string;
  guildTag: string;
  inviterName: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  accept: [];
  decline: [];
}>();

function handleAccept() {
  emit('accept');
}

function handleDecline() {
  emit('decline');
}
</script>

<style scoped>
.guild-name {
  font-size: 1.3em;
  color: var(--text-accent);
  font-weight: bold;
  margin: 0;
}

.invite-text {
  color: var(--text-bright);
  margin: 0;
}

.inviter-text {
  color: var(--text-dim);
  font-size: 0.95em;
  margin: 0;
}

.inviter-name {
  color: var(--text-bright);
  font-weight: bold;
}
</style>
