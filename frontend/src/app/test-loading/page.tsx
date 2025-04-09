'use client';

import { useState } from 'react';
import TransactionLoadingModal from '../story/[chapterSlug]/[storySlug]/components/TransactionLoadingModal';

const TestLoading = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState('마법이 시전되는 중입니다...');
  const [duration, setDuration] = useState(5);

  const messages = [
    '당신의 결정이 세계의 운명을 바꾸고 있습니다...',
    '세계의 분기점이 준비되고 있습니다...',
    '분기점이 닫히고 새로운 운명이 결정됩니다...',
    '전투가 진행 중입니다. 모험가들이 분투하고 있습니다...',
    '당신의 마법이 세계를 변화시키고 있습니다...',
    '고대의 유물이 활성화되고 있습니다...',
    '던전의 문이 열리고 있습니다...',
  ];

  const handleOpenModal = (msg: string) => {
    setMessage(msg);
    setIsModalOpen(true);
    // 설정한 시간(초) 후 자동으로 닫힘
    setTimeout(() => {
      setIsModalOpen(false);
    }, duration * 1000);
  };

  const handleSimulateTransaction = () => {
    // 트랜잭션 시뮬레이션 - 3단계 진행
    setMessage('세계의 분기점이 준비되고 있습니다...');
    setIsModalOpen(true);
    
    setTimeout(() => {
      setMessage('당신의 결정이 세계의 운명을 바꾸고 있습니다...');
      
      setTimeout(() => {
        setMessage('분기점이 닫히고 새로운 운명이 결정됩니다...');
        
        setTimeout(() => {
          setIsModalOpen(false);
        }, 3000);
      }, 3000);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-fantasy-background p-8">
      <div className="max-w-3xl mx-auto bg-fantasy-surface p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-fantasy-text mb-6">트랜잭션 로딩 모달 테스트</h1>
        
        <div className="space-y-6">
          <div>
            <h2 className="text-xl text-fantasy-text mb-3">로딩 시간 설정</h2>
            <div className="flex items-center space-x-4">
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={duration} 
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-48"
              />
              <span className="text-fantasy-text">{duration}초</span>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl text-fantasy-text mb-3">개별 메시지 테스트</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {messages.map((msg, index) => (
                <button
                  key={index}
                  onClick={() => handleOpenModal(msg)}
                  className="p-3 bg-fantasy-bronze hover:bg-fantasy-copper text-white rounded-lg transition"
                >
                  {msg.substring(0, 20)}...
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h2 className="text-xl text-fantasy-text mb-3">트랜잭션 시뮬레이션</h2>
            <button
              onClick={handleSimulateTransaction}
              className="p-3 bg-fantasy-gold hover:bg-yellow-500 text-black font-medium rounded-lg transition"
            >
              전체 트랜잭션 흐름 시뮬레이션 (약 9초)
            </button>
          </div>
          
          <div className="pt-4 border-t border-fantasy-copper">
            <button
              onClick={() => setIsModalOpen(false)}
              className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
            >
              모달 즉시 닫기
            </button>
          </div>
        </div>
      </div>
      
      <TransactionLoadingModal 
        isOpen={isModalOpen}
        message={message}
      />
    </div>
  );
};

export default TestLoading; 