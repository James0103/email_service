<template>
  <div class="naver-settings">
    <h2>네이버 커머스 API 연동</h2>
    <p class="settings-description">
      네이버 커머스 API를 연동하여 자동으로 주문 정보를 불러올 수 있습니다.
      <a href="https://developers.naver.com/docs/marketplace/overview/" target="_blank" class="help-link">
        네이버 커머스 API 문서 보기
      </a>
    </p>

    <div class="settings-card">
      <div v-if="isLoading" class="loading-state">
        <p>정보를 불러오는 중...</p>
      </div>

      <div v-else-if="isSaving || saveSuccess || saveError" class="update-status">
        <div v-if="isSaving" class="updating-message">
          저장 중...
        </div>
        <div v-else-if="saveSuccess" class="success-message">
          네이버 API 설정이 성공적으로 저장되었습니다.
        </div>
        <div v-else-if="saveError" class="error-message">
          {{ saveError }}
        </div>
      </div>

      <div v-if="isConnected" class="connection-status connected">
        <div class="status-icon">✅</div>
        <div class="status-details">
          <h3>연결됨</h3>
          <p>네이버 커머스 API가 성공적으로 연결되었습니다.</p>
          <p class="connection-info">마지막 확인: {{ lastChecked }}</p>
        </div>
      </div>

      <div v-else-if="!isLoading" class="connection-status not-connected">
        <div class="status-icon">❌</div>
        <div class="status-details">
          <h3>연결되지 않음</h3>
          <p>네이버 커머스 API에 연결되어 있지 않습니다. 아래에서 API 정보를 입력하세요.</p>
        </div>
      </div>

      <form @submit.prevent="saveNaverApiSettings">
        <div class="form-group">
          <label for="clientId">Client ID</label>
          <input
            id="clientId"
            type="text"
            v-model="clientId"
            placeholder="네이버 API Client ID를 입력하세요"
            required
          />
          <div class="form-hint">
            네이버 개발자 센터 애플리케이션에서 발급받은 Client ID
          </div>
        </div>

        <div class="form-group">
          <label for="clientSecret">Client Secret</label>
          <input
            id="clientSecret"
            type="password"
            v-model="clientSecret"
            placeholder="네이버 API Client Secret을 입력하세요"
            required
          />
          <div class="form-hint">
            네이버 개발자 센터 애플리케이션에서 발급받은 Client Secret
          </div>
        </div>

        <div class="form-actions">
          <button
            type="button"
            class="test-connection-button"
            @click="testConnection"
            :disabled="isTesting || !clientId || !clientSecret || isSaving"
          >
            {{ isTesting ? '테스트 중...' : '연결 테스트' }}
          </button>

          <button
            type="submit"
            class="save-button"
            :disabled="isSaving || !clientId || !clientSecret"
          >
            {{ isSaving ? '저장 중...' : '저장' }}
          </button>
        </div>
      </form>
    </div>

    <div class="settings-card api-instructions">
      <h3>네이버 커머스 API 설정 방법</h3>

      <ol class="instruction-steps">
        <li>
          <strong>네이버 개발자 센터 가입</strong>
          <p>네이버 개발자 센터에 가입하고 로그인합니다.</p>
          <a href="https://developers.naver.com/" target="_blank" class="instruction-link">
            네이버 개발자 센터 바로가기
          </a>
        </li>

        <li>
          <strong>애플리케이션 등록</strong>
          <p>새로운 애플리케이션을 등록하고 다음 정보를 입력합니다:</p>
          <ul>
            <li>애플리케이션 이름: [원하는 이름]</li>
            <li>사용 API: 네이버 커머스 API 선택</li>
            <li>서비스 환경: PC웹</li>
            <li>API 권한 요청: 필요한 판매 권한 선택</li>
          </ul>
        </li>

        <li>
          <strong>Client ID와 Client Secret 발급</strong>
          <p>애플리케이션 등록 후 발급된 Client ID와 Client Secret을 위 입력란에 입력합니다.</p>
        </li>
      </ol>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()

// 설정 상태
const clientId = ref('')
const clientSecret = ref('')
const isConnected = ref(false)
const lastChecked = ref('')

// UI 상태
const isLoading = ref(true)
const isSaving = ref(false)
const isTesting = ref(false)
const saveSuccess = ref(false)
const saveError = ref(null)
const testSuccess = ref(false)
const testError = ref(null)

// 초기 데이터 로드
onMounted(async () => {
  if (authStore.user) {
    await loadNaverApiSettings()
  }
})

// 네이버 API 설정 로드
async function loadNaverApiSettings() {
  isLoading.value = true

  try {
    const { data, error } = await supabase
      .from('api_settings')
      .select('client_id, client_secret, is_connected, last_checked')
      .eq('user_id', authStore.user.id)
      .eq('api_type', 'naver_commerce')
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116은 결과 없음 에러
      console.error('네이버 API 설정 로드 오류:', error)
      return
    }

    if (data) {
      clientId.value = data.client_id || ''
      clientSecret.value = data.client_secret || ''
      isConnected.value = data.is_connected || false

      if (data.last_checked) {
        const date = new Date(data.last_checked)
        lastChecked.value = new Intl.DateTimeFormat('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }).format(date)
      }
    }
  } catch (err) {
    console.error('네이버 API 설정 로드 중 오류:', err)
  } finally {
    isLoading.value = false
  }
}

// 네이버 API 설정 저장
async function saveNaverApiSettings() {
  if (!clientId.value || !clientSecret.value) return

  isSaving.value = true
  saveSuccess.value = false
  saveError.value = null

  try {
    // API 설정 저장 (암호화는 서버 측에서 처리)
    const { error } = await supabase
      .from('api_settings')
      .upsert({
        user_id: authStore.user.id,
        api_type: 'naver_commerce',
        client_id: clientId.value,
        client_secret: clientSecret.value,
        is_connected: isConnected.value,
        last_checked: isConnected.value ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })

    if (error) throw error

    saveSuccess.value = true

    // 3초 후 성공 메시지 숨기기
    setTimeout(() => {
      saveSuccess.value = false
    }, 3000)

  } catch (err) {
    console.error('네이버 API 설정 저장 오류:', err)
    saveError.value = '네이버 API 설정 저장 중 오류가 발생했습니다.'
  } finally {
    isSaving.value = false
  }
}

// 네이버 API 연결 테스트
async function testConnection() {
  if (!clientId.value || !clientSecret.value) return

  isTesting.value = true
  testSuccess.value = false
  testError.value = null

  try {
    // 서버리스 함수를 통한 API 연결 테스트
    const { data, error } = await supabase.functions.invoke('test-naver-api-connection', {
      body: {
        clientId: clientId.value,
        clientSecret: clientSecret.value
      }
    })

    if (error) throw error

    if (data && data.success) {
      isConnected.value = true
      lastChecked.value = new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date())

      testSuccess.value = true
      alert('네이버 API 연결 테스트에 성공했습니다.')
    } else {
      isConnected.value = false
      throw new Error(data?.message || '알 수 없는 오류가 발생했습니다.')
    }

  } catch (err) {
    console.error('네이버 API 연결 테스트 오류:', err)
    testError.value = err.message || '네이버 API 연결 테스트 중 오류가 발생했습니다.'
    alert(`연결 테스트 실패: ${testError.value}`)
    isConnected.value = false
  } finally {
    isTesting.value = false
  }
}
</script>

<style scoped>
.naver-settings {
  max-width: 800px;
}

h2 {
  font-size: 1.6rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.settings-description {
  margin-bottom: 1.5rem;
  color: #666;
}

.help-link {
  color: #4a6cf7;
  text-decoration: none;
  margin-left: 0.5rem;
}

.help-link:hover {
  text-decoration: underline;
}

.settings-card {
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid #eee;
}

.loading-state {
  text-align: center;
  padding: 1rem;
  color: #666;
}

.connection-status {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1.5rem;
}

.connection-status.connected {
  background-color: #e8f5e9;
}

.connection-status.not-connected {
  background-color: #ffebee;
}

.status-icon {
  font-size: 2rem;
  margin-right: 1rem;
}

.status-details h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
}

.status-details p {
  margin: 0;
  color: #666;
}

.connection-info {
  font-size: 0.9rem;
  color: #888;
  margin-top: 0.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #555;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-hint {
  font-size: 0.8rem;
  color: #888;
  margin-top: 0.5rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.save-button, .test-connection-button {
  padding: 0.7rem 1.5rem;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.save-button {
  background-color: #4a6cf7;
  color: white;
  border: none;
}

.save-button:hover:not(:disabled) {
  background-color: #3a5ce4;
}

.test-connection-button {
  background-color: #f0f4ff;
  color: #4a6cf7;
  border: 1px solid #e0e7ff;
}

.test-connection-button:hover:not(:disabled) {
  background-color: #e0e7ff;
}

.save-button:disabled, .test-connection-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.update-status {
  margin-bottom: 1.5rem;
  padding: 0.8rem;
  border-radius: 4px;
  font-weight: 500;
}

.updating-message {
  background-color: #e3f2fd;
  color: #1976d2;
}

.success-message {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.error-message {
  background-color: #ffebee;
  color: #d32f2f;
}

.api-instructions {
  background-color: #f8f9fa;
}

.api-instructions h3 {
  font-size: 1.3rem;
  margin-bottom: 1rem;
  color: #333;
}

.instruction-steps {
  padding-left: 1.5rem;
}

.instruction-steps li {
  margin-bottom: 1.2rem;
}

.instruction-steps strong {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
}

.instruction-steps p {
  margin: 0.5rem 0;
  color: #666;
}

.instruction-steps ul {
  margin: 0.5rem 0 0.5rem 1.5rem;
}

.instruction-steps ul li {
  margin-bottom: 0.3rem;
}

.instruction-link {
  display: inline-block;
  color: #4a6cf7;
  text-decoration: none;
  margin-top: 0.5rem;
}

.instruction-link:hover {
  text-decoration: underline;
}
</style>
