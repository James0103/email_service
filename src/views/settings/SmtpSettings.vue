<template>
  <div class="smtp-settings">
    <h2>SMTP 설정</h2>
    <p class="settings-description">
      이메일 발송을 위한 SMTP 서버 정보를 설정합니다. 설정한 SMTP 서버를 통해 고객에게 시리얼 번호가 포함된 이메일이 발송됩니다.
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
          SMTP 설정이 성공적으로 저장되었습니다.
        </div>
        <div v-else-if="saveError" class="error-message">
          {{ saveError }}
        </div>
      </div>

      <div v-if="isConnected" class="connection-status connected">
        <div class="status-icon">✅</div>
        <div class="status-details">
          <h3>연결됨</h3>
          <p>SMTP 서버가 성공적으로 연결되었습니다.</p>
          <p class="connection-info">마지막 확인: {{ lastChecked }}</p>
        </div>
      </div>

      <div v-else-if="!isLoading" class="connection-status not-connected">
        <div class="status-icon">❌</div>
        <div class="status-details">
          <h3>연결되지 않음</h3>
          <p>SMTP 서버에 연결되어 있지 않습니다. 아래에서 SMTP 정보를 입력하세요.</p>
        </div>
      </div>

      <form @submit.prevent="saveSmtpSettings">
        <div class="form-group">
          <label for="smtpHost">SMTP 호스트</label>
          <input
            id="smtpHost"
            type="text"
            v-model="smtpHost"
            placeholder="예: smtp.gmail.com"
            required
          />
        </div>

        <div class="form-group">
          <label for="smtpPort">SMTP 포트</label>
          <input
            id="smtpPort"
            type="number"
            v-model="smtpPort"
            placeholder="예: 587"
            required
          />
          <div class="form-hint">
            일반적으로 사용되는 포트: 25, 465(SSL), 587(TLS)
          </div>
        </div>

        <div class="form-group">
          <label for="smtpSecure">보안 연결 (SSL/TLS)</label>
          <select id="smtpSecure" v-model="smtpSecure">
            <option value="none">없음</option>
            <option value="tls">TLS</option>
            <option value="ssl">SSL</option>
          </select>
        </div>

        <div class="form-group">
          <label for="smtpUsername">SMTP 사용자명</label>
          <input
            id="smtpUsername"
            type="text"
            v-model="smtpUsername"
            placeholder="이메일 주소 또는 사용자명"
            required
          />
        </div>

        <div class="form-group">
          <label for="smtpPassword">SMTP 비밀번호</label>
          <input
            id="smtpPassword"
            type="password"
            v-model="smtpPassword"
            placeholder="SMTP 비밀번호"
            required
          />
          <div class="form-hint">
            Gmail을 사용하는 경우 앱 비밀번호를 생성하여 사용하세요.
          </div>
        </div>

        <div class="form-group">
          <label for="senderEmail">발신자 이메일</label>
          <input
            id="senderEmail"
            type="email"
            v-model="senderEmail"
            placeholder="고객에게 표시될 발신자 이메일"
            required
          />
        </div>

        <div class="form-group">
          <label for="senderName">발신자 이름</label>
          <input
            id="senderName"
            type="text"
            v-model="senderName"
            placeholder="고객에게 표시될 발신자 이름"
            required
          />
        </div>

        <div class="form-actions">
          <button
            type="button"
            class="test-connection-button"
            @click="testConnection"
            :disabled="isTesting || !isFormValid || isSaving"
          >
            {{ isTesting ? '테스트 중...' : '연결 테스트' }}
          </button>

          <button
            type="submit"
            class="save-button"
            :disabled="isSaving || !isFormValid"
          >
            {{ isSaving ? '저장 중...' : '저장' }}
          </button>
        </div>
      </form>
    </div>

    <div class="settings-card smtp-instructions">
      <h3>SMTP 설정 도움말</h3>

      <div class="instruction-section">
        <h4>주요 이메일 서비스 SMTP 설정</h4>

        <div class="service-settings">
          <div class="service-item">
            <strong>Gmail</strong>
            <ul>
              <li>호스트: smtp.gmail.com</li>
              <li>포트: 587</li>
              <li>보안: TLS</li>
              <li>사용자명: 이메일 주소</li>
              <li>비밀번호: 앱 비밀번호 (Google 계정 설정에서 생성)</li>
            </ul>
            <a href="https://support.google.com/accounts/answer/185833" target="_blank">Gmail 앱 비밀번호 설정 방법</a>
          </div>

          <div class="service-item">
            <strong>Naver</strong>
            <ul>
              <li>호스트: smtp.naver.com</li>
              <li>포트: 587</li>
              <li>보안: TLS</li>
              <li>사용자명: 이메일 주소</li>
              <li>비밀번호: 네이버 계정 비밀번호</li>
            </ul>
            <p>SMTP 설정 전 네이버 메일 환경설정에서 POP3/SMTP 사용 설정 필요</p>
          </div>
        </div>
      </div>

      <div class="instruction-section">
        <h4>안내사항</h4>
        <ul class="notice-list">
          <li>대량의 이메일 발송은 이메일 제공업체의 정책에 따라 제한될 수 있습니다.</li>
          <li>Gmail, Naver 등의 무료 이메일 서비스는 일일 발송량 제한이 있습니다.</li>
          <li>대량 발송이 필요한 경우 Amazon SES, SendGrid 등의 전문 서비스 이용을 권장합니다.</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()

// 설정 상태
const smtpHost = ref('')
const smtpPort = ref(587)
const smtpSecure = ref('tls')
const smtpUsername = ref('')
const smtpPassword = ref('')
const senderEmail = ref('')
const senderName = ref('')
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

// 폼 유효성 검사
const isFormValid = computed(() => {
  return (
    smtpHost.value &&
    smtpPort.value &&
    smtpUsername.value &&
    smtpPassword.value &&
    senderEmail.value &&
    senderName.value
  )
})

// 초기 데이터 로드
onMounted(async () => {
  if (authStore.user) {
    await loadSmtpSettings()
  }
})

// SMTP 설정 로드
async function loadSmtpSettings() {
  isLoading.value = true

  try {
    const { data, error } = await supabase
      .from('smtp_settings')
      .select('*')
      .eq('user_id', authStore.user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116은 결과 없음 에러
      console.error('SMTP 설정 로드 오류:', error)
      return
    }

    if (data) {
      smtpHost.value = data.host || ''
      smtpPort.value = data.port || 587
      smtpSecure.value = data.secure || 'tls'
      smtpUsername.value = data.username || ''
      smtpPassword.value = data.password || ''
      senderEmail.value = data.sender_email || ''
      senderName.value = data.sender_name || ''
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
    console.error('SMTP 설정 로드 중 오류:', err)
  } finally {
    isLoading.value = false
  }
}

// SMTP 설정 저장
async function saveSmtpSettings() {
  if (!isFormValid.value) return

  isSaving.value = true
  saveSuccess.value = false
  saveError.value = null

  try {
    // SMTP 설정 저장 (암호화는 서버 측에서 처리)
    const { error } = await supabase
      .from('smtp_settings')
      .upsert({
        user_id: authStore.user.id,
        host: smtpHost.value,
        port: smtpPort.value,
        secure: smtpSecure.value,
        username: smtpUsername.value,
        password: smtpPassword.value,
        sender_email: senderEmail.value,
        sender_name: senderName.value,
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
    console.error('SMTP 설정 저장 오류:', err)
    saveError.value = 'SMTP 설정 저장 중 오류가 발생했습니다.'
  } finally {
    isSaving.value = false
  }
}

// SMTP 연결 테스트
async function testConnection() {
  if (!isFormValid.value) return

  isTesting.value = true
  testSuccess.value = false
  testError.value = null

  try {
    // 서버리스 함수를 통한 SMTP 연결 테스트
    const { data, error } = await supabase.functions.invoke('test-smtp-connection', {
      body: {
        host: smtpHost.value,
        port: parseInt(smtpPort.value),
        secure: smtpSecure.value,
        username: smtpUsername.value,
        password: smtpPassword.value,
        senderEmail: senderEmail.value,
        senderName: senderName.value
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
      alert('SMTP 연결 테스트에 성공했습니다.')
    } else {
      isConnected.value = false
      throw new Error(data?.message || '알 수 없는 오류가 발생했습니다.')
    }

  } catch (err) {
    console.error('SMTP 연결 테스트 오류:', err)
    testError.value = err.message || 'SMTP 연결 테스트 중 오류가 발생했습니다.'
    alert(`연결 테스트 실패: ${testError.value}`)
    isConnected.value = false
  } finally {
    isTesting.value = false
  }
}
</script>

<style scoped>
.smtp-settings {
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

input, select {
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

.smtp-instructions {
  background-color: #f8f9fa;
}

.smtp-instructions h3 {
  font-size: 1.3rem;
  margin-bottom: 1rem;
  color: #333;
}

.instruction-section {
  margin-bottom: 1.5rem;
}

.instruction-section h4 {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: #444;
}

.service-settings {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.service-item {
  background-color: white;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #eee;
}

.service-item strong {
  display: block;
  margin-bottom: 0.8rem;
  font-size: 1.1rem;
  color: #333;
}

.service-item ul {
  margin: 0 0 1rem 1.5rem;
  padding: 0;
}

.service-item li {
  margin-bottom: 0.3rem;
  color: #666;
}

.service-item a {
  color: #4a6cf7;
  text-decoration: none;
  font-size: 0.9rem;
}

.service-item a:hover {
  text-decoration: underline;
}

.service-item p {
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.5rem;
}

.notice-list {
  margin: 0 0 0 1.5rem;
  padding: 0;
}

.notice-list li {
  margin-bottom: 0.5rem;
  color: #666;
}

@media (max-width: 767px) {
  .service-settings {
    grid-template-columns: 1fr;
  }
}
</style>
