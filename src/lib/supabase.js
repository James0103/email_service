import { createClient } from '@supabase/supabase-js';

// 실제 배포 시 환경 변수로 관리해야 합니다
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL과 Anon Key가 필요합니다. .env 파일을 확인해주세요.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
