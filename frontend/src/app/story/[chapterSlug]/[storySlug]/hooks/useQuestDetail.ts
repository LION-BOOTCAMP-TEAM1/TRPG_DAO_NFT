'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Quest } from '../types/story';

export function useQuestDetail(id?: number | null) {
  const [quest, setQuest] = useState<Quest | null>(null);

  useEffect(() => {
    if (!id) return;

    api.get(`api/quests/${id}`).then((res) => {
      setQuest(res.data);
    });
  }, [id]);

  return { quest };
}
