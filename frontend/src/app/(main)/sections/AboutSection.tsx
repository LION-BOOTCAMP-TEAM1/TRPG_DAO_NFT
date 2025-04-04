'use client';

interface AboutSectionProps {
  title: string;
  description: string;
  ctaButtonText: string;
  ctaButtonLink: string;
}

export default function AboutSection({
  title = "프로젝트 소개",
  description = "우리는 TRPG와 블록체인을 결합한 새로운 형태의 스토리텔링 게임을 만듭니다. DAO 투표로 이야기를 함께 만들어가고, 플레이어의 선택이 온체인에 기록되어 NFT로 보상받는 경험을 제공합니다. 이 세계에서 당신의 선택이 곧 전설이 됩니다.",
  ctaButtonText = "더 알아보기",
  ctaButtonLink = "#"
}: Partial<AboutSectionProps>) {
  return (
    <section className="py-20 bg-fantasy-surface dark:bg-[var(--fantasy-surface)] relative transition-colors duration-300">
      {/* 장식용 마크다운 라인 */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/3 border-t border-fantasy-gold dark:border-[var(--fantasy-gold)] opacity-30"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-fantasy-gold dark:text-[var(--fantasy-gold)] mb-8">
          {title}
        </h2>
        
        <div className="max-w-3xl mx-auto mb-10">
          <p className="text-fantasy-text dark:text-[var(--fantasy-text)] leading-relaxed mb-6">
            {description}
          </p>
          
          <button 
            onClick={() => window.location.href = ctaButtonLink}
            className="inline-block px-6 py-2 border border-fantasy-gold dark:border-[var(--fantasy-gold)] text-fantasy-gold dark:text-[var(--fantasy-gold)] hover:bg-fantasy-gold hover:text-fantasy-background dark:hover:bg-[var(--fantasy-gold)] dark:hover:text-[var(--fantasy-background)] transition-all duration-300 rounded"
          >
            {ctaButtonText}
          </button>
        </div>
      </div>
      
      {/* 장식용 마크다운 라인 */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/3 border-t border-fantasy-gold dark:border-[var(--fantasy-gold)] opacity-30"></div>
    </section>
  );
}