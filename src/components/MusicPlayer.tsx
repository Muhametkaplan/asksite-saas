'use client';

import { useState, useRef, useEffect } from 'react';
import { Music, Pause, Play } from 'lucide-react';
import { extractYouTubeId } from './CustomAudioPlayer';

const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

interface MusicPlayerProps {
  musicUrl: string;
}

export default function MusicPlayer({ musicUrl }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<any>(null);

  const youtubeId = extractYouTubeId(musicUrl);

  useEffect(() => {
    if (!youtubeId) return;

    let isMounted = true;

    const initYT = () => {
      if (typeof window !== 'undefined' && (window as any).YT && (window as any).YT.Player) {
        const playerElementId = `yt-music-${Math.random().toString(36).substring(2, 7)}`;
        const container = document.getElementById('yt-music-container');
        if (container) {
          container.innerHTML = `<div id="${playerElementId}"></div>`;
          ytPlayerRef.current = new (window as any).YT.Player(playerElementId, {
            videoId: youtubeId,
            playerVars: { autoplay: 0, controls: 0, loop: 1, playlist: youtubeId, playsinline: 1 },
            events: {
              onStateChange: (event: any) => {
                if (!isMounted) return;
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

  const toggleMusic = () => {
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
          .catch((e) => console.log('Müzik başlatılamadı:', e));
      }
    }
  };

  return (
    <div className="music-player-widget flex items-center justify-center gap-3 rounded-full bg-white/70 backdrop-blur-md px-5 py-3 shadow-sm border border-white/60 mb-6 relative overflow-hidden">
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
      <span className="text-sm font-medium text-rose-900/80 flex items-center gap-1.5">
        {youtubeId ? <YoutubeIcon className="h-4 w-4 text-red-500" /> : <Music className="h-4 w-4 text-rose-400" />}
        {isPlaying ? 'Aşk Melodisi Çalıyor... 🎹' : 'Arka Plan Müziği 🎵'}
      </span>

      {youtubeId ? (
        <div id="yt-music-container" className="absolute top-0 left-0 w-1 h-1 opacity-0 pointer-events-none overflow-hidden" />
      ) : (
        <audio ref={audioRef} loop src={musicUrl} />
      )}
    </div>
  );
}
