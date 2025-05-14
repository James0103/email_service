<template>
  <div class="dashboard-container">
    <div class="dashboard-welcome">
      <h2>안녕하세요, {{ authStore.user?.email }} 님!</h2>
      <p>스마트 시리얼 이메일러에 오신 것을 환영합니다.</p>
    </div>

    <div class="dashboard-stats">
      <div class="stat-card">
        <h3>시리얼 번호</h3>
        <div class="stat-value">0</div>
        <div class="stat-description">등록된 시리얼 수</div>
      </div>

      <div class="stat-card">
        <h3>이메일 발송</h3>
        <div class="stat-value">0</div>
        <div class="stat-description">총 발송 수</div>
      </div>

      <div class="stat-card">
        <h3>네이버 연동</h3>
        <div class="stat-value">
          <span v-if="isNaverConnected" class="status-connected">연결됨</span>
          <span v-else class="status-disconnected">연결 필요</span>
        </div>
        <div class="stat-description">API 상태</div>
      </div>

      <div class="stat-card">
        <h3>SMTP 설정</h3>
        <div class="stat-value">
          <span v-if="isSmtpConfigured" class="status-connected">설정됨</span>
          <span v-else class="status-disconnected">설정 필요</span>
        </div>
        <div class="stat-description">이메일 발송 설정</div>
      </div>
    </div>

    <div class="dashboard-actions">
      <h3>빠른 작업</h3>
      <div class="action-buttons">
        <router-link to="/serial-numbers/upload" class="action-button">
          <span class="action-icon">📤</span>
          <span>시리얼 번호 업로드</span>
        </router-link>

        <router-link to="/settings/naver" class="action-button">
          <span class="action-icon">🔄</span>
          <span>네이버 API 연동</span>
        </router-link>

        <router-link to="/settings/smtp" class="action-button">
          <span class="action-icon">📧</span>
          <span>SMTP 설정</span>
        </router-link>

        <router-link to="/logs" class="action-button">
          <span class="action-icon">🔍</span>
          <span>발송 내역 확인</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

// 서비스 연결 상태 (나중에 실제 데이터로 교체)
const isNaverConnected = ref(false);
const isSmtpConfigured = ref(false);

// 페이지 로드 시 사용자 인증 확인
onMounted(async () => {
  if (!authStore.isAuthenticated) {
    await authStore.checkSession();
    if (!authStore.isAuthenticated) {
      router.push('/login');
    }
  }

  // 나중에 여기서 네이버 API와 SMTP 연결 상태를 확인하는 로직 추가 예정
});
</script>

<style scoped>
.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.dashboard-welcome {
  margin-bottom: 1rem;
}

.dashboard-welcome h2 {
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.dashboard-welcome p {
  color: #666;
  font-size: 1.1rem;
}

.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stat-card h3 {
  font-size: 1rem;
  color: #666;
  margin-top: 0;
  margin-bottom: 1rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.8rem;
}

.stat-description {
  font-size: 0.9rem;
  color: #888;
}

.status-connected {
  color: #2e7d32;
  font-size: 1.2rem;
}

.status-disconnected {
  color: #d32f2f;
  font-size: 1.2rem;
}

.dashboard-actions {
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.dashboard-actions h3 {
  font-size: 1.2rem;
  color: #333;
  margin-top: 0;
  margin-bottom: 1.5rem;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.action-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem 1rem;
  text-decoration: none;
  color: #333;
  transition: all 0.2s;
}

.action-button:hover {
  background-color: #f0f4ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.action-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .dashboard-stats {
    grid-template-columns: 1fr;
  }
}
</style>
