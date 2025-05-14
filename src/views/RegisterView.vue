<template>
  <div class="register-container">
    <div class="register-form">
      <h1>스마트 시리얼 이메일러</h1>
      <h2>회원가입</h2>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
        <div class="login-redirect">
          <router-link to="/login">로그인 페이지로 이동</router-link>
        </div>
      </div>

      <form v-if="!successMessage" @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="email">이메일</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            placeholder="이메일을 입력하세요"
            autocomplete="email"
          />
        </div>

        <div class="form-group">
          <label for="password">비밀번호</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            placeholder="비밀번호를 입력하세요 (최소 6자)"
            autocomplete="new-password"
            minlength="6"
          />
        </div>

        <div class="form-group">
          <label for="passwordConfirm">비밀번호 확인</label>
          <input
            id="passwordConfirm"
            v-model="passwordConfirm"
            type="password"
            required
            placeholder="비밀번호를 다시 입력하세요"
            autocomplete="new-password"
            minlength="6"
          />
        </div>

        <button type="submit" :disabled="loading">
          {{ loading ? '가입 중...' : '회원가입' }}
        </button>

        <div class="login-link">
          <p>이미 계정이 있으신가요? <router-link to="/login">로그인</router-link></p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const passwordConfirm = ref('');
const loading = ref(false);
const error = ref('');
const successMessage = ref('');

async function handleRegister() {
  error.value = '';

  if (!email.value || !password.value || !passwordConfirm.value) {
    error.value = '모든 필드를 입력해주세요.';
    return;
  }

  if (password.value.length < 6) {
    error.value = '비밀번호는 최소 6자 이상이어야 합니다.';
    return;
  }

  if (password.value !== passwordConfirm.value) {
    error.value = '비밀번호가 일치하지 않습니다.';
    return;
  }

  try {
    loading.value = true;
    await authStore.register(email.value, password.value);
    successMessage.value = '회원가입에 성공했습니다! 이메일을 확인하여 계정을 인증하세요.';

    // 폼 초기화
    email.value = '';
    password.value = '';
    passwordConfirm.value = '';
  } catch (err) {
    error.value = err.message || '회원가입에 실패했습니다. 다시 시도해주세요.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.register-form {
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  background: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

h1 {
  text-align: center;
  margin-bottom: 0.5rem;
  color: #333;
  font-size: 1.8rem;
}

h2 {
  text-align: center;
  margin-bottom: 2rem;
  color: #666;
  font-size: 1.4rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

button {
  width: 100%;
  padding: 0.75rem;
  background-color: #4a6cf7;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:hover {
  background-color: #3a5ce4;
}

button:disabled {
  background-color: #a0aed0;
  cursor: not-allowed;
}

.error-message {
  background-color: #ffebee;
  color: #d32f2f;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
}

.success-message {
  background-color: #e8f5e9;
  color: #2e7d32;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
}

.login-link, .login-redirect {
  text-align: center;
  margin-top: 1.5rem;
}

a {
  color: #4a6cf7;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>
