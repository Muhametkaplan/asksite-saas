'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Music, Volume2, VolumeX, Sparkles } from 'lucide-react';

interface CustomAudioPlayerProps {
  audioUrl?: string;
  title?: string;
}

export default function CustomAudioPlayer({ audioUrl, title = 'Bizim Aşk Şarkımız' }: CustomAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const urlToPlay = audioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3';

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.log('Audio playback error:', e));
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="custom-audio-player my-6 rounded-3xl bg-gradient-to-r from-pink-500/90 via-rose-500/90 to-red-500/90 p-4 shadow-xl backdrop-blur-md border border-white/40 text-white relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute -right-8 -bottom-8 h-24 w-24 rounded-full bg-white/10 blur-lg pointer-events-none" />

      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white text-rose-600 shadow-md transition hover:scale-105 active:scale-95 ${
            isPlaying ? 'animate-pulse' : ''
          }`}
          aria-label="Play or Pause Music"
        >
          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
        </button>

        {/* Title & Progress Bar */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-white truncate flex items-center gap-1.5">
              <Music className="h-3.5 w-3.5 text-pink-200" /> {title} <Sparkles className="h-3 w-3 text-amber-200" />
            </span>
            <span className="text-[10px] font-medium text-pink-100 font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white hover:bg-white/40 transition"
          />
        </div>

        {/* Mute Button */}
        <button
          onClick={toggleMute}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition"
          aria-label="Mute or Unmute"
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>

      <audio
        ref={audioRef}
        src={urlToPlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        loop
      />
    </div>
  );
}
