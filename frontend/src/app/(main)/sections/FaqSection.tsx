'use client';

import { useState } from 'react';

interface FaqItemProps {
  question: string;
  answer: string;
}

function FaqItem({ question, answer }: FaqItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-fantasy-bronze/30 dark:border-[var(--fantasy-bronze)]/30">
      <button
        className="flex justify-between items-center w-full py-4 text-left cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-fantasy-text dark:text-[var(--fantasy-text)] text-sm hover:text-fantasy-gold dark:hover:text-[var(--fantasy-gold)]">{question}</span>
        <span className="text-fantasy-text dark:text-[var(--fantasy-text)] text-sm hover:text-fantasy-gold dark:hover:text-[var(--fantasy-gold)]">
          {isOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </span>
      </button>
      {isOpen && (
        <div className="pb-4 text-fantasy-text dark:text-[var(--fantasy-text)]">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}

interface FaqSectionProps {
  title: string;
  subtitle: string;
  faqs: FaqItemProps[];
}

export default function FaqSection({
  title = "FAQ'S",
  subtitle = "TRPG와 블록체인의 만남, 자주 묻는 질문을 통해 더 자세히 알아보세요.",
  faqs = [
    {
      question: "이 프로젝트는 어떤 게임인가요?",
      answer: "이 프로젝트는 TRPG(테이블탑 롤플레잉 게임)와 블록체인 기술을 결합한 Web3 게임입니다. 플레이어는 다양한 선택지를 통해 스토리를 진행하며, 그 기록은 온체인으로 저장되고 NFT로 보상받게 됩니다."
    },
    {
      question: "게임은 어떻게 시작하나요?",
      answer: "지갑을 연결하면 자동으로 플레이어가 등록됩니다. 이후 제공되는 스타터 캐릭터로 모험을 시작할 수 있으며, 선택과 행동에 따라 스토리가 변화합니다."
    },
    {
      question: "DAO 투표는 무엇에 사용되나요?",
      answer: "주요 스토리 분기점에서는 DAO 투표를 통해 다음 전개를 결정합니다. 모든 참여자는 보유한 NFT 또는 토큰을 기준으로 투표권을 행사할 수 있습니다."
    },
    {
      question: "NFT는 어떤 역할을 하나요?",
      answer: "NFT는 플레이어의 선택, 업적, 전투 결과 등을 기록하는 디지털 자산입니다. 이 NFT는 보상으로 지급되며, 후속 시즌이나 콘텐츠에서 특별한 권한이나 혜택을 부여받는 데 사용됩니다."
    },
    {
      question: "게임 내 캐릭터는 어떻게 성장하나요?",
      answer: "캐릭터는 퀘스트 수행, 전투 참여, 이벤트 클리어를 통해 경험치와 아이템을 얻고 성장합니다. 성장한 캐릭터는 더 높은 난이도의 콘텐츠에 도전할 수 있습니다."
    }
  ]
}: Partial<FaqSectionProps>) {
  return (
    <section className="py-20 bg-fantasy-surface dark:bg-[var(--fantasy-surface)] transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-fantasy-gold dark:text-[var(--fantasy-gold)] mb-4">
          {title}
        </h2>
        <p className="text-center text-fantasy-text dark:text-[var(--fantasy-text)] mb-12 max-w-3xl mx-auto">
          {subtitle}
        </p>
        
        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <FaqItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  );
}