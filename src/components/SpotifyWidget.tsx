'use client';

import { useState, useEffect } from 'react';
import { Music2, Sparkles, Disc } from 'lucide-react';

interface SpotifyWidgetProps {
  spotifyUrl?: string;
  lyrics?: string[];
}

export default function SpotifyWidget({ spotifyUrl, lyrics }: SpotifyWidgetProps) {
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0);

  // Default lyrics if none provided
  const lyricList = lyrics && lyrics.length > 0
    ? lyrics
    : [
        'Sen benim kalbimin en tatlı melodisisin... 🎵',
        'Gözlerine baktığım an tüm dertler unutuluyor...',
        'Birlikte söyleyeceğimiz daha nice şarkılara ❤️',
        'Kalbim ritmini seninle buluyor ✨',
      ];

  // Helper to convert any Spotify share link (mobile, intl-tr, desktop, uri) to valid embed iframe src
  const getEmbedSrc = (url?: string) => {
    const defaultEmbed = 'https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M?utm_source=generator&theme=0';
    if (!url || typeof url !== 'string' || !url.trim()) {
      return defaultEmbed;
    }

    const cleanUrl = url.trim();

    // Extract type (playlist, track, album, artist) and ID (handles intl-tr, intl-es, desktop, mobile)
    const match = cleanUrl.match(/(playlist|track|album|artist)[\/:]([a-zA-Z0-9]+)/i);
    if (match && match[1] && match[2]) {
      const type = match[1].toLowerCase();
      const id = match[2];
      return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
    }

    // Fallback if match fails: remove intl-xx and fix embed path
    let formatted = cleanUrl.replace(/\/intl-[a-z]{2}\//i, '/');
    if (!formatted.includes('/embed/')) {
      formatted = formatted.replace('spotify.com/', 'spotify.com/embed/');
    }
    return formatted;
  };

  const embedSrc = getEmbedSrc(spotifyUrl);

  // Automatic scrolling for romantic lyrics/karaoke
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentLyricIndex((prev) => (prev + 1) % lyricList.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [lyricList.length]);

  return (
    <div className="spotify-widget my-6 rounded-3xl bg-gradient-to-br from-rose-900/90 via-slate-900 to-pink-950 p-5 text-white shadow-xl backdrop-blur-md border border-rose-500/30 overflow-hidden relative">
      {/* Decorative Glow */}
      <div className="absolute -top-12 -left-12 h-32 w-32 rounded-full bg-emerald-500/20 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-rose-500/20 blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Music2 className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-rose-100 flex items-center gap-1.5">
              Spotify Favori Çalma Listemiz 💚
            </h3>
            <p className="text-[11px] text-rose-200/70">Aşk Şarkılarımız & Dinamik Karaoke</p>
          </div>
        </div>
        <Disc className="h-6 w-6 text-pink-400/80 animate-spin-slow" />
      </div>

      {/* Spotify Embed Player */}
      <div className="rounded-2xl overflow-hidden shadow-inner border border-white/10 bg-black/40">
        <iframe
          src={embedSrc}
          width="100%"
          height="152"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="rounded-2xl border-0"
          title="Spotify Music Player"
        />
      </div>

      {/* Karaoke / Romantik Akış Alanı */}
      <div className="mt-4 rounded-2xl bg-white/10 p-3.5 backdrop-blur-sm border border-white/10 text-center relative overflow-hidden">
        <div className="text-[10px] font-bold uppercase tracking-wider text-rose-300 flex items-center justify-center gap-1 mb-1">
          <Sparkles className="h-3 w-3 text-amber-300" /> Romantik Karaoke Akışı <Sparkles className="h-3 w-3 text-amber-300" />
        </div>
        <div className="min-h-[40px] flex items-center justify-center px-2">
          <p className="text-xs font-semibold text-pink-100 italic transition-all duration-700 animate-in fade-in slide-in-from-bottom-2">
            "{lyricList[currentLyricIndex]}"
          </p>
        </div>
      </div>
    </div>
  );
}
