'use client';

interface StoryCardProps {
  title: string;
  imageUrl: string;
  storyType: string;
  borderColor: string;
}

function StoryCard({ title, imageUrl, storyType, borderColor }: StoryCardProps) {
  return (
    <div className={`relative transform transition-transform duration-300 hover:scale-105 hover:z-10 cursor-pointer`}>
      <div 
        className={`absolute inset-0 rounded-lg`}
        style={{ 
          borderWidth: '3px', 
          borderStyle: 'solid',
          borderColor: borderColor,
          boxShadow: `0 0 10px ${borderColor}, 0 0 20px ${borderColor}` 
        }}
      ></div>
      <div className="relative bg-fantasy-surface/80 dark:bg-[var(--fantasy-surface)]/80 rounded-lg overflow-hidden p-1">
        <img 
          src={imageUrl} 
          alt={title} 
          className="w-full object-cover aspect-[3/4] rounded"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
          <h3 className="text-center text-white font-bold text-sm">{title}</h3>
          <p className="text-center text-xs" style={{ color: borderColor }}>{storyType}</p>
        </div>
      </div>
    </div>
  );
}

interface StoryCardsSectionProps {
  title: string;
  subtitle: string;
  cards: StoryCardProps[];
}

export default function StoryCardsSection({
  title = "스토리 카드 목록",
  subtitle = "이세계에서 펼쳐지는 다양한 이야기들을 카드로 만나보세요. 당신의 선택이 다음 스토리를 결정합니다.",
  cards = [
    { title: "잊혀진 무덤", imageUrl: "/main/nft-card/grave.png", storyType: "모험", borderColor: "#FFD700" },
    { title: "드래곤의 둥지", imageUrl: "/main/nft-card/dragon.png", storyType: "퀘스트", borderColor: "#0096FF" },
    { title: "마법의 숲", imageUrl: "/main/nft-card/forest.png", storyType: "탐험", borderColor: "#C300FF" },
    { title: "어두운 예언", imageUrl: "/main/nft-card/dark.png", storyType: "미스터리", borderColor: "#0096FF" },
    { title: "영웅의 여정", imageUrl: "/main/nft-card/hero.png", storyType: "서사", borderColor: "#FFD700" },
    { title: "고대 유적", imageUrl: "/main/nft-card/ancient.png", storyType: "역사", borderColor: "#00FF66" },
    { title: "마법 학교", imageUrl: "/main/nft-card/school.png", storyType: "판타지", borderColor: "#C300FF" },
    { title: "그림자의 영역", imageUrl: "/main/nft-card/shadow.png", storyType: "공포", borderColor: "#0096FF" },
    { title: "천상의 전쟁", imageUrl: "/main/nft-card/war.png", storyType: "전투", borderColor: "#FFD700" },
    { title: "잃어버린 문명", imageUrl: "/main/nft-card/lost.png", storyType: "발견", borderColor: "#00FF66" }
  ]
}: Partial<StoryCardsSectionProps>) {
  return (
    <section className="py-20 bg-fantasy-background dark:bg-[var(--fantasy-background)] transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-fantasy-gold dark:text-[var(--fantasy-gold)] mb-4">
          {title}
        </h2>
        <p className="text-center text-fantasy-text dark:text-[var(--fantasy-text)] mb-12 max-w-3xl mx-auto">
          {subtitle}
        </p>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {cards.map((card, index) => (
            <StoryCard 
              key={index} 
              {...card} 
            />
          ))}
        </div>
      </div>
    </section>
  );
}