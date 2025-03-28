'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Story } from '../types/story';

export function useStoryDetail(identifier?: string | number | null) {
  const [story, setStory] = useState<Story | null>(null);

  useEffect(() => {
    if (!identifier) return;

    const url = `/api/stories/${identifier}`;

    api
      .get(url)
      .then((res) => setStory(res.data))
      .catch((err) => {
        console.error('[useStoryDetail] Failed to fetch story:', err);
      });
  }, [identifier]);

  return { story };
}
