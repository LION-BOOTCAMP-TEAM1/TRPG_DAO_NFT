import path from 'path';

/**
 * 이미지 파일의 서버 경로를 반환합니다.
 * @param type 이미지 타입 (stories 또는 chapters)
 * @param filename 파일명
 * @returns 서버 내 파일 경로
 */
export const getServerImagePath = (type: 'stories' | 'chapters', filename: string): string => {
  return path.join(__dirname, '../../static/images', type, filename);
};

/**
 * 클라이언트에서 접근 가능한 이미지 URL을 반환합니다.
 * @param type 이미지 타입 (stories 또는 chapters)
 * @param filename 파일명
 * @returns 클라이언트에서 접근 가능한 URL
 */
export const getImageUrl = (type: 'stories' | 'chapters', filename: string): string => {
  // 서버 주소는 환경 변수 또는 설정에서 가져올 수 있습니다
  const baseUrl = process.env.SERVER_URL || 'http://localhost:5001';
  return `${baseUrl}/static/images/${type}/${filename}`;
};

/**
 * 스토리 이미지 파일명을 생성합니다.
 * @param storyId 스토리 ID
 * @param ext 파일 확장자 (기본값: .jpg)
 * @returns 파일명
 */
export const getStoryImageFilename = (storyId: number | string, ext: string = '.jpg'): string => {
  return `story-${storyId}${ext}`;
};

/**
 * 챕터 이미지 파일명을 생성합니다.
 * @param chapterId 챕터 ID
 * @param ext 파일 확장자 (기본값: .jpg)
 * @returns 파일명
 */
export const getChapterImageFilename = (chapterId: number | string, ext: string = '.jpg'): string => {
  return `chapter-${chapterId}${ext}`;
};

/**
 * 스토리 이미지의 전체 URL을 반환합니다.
 * @param storyId 스토리 ID
 * @param ext 파일 확장자 (기본값: .jpg)
 * @returns 이미지 URL
 */
export const getStoryImageUrl = (storyId: number | string, ext: string = '.jpg'): string => {
  return getImageUrl('stories', getStoryImageFilename(storyId, ext));
};

/**
 * 챕터 이미지의 전체 URL을 반환합니다.
 * @param chapterId 챕터 ID
 * @param ext 파일 확장자 (기본값: .jpg)
 * @returns 이미지 URL
 */
export const getChapterImageUrl = (chapterId: number | string, ext: string = '.jpg'): string => {
  return getImageUrl('chapters', getChapterImageFilename(chapterId, ext));
}; 