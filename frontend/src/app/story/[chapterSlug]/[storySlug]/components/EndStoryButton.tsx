'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'sonner';

interface EndStoryButtonProps {
  walletAddress: string;
}

const EndStoryButton = ({ walletAddress }: EndStoryButtonProps) => {
  const router = useRouter();
  const [isMinting, setIsMinting] = useState(false);
  const [mintMessage, setMintMessage] = useState('');

  const handleClick = async () => {
    console.log('📘 스토리 종료 처리!');
    setIsMinting(true);
    setMintMessage('');

    try {
      console.log('walletAddress', walletAddress);
      const res = await api.post('/api/nft/mintByID', {
        walletAddress,
        tokenId: 92,
      });

      if (res.data?.txHash) {
        setMintMessage(res.data.message || 'NFT 민팅 성공');
        
        toast(`[칭호] 드래곤 슬레이어`, {
          description: '고대의 폭룡을 쓰러뜨린 자에게만 허락되는 칭호',
          icon: <img src='https://violet-eligible-junglefowl-936.mypinata.cloud/ipfs/bafybeibvbkrcojhsli7lbnomhx7la3s2f5kmprpwl2jdcrzm3htdbxqaqa'
            alt="item" width={64} height={64} 
          />,
        });

        console.log('✅ Minted:', res.data);
      } else {
        throw new Error('응답에 txHash 없음');
      }
    } catch (err: any) {
      console.error('❌ 민팅 실패:', err);
      setMintMessage('민팅에 실패했습니다');
    } finally {
      setIsMinting(false);
      setTimeout(() => window.location.href = '/story', 2000);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        disabled={isMinting}
        className="px-6 py-3 bg-gray-800 text-white font-bold rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
      >
        {isMinting ? '🛠️ 민팅 중...' : '📘 스토리 종료하기'}
      </button>
      {mintMessage && <p className="text-sm text-green-300">{mintMessage}</p>}
    </div>
  );
};

export default EndStoryButton;
