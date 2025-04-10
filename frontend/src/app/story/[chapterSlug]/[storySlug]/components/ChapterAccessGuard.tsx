'use client';

import useGuardChapterAccess from '../hooks/useChapterAccessGuard';

export default function ChapterAccessGuard() {
  useGuardChapterAccess();
  return null;
}
