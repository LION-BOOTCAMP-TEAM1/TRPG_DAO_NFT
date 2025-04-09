'use client';

import { useState } from 'react';

interface CategoryItemProps {
  title: string;
  description: string;
  imageUrl: string;
}

function CategoryItem({ title, description, imageUrl }: CategoryItemProps) {
  return (
    <div className="bg-fantasy-surface/90 dark:bg-[var(--fantasy-surface)]/90 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-fantasy-gold/20 hover:-translate-y-1">
      <div className="h-48 overflow-hidden">
        <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
      </div>
      <div className="p-5">
        <h3 className="text-xl font-bold text-fantasy-gold dark:text-[var(--fantasy-gold)] mb-2">{title}</h3>
        <p className="text-fantasy-text dark:text-[var(--fantasy-text)]">{description}</p>
      </div>
    </div>
  );
}

interface CategorySectionProps {
  title: string;
  description: string;
  items: CategoryItemProps[];
}

function CategorySection({ title, description, items }: CategorySectionProps) {
  return (
    <div>
      <h3 className="text-2xl font-bold text-fantasy-gold dark:text-[var(--fantasy-gold)] mb-3">{title}</h3>
      <p className="text-fantasy-text dark:text-[var(--fantasy-text)] mb-8 max-w-2xl">{description}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item, index) => (
          <CategoryItem key={index} {...item} />
        ))}
      </div>
    </div>
  );
}

type CategoryType = 'sessions' | 'worldSettings' | 'genres';

interface CategoryTabProps {
  active: boolean;
  label: string;
  onClick: () => void;
}

function CategoryTab({ active, label, onClick }: CategoryTabProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-t-lg transition-all duration-300 ${
        active 
          ? 'bg-fantasy-surface/90 dark:bg-[var(--fantasy-surface)]/90 text-fantasy-gold dark:text-[var(--fantasy-gold)] font-bold border-b-2 border-fantasy-gold'
          : 'bg-fantasy-surface/50 dark:bg-[var(--fantasy-surface)]/50 text-fantasy-text dark:text-[var(--fantasy-text)] hover:bg-fantasy-surface/70'
      }`}
    >
      {label}
    </button>
  );
}

interface StoryBoardSectionProps {
  title: string;
  subtitle: string;
  sessions: CategoryItemProps[];
  worldSettings: CategoryItemProps[];
  genres: CategoryItemProps[];
}

export default function StoryBoardSection({
  title = "스토리 보드",
  subtitle = "스토리 보드는 세션, 세계관, 장르로 구성된 이야기의 기본 뼈대입니다.",
  sessions = [
    {
      title: "단발성 세션",
      description: "한 번의 모임으로 완결되는 이야기입니다. 2-4시간 정도의 짧은 시간 동안 플레이할 수 있습니다.",
      imageUrl: "/main/storyBoard/storyBoard-session.jpeg",
    },
    {
      title: "캠페인 세션",
      description: "여러 번의 세션으로 이어지는 장기 이야기입니다. 캐릭터의 성장과 깊이 있는 스토리를 경험할 수 있습니다.",
      imageUrl: "/main/storyBoard/storyBoard-campaign.png",
    },
    {
      title: "이벤트 세션",
      description: "특별한 테마나 이벤트를 중심으로 구성된 세션입니다. 계절 행사나 특별 이벤트에 맞춰 진행됩니다.",
      imageUrl: "/main/storyBoard/storyBoard-event.png",
    },
  ],
  worldSettings = [
    {
      title: "판타지 세계",
      description: "마법과 신비로운 생물이 존재하는 중세 판타지 세계에서 모험을 즐깁니다.",
      imageUrl: "/main/storyBoard/storyBoard-fantasy.png",
    },
    {
      title: "사이버펑크",
      description: "첨단 기술과 디스토피아적 사회가 공존하는 미래 세계에서의 이야기입니다.",
      imageUrl: "/main/storyBoard/storyBoard-cyberpunk.png",
    },
    {
      title: "현대 판타지",
      description: "현대 세계에 마법과 초자연적 요소가 숨겨져 있는 세계관입니다.",
      imageUrl: "/main/storyBoard/storyBoard-modern.png",
    },
  ],
  genres = [
    {
      title: "모험",
      description: "미지의 땅을 탐험하고 보물을 찾는 여정을 다룹니다.",
      imageUrl: "/main/storyBoard/storyBoard-adventure.png",
    },
    {
      title: "미스터리",
      description: "사건과 수수께끼를 해결하는 추리 중심의 이야기입니다.",
      imageUrl: "/main/nft-card/dark.png",
    },
    {
      title: "호러",
      description: "공포와 긴장감을 주는 요소들이 중심인 이야기입니다.",
      imageUrl: "/main/nft-card/shadow.png",
    },
  ],
}: Partial<StoryBoardSectionProps>) {
  const [activeCategory, setActiveCategory] = useState<CategoryType>('sessions');
  
  const categoryData = {
    sessions: {
      title: "세션 유형", 
      description: "다양한 길이와 형태의 세션을 통해 원하는 방식으로 게임을 즐길 수 있습니다.",
      items: sessions
    },
    worldSettings: {
      title: "세계관", 
      description: "다양한 세계에서 펼쳐지는 모험을 경험하세요.",
      items: worldSettings
    },
    genres: {
      title: "장르", 
      description: "여러분이 좋아하는 장르의 이야기를 선택할 수 있습니다.",
      items: genres
    },
  };

  return (
    <section className="py-20 bg-fantasy-background/80 dark:bg-[var(--fantasy-background)]/80 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-fantasy-gold dark:text-[var(--fantasy-gold)] mb-4">
          {title}
        </h2>
        <p className="text-center text-fantasy-text dark:text-[var(--fantasy-text)] mb-10 max-w-3xl mx-auto">
          {subtitle}
        </p>
        
        {/* 카테고리 필터링 메뉴 */}
        <div className="flex justify-center mb-10 space-x-2">
          <CategoryTab 
            active={activeCategory === 'sessions'} 
            label="세션 유형" 
            onClick={() => setActiveCategory('sessions')} 
          />
          <CategoryTab 
            active={activeCategory === 'worldSettings'} 
            label="세계관" 
            onClick={() => setActiveCategory('worldSettings')} 
          />
          <CategoryTab 
            active={activeCategory === 'genres'} 
            label="장르" 
            onClick={() => setActiveCategory('genres')} 
          />
        </div>
        
        {/* 활성화된 카테고리만 표시 */}
        <div className="min-h-[500px]">
          <CategorySection 
            title={categoryData[activeCategory].title} 
            description={categoryData[activeCategory].description}
            items={categoryData[activeCategory].items}
          />
        </div>
      </div>
    </section>
  );
} 