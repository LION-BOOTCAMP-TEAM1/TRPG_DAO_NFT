'use client';

import React, { useState } from 'react';
import TransactionLoadingModal from '../../story/[chapterSlug]/[storySlug]/components/TransactionLoadingModal';

export default function ModalTestPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState('마법이 시전되는 중입니다...');
  const [duration, setDuration] = useState(5);

  const showModal = () => {
    setIsModalOpen(true);
    // 지정된 시간 후에 모달 닫기
    if (duration > 0) {
      setTimeout(() => {
        setIsModalOpen(false);
      }, duration * 1000);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="p-8 bg-fantasy-background min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-fantasy-text">트랜잭션 로딩 모달 테스트</h1>
      
      <div className="bg-fantasy-surface p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-xl font-bold mb-4 text-fantasy-text">모달 설정</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-fantasy-text mb-2">메시지:</label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-2 rounded border bg-fantasy-surface text-fantasy-text"
            />
          </div>
          
          <div>
            <label className="block text-fantasy-text mb-2">
              지속 시간 (초, 0은 무제한):
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              min="0"
              className="w-full p-2 rounded border bg-fantasy-surface text-fantasy-text"
            />
          </div>
          
          <div className="pt-4 flex space-x-4">
            <button
              onClick={showModal}
              className="px-4 py-2 bg-fantasy-copper text-white rounded hover:bg-fantasy-copper/80 transition"
            >
              모달 표시
            </button>
            
            <button
              onClick={closeModal}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition"
            >
              모달 닫기
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-fantasy-surface p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-fantasy-text">미리 정의된 메시지로 테스트</h2>
        
        <div className="space-y-3">
          <button
            onClick={() => {
              setMessage('세계의 분기점이 준비되고 있습니다...');
              showModal();
            }}
            className="w-full px-4 py-2 bg-fantasy-copper text-white rounded hover:bg-fantasy-copper/80 transition"
          >
            제안 초기화 메시지 테스트
          </button>
          
          <button
            onClick={() => {
              setMessage('당신의 결정이 세계의 운명을 바꾸고 있습니다...');
              showModal();
            }}
            className="w-full px-4 py-2 bg-fantasy-copper text-white rounded hover:bg-fantasy-copper/80 transition"
          >
            투표 중 메시지 테스트
          </button>
          
          <button
            onClick={() => {
              setMessage('분기점이 닫히고 새로운 운명이 결정됩니다...');
              showModal();
            }}
            className="w-full px-4 py-2 bg-fantasy-copper text-white rounded hover:bg-fantasy-copper/80 transition"
          >
            제안 종료 메시지 테스트
          </button>
        </div>
      </div>
      
      {/* 모달 컴포넌트 */}
      <TransactionLoadingModal isOpen={isModalOpen} message={message} />
    </div>
  );
} 