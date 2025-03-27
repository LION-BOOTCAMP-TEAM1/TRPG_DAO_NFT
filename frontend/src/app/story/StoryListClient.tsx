'use client';

import FeatureSection from './components/FeatureSection';
import StoryCard from './components/StoryCard';
import { StorySummary } from './types/story';

const StoryListPage = () => {
  const stories: StorySummary[] = [
    {
      id: 1,
      slug: 'isekai-summoning',
      title: '이세계로의 소환',
      summary:
        '당신은 알 수 없는 힘에 의해 이세계로 소환되었다. 이제 당신의 운명을 선택해야 한다.',
    },
    {
      id: 2,
      slug: 'isekai-summoning',
      title: '이세계로의 소환',
      summary:
        '당신은 알 수 없는 힘에 의해 이세계로 소환되었다. 이제 당신의 운명을 선택해야 한다.',
    },
  ];

  return (
    <div className="p-6 space-y-12 min-h-screen bg-[#f4efe1]">
      <FeatureSection />

      {/* Story List */}
      <div className="space-y-6">
        <h1 className="story-list-h1">Stories</h1>

        {stories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>
    </div>
  );
};

export default StoryListPage;
