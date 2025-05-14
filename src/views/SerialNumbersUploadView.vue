<template>
  <div class="upload-container">
    <header class="page-header">
      <h1>시리얼 번호 업로드</h1>
      <div class="action-buttons">
        <router-link to="/serial-numbers" class="back-button">
          <span>목록으로 돌아가기</span>
        </router-link>
      </div>
    </header>

    <main class="content-area">
      <div class="upload-section">
        <div class="upload-instructions">
          <h2>엑셀 파일 업로드</h2>
          <p>시리얼 번호가 포함된 엑셀 파일(.xlsx, .csv)을 업로드하세요.</p>
          <div class="template-info">
            <h3>엑셀 파일 형식</h3>
            <p>시스템에서 처리할 엑셀 파일은 다음 양식을 따라야 합니다:</p>
            <ul>
              <li><strong>첫 번째 열</strong>: 상품코드 (네이버 상품번호)</li>
              <li><strong>두 번째 열</strong>: 시리얼 번호</li>
            </ul>
            <p>헤더(첫 번째 행)는 포함해도 되고 포함하지 않아도 됩니다.</p>
            <div class="template-buttons">
              <button class="download-template-button" @click="downloadTemplate">엑셀 템플릿 다운로드</button>
              <button class="example-button" @click="showExample = !showExample">
                {{ showExample ? '예시 닫기' : '예시 보기' }}
              </button>
            </div>
          </div>

          <div v-if="showExample" class="example-table">
            <table>
              <thead>
                <tr>
                  <th>상품코드</th>
                  <th>시리얼 번호</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1234567890</td>
                  <td>ABC-DEF-12345-GHIJK</td>
                </tr>
                <tr>
                  <td>1234567890</td>
                  <td>ABC-DEF-67890-LMNOP</td>
                </tr>
                <tr>
                  <td>9876543210</td>
                  <td>XYZ-123-45678-QRSTU</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="file-upload-wrapper">
          <div
            class="file-upload-area"
            :class="{ 'active': isDragging }"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleFileDrop"
            @click="$refs.fileInput.click()"
          >
            <input
              ref="fileInput"
              type="file"
              accept=".xlsx,.csv"
              class="file-input"
              @change="handleFileSelect"
            />
            <div class="upload-icon">📤</div>
            <p class="upload-text">
              {{ fileName || '파일을 여기에 끌어다 놓거나 클릭하여 업로드하세요' }}
            </p>
            <p class="file-format">지원 형식: .xlsx, .csv</p>
          </div>

          <button
            class="upload-button"
            :disabled="!file || uploading"
            @click="uploadFile"
          >
            {{ uploading ? '업로드 중...' : '업로드' }}
          </button>
        </div>
      </div>

      <!-- 업로드 결과 표시 영역 -->
      <div v-if="uploadResult" class="upload-result">
        <div :class="['result-header', uploadResult.success ? 'success' : 'error']">
          <h3>{{ uploadResult.success ? '업로드 성공' : '업로드 실패' }}</h3>
        </div>

        <div class="result-details">
          <div v-if="uploadResult.success">
            <p>{{ uploadResult.totalCount }}개의 시리얼 번호가 성공적으로 업로드되었습니다.</p>
            <table class="result-summary">
              <tr>
                <th>총 업로드 수</th>
                <td>{{ uploadResult.totalCount }}</td>
              </tr>
              <tr>
                <th>상품코드 수</th>
                <td>{{ uploadResult.productCodes?.length || 0 }}</td>
              </tr>
            </table>

            <div class="action-after-upload">
              <router-link to="/serial-numbers" class="view-serials-button">
                시리얼 번호 목록 보기
              </router-link>
              <button class="upload-another-button" @click="resetUpload">
                다른 파일 업로드하기
              </button>
            </div>
          </div>

          <div v-else>
            <p>파일 업로드 중 오류가 발생했습니다:</p>
            <div class="error-message">{{ uploadResult.error }}</div>
            <button class="try-again-button" @click="resetUpload">다시 시도하기</button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import * as XLSX from 'xlsx'

// 파일 업로드 관련 상태
const file = ref(null)
const fileName = ref('')
const isDragging = ref(false)
const uploading = ref(false)
const fileInput = ref(null)

// 업로드 결과 상태
const uploadResult = ref(null)

// 예시 표시 상태
const showExample = ref(false)

// 파일 선택 핸들러
function handleFileSelect(event) {
  const selectedFile = event.target.files[0]
  if (selectedFile) {
    file.value = selectedFile
    fileName.value = selectedFile.name
  }
}

// 파일 드래그 앤 드롭 핸들러
function handleFileDrop(event) {
  isDragging.value = false
  const droppedFile = event.dataTransfer.files[0]
  if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.csv'))) {
    file.value = droppedFile
    fileName.value = droppedFile.name
  }
}

// 템플릿 다운로드 함수
function downloadTemplate() {
  // 템플릿 데이터 생성
  const templateData = [
    ['상품코드', '시리얼 번호'],
    ['1234567890', 'ABC-DEF-12345-GHIJK']
  ]

  // 워크시트 생성
  const ws = XLSX.utils.aoa_to_sheet(templateData)

  // 워크북 생성 및 워크시트 추가
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '시리얼번호템플릿')

  // 파일 다운로드
  XLSX.writeFile(wb, '시리얼번호_템플릿.xlsx')
}

// 파일 업로드 함수
async function uploadFile() {
  if (!file.value) return

  try {
    uploading.value = true

    // 엑셀 파일 읽기
    const data = await readExcelFile(file.value)

    if (!data || data.length === 0) {
      uploadResult.value = {
        success: false,
        error: '유효한 데이터가 없습니다. 파일 형식을 확인해주세요.'
      }
      return
    }

    // 데이터 유효성 검증
    const validationResult = validateData(data)
    if (!validationResult.valid) {
      uploadResult.value = {
        success: false,
        error: validationResult.error
      }
      return
    }

    // 데이터 처리 및 Supabase에 저장
    const { success, error, totalCount, productCodes } = await processAndSaveData(data)

    if (success) {
      uploadResult.value = {
        success: true,
        totalCount,
        productCodes
      }
    } else {
      uploadResult.value = {
        success: false,
        error: error || '알 수 없는 오류가 발생했습니다.'
      }
    }

  } catch (err) {
    console.error('파일 업로드 오류:', err)
    uploadResult.value = {
      success: false,
      error: err.message || '파일 업로드 중 오류가 발생했습니다.'
    }
  } finally {
    uploading.value = false
  }
}

// 엑셀 파일 읽기 함수
function readExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]

        // 엑셀 데이터를 JSON으로 변환
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

        // 첫 번째 행이 헤더인 경우 제거 (헤더가 있을 수도 있고 없을 수도 있음)
        const firstRow = jsonData[0]
        if (firstRow && (
          firstRow[0]?.toString().toLowerCase().includes('상품') ||
          firstRow[0]?.toString().toLowerCase().includes('product') ||
          firstRow[1]?.toString().toLowerCase().includes('시리얼') ||
          firstRow[1]?.toString().toLowerCase().includes('serial')
        )) {
          jsonData.shift() // 헤더 제거
        }

        resolve(jsonData)
      } catch (err) {
        reject(new Error('엑셀 파일을 읽는 중 오류가 발생했습니다.'))
      }
    }

    reader.onerror = () => {
      reject(new Error('파일을 읽는 중 오류가 발생했습니다.'))
    }

    reader.readAsBinaryString(file)
  })
}

// 데이터 유효성 검증 함수
function validateData(data) {
  if (!data || data.length === 0) {
    return { valid: false, error: '데이터가 비어있습니다.' }
  }

  // 각 행이 두 개의 열(상품코드, 시리얼번호)을 가지고 있는지 확인
  for (let i = 0; i < data.length; i++) {
    const row = data[i]

    if (!row || row.length < 2 || !row[0] || !row[1]) {
      return {
        valid: false,
        error: `${i+1}번째 행에 올바른 데이터가 없습니다. 상품코드와 시리얼 번호가 모두 필요합니다.`
      }
    }

    // 상품코드가 숫자 또는 문자열인지 확인
    if (typeof row[0] !== 'number' && typeof row[0] !== 'string') {
      return {
        valid: false,
        error: `${i+1}번째 행의 상품코드가 올바르지 않습니다.`
      }
    }

    // 시리얼 번호가 문자열인지 확인
    if (typeof row[1] !== 'string' && typeof row[1] !== 'number') {
      return {
        valid: false,
        error: `${i+1}번째 행의 시리얼 번호가 올바르지 않습니다.`
      }
    }
  }

  return { valid: true }
}

// 데이터 처리 및 저장 함수
async function processAndSaveData(data) {
  try {
    // 상품 코드 및 시리얼 번호 추출 및 형식 변환
    const serialNumbersData = data.map(row => ({
      product_code: row[0].toString().trim(),
      serial_number: row[1].toString().trim(),
      is_used: false,
      created_at: new Date().toISOString()
    }))

    // 중복된 상품 코드 목록 추출
    const productCodes = [...new Set(serialNumbersData.map(item => item.product_code))]

    // Supabase에 데이터 저장
    const { data: insertedData, error } = await supabase
      .from('serial_numbers')
      .insert(serialNumbersData)
      .select()

    if (error) throw error

    return {
      success: true,
      totalCount: serialNumbersData.length,
      productCodes
    }
  } catch (err) {
    console.error('데이터 처리 오류:', err)
    return {
      success: false,
      error: err.message || '데이터 처리 중 오류가 발생했습니다.'
    }
  }
}

// 업로드 리셋 함수
function resetUpload() {
  file.value = null
  fileName.value = ''
  uploadResult.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}
</script>

<style scoped>
.upload-container {
  padding: 2rem;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

h1 {
  font-size: 1.8rem;
  margin: 0;
  color: #333;
}

.back-button {
  display: inline-flex;
  align-items: center;
  color: #4a6cf7;
  padding: 0.6rem 1.2rem;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
  border: 1px solid #4a6cf7;
  transition: all 0.2s;
}

.back-button:hover {
  background-color: #f0f4ff;
}

.content-area {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
}

.upload-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.upload-instructions h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #333;
}

.upload-instructions p {
  color: #666;
  margin-bottom: 1.5rem;
}

.template-info {
  background-color: #f8f9fa;
  padding: 1.2rem;
  border-radius: 6px;
  margin-bottom: 1.5rem;
}

.template-info h3 {
  font-size: 1.1rem;
  margin-bottom: 0.8rem;
  color: #333;
}

.template-info ul {
  margin-left: 1.5rem;
  margin-bottom: 1rem;
}

.template-info li {
  margin-bottom: 0.5rem;
}

.template-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.download-template-button, .example-button {
  padding: 0.6rem 1rem;
  border-radius: 4px;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.download-template-button {
  background-color: #4a6cf7;
  color: white;
}

.download-template-button:hover {
  background-color: #3a5ce4;
}

.example-button {
  background-color: #f0f4ff;
  color: #4a6cf7;
  border: 1px solid #e0e7ff;
}

.example-button:hover {
  background-color: #e0e7ff;
}

.example-table {
  margin-bottom: 1.5rem;
  overflow-x: auto;
}

.example-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.example-table th, .example-table td {
  padding: 0.6rem;
  text-align: left;
  border: 1px solid #ddd;
}

.example-table th {
  background-color: #f0f4ff;
  font-weight: 600;
  color: #333;
}

.file-upload-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.file-upload-area {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  border: 2px dashed #ddd;
  border-radius: 6px;
  background-color: #fafafa;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 250px;
}

.file-upload-area.active {
  border-color: #4a6cf7;
  background-color: #f0f4ff;
}

.file-upload-area:hover {
  border-color: #4a6cf7;
}

.file-input {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.upload-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #4a6cf7;
}

.upload-text {
  font-size: 1.1rem;
  color: #333;
  text-align: center;
  margin-bottom: 0.5rem;
}

.file-format {
  font-size: 0.9rem;
  color: #888;
}

.upload-button {
  padding: 0.8rem;
  background-color: #4a6cf7;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-button:hover:not(:disabled) {
  background-color: #3a5ce4;
}

.upload-button:disabled {
  background-color: #a0aed0;
  cursor: not-allowed;
}

.upload-result {
  margin-top: 2rem;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.result-header {
  padding: 1rem 1.5rem;
  color: white;
}

.result-header.success {
  background-color: #2e7d32;
}

.result-header.error {
  background-color: #d32f2f;
}

.result-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.result-details {
  padding: 1.5rem;
  background-color: white;
}

.result-summary {
  margin: 1.5rem 0;
  width: 100%;
  border-collapse: collapse;
}

.result-summary th, .result-summary td {
  padding: 0.8rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.result-summary th {
  width: 40%;
  color: #666;
  font-weight: 500;
}

.error-message {
  background-color: #ffebee;
  padding: 1rem;
  border-radius: 4px;
  color: #d32f2f;
  margin: 1rem 0;
}

.action-after-upload {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.view-serials-button, .upload-another-button, .try-again-button {
  padding: 0.7rem 1.2rem;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.view-serials-button {
  background-color: #4a6cf7;
  color: white;
  text-decoration: none;
}

.view-serials-button:hover {
  background-color: #3a5ce4;
}

.upload-another-button, .try-again-button {
  background-color: #f0f4ff;
  color: #4a6cf7;
  border: 1px solid #e0e7ff;
}

.upload-another-button:hover, .try-again-button:hover {
  background-color: #e0e7ff;
}

@media (max-width: 992px) {
  .upload-section {
    grid-template-columns: 1fr;
  }
}
</style>
