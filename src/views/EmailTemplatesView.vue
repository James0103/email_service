<template>
  <div class="email-templates-container">
    <header class="page-header">
      <h1>이메일 템플릿 설정</h1>
      <button
        class="save-button"
        @click="saveTemplate"
        :disabled="isSaving"
      >
        {{ isSaving ? '저장 중...' : '템플릿 저장' }}
      </button>
    </header>

    <div class="template-content">
      <!-- 왼쪽: 입력 필드 -->
      <div class="template-form">
        <div class="form-group">
          <label for="email_subject">이메일 제목</label>
          <input
            id="email_subject"
            type="text"
            v-model="template.email_subject"
            placeholder="이메일 제목을 입력하세요"
          />
        </div>

        <div class="form-group">
          <label for="email_body">이메일 내용</label>
          <textarea
            id="email_body"
            v-model="template.email_body"
            placeholder="안녕하세요,&#10;&#10;주문하신 상품의 시리얼 번호는 다음과 같습니다:&#10;시리얼 번호: {{serial_number}}&#10;&#10;감사합니다."
            rows="8"
          ></textarea>
          <div class="form-hint">
            다음 변수를 사용할 수 있습니다: {{serial_number}}, {{product_name}}, {{order_id}}
          </div>
        </div>

        <div class="form-group">
          <label for="logo_image">로고 이미지</label>
          <div class="logo-upload">
            <input
              id="logoInput"
              type="file"
              accept="image/*"
              ref="logoInput"
              @change="handleLogoUpload"
              class="file-input"
            />
            <button
              class="upload-button"
              @click="$refs.logoInput.click()"
            >
              로고 이미지 업로드
            </button>
            <span class="selected-file">{{ logoFileName || '선택된 파일 없음' }}</span>
          </div>
          <div v-if="template.logo_image" class="logo-preview">
            <img :src="template.logo_image" alt="로고 미리보기" />
            <button class="remove-logo" @click="removeLogo">✕</button>
          </div>
        </div>

        <div class="form-group">
          <label for="cs_phone_number">연락처</label>
          <input
            id="cs_phone_number"
            type="text"
            v-model="template.cs_phone_number"
            placeholder="고객 문의 연락처를 입력하세요"
          />
        </div>

        <div class="form-group">
          <label for="cs_email_address">이메일</label>
          <input
            id="cs_email_address"
            type="email"
            v-model="template.cs_email_address"
            placeholder="고객 문의 이메일을 입력하세요"
          />
        </div>

        <div class="form-group">
          <label for="cs_address">주소</label>
          <input
            id="cs_address"
            type="text"
            v-model="template.cs_address"
            placeholder="회사 주소를 입력하세요"
          />
        </div>
      </div>

      <!-- 오른쪽: 이메일 프리뷰 -->
      <div class="template-preview">
        <div class="preview-header">
          <h3>이메일 미리보기</h3>
        </div>
        <div class="email-preview">
          <div v-if="template.logo_image" class="preview-logo">
            <img :src="template.logo_image" alt="로고" />
          </div>
          <div class="preview-subject">
            <strong>제목:</strong> {{ template.email_subject || '(제목 없음)' }}
          </div>
          <div class="preview-body">
            <div style="white-space: pre-line">{{ template.email_body || '(내용 없음)' }}</div>
          </div>
          <div class="preview-footer">
            <div v-if="template.cs_phone_number" class="footer-item">
              <strong>연락처:</strong> {{ template.cs_phone_number }}
            </div>
            <div v-if="template.cs_email_address" class="footer-item">
              <strong>이메일:</strong> {{ template.cs_email_address }}
            </div>
            <div v-if="template.cs_address" class="footer-item">
              <strong>주소:</strong> {{ template.cs_address }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();

// 템플릿 데이터
const template = ref({
  email_subject: '',
  email_body: '',
  logo_image: '',
  cs_phone_number: '',
  cs_email_address: '',
  cs_address: ''
});

// UI 상태
const isSaving = ref(false);
const logoFileName = ref('');

// 페이지 로드 시 템플릿 데이터 가져오기
onMounted(async () => {
  if (authStore.user) {
    await loadTemplateData();
  }
});

// 템플릿 데이터 로드
async function loadTemplateData() {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('user_id', authStore.user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116은 데이터 없음 에러
      console.error('템플릿 로드 오류:', error);
      return;
    }

    if (data) {
      template.value = {
        email_subject: data.email_subject || '',
        email_body: data.email_body || '',
        logo_image: data.logo_image || '',
        cs_phone_number: data.cs_phone_number || '',
        cs_email_address: data.cs_email_address || '',
        cs_address: data.cs_address || ''
      };
    }
  } catch (err) {
    console.error('템플릿 데이터 로드 중 오류:', err);
  }
}

// 로고 이미지 업로드 처리
async function handleLogoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  logoFileName.value = file.name;

  // 여기서는 간단하게 base64로 인코딩하여 저장
  // 실제 서비스에서는 Supabase Storage 등을 사용하여 업로드할 수 있음
  const reader = new FileReader();
  reader.onload = (e) => {
    template.value.logo_image = e.target.result;
  };
  reader.readAsDataURL(file);
}

// 로고 제거
function removeLogo() {
  template.value.logo_image = '';
  logoFileName.value = '';
  const logoInputElement = document.querySelector('#logoInput');
  if (logoInputElement) {
    logoInputElement.value = '';
  }
}

// 템플릿 저장
async function saveTemplate() {
  if (!authStore.user) return;

  isSaving.value = true;

  try {
    const { error } = await supabase
      .from('email_templates')
      .upsert({
        user_id: authStore.user.id,
        email_subject: template.value.email_subject,
        email_body: template.value.email_body,
        logo_image: template.value.logo_image,
        cs_phone_number: template.value.cs_phone_number,
        cs_email_address: template.value.cs_email_address,
        cs_address: template.value.cs_address,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    alert('이메일 템플릿이 성공적으로 저장되었습니다.');
  } catch (err) {
    console.error('템플릿 저장 오류:', err);
    alert('템플릿 저장 중 오류가 발생했습니다.');
  } finally {
    isSaving.value = false;
  }
}
</script>

<style scoped>
.email-templates-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

h1 {
  font-size: 1.8rem;
  margin: 0;
  color: #333;
}

.save-button {
  background-color: #4a6cf7;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.save-button:hover:not(:disabled) {
  background-color: #3a5ce4;
}

.save-button:disabled {
  background-color: #a0aed0;
  cursor: not-allowed;
}

.template-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.template-form, .template-preview {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #555;
}

input, textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
}

textarea {
  resize: vertical;
}

.form-hint {
  font-size: 0.8rem;
  color: #888;
  margin-top: 0.5rem;
}

.logo-upload {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.file-input {
  display: none;
}

.upload-button {
  background-color: #f0f4ff;
  color: #4a6cf7;
  border: 1px solid #e0e7ff;
  padding: 0.6rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.selected-file {
  font-size: 0.9rem;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logo-preview {
  position: relative;
  display: inline-block;
  margin-top: 0.5rem;
}

.logo-preview img {
  max-width: 200px;
  max-height: 100px;
  border: 1px solid #eee;
  border-radius: 4px;
}

.remove-logo {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #ff4d4f;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.7rem;
  font-weight: bold;
}

.preview-header {
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
}

.preview-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
}

.email-preview {
  background-color: #f8f9fa;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 1.5rem;
  min-height: 400px;
}

.preview-logo {
  text-align: center;
  margin-bottom: 1.5rem;
}

.preview-logo img {
  max-width: 200px;
  max-height: 80px;
}

.preview-subject {
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px dashed #eee;
}

.preview-body {
  margin-bottom: 2rem;
  line-height: 1.6;
}

.preview-footer {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px dashed #eee;
  font-size: 0.9rem;
  color: #666;
}

.footer-item {
  margin-bottom: 0.5rem;
}

@media (max-width: 992px) {
  .template-content {
    grid-template-columns: 1fr;
  }
}
</style>
