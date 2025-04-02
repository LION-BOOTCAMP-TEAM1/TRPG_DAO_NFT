import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function useNextStep() {
  const router = useRouter();

  const goToNext = useCallback(() => {
    // 실제 상황에 따라 결과 기반 이동 필요
    console.log('다음 스토리로 이동');
    // router.push("/story/next-chapter/next-story");
  }, [router]);

  return { goToNext };
}
