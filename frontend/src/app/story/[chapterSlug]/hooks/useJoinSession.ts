import { useState } from 'react';
import { ethers } from 'ethers';
import { dummyChapter } from '../types/chapter';
import { useRouter } from 'next/navigation';

export const useJoinSession = () => {
  const router = useRouter();
  const [joinTx, setJoinTx] = useState('');
  const [joinError, setJoinError] = useState('');

  const joinSession = async (chapter: dummyChapter, dao: any) => {
    if (!dao) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      const alreadyJoined = await dao.isUserInSession(chapter.id, userAddress);

      if (!alreadyJoined) {
        const tx = await dao.addUserToSession(chapter.id, userAddress);
        const receipt = await tx.wait();
        setJoinTx(receipt.hash);
        console.log('세션 참가 완료:', receipt.hash);
      } else {
        console.log('이미 세션에 참가한 유저입니다.');
      }

      router.push(`/story/${chapter.slug}/${chapter.storySlug}`);
    } catch (err: any) {
      console.error(err);
      setJoinError(err.message || '세션 참가 실패');
    }
  };

  return { joinSession, joinTx, joinError };
};
