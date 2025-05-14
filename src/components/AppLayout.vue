<template>
  <div class="app-layout">
    <header class="app-header">
      <h1>스마트 시리얼 이메일러</h1>
      <div class="user-actions" v-if="authStore.isAuthenticated">
        <span class="user-email">{{ authStore.user?.email }}</span>
        <button class="logout-button" @click="handleLogout">로그아웃</button>
      </div>
    </header>

    <main class="app-content">
      <aside class="app-sidebar" v-if="authStore.isAuthenticated">
        <nav class="app-nav">
          <ul>
            <li>
              <router-link to="/dashboard" class="nav-link">
                <span class="nav-icon">📊</span>
                <span>대시보드</span>
              </router-link>
            </li>
            <li>
              <router-link to="/serial-numbers" class="nav-link">
                <span class="nav-icon">🔢</span>
                <span>시리얼 번호</span>
              </router-link>
            </li>
            <li>
              <router-link to="/email-templates" class="nav-link">
                <span class="nav-icon">✉️</span>
                <span>이메일 템플릿</span>
              </router-link>
            </li>
            <li>
              <router-link to="/settings" class="nav-link">
                <span class="nav-icon">⚙️</span>
                <span>설정</span>
              </router-link>
            </li>
            <li>
              <router-link to="/logs" class="nav-link">
                <span class="nav-icon">📝</span>
                <span>발송 내역</span>
              </router-link>
            </li>
          </ul>
        </nav>
      </aside>

      <div class="app-main">
        <slot></slot>
      </div>
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

// 로그아웃 처리
async function handleLogout() {
  try {
    await authStore.logout();
    router.push('/login');
  } catch (error) {
    console.error('로그아웃 중 오류 발생:', error);
  }
}
</script>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f8f9fa;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.app-header h1 {
  font-size: 1.5rem;
  margin: 0;
  color: #333;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-email {
  font-size: 0.9rem;
  color: #666;
}

.logout-button {
  background-color: transparent;
  border: 1px solid #4a6cf7;
  color: #4a6cf7;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.logout-button:hover {
  background-color: #4a6cf7;
  color: white;
}

.app-content {
  display: flex;
  flex: 1;
}

.app-sidebar {
  width: 250px;
  background-color: white;
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.05);
  padding: 1.5rem 0;
  flex-shrink: 0;
}

.app-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 0.8rem 1.5rem;
  color: #555;
  text-decoration: none;
  transition: all 0.2s;
  gap: 0.8rem;
}

.nav-link:hover, .router-link-active {
  background-color: #f0f4ff;
  color: #4a6cf7;
  border-left: 3px solid #4a6cf7;
}

.nav-icon {
  font-size: 1.2rem;
}

.app-main {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .app-content {
    flex-direction: column;
  }

  .app-sidebar {
    width: 100%;
    padding: 0.5rem 0;
  }

  .app-main {
    padding: 1rem;
  }
}
</style>
