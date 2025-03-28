'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Chapter } from '../types/chapter';

export function useChapterDetail(slug: string) {
  const [chapter, setChapter] = useState<Chapter | null>(null);

  useEffect(() => {
    if (!slug) return;

    api.get(`api/chapters/${slug}`).then((res) => setChapter(res.data));
  }, [slug]);

  return { chapter };
}
