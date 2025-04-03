import { useState } from 'react';
import api from '@/lib/axios';
import { Session } from '../types/chapter';

export function useSession(chapterSlug: string | number) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = async () => {
    try {
      console.log('[useSession] fetching session for chapterId:', chapterSlug);
      const res = await api.get(`/api/sessions/${chapterSlug}`);
      console.log('[useSession] session response:', res.data);
      setSession(res.data);
      setLoading(false);
    } catch (err) {
      console.error('[useSession] 세션 불러오기 실패:', err);
    }
  };

  const joinSession = async (userId: number) => {
    console.log('[useSession] joining session with userId:', userId);
    await api.post(`/api/sessions/${chapterSlug}/participants`, { userId });
  };

  return {
    session,
    loading,
    fetchSession,
    joinSession,
  };
}
