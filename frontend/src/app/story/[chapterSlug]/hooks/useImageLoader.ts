import { useEffect, useState } from 'react';
import api from '@/lib/axios';

export function useImageLoader(url?: string) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;

    api
      .get(url, { responseType: 'blob' }) // 이미지 데이터로 요청
      .then((res) => {
        const imageUrl = URL.createObjectURL(res.data); // Blob → Object URL
        setImageSrc(imageUrl);
      })
      .catch((err) => {
        console.error('이미지 로딩 실패:', err);
        setImageSrc(null);
      });
  }, [url]);

  return imageSrc;
}
