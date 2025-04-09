'use client';

import Link from 'next/link';

interface FeatureCardProps {
  title: string;
  description: string;
  imageUrl: string;
  linkText: string;
  linkUrl: string;
}

function FeatureCard({ title, description, imageUrl, linkText, linkUrl }: FeatureCardProps) {
  return (
    <div className="bg-fantasy-surface dark:bg-[var(--fantasy-surface)] overflow-hidden rounded-lg shadow-lg transition-all duration-300 hover:shadow-2xl border border-fantasy-bronze/40 dark:border-[var(--fantasy-bronze)]/40 hover:border-fantasy-gold dark:hover:border-[var(--fantasy-gold)]">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={title} 
          className="w-full h-full object-cover transform transition-transform duration-500 hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-fantasy-background/90 to-transparent dark:from-[var(--fantasy-background)]/90 opacity-60"></div>
        <h3 className="absolute bottom-0 left-0 p-4 text-xl font-bold text-fantasy-gold dark:text-[var(--fantasy-gold)]">{title}</h3>
      </div>
      
      <div className="p-4">
        <p className="text-fantasy-text dark:text-[var(--fantasy-text)] mb-4 h-20 overflow-hidden">
          {description}
        </p>
        
        <Link href={linkUrl}>
          <button className="w-full py-2 bg-fantasy-blood dark:bg-[var(--fantasy-blood)] hover:opacity-90 text-white font-medium rounded transition-colors">
            {linkText}
          </button>
        </Link>
      </div>
    </div>
  );
}

interface FeaturedSectionProps {
  title: string;
  features: FeatureCardProps[];
}

export default function FeaturedSection({
  title = "주요 기능",
  features = [
    {
      title: "스토리 분기 투표",
      description: "플레이어들의 선택으로 다음 스토리 전개를 결정하세요. DAO 기반 투표를 통해 집단 지성이 반영됩니다.",
      imageUrl: "/main/dao.png",
      linkText: "투표 참여하기",
      linkUrl: "/story"
    },
    {
      title: "NFT 캐릭터 보상",
      description: "특정 이벤트나 선택에 따라 고유한 NFT 캐릭터와 아이템을 획득할 수 있습니다. 당신의 이야기를 기록하세요.",
      imageUrl: "/main/nft.png",
      linkText: "보상 확인하기",
      linkUrl: "/marketplace"
    },
    {
      title: "온체인 히스토리 기록",
      description: "게임 내 주요 행동과 선택은 블록체인에 영구적으로 기록되어 당신의 여정을 증명합니다.",
      imageUrl: "/main/blockchain.png",
      linkText: "기록 보기",
      linkUrl: "/story"
    }
  ]
}: Partial<FeaturedSectionProps>) {
  return (
    <section className="py-20 bg-fantasy-background dark:bg-[var(--fantasy-background)] transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-fantasy-gold dark:text-[var(--fantasy-gold)] mb-12">
          {title}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}