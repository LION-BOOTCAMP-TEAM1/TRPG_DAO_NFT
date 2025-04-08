import React, { useEffect, useState } from 'react';

type TransactionLoadingModalProps = {
  isOpen: boolean;
  message: string;
};

// TRPG 캐릭터 및 애니메이션 (판타지 테마 색상으로 변경)
const CHARACTERS = [
  { name: '전사', icon: '⚔️', color: 'var(--fantasy-blood)' },
  { name: '마법사', icon: '🔮', color: 'var(--fantasy-magic)' },
  { name: '궁수', icon: '🏹', color: 'var(--fantasy-forest)' },
  { name: '성직자', icon: '✨', color: 'var(--fantasy-gold)' },
  { name: '도적', icon: '🗡️', color: 'var(--fantasy-iron)' },
];

// 전투 효과음 이모지
const EFFECTS = ['💥', '⚡', '🔥', '❄️', '✨', '💫'];

const TransactionLoadingModal = ({ isOpen, message }: TransactionLoadingModalProps) => {
  const [character, setCharacter] = useState(CHARACTERS[0]);
  const [effect, setEffect] = useState('');
  
  // 랜덤 효과를 주기적으로 표시
  useEffect(() => {
    if (!isOpen) return;
    
    // 랜덤 캐릭터 선택
    const randomChar = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
    setCharacter(randomChar);
    
    // 효과 애니메이션
    const effectInterval = setInterval(() => {
      const randomEffect = EFFECTS[Math.floor(Math.random() * EFFECTS.length)];
      setEffect(randomEffect);
      
      // 효과 제거 (잠시 후 사라짐)
      setTimeout(() => {
        setEffect('');
      }, 300);
    }, 1000);
    
    return () => {
      clearInterval(effectInterval);
    };
  }, [isOpen]);
  
  if (!isOpen) return null;

  // 인라인 스타일에 CSS 변수 사용
  const modalStyles = {
    background: 'var(--fantasy-surface)',
    color: 'var(--fantasy-text)',
    borderColor: 'var(--fantasy-gold)',
  };

  const gradientBackground = {
    background: 'linear-gradient(to bottom, var(--fantasy-surface), var(--fantasy-background))',
  };

  const characterBackground = {
    background: 'var(--fantasy-background)',
    borderColor: 'var(--fantasy-gold)',
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black opacity-80"></div>
      <div className="p-8 rounded-lg shadow-2xl max-w-md w-full relative z-10 border-4" style={modalStyles}>
        {/* 배경 장식 패턴 */}
        <div className="absolute inset-0 rounded-lg" style={gradientBackground}></div>
        
        <div className="flex flex-col items-center space-y-6 relative z-10">
          {/* 캐릭터 애니메이션 - 배경과 함께 */}
          <div className="relative">
            <div className="w-36 h-36 flex items-center justify-center rounded-full border-2 opacity-80" style={characterBackground}>
              <div 
                className="animate-bounce text-7xl drop-shadow-lg" 
                style={{ color: character.color }}
              >
                {character.icon}
              </div>
            </div>
            
            {/* 전투 효과 */}
            {effect && (
              <div 
                className="absolute -right-2 -top-2 text-5xl animate-ping"
                style={{ color: 'var(--fantasy-gold)' }}
              >
                {effect}
              </div>
            )}
          </div>
          
          <h3 className="text-2xl font-bold text-center mb-2" style={{ color: 'var(--fantasy-text)' }}>
            {message}
          </h3>
          
          <p className="text-center text-sm" style={{ color: 'var(--fantasy-copper)' }}>
            잠시만 기다려주세요...
          </p>
        </div>
      </div>
    </div>
  );
};

export default TransactionLoadingModal; 