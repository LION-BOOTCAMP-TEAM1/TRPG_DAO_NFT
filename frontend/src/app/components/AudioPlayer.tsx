'use client';
import { useEffect, useRef, useState } from 'react';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

interface AudioPlayerProps {
  audioSrc: string;
  autoPlay?: boolean;
}

export default function AudioPlayer({ audioSrc, autoPlay = false }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // 음량 조절 효과
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);
  
  // 새 오디오 소스가 제공되면 부드럽게 전환
  useEffect(() => {
    if (audioRef.current) {
      // 이전 오디오 페이드 아웃
      const fadeOutInterval = setInterval(() => {
        if (audioRef.current && audioRef.current.volume > 0.05) {
          audioRef.current.volume -= 0.05;
        } else {
          clearInterval(fadeOutInterval);
          // 소스 변경 후 페이드 인
          audioRef.current!.src = audioSrc;
          if (isPlaying) {
            audioRef.current!.play().then(() => {
              // 페이드 인
              let newVolume = 0;
              const fadeInInterval = setInterval(() => {
                if (newVolume < volume) {
                  newVolume += 0.05;
                  audioRef.current!.volume = isMuted ? 0 : newVolume;
                } else {
                  clearInterval(fadeInInterval);
                }
              }, 50);
            }).catch(e => console.error("Audio playback failed:", e));
          }
        }
      }, 50);
      
      return () => clearInterval(fadeOutInterval);
    }
  }, [audioSrc]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const toggleMute = () => setIsMuted(!isMuted);
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  return (
    <div className="audio-player bg-fantasy-background/90 backdrop-blur-sm rounded-full p-2 shadow-lg border border-fantasy-copper/30 flex items-center gap-2 transition-all duration-300"
         onMouseEnter={() => setShowVolumeControl(true)}
         onMouseLeave={() => setShowVolumeControl(false)}>
      <button 
        onClick={togglePlay}
        className="w-10 h-10 rounded-full bg-fantasy-copper/20 flex items-center justify-center text-fantasy-text hover:bg-fantasy-copper/40 transition-colors"
      >
        {isPlaying ? <FaPause /> : <FaPlay />}
      </button>
      
      <div className={`flex items-center gap-2 overflow-hidden transition-all duration-300 ${showVolumeControl ? 'w-36 opacity-100' : 'w-0 opacity-0'}`}>
        <button 
          onClick={toggleMute}
          className="text-fantasy-text hover:text-fantasy-copper transition-colors"
        >
          {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
        </button>
        
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="w-24 accent-fantasy-copper"
        />
      </div>
      
      <audio ref={audioRef} src={audioSrc} preload="auto" loop />
    </div>
  );
}