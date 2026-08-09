'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Music, Volume2, VolumeX, Sparkles } from 'lucide-react';

const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

export function extractYouTubeId(url?: string): string | null {
  if (!url) return null;
  const str = url.trim();
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = str.match(regExp);
  if (match && match[2] && match[2].length === 11) {
    return match[2];
  }
  return null;
}

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
  const ytPlayerRef = useRef<any>(null);

  const urlToPlay = audioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3';
  const youtubeId = extractYouTubeId(urlToPlay);

  // Initialize YouTube IFrame Player API when youtubeId is present
  useEffect(() => {
    if (!youtubeId) return;

    let isMounted = true;

    const initYT = () => {
      if (typeof window !== 'undefined' && (window as any).YT && (window as any).YT.Player) {
        const playerElementId = `yt-player-${Math.random().toString(36).substring(2, 7)}`;
        const container = document.getElementById('yt-player-container');
        if (container) {
          container.innerHTML = `<div id="${playerElementId}"></div>`;
          ytPlayerRef.current = new (window as any).YT.Player(playerElementId, {
            videoId: youtubeId,
            playerVars: {
              autoplay: 0,
              controls: 0,
              loop: 1,
              playlist: youtubeId,
              modestbranding: 1,
              playsinline: 1,
            },
            events: {
              onStateChange: (event: any) => {
                if (!isMounted) return;
                // 1 = PLAYING, 2 = PAUSED
                if (event.data === 1) setIsPlaying(true);
                else if (event.data === 2) setIsPlaying(false);
              },
            },
          });
        }
      }
    };

    if (typeof window !== 'undefined' && (window as any).YT && (window as any).YT.Player) {
      initYT();
    } else {
      const existingScript = document.getElementById('youtube-iframe-api');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(tag);
      }
      const prevCallback = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        initYT();
      };
    }

    return () => {
      isMounted = false;
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (e) {}
      }
    };
  }, [youtubeId]);

  // Sync seek position and duration for both HTML5 Audio and YouTube API
  useEffect(() => {
    const interval = setInterval(() => {
      if (youtubeId && ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
        try {
          const cur = ytPlayerRef.current.getCurrentTime() || 0;
          const dur = ytPlayerRef.current.getDuration() || 0;
          setCurrentTime(cur);
          if (dur > 0) setDuration(dur);
        } catch (e) {}
      } else if (!youtubeId && audioRef.current) {
        setCurrentTime(audioRef.current.currentTime || 0);
        if (audioRef.current.duration) setDuration(audioRef.current.duration);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [youtubeId]);

  const togglePlay = () => {
    if (youtubeId) {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.getPlayerState === 'function') {
        const state = ytPlayerRef.current.getPlayerState();
        if (state === 1) {
          ytPlayerRef.current.pauseVideo();
          setIsPlaying(false);
        } else {
          ytPlayerRef.current.playVideo();
          setIsPlaying(true);
        }
      }
    } else {
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
    }
  };

  const toggleMute = () => {
    if (youtubeId) {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.isMuted === 'function') {
        if (ytPlayerRef.current.isMuted()) {
          ytPlayerRef.current.unMute();
          setIsMuted(false);
        } else {
          ytPlayerRef.current.mute();
          setIsMuted(true);
        }
      }
    } else {
      if (!audioRef.current) return;
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = Number(e.target.value);
    setCurrentTime(seekTime);

    if (youtubeId) {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
        ytPlayerRef.current.seekTo(seekTime, true);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.currentTime = seekTime;
      }
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
              {youtubeId ? <YoutubeIcon className="h-4 w-4 text-red-200" /> : <Music className="h-3.5 w-3.5 text-pink-200" />}{' '}
              {title} <Sparkles className="h-3 w-3 text-amber-200" />
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

      {/* Hidden Engine Elements */}
      {youtubeId ? (
        <div id="yt-player-container" className="absolute top-0 left-0 w-1 h-1 opacity-0 pointer-events-none overflow-hidden" />
      ) : (
        <audio
          ref={audioRef}
          src={urlToPlay}
          onTimeUpdate={() => {
            if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
          }}
          onLoadedMetadata={() => {
            if (audioRef.current) setDuration(audioRef.current.duration);
          }}
          loop
        />
      )}
    </div>
  );
}
