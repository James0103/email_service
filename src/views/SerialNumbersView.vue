<template>
  <div class="serial-numbers-container">
    <header class="page-header">
      <h1>시리얼 번호 관리</h1>
      <div class="action-buttons">
        <router-link to="/serial-numbers/upload" class="upload-button">
          <span>시리얼 번호 업로드</span>
        </router-link>
      </div>
    </header>

    <main class="content-area">
      <div class="filter-controls">
        <div class="search-box">
          <input
            type="text"
            v-model="searchTerm"
            placeholder="상품코드, 시리얼 번호 검색..."
            @input="handleSearch"
          />
          <button class="search-button">검색</button>
        </div>

        <div class="filter-options">
          <select v-model="statusFilter" @change="applyFilters">
            <option value="all">모든 상태</option>
            <option value="used">사용됨</option>
            <option value="unused">미사용</option>
          </select>

          <select v-model="sortOption" @change="applyFilters">
            <option value="date_desc">등록일 (최신순)</option>
            <option value="date_asc">등록일 (오래된순)</option>
            <option value="product_code">상품코드 (오름차순)</option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="loading-indicator">
        <p>시리얼 번호를 불러오는 중...</p>
      </div>

      <div v-else-if="serialNumbers.length === 0" class="empty-state">
        <div class="empty-message">
          <h3>등록된 시리얼 번호가 없습니다</h3>
          <p>시리얼 번호를 업로드하려면 상단의 '시리얼 번호 업로드' 버튼을 클릭하세요.</p>
        </div>
      </div>

      <div v-else class="serial-numbers-table">
        <table>
          <thead>
            <tr>
              <th>번호</th>
              <th>상품코드</th>
              <th>시리얼 번호</th>
              <th>상태</th>
              <th>등록일</th>
              <th>사용일</th>
              <th>주문번호</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(serial, index) in serialNumbers" :key="index">
              <td>{{ index + 1 }}</td>
              <td>{{ serial.product_code }}</td>
              <td>{{ serial.serial_number }}</td>
              <td>
                <span
                  class="status-badge"
                  :class="serial.is_used ? 'used' : 'unused'"
                >
                  {{ serial.is_used ? '사용됨' : '미사용' }}
                </span>
              </td>
              <td>{{ formatDate(serial.created_at) }}</td>
              <td>{{ serial.used_at ? formatDate(serial.used_at) : '-' }}</td>
              <td>{{ serial.order_id || '-' }}</td>
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
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../lib/supabase'

// 데이터 상태
const serialNumbers = ref([])
const loading = ref(true)
const error = ref(null)

// 필터 및 정렬 상태
const searchTerm = ref('')
const statusFilter = ref('all')
const sortOption = ref('date_desc')

// 페이지네이션
const currentPage = ref(1)
const itemsPerPage = 10
const totalItems = ref(0)
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage))

// 초기 데이터 로드
onMounted(async () => {
  await fetchSerialNumbers()
})

// 시리얼 번호 조회 함수
async function fetchSerialNumbers() {
  try {
    loading.value = true

    // 상태 필터 적용
    let query = supabase.from('serial_numbers')
      .select('*', { count: 'exact' })

    // 검색어 적용
    if (searchTerm.value) {
      query = query.or(`product_code.ilike.%${searchTerm.value}%,serial_number.ilike.%${searchTerm.value}%`)
    }

    // 상태 필터 적용
    if (statusFilter.value !== 'all') {
      query = query.eq('is_used', statusFilter.value === 'used')
    }

    // 정렬 적용
    switch (sortOption.value) {
      case 'date_desc':
        query = query.order('created_at', { ascending: false })
        break
      case 'date_asc':
        query = query.order('created_at', { ascending: true })
        break
      case 'product_code':
        query = query.order('product_code', { ascending: true })
        break
    }

    // 페이지네이션 적용
    const from = (currentPage.value - 1) * itemsPerPage
    const to = from + itemsPerPage - 1
    query = query.range(from, to)

    const { data, error: queryError, count } = await query

    if (queryError) throw queryError

    serialNumbers.value = data || []
    totalItems.value = count || 0

  } catch (err) {
    console.error('시리얼 번호 조회 오류:', err)
    error.value = '시리얼 번호를 불러오는 중 오류가 발생했습니다.'
  } finally {
    loading.value = false
  }
}

// 검색 처리
function handleSearch() {
  currentPage.value = 1 // 검색 시 첫 페이지로 이동
  fetchSerialNumbers()
}

// 필터 적용
function applyFilters() {
  currentPage.value = 1 // 필터 변경 시 첫 페이지로 이동
  fetchSerialNumbers()
}

// 페이지네이션 함수
function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    fetchSerialNumbers()
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
    fetchSerialNumbers()
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
</script>

<style scoped>
.serial-numbers-container {
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

.action-buttons {
  display: flex;
  gap: 1rem;
}

.upload-button {
  display: inline-flex;
  align-items: center;
  background-color: #4a6cf7;
  color: white;
  padding: 0.6rem 1.2rem;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
  transition: background-color 0.2s;
}

.upload-button:hover {
  background-color: #3a5ce4;
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

.serial-numbers-table {
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

.status-badge.used {
  background-color: #ffebee;
  color: #d32f2f;
}

.status-badge.unused {
  background-color: #e8f5e9;
  color: #2e7d32;
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
