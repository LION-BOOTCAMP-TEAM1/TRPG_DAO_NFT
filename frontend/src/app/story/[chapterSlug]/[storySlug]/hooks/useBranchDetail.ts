'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { BranchPoint } from '../types/story';

export function useBranchDetail(id?: number | null) {
  const [branch, setBranch] = useState<BranchPoint | null>(null);

  useEffect(() => {
    if (!id) return;

    api.get(`api/branchpoints/${id}`).then((res) => {
      setBranch(res.data);
    });
  }, [id]);

  return { branch };
}
