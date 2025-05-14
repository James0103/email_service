<template>
  <div class="settings-container">
    <header class="page-header">
      <h1>설정</h1>
    </header>

    <div class="settings-content">
      <!-- 프로필 설정 섹션 -->
      <div class="settings-card">
        <h2>프로필 설정</h2>

        <div v-if="profileIsUpdating || profileUpdateSuccess || profileUpdateError" class="update-status">
          <div v-if="profileIsUpdating" class="updating-message">
            업데이트 중...
          </div>
          <div v-else-if="profileUpdateSuccess" class="success-message">
            프로필이 성공적으로 업데이트되었습니다.
          </div>
          <div v-else-if="profileUpdateError" class="error-message">
            {{ profileUpdateError }}
          </div>
        </div>

        <form @submit.prevent="updateProfile">
          <div class="form-group">
            <label for="email">이메일</label>
            <input
              id="email"
              type="email"
              v-model="email"
              disabled
            />
            <div class="form-hint">이메일 주소는 변경할 수 없습니다.</div>
          </div>

          <div class="form-group">
            <label for="companyName">회사/상점명</label>
            <input
              id="companyName"
              type="text"
              v-model="companyName"
              placeholder="회사 또는 상점 이름을 입력하세요"
            />
          </div>

          <div class="form-group">
            <label for="clientId">네이버 API Client ID</label>
            <input
              id="clientId"
              type="text"
              v-model="clientId"
              placeholder="네이버 API Client ID를 입력하세요"
            />
            <div class="form-hint">
              네이버 개발자 센터 애플리케이션에서 발급받은 Client ID
            </div>
          </div>

          <div class="button-group">
            <button
              type="button"
              class="test-connection-button"
              @click="testNaverConnection"
              :disabled="isNaverTesting || !clientId"
            >
              {{ isNaverTesting ? '테스트 중...' : '연결 테스트' }}
            </button>
            <button type="submit" class="save-button" :disabled="profileIsUpdating">저장</button>
          </div>
        </form>
      </div>

      <!-- 네이버 API 설정 방법 섹션 -->
      <div class="settings-card api-instructions">
        <h2>네이버 커머스 API 설정 방법</h2>

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
            <p>애플리케이션 등록 후 발급된 Client ID를 위 입력란에 입력합니다.</p>
          </li>
        </ol>
      </div>

      <!-- 비밀번호 변경 섹션 -->
      <div class="settings-card">
        <h2>비밀번호 변경</h2>

        <div v-if="passwordIsUpdating || passwordUpdateSuccess || passwordUpdateError" class="update-status">
          <div v-if="passwordIsUpdating" class="updating-message">
            비밀번호 업데이트 중...
          </div>
          <div v-else-if="passwordUpdateSuccess" class="success-message">
            비밀번호가 성공적으로 변경되었습니다.
          </div>
          <div v-else-if="passwordUpdateError" class="error-message">
            {{ passwordUpdateError }}
          </div>
        </div>

        <form @submit.prevent="updatePassword">
          <div class="form-group">
            <label for="currentPassword">현재 비밀번호</label>
            <input
              id="currentPassword"
              type="password"
              v-model="currentPassword"
              placeholder="현재 비밀번호를 입력하세요"
              required
            />
          </div>

          <div class="form-group">
            <label for="newPassword">새 비밀번호</label>
            <input
              id="newPassword"
              type="password"
              v-model="newPassword"
              placeholder="새 비밀번호를 입력하세요 (최소 6자)"
              required
              minlength="6"
            />
          </div>

          <div class="form-group">
            <label for="confirmPassword">비밀번호 확인</label>
            <input
              id="confirmPassword"
              type="password"
              v-model="confirmPassword"
              placeholder="새 비밀번호를 다시 입력하세요"
              required
              minlength="6"
            />
          </div>

          <div class="form-actions">
            <button
              type="submit"
              class="save-button"
              :disabled="passwordIsUpdating || !newPassword || !confirmPassword || newPassword !== confirmPassword"
            >
              비밀번호 변경
            </button>
          </div>
        </form>
      </div>

      <!-- 계정 삭제 섹션 -->
      <div class="settings-card danger-zone">
        <h2>계정 삭제</h2>
        <p>계정을 삭제하시면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.</p>
        <button class="delete-account-button" @click="confirmDeleteAccount">계정 삭제</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

// 프로필 정보
const email = ref('')
const companyName = ref('')
const clientId = ref('')

// 프로필 업데이트 상태
const profileIsUpdating = ref(false)
const profileUpdateSuccess = ref(false)
const profileUpdateError = ref(null)

// 네이버 API 연결 상태
const isNaverTesting = ref(false)

// 비밀번호 변경 관련
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const passwordIsUpdating = ref(false)
const passwordUpdateSuccess = ref(false)
const passwordUpdateError = ref(null)

// 초기 데이터 로드
onMounted(async () => {
  if (authStore.user) {
    await loadProfileData()
  }
})

// 프로필 정보 로드
async function loadProfileData() {
  if (!authStore.user) return

  email.value = authStore.user.email || ''

  try {
    // 프로필 정보 로드
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('company_name')
      .eq('user_id', authStore.user.id)
      .single()

    if (profileData) {
      companyName.value = profileData.company_name || ''
    } else if (profileError && profileError.code !== 'PGRST116') {
      console.error('프로필 정보 로드 중 오류:', profileError)
    }

    // 네이버 API Client ID 로드
    const { data: apiData, error: apiError } = await supabase
      .from('api_settings')
      .select('client_id')
      .eq('user_id', authStore.user.id)
      .eq('api_type', 'naver_commerce')
      .single()

    if (apiData) {
      clientId.value = apiData.client_id || ''
    } else if (apiError && apiError.code !== 'PGRST116') {
      console.error('API 설정 로드 중 오류:', apiError)
    }
  } catch (err) {
    console.error('설정 로드 중 오류:', err)
  }
}

// 프로필 업데이트 함수
async function updateProfile() {
  if (!authStore.user) return

  profileIsUpdating.value = true
  profileUpdateSuccess.value = false
  profileUpdateError.value = null

  try {
    // 프로필 정보 업데이트
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: authStore.user.id,
        company_name: companyName.value,
        updated_at: new Date().toISOString()
      })

    if (profileError) throw profileError

    // 네이버 API Client ID 업데이트
    const { error: apiError } = await supabase
      .from('api_settings')
      .upsert({
        user_id: authStore.user.id,
        api_type: 'naver_commerce',
        client_id: clientId.value,
        updated_at: new Date().toISOString()
      })

    if (apiError) throw apiError

    profileUpdateSuccess.value = true

    // 3초 후 성공 메시지 숨기기
    setTimeout(() => {
      profileUpdateSuccess.value = false
    }, 3000)

  } catch (err) {
    console.error('프로필 업데이트 오류:', err)
    profileUpdateError.value = '프로필 업데이트 중 오류가 발생했습니다.'
  } finally {
    profileIsUpdating.value = false
  }
}

// 네이버 API 연결 테스트
async function testNaverConnection() {
  if (!clientId.value) return

  isNaverTesting.value = true

  try {
    // 서버리스 함수를 통한 API 연결 테스트
    const { data, error } = await supabase.functions.invoke('test-naver-api-connection', {
      body: {
        clientId: clientId.value
      }
    })

    if (error) throw error

    if (data && data.success) {
      alert('네이버 API 연결 테스트에 성공했습니다.')
    } else {
      throw new Error(data?.message || '알 수 없는 오류가 발생했습니다.')
    }
  } catch (err) {
    console.error('네이버 API 연결 테스트 오류:', err)
    alert(`연결 테스트 실패: ${err.message || '네이버 API 연결 테스트 중 오류가 발생했습니다.'}`)
  } finally {
    isNaverTesting.value = false
  }
}

// 비밀번호 변경 함수
async function updatePassword() {
  if (newPassword.value !== confirmPassword.value) {
    passwordUpdateError.value = '새 비밀번호가 일치하지 않습니다.'
    return
  }

  passwordIsUpdating.value = true
  passwordUpdateSuccess.value = false
  passwordUpdateError.value = null

  try {
    // 현재 비밀번호로 로그인 시도하여 확인
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: currentPassword.value
    })

    if (signInError) {
      throw new Error('현재 비밀번호가 올바르지 않습니다.')
    }

    // 비밀번호 변경
    const { error } = await supabase.auth.updateUser({
      password: newPassword.value
    })

    if (error) throw error

    // 성공 시 입력값 초기화
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''

    passwordUpdateSuccess.value = true

    // 3초 후 성공 메시지 숨기기
    setTimeout(() => {
      passwordUpdateSuccess.value = false
    }, 3000)

  } catch (err) {
    console.error('비밀번호 변경 오류:', err)
    passwordUpdateError.value = err.message || '비밀번호 변경 중 오류가 발생했습니다.'
  } finally {
    passwordIsUpdating.value = false
  }
}

// 계정 삭제 확인
function confirmDeleteAccount() {
  if (confirm('정말로 계정을 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.')) {
    deleteAccount()
  }
}

// 계정 삭제 함수
async function deleteAccount() {
  try {
    // 사용자 데이터 및 프로필 삭제 (트랜잭션 필요)
    const { error } = await supabase.rpc('delete_user_account')

    if (error) throw error

    // 로그아웃
    await authStore.logout()

    // 로그인 페이지로 리다이렉트
    window.location.href = '/login'

  } catch (err) {
    console.error('계정 삭제 오류:', err)
    alert('계정 삭제 중 오류가 발생했습니다.')
  }
}
</script>

<style scoped>
.settings-container {
  padding: 2rem;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 2rem;
}

h1 {
  font-size: 1.8rem;
  margin: 0;
  color: #333;
}

h2 {
  font-size: 1.6rem;
  margin-bottom: 1.5rem;
  color: #333;
}

h3 {
  font-size: 1.3rem;
  margin-bottom: 1rem;
  color: #333;
}

.settings-description {
  margin-bottom: 1.5rem;
  color: #666;
}

.settings-content {
  max-width: 800px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.settings-card {
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid #eee;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
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

input:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
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

.button-group {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
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

.danger-zone {
  border-color: #ffebee;
}

.danger-zone h2 {
  color: #d32f2f;
}

.danger-zone p {
  margin-bottom: 1rem;
  color: #666;
}

.delete-account-button {
  padding: 0.7rem 1.5rem;
  background-color: #d32f2f;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.delete-account-button:hover {
  background-color: #b71c1c;
}

@media (max-width: 767px) {
  .button-group {
    flex-direction: column;
  }

  .button-group button {
    width: 100%;
  }
}
</style>
