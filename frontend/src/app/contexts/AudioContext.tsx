'use client';
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

interface AudioContextType {
  play: (src: string) => void;
  pause: () => void;
  toggle: () => void;
  isPlaying: boolean;
  currentSrc: string;
  volume: number;
  setVolume: (volume: number) => void;
  mute: () => void;
  unmute: () => void;
  isMuted: boolean;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.7);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  
  // 실제 오디오 요소를 ref로 관리
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // 마지막으로 재생하려던 소스 추적
  const lastSrcRef = useRef<string>('');
  
  // 컴포넌트 마운트 시 오디오 요소 생성
  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume;
    audio.addEventListener('ended', () => {
      // 음악이 끝나면 다시 재생 (반복 재생)
      audio.currentTime = 0;
      audio.play().catch(e => console.error("Auto replay failed:", e));
    });
    audioRef.current = audio;
    
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);
  
  // 볼륨 변경 시 적용
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);
  
  const fadeOut = () => {
    return new Promise<void>((resolve) => {
      if (!audioRef.current || audioRef.current.volume <= 0) {
        resolve();
        return;
      }
      
      let currentVolume = audioRef.current.volume;
      const fadeOutInterval = setInterval(() => {
        if (currentVolume > 0.05) {
          currentVolume -= 0.05;
          if (audioRef.current) audioRef.current.volume = currentVolume;
        } else {
          if (audioRef.current) audioRef.current.volume = 0;
          clearInterval(fadeOutInterval);
          resolve();
        }
      }, 50);
    });
  };
  
  const fadeIn = (targetVolume: number) => {
    return new Promise<void>((resolve) => {
      if (!audioRef.current) {
        resolve();
        return;
      }
      
      let currentVolume = 0;
      audioRef.current.volume = 0;
      
      const fadeInInterval = setInterval(() => {
        if (currentVolume < targetVolume - 0.05) {
          currentVolume += 0.05;
          if (audioRef.current) audioRef.current.volume = currentVolume;
        } else {
          if (audioRef.current) audioRef.current.volume = targetVolume;
          clearInterval(fadeInInterval);
          resolve();
        }
      }, 50);
    });
  };
  
  const play = async (src: string) => {
    // 이미 같은 소스를 재생 중이면 아무것도 하지 않음
    if (currentSrc === src && isPlaying) return;

    lastSrcRef.current = src;
    
    // 새 소스가 다르면 페이드 아웃 후 소스 변경
    if (audioRef.current) {
      if (isPlaying && currentSrc !== src) {
        await fadeOut();
      }
      
      // 소스 변경
      audioRef.current.src = src;
      setCurrentSrc(src);
      
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        
        // 페이드 인
        if (!isMuted) {
          await fadeIn(volume);
        }
      } catch (error) {
        console.error('Audio play failed:', error);
        setIsPlaying(false);
      }
    }
  };
  
  const pause = async () => {
    if (audioRef.current && isPlaying) {
      await fadeOut();
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };
  
  const toggle = () => {
    if (isPlaying) {
      pause();
    } else {
      play(lastSrcRef.current);
    }
  };
  
  const mute = () => {
    if (audioRef.current) {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };
  
  const unmute = () => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      setIsMuted(false);
    }
  };
  
  const value = {
    play,
    pause,
    toggle,
    isPlaying,
    currentSrc,
    volume,
    setVolume,
    mute,
    unmute,
    isMuted
  };
  
  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
}; 