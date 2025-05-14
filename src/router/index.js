import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../lib/supabase'

// 라우트 가드 함수 - 인증된 사용자만 접근 가능
async function requireAuth(to, from, next) {
  const { data } = await supabase.auth.getSession()

  if (data?.session) {
    next()
  } else {
    next('/login')
  }
}

// 이미 인증된 사용자는 로그인/회원가입 페이지 접근 시 대시보드로 리다이렉트
async function redirectIfAuth(to, from, next) {
  const { data } = await supabase.auth.getSession()

  if (data?.session) {
    next('/dashboard')
  } else {
    next()
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      beforeEnter: redirectIfAuth
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
      beforeEnter: redirectIfAuth
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
      beforeEnter: requireAuth
    },
    {
      path: '/serial-numbers',
      name: 'serialNumbers',
      component: () => import('../views/SerialNumbersView.vue'),
      beforeEnter: requireAuth
    },
    {
      path: '/serial-numbers/upload',
      name: 'serialNumbersUpload',
      component: () => import('../views/SerialNumbersUploadView.vue'),
      beforeEnter: requireAuth
    },
    {
      path: '/email-templates',
      name: 'emailTemplates',
      component: () => import('../views/EmailTemplatesView.vue'),
      beforeEnter: requireAuth
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      beforeEnter: requireAuth
    },
    {
      path: '/logs',
      name: 'logs',
      component: () => import('../views/LogsView.vue'),
      beforeEnter: requireAuth
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'notFound',
      component: () => import('../views/NotFoundView.vue')
    }
  ]
})

export default router
