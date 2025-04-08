'use client';

import { useUnloadWarning } from '@/app/hooks/useUnloadWarning';

const UnloadHandler = ({ isBlocking = true }: { isBlocking?: boolean }) => {
  useUnloadWarning(isBlocking);
  return null;
};

export default UnloadHandler;
