<script setup>
import { RouterView, useRoute } from 'vue-router'
import { computed, onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import AppLayout from './components/AppLayout.vue'

const authStore = useAuthStore()
const route = useRoute()

// 로그인/회원가입 화면인지 확인
const isAuthPage = computed(() => {
  return route.path === '/login' || route.path === '/register'
})

// 404 페이지인지 확인
const isNotFoundPage = computed(() => {
  return route.name === 'notFound'
})

// 앱 시작 시 사용자 세션 확인
onMounted(async () => {
  await authStore.checkSession()
})
</script>

<template>
  <div class="app">
    <!-- 로그인/회원가입 페이지는 레이아웃 없이 표시 -->
    <RouterView v-if="isAuthPage" />

    <!-- 404 에러 페이지 -->
    <RouterView v-else-if="isNotFoundPage" />

    <!-- 인증이 필요한 페이지는 레이아웃과 함께 표시 -->
    <AppLayout v-else>
      <RouterView />
    </AppLayout>
  </div>
</template>

<style>
/* 글로벌 스타일 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Noto Sans KR', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 16px;
  line-height: 1.5;
  color: #333;
}

.app {
  width: 100%;
  min-height: 100vh;
}

/* 공통 유틸리티 클래스 */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
}
</style>
