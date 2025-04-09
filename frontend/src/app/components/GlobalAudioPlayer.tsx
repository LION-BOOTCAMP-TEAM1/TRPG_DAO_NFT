'use client';
import { useEffect, useState } from 'react';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import { useAudio } from '../contexts/AudioContext';

export default function GlobalAudioPlayer() {
  const { 
    isPlaying, 
    toggle, 
    volume, 
    setVolume, 
    isMuted, 
    mute, 
    unmute,
    currentSrc
  } = useAudio();
  
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const toggleMute = () => {
    if (isMuted) {
      unmute();
    } else {
      mute();
    }
  };

  // 현재 재생 중인 소스가 없는 경우 UI 숨기기
  if (!currentSrc) return null;

  return (
    <div className="audio-player bg-fantasy-background/90 backdrop-blur-sm rounded-full p-2 shadow-lg border border-fantasy-copper/30 flex items-center gap-2 transition-all duration-300"
         onMouseEnter={() => setShowVolumeControl(true)}
         onMouseLeave={() => setShowVolumeControl(false)}>
      <button 
        onClick={toggle}
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
    </div>
  );
} 