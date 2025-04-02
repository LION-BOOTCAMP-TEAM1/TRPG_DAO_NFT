import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import type { Story } from '../types/story';

export function useStoryDetail(slug: string) {
  const [story, setStory] = useState<Story | null>(null);

  useEffect(() => {
    if (!slug) return;
    api.get(`/api/stories/${slug}`).then((res) => {
      setStory(res.data);
    });
  }, [slug]);

  return { story };
}
