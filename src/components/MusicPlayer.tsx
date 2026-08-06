'use client';

import { useState, useRef } from 'react';
import { Music, Pause, Play } from 'lucide-react';

interface MusicPlayerProps {
  musicUrl: string;
}

export default function MusicPlayer({ musicUrl }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleMusic = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.log('Müzik başlatılamadı:', e));
    }
  };

  return (
    <div className="music-player-widget flex items-center justify-center gap-3 rounded-full bg-white/70 backdrop-blur-md px-5 py-3 shadow-sm border border-white/60 mb-6">
      <button
        onClick={toggleMusic}
        className={`music-toggle-btn flex h-11 w-11 items-center justify-center rounded-full text-white transition-transform active:scale-95 shadow-md ${
          isPlaying
            ? 'bg-gradient-to-r from-pink-500 to-rose-500 animate-pulse'
            : 'bg-gradient-to-r from-rose-400 to-pink-400'
        }`}
        aria-label="Müzik Çal/Durdur"
      >
        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
      </button>
      <span className="text-sm font-medium text-rose-900/80">
        {isPlaying ? 'Aşk Melodisi Çalıyor... 🎹' : 'Arka Plan Müziği 🎵'}
      </span>
      <audio ref={audioRef} loop src={musicUrl} />
    </div>
  );
}
