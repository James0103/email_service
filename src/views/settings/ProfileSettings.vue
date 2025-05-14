<template>
  <div class="profile-settings">
    <h2>프로필 설정</h2>

    <div class="settings-card">
      <div v-if="isUpdating || updateSuccess || updateError" class="update-status">
        <div v-if="isUpdating" class="updating-message">
          업데이트 중...
        </div>
        <div v-else-if="updateSuccess" class="success-message">
          프로필이 성공적으로 업데이트되었습니다.
        </div>
        <div v-else-if="updateError" class="error-message">
          {{ updateError }}
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
          <label for="fullName">이름</label>
          <input
            id="fullName"
            type="text"
            v-model="fullName"
            placeholder="이름을 입력하세요"
          />
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

        <div class="form-actions">
          <button type="submit" class="save-button" :disabled="isUpdating">저장</button>
        </div>
      </form>
    </div>

    <div class="settings-card">
      <h3>비밀번호 변경</h3>

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

    <div class="settings-card danger-zone">
      <h3>계정 삭제</h3>
      <p>계정을 삭제하시면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.</p>
      <button class="delete-account-button" @click="confirmDeleteAccount">계정 삭제</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { supabase } from '../../lib/supabase'

const authStore = useAuthStore()

// 프로필 정보
const email = ref('')
const fullName = ref('')
const companyName = ref('')

// 프로필 업데이트 상태
const isUpdating = ref(false)
const updateSuccess = ref(false)
const updateError = ref(null)

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
    email.value = authStore.user.email || ''

    // 프로필 정보 불러오기
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, company_name')
        .eq('user_id', authStore.user.id)
        .single()

      if (data) {
        fullName.value = data.full_name || ''
        companyName.value = data.company_name || ''
      } else if (error) {
        console.error('프로필 정보 로드 중 오류:', error)
      }
    } catch (err) {
      console.error('프로필 정보 로드 중 오류:', err)
    }
  }
})

// 프로필 업데이트 함수
async function updateProfile() {
  isUpdating.value = true
  updateSuccess.value = false
  updateError.value = null

  try {
    // profiles 테이블에 사용자 정보 업데이트 또는 생성
    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: authStore.user.id,
        full_name: fullName.value,
        company_name: companyName.value,
        updated_at: new Date().toISOString()
      })

    if (error) throw error

    updateSuccess.value = true

    // 3초 후 성공 메시지 숨기기
    setTimeout(() => {
      updateSuccess.value = false
    }, 3000)

  } catch (err) {
    console.error('프로필 업데이트 오류:', err)
    updateError.value = '프로필 업데이트 중 오류가 발생했습니다.'
  } finally {
    isUpdating.value = false
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

    // 로그인 페이지로 리다이렉트 (라우터 인스턴스가 없으므로 window.location 사용)
    window.location.href = '/login'

  } catch (err) {
    console.error('계정 삭제 오류:', err)
    alert('계정 삭제 중 오류가 발생했습니다.')
  }
}
</script>

<style scoped>
.profile-settings {
  max-width: 800px;
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

.settings-card {
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid #eee;
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
}

.save-button {
  padding: 0.7rem 1.5rem;
  background-color: #4a6cf7;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.save-button:hover:not(:disabled) {
  background-color: #3a5ce4;
}

.save-button:disabled {
  background-color: #a0aed0;
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

.danger-zone {
  border-color: #ffebee;
}

.danger-zone h3 {
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
</style>
