import { useCallback, useEffect, useState } from 'react';
import { Story } from '../types/story';

export function useStoryScenePlayback(story: Story | null) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [displayedScenes, setDisplayedScenes] = useState<string[]>([]);
  const [currentText, setCurrentText] = useState('');
  const [isSkipping, setIsSkipping] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && story) {
        const fullTexts = story.StoryScene.map((scene) => scene.text);
        setDisplayedScenes(fullTexts);
        setCurrentText('');
        setSceneIndex(story.StoryScene.length);
      }
    },
    [story],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!story || sceneIndex >= story.StoryScene.length) return;
    const currentScene = story.StoryScene[sceneIndex];
    let charIndex = 0;
    let interval: NodeJS.Timeout;
    let timeout: NodeJS.Timeout;

    if (isSkipping) {
      setDisplayedScenes((prev) => [...prev, currentScene.text]);
      setCurrentText('');
      timeout = setTimeout(() => {
        setSceneIndex((prev) => prev + 1);
        setIsSkipping(false);
      }, 500);
    } else {
      setCurrentText('');
      interval = setInterval(() => {
        charIndex++;
        setCurrentText(currentScene.text.slice(0, charIndex));
        if (charIndex >= currentScene.text.length) {
          clearInterval(interval);
          timeout = setTimeout(() => {
            setDisplayedScenes((prev) => [...prev, currentScene.text]);
            setCurrentText('');
            setSceneIndex((prev) => prev + 1);
          }, 500);
        }
      }, 30);
    }

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [sceneIndex, story, isSkipping]);

  const isSceneComplete =
    story && sceneIndex >= story.StoryScene.length && currentText === '';

  return {
    sceneIndex,
    displayedScenes,
    currentText,
    setIsSkipping,
    isSceneComplete,
  };
}
