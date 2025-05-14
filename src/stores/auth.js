import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '../lib/supabase';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const loading = ref(true);
  const error = ref(null);

  // 현재 사용자 확인
  const isAuthenticated = computed(() => !!user.value);

  // 초기 세션 확인
  async function checkSession() {
    try {
      loading.value = true;
      error.value = null;

      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        user.value = data.session.user;
      }
    } catch (err) {
      console.error('세션 확인 중 오류 발생:', err);
      error.value = '세션을 확인하는 중 오류가 발생했습니다';
    } finally {
      loading.value = false;
    }
  }

  // 로그인
  async function login(email, password) {
    try {
      loading.value = true;
      error.value = null;

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      user.value = data.user;
      return data;
    } catch (err) {
      console.error('로그인 중 오류 발생:', err);
      error.value = '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // 회원가입
  async function register(email, password) {
    try {
      loading.value = true;
      error.value = null;

      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      return data;
    } catch (err) {
      console.error('회원가입 중 오류 발생:', err);
      error.value = '회원가입에 실패했습니다.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // 로그아웃
  async function logout() {
    try {
      loading.value = true;
      error.value = null;

      const { error: authError } = await supabase.auth.signOut();
      if (authError) throw authError;

      user.value = null;
    } catch (err) {
      console.error('로그아웃 중 오류 발생:', err);
      error.value = '로그아웃 중 오류가 발생했습니다.';
    } finally {
      loading.value = false;
    }
  }

  // 인증 상태 변경 감지
  supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      user.value = session.user;
    } else {
      user.value = null;
    }
  });

  return {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    checkSession
  };
});
