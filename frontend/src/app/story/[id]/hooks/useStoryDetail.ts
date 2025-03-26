import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Story, Quest } from '../types/story';

export function useStoryDetail(id: string | string[]) {
  const [story, setStory] = useState<Story | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);

  useEffect(() => {
    api.get(`/stories/${id}`).then((res) => {
      setStory(res.data);
      if (res.data.quests) {
        const fetchQuestDetails = async () => {
          const questIds = res.data.quests.map((q: any) => q.id);
          const questResponses = await Promise.all(
            questIds.map((qid: number) => api.get(`/quests/${qid}`)),
          );
          const questData = questResponses.map((r) => r.data);
          setQuests(questData);
        };
        fetchQuestDetails();
      }
    });
  }, [id]);

  return { story, quests };
}
