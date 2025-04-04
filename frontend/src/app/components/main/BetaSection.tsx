'use client';

interface BetaSectionProps {
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
}

export default function BetaSection({
  title = "베타 테스터로 전설을 시작하세요!",
  subtitle = "지금 베타 테스트에 참여하고 무료 랜덤 NFT 캐릭터를 받아보세요. 여러분의 선택이 스토리를 만듭니다!",
  buttonText = "베타 테스트 참여하기",
  buttonLink = "/pages/signup"
}: Partial<BetaSectionProps>) {
  return (
    <section className="py-20 bg-fantasy-background dark:bg-[var(--fantasy-background)] relative transition-colors duration-300">
      {/* 배경 효과 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-cover bg-center opacity-20"
             style={{backgroundImage: 'url(/background.png)'}}></div>
        
        {/* 마법 효과 (선택적) */}
        <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-fantasy-magic dark:bg-[var(--fantasy-magic)] blur-3xl opacity-10"></div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-fantasy-blood dark:bg-[var(--fantasy-blood)] blur-3xl opacity-10"></div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-fantasy-gold dark:text-[var(--fantasy-gold)] mb-4">
            {title}
          </h2>
          <p className="text-lg text-fantasy-text dark:text-[var(--fantasy-text)] mb-10">
            {subtitle}
          </p>
          
          <a 
            href={buttonLink}
            className="inline-block px-8 py-3 bg-gradient-to-r from-fantasy-blood to-fantasy-gold dark:from-[var(--fantasy-blood)] dark:to-[var(--fantasy-gold)] text-white font-bold rounded-lg transform transition-transform hover:scale-105 hover:shadow-lg shadow-fantasy-gold/20 dark:shadow-[var(--fantasy-gold)]/20"
          >
            {buttonText}
          </a>
        </div>
      </div>
    </section>
  );
}