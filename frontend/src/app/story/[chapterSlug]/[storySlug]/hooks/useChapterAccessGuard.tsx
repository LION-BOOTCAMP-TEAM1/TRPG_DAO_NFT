'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  isChapterPathAllowed,
  removeChapterPath,
} from '@/utils/manageLocalStorage';

const useGuardChapterAccess = () => {
  const pathname = usePathname();
  const router = useRouter();

  //경로 확인
  useEffect(() => {
    const isAllowed = isChapterPathAllowed(pathname);
    if (!isAllowed) {
      alert(
        '해당 경로는 직접 접근이 불가능합니다. 스토리 시작 버튼을 이용해주세요.',
      );
      router.replace('/');
    }

    //이전 페이지 쿠키 삭제 함수
    return () => {
      removeChapterPath(pathname);
    };
  }, [pathname, router]);
};

export default useGuardChapterAccess;
