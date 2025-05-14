<template>
  <div class="logs-container">
    <header class="page-header">
      <h1>발송 내역</h1>
    </header>

    <main class="content-area">
      <div class="filter-controls">
        <div class="search-box">
          <input
            type="text"
            v-model="searchTerm"
            placeholder="주문번호, 이메일, 시리얼 번호 검색..."
            @input="handleSearch"
          />
          <button class="search-button">검색</button>
        </div>

        <div class="filter-options">
          <select v-model="statusFilter" @change="applyFilters">
            <option value="all">모든 상태</option>
            <option value="success">성공</option>
            <option value="failed">실패</option>
          </select>

          <select v-model="dateRange" @change="applyFilters">
            <option value="today">오늘</option>
            <option value="yesterday">어제</option>
            <option value="thisWeek">이번 주</option>
            <option value="thisMonth">이번 달</option>
            <option value="lastMonth">지난 달</option>
            <option value="all">전체 기간</option>
          </select>

          <select v-model="sortOption" @change="applyFilters">
            <option value="date_desc">발송일 (최신순)</option>
            <option value="date_asc">발송일 (오래된순)</option>
            <option value="product_code">상품코드 (오름차순)</option>
            <option value="status">상태</option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="loading-indicator">
        <p>발송 내역을 불러오는 중...</p>
      </div>

      <div v-else-if="logs.length === 0" class="empty-state">
        <div class="empty-message">
          <h3>발송 내역이 없습니다</h3>
          <p>아직 발송된 이메일이 없습니다. 네이버 연동 설정이 완료되면 자동으로 이메일이
            발송됩니다.</p>
        </div>
      </div>

      <div v-else class="logs-table">
        <table>
          <thead>
            <tr>
              <th>주문번호</th>
              <th>상품명</th>
              <th>수신자 이메일</th>
              <th>시리얼 번호</th>
              <th>발송일시</th>
              <th>상태</th>
              <th>액션</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(log, index) in logs" :key="index">
              <td>{{ log.order_id }}</td>
              <td>{{ log.product_name }}</td>
              <td>{{ log.recipient_email }}</td>
              <td>{{ formatSerialNumber(log.serial_number) }}</td>
              <td>{{ formatDate(log.sent_at) }}</td>
              <td>
                <span
                  class="status-badge"
                  :class="log.status === 'success' ? 'success' : 'failed'"
                >
                  {{ log.status === 'success' ? '성공' : '실패' }}
                </span>
              </td>
              <td>
                <button
                  class="action-button"
                  @click="showDetails(log)"
                >
                  상세보기
                </button>
                <button
                  v-if="log.status === 'failed'"
                  class="resend-button"
                  @click="resendEmail(log)"
                >
                  재발송
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="pagination">
          <button
            @click="prevPage"
            :disabled="currentPage === 1"
            class="pagination-button"
          >
            이전
          </button>
          <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
          <button
            @click="nextPage"
            :disabled="currentPage === totalPages"
            class="pagination-button"
          >
            다음
          </button>
        </div>
      </div>
    </main>

    <!-- 상세 정보 모달 -->
    <div v-if="selectedLog" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>발송 상세 정보</h3>
          <button class="close-button" @click="closeModal">×</button>
        </div>

        <div class="modal-body">
          <div class="detail-item">
            <span class="detail-label">주문번호:</span>
            <span class="detail-value">{{ selectedLog.order_id }}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">상품명:</span>
            <span class="detail-value">{{ selectedLog.product_name }}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">수신자 이메일:</span>
            <span class="detail-value">{{ selectedLog.recipient_email }}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">시리얼 번호:</span>
            <span class="detail-value">{{ selectedLog.serial_number }}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">발송일시:</span>
            <span class="detail-value">{{ formatDate(selectedLog.sent_at) }}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">상태:</span>
            <span
              class="status-badge"
              :class="selectedLog.status === 'success' ? 'success' : 'failed'"
            >
              {{ selectedLog.status === 'success' ? '성공' : '실패' }}
            </span>
          </div>

          <div v-if="selectedLog.status === 'failed'" class="detail-item">
            <span class="detail-label">오류 메시지:</span>
            <span class="detail-value error-message">{{ selectedLog.error_message }}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">이메일 내용:</span>
            <div class="email-preview">
              <div v-html="selectedLog.email_content"></div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button
            v-if="selectedLog.status === 'failed'"
            class="resend-button"
            @click="resendEmail(selectedLog)"
          >
            이메일 재발송
          </button>
          <button class="close-modal-button" @click="closeModal">닫기</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase'

// 데이터 상태
const logs = ref([])
const loading = ref(true)
const error = ref(null)
const selectedLog = ref(null)

// 필터 및 정렬 상태
const searchTerm = ref('')
const statusFilter = ref('all')
const dateRange = ref('all')
const sortOption = ref('date_desc')

// 페이지네이션
const currentPage = ref(1)
const itemsPerPage = 10
const totalItems = ref(0)
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage))

// 초기 데이터 로드
onMounted(async () => {
  await fetchLogs()
})

// 발송 내역 조회 함수
async function fetchLogs() {
  try {
    loading.value = true

    // 상태 필터 적용
    let query = supabase.from('email_logs')
      .select('*', { count: 'exact' })

    // 검색어 적용
    if (searchTerm.value) {
      query = query.or(`order_id.ilike.%${searchTerm.value}%,recipient_email.ilike.%${searchTerm.value}%,serial_number.ilike.%${searchTerm.value}%`)
    }

    // 상태 필터 적용
    if (statusFilter.value !== 'all') {
      query = query.eq('status', statusFilter.value)
    }

    // 날짜 범위 필터 적용
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (dateRange.value === 'today') {
      const endOfDay = new Date(today)
      endOfDay.setHours(23, 59, 59, 999)
      query = query.gte('sent_at', today.toISOString()).lte('sent_at', endOfDay.toISOString())
    } else if (dateRange.value === 'yesterday') {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const endOfYesterday = new Date(yesterday)
      endOfYesterday.setHours(23, 59, 59, 999)
      query = query.gte('sent_at', yesterday.toISOString()).lte('sent_at', endOfYesterday.toISOString())
    } else if (dateRange.value === 'thisWeek') {
      const firstDayOfWeek = new Date(today)
      const day = today.getDay() || 7 // 일요일이면 7로 처리
      firstDayOfWeek.setDate(today.getDate() - day + 1) // 이번 주 월요일
      firstDayOfWeek.setHours(0, 0, 0, 0)
      query = query.gte('sent_at', firstDayOfWeek.toISOString())
    } else if (dateRange.value === 'thisMonth') {
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      firstDayOfMonth.setHours(0, 0, 0, 0)
      query = query.gte('sent_at', firstDayOfMonth.toISOString())
    } else if (dateRange.value === 'lastMonth') {
      const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      firstDayOfLastMonth.setHours(0, 0, 0, 0)
      const firstDayOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      firstDayOfThisMonth.setHours(0, 0, 0, 0)
      query = query.gte('sent_at', firstDayOfLastMonth.toISOString()).lt('sent_at', firstDayOfThisMonth.toISOString())
    }

    // 정렬 적용
    switch (sortOption.value) {
      case 'date_desc':
        query = query.order('sent_at', { ascending: false })
        break
      case 'date_asc':
        query = query.order('sent_at', { ascending: true })
        break
      case 'product_code':
        query = query.order('product_code', { ascending: true })
        break
      case 'status':
        query = query.order('status', { ascending: true })
        break
    }

    // 페이지네이션 적용
    const from = (currentPage.value - 1) * itemsPerPage
    const to = from + itemsPerPage - 1
    query = query.range(from, to)

    const { data, error: queryError, count } = await query

    if (queryError) throw queryError

    logs.value = data || []
    totalItems.value = count || 0

  } catch (err) {
    console.error('발송 내역 조회 오류:', err)
    error.value = '발송 내역을 불러오는 중 오류가 발생했습니다.'
  } finally {
    loading.value = false
  }
}

// 검색 처리
function handleSearch() {
  currentPage.value = 1 // 검색 시 첫 페이지로 이동
  fetchLogs()
}

// 필터 적용
function applyFilters() {
  currentPage.value = 1 // 필터 변경 시 첫 페이지로 이동
  fetchLogs()
}

// 페이지네이션 함수
function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    fetchLogs()
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
    fetchLogs()
  }
}

// 날짜 포맷 함수
function formatDate(dateString) {
  if (!dateString) return '-'

  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// 시리얼 번호 포맷 (일부만 표시)
function formatSerialNumber(serialNumber) {
  if (!serialNumber) return '-'

  if (serialNumber.length > 12) {
    return serialNumber.substring(0, 4) + '...' + serialNumber.substring(serialNumber.length - 4)
  }

  return serialNumber
}

// 상세 정보 표시
function showDetails(log) {
  selectedLog.value = log
}

// 모달 닫기
function closeModal() {
  selectedLog.value = null
}

// 이메일 재발송
async function resendEmail(log) {
  try {
    const { error } = await supabase.functions.invoke('resend-serial-email', {
      body: {
        logId: log.id
      }
    })

    if (error) throw error

    alert('이메일 재발송 요청이 성공적으로 처리되었습니다.')
    await fetchLogs() // 목록 새로고침

  } catch (err) {
    console.error('이메일 재발송 오류:', err)
    alert('이메일 재발송 중 오류가 발생했습니다: ' + (err.message || '알 수 없는 오류'))
  }
}
</script>

<style scoped>
.logs-container {
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

.content-area {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
}

.filter-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.search-box {
  display: flex;
  width: 100%;
  max-width: 400px;
}

.search-box input {
  flex: 1;
  padding: 0.6rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px 0 0 4px;
  font-size: 0.95rem;
}

.search-button {
  padding: 0.6rem 1rem;
  background-color: #4a6cf7;
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
}

.filter-options {
  display: flex;
  gap: 1rem;
}

select {
  padding: 0.6rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  font-size: 0.95rem;
}

.loading-indicator, .empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.empty-message {
  text-align: center;
  color: #666;
}

.empty-message h3 {
  margin-bottom: 0.5rem;
  font-size: 1.2rem;
}

.logs-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

th, td {
  padding: 0.8rem 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #555;
}

.status-badge {
  display: inline-block;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.success {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-badge.failed {
  background-color: #ffebee;
  color: #d32f2f;
}

.action-button, .resend-button {
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  margin-right: 0.5rem;
  white-space: nowrap;
}

.action-button {
  background-color: #f0f4ff;
  color: #4a6cf7;
}

.resend-button {
  background-color: #ffebee;
  color: #d32f2f;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.pagination-button {
  padding: 0.5rem 1rem;
  background-color: #f0f4ff;
  color: #4a6cf7;
  border: 1px solid #e0e7ff;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.pagination-button:hover:not(:disabled) {
  background-color: #e0e7ff;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.9rem;
  color: #666;
}

/* 모달 스타일 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.3rem;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #888;
  cursor: pointer;
}

.modal-body {
  padding: 1.5rem;
}

.detail-item {
  margin-bottom: 1rem;
}

.detail-label {
  display: block;
  font-weight: 500;
  color: #666;
  margin-bottom: 0.3rem;
}

.error-message {
  color: #d32f2f;
}

.email-preview {
  background-color: #f8f9fa;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 1rem;
  margin-top: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.close-modal-button {
  padding: 0.6rem 1.2rem;
  background-color: #f0f4ff;
  color: #4a6cf7;
  border: 1px solid #e0e7ff;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

@media (max-width: 768px) {
  .filter-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    max-width: 100%;
  }

  .filter-options {
    flex-direction: column;
  }
}
</style>
