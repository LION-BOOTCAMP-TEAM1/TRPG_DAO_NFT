import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Chapter } from '../types/chapter';

export function useChapterDetail(slug: string) {
  const [chapter, setChapter] = useState<Chapter | null>(null);

  useEffect(() => {
    if (!slug) return;

    console.log('[useChapterDetail] fetching chapter for slug:', slug);
    api
      .get(`/api/chapters/${slug}`)
      .then((res) => {
        console.log('[useChapterDetail] chapter response:', res.data);
        setChapter(res.data);
      })
      .catch((err) => {
        console.error('[useChapterDetail] fetch failed:', err);
      });
  }, [slug]);

  return { chapter };
}
