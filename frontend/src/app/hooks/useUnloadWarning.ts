'use client';

import { useEffect } from 'react';

export const useUnloadWarning = (shouldBlock: boolean = true) => {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!shouldBlock) return;
      e.preventDefault();
      e.returnValue =
        '정말 페이지를 떠나시겠습니까? 변경 사항이 저장되지 않습니다.';
    };

    const handlePopState = () => {
      if (!shouldBlock) return;

      const confirmLeave = window.confirm(
        '정말 페이지를 떠나시겠습니까? 변경 사항이 저장되지 않습니다.',
      );
      if (!confirmLeave) {
        history.pushState(null, '', location.href); // 뒤로가기를 취소
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    history.pushState(null, '', location.href); // 진입 시 스택 하나 추가

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [shouldBlock]);
};
