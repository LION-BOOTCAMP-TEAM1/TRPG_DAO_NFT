'use client';

import { useEffect, useState, useCallback } from 'react';
import { StoryScene } from '../types/story';

export function useScenePlayback(scenes: StoryScene[] = []) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [displayedScenes, setDisplayedScenes] = useState<string[]>([]);
  const [currentText, setCurrentText] = useState('');
  const [isSkipping, setIsSkipping] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const fullTexts = scenes.map((scene) => scene.text);
        setDisplayedScenes(fullTexts);
        setCurrentText('');
        setSceneIndex(scenes.length);
      }
    },
    [scenes],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!scenes || sceneIndex >= scenes.length) return;
    const currentScene = scenes[sceneIndex];
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
  }, [sceneIndex, scenes, isSkipping]);

  const isSceneComplete = sceneIndex >= scenes.length && currentText === '';

  return {
    displayedScenes,
    currentText,
    setIsSkipping,
    isSceneComplete,
  };
}
