//스토리 쿠키 저장
function saveStoryToLocalStorage(state: string) {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem('story', serializedState);
  } catch (e) {
    console.warn('Failed to save state to localStorage', e);
  }
}

function loadStoryFromLocalStorage() {
  try {
    const serializedState = localStorage.getItem('story');
    if (serializedState === null) return undefined;
    return JSON.parse(serializedState);
  } catch (e) {
    console.warn('Failed to load state from localStorage', e);
    return undefined;
  }
}

//경로 저장
const ALLOWED_PATH_KEY = 'allowedChapterPaths';

export const saveAllowedChapterPath = (path: string): Promise<void> => {
  return new Promise((resolve) => {
    try {
      const stored = localStorage.getItem('allowedChapterPaths');
      const paths = stored ? JSON.parse(stored) : [];

      if (!paths.includes(path)) {
        paths.push(path);
        localStorage.setItem('allowedChapterPaths', JSON.stringify(paths));
      }

      resolve();
    } catch (error) {
      console.error('Error saving allowed chapter path:', error);
      resolve();
    }
  });
};

export function isChapterPathAllowed(path: string) {
  if (typeof window === 'undefined') return false;

  const normalized = path.toLowerCase();
  const existing = JSON.parse(localStorage.getItem(ALLOWED_PATH_KEY) || '[]');
  return existing.map((p: string) => p.toLowerCase()).includes(normalized);
}

//이젠 페이지 쿠키 삭제
export function removeChapterPath(path: string) {
  try {
    const stored = localStorage.getItem('allowedChapterPaths');
    const paths = stored ? JSON.parse(stored) : [];

    const updated = paths.filter((p: string) => p !== path);
    localStorage.setItem('allowedChapterPaths', JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to remove path from localStorage', e);
  }
}

//이어하기시 저장 쿠키 삭제.
function clearStory() {
  localStorage.removeItem('story');
}

export { saveStoryToLocalStorage, loadStoryFromLocalStorage, clearStory };
