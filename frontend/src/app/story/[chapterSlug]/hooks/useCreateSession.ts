import { useState } from 'react';
import { dummyChapter } from '../types/chapter';

export const useCreateSession = () => {
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');

  const createSession = async (chapter: dummyChapter, dao: any) => {
    console.log('dao in create: ', dao);
    if (!dao) return;
    try {
      console.log('chapter.id', chapter.id);
      const exists = await dao.sessionExists(chapter.id);
      if (!exists) {
        const tx = await dao.createSession(
          chapter.id,
          chapter.worldId,
          chapter.genreId,
        );
        const receipt = await tx.wait();
        setTxHash(receipt.hash);
        console.log('세션 생성 완료:', receipt.hash);
      } else {
        console.log('이미 세션이 존재합니다.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || '세션 생성 실패');
    }
  };

  return { createSession, txHash, error };
};
