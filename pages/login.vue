<template>
  <div class="terminal-container">
    <div class="auth-content">
      <div class="auth-header">
        <div class="ascii-art">
          ⚔️  🛡️  ⚔️
        </div>
        <div class="title-border">╔════════════════════════════════════════╗</div>
        <div class="message message-accent">║       VÒNG TÍCH THÀNH - ĐĂNG NHẬP      ║</div>
        <div class="title-border">╚════════════════════════════════════════╝</div>
        <div class="subtitle">Chào mừng trở lại, chiến binh!</div>
      </div>

      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label class="form-label">
            <span class="prompt">&gt;</span> Tên người chơi:
          </label>
          <input
            v-model="username"
            type="text"
            class="form-input"
            autocomplete="username"
            required
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label class="form-label">
            <span class="prompt">&gt;</span> Mật khẩu:
          </label>
          <input
            v-model="password"
            type="password"
            class="form-input"
            autocomplete="current-password"
            required
            :disabled="loading"
          />
        </div>

        <div v-if="errorMessage" class="message message-error">
          {{ errorMessage }}
        </div>

        <div class="form-actions">
          <button type="submit" class="btn-submit" :disabled="loading">
            {{ loading ? '[ Đang xử lý... ]' : '[ ĐĂNG NHẬP ]' }}
          </button>
        </div>

        <div class="message message-system">
          <span>Chưa có tài khoản? </span>
          <NuxtLink to="/register" class="link">Đăng ký ngay</NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

definePageMeta({
  middleware: 'guest'
});

const username = ref('');
const password = ref('');
const errorMessage = ref('');
const loading = ref(false);

const { login } = useAuth();
const router = useRouter();

const handleLogin = async () => {
  errorMessage.value = '';
  loading.value = true;

  try {
    const result = await login(username.value, password.value);
    
    if (result.success) {
      // Use navigateTo with replace to force navigation
      await navigateTo('/', { replace: true, external: true });
    } else {
      errorMessage.value = result.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
    }
  } catch (error) {
    errorMessage.value = 'Có lỗi xảy ra. Vui lòng thử lại.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.terminal-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-black);
  overflow-y: auto;
  padding: 2rem;
}

.auth-content {
  width: 100%;
  max-width: 600px;
  padding: 2rem;
}

.auth-header {
  margin-bottom: 2rem;
}

.ascii-art {
  text-align: center;
  font-size: 24px;
  margin-bottom: 1rem;
}

.title-border {
  color: var(--text-accent);
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 18px;
  text-align: center;
  line-height: 1.2;
}

.subtitle {
  color: var(--text-cyan);
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 16px;
  text-align: center;
  margin-top: 0.5rem;
  font-style: italic;
}

.message {
  margin-bottom: 0.2rem;
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 18px;
  line-height: 1.4;
}

.message-normal {
  color: var(--text-dim);
}

.message-accent {
  color: var(--text-accent);
  text-align: center;
}

.message-error {
  color: var(--text-danger);
  margin-top: 1rem;
}

.message-system {
  color: var(--text-cyan);
  text-align: center;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  color: var(--text-dim);
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.prompt {
  color: var(--text-bright);
  font-weight: bold;
}

.form-input {
  background-color: transparent;
  border: 2px solid var(--text-dim);
  color: var(--text-bright);
  padding: 0.75rem 1rem;
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 18px;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: var(--text-bright);
}

.form-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-actions {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
}

.btn-submit {
  background-color: transparent;
  border: 2px solid var(--text-bright);
  color: var(--text-bright);
  padding: 0.75rem 2rem;
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
}

.btn-submit:hover:not(:disabled) {
  background-color: var(--text-bright);
  color: var(--bg-black);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.link {
  color: var(--text-cyan);
  text-decoration: underline;
  cursor: pointer;
}

.link:hover {
  color: var(--text-bright);
}
</style>
