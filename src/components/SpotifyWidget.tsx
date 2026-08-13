'use client';

import { useState, useEffect } from 'react';
import { Music2, Sparkles, Disc, ExternalLink, Info } from 'lucide-react';

interface SpotifyWidgetProps {
  spotifyUrl?: string;
  lyrics?: string[];
}

const PRESETS = [
  { name: '💖 Romantik Hits', url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DWZQD1rStM4VL' },
  { name: '🌸 Pop Aşk', url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX3j9660i1g6X' },
  { name: '🎵 Aşk Şarkıları', url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX506F6QhE9q7' },
];

export default function SpotifyWidget({ spotifyUrl, lyrics }: SpotifyWidgetProps) {
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0);
  const [showDebug, setShowDebug] = useState(false);
  const [activeOverride, setActiveOverride] = useState<string | null>(null);

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
    if (activeOverride) return activeOverride;

    const fallbackId = '37i9dQZF1DWZQD1rStM4VL'; // Official Spotify "Romantik Hits"
    const fallbackEmbed = `https://open.spotify.com/embed/playlist/${fallbackId}`;

    if (!url || typeof url !== 'string' || !url.trim()) {
      return fallbackEmbed;
    }

    let cleanUrl = url.trim();

    // 1. If already a clean embed URL, strip tracking params (&pi=, &sci=) and return
    if (cleanUrl.includes('spotify.com/embed/')) {
      const qIndex = cleanUrl.indexOf('?');
      return qIndex !== -1 ? cleanUrl.substring(0, qIndex) : cleanUrl;
    }

    // 2. Extract Spotify item type (playlist, track, album, artist) and ID (Base62)
    const match = cleanUrl.match(/(playlist|track|album|artist)[\/:]([a-zA-Z0-9]+)/i);
    if (match && match[1] && match[2]) {
      const type = match[1].toLowerCase();
      const id = match[2];
      return `https://open.spotify.com/embed/${type}/${id}`;
    }

    // 3. Fallback: replace spotify.com/ with spotify.com/embed/ and strip query params
    let formatted = cleanUrl.replace(/\/intl-[a-z]{2}\//i, '/');
    if (!formatted.includes('spotify.com/embed/')) {
      formatted = formatted.replace('spotify.com/', 'spotify.com/embed/');
    }
    const qIndex = formatted.indexOf('?');
    if (qIndex !== -1) {
      formatted = formatted.substring(0, qIndex);
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
    <div className="spotify-widget my-6 rounded-3xl bg-gradient-to-br from-rose-900/90 via-slate-900 to-pink-950 p-5 text-white shadow-xl backdrop-blur-md border border-rose-500/30 overflow-hidden relative space-y-3">
      {/* Decorative Glow */}
      <div className="absolute -top-12 -left-12 h-32 w-32 rounded-full bg-emerald-500/20 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-rose-500/20 blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-rose-200 transition"
            title="Link Bilgisi / Hata Ayıklama"
          >
            <Info className="h-4 w-4" />
          </button>
          <Disc className="h-6 w-6 text-pink-400/80 animate-spin-slow" />
        </div>
      </div>

      {/* Preset Quick Selectors & Open App Button */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px] font-bold">
        <div className="flex items-center gap-1 overflow-x-auto py-1 max-w-full">
          {PRESETS.map((preset) => (
            <button
              key={preset.url}
              onClick={() => setActiveOverride(preset.url)}
              className={`px-2.5 py-1 rounded-xl transition border ${
                (activeOverride === preset.url || (!activeOverride && embedSrc === preset.url))
                  ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/50 shadow-2xs'
                  : 'bg-white/5 text-rose-200/80 hover:bg-white/10 border-white/10'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
        <a
          href={embedSrc.replace('/embed/', '/')}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white transition text-[10px] font-extrabold shadow-2xs"
        >
          <span>Spotify App</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Debug Info Dropdown (If toggled by user) */}
      {showDebug && (
        <div className="p-3 rounded-xl bg-black/60 border border-amber-500/40 text-[10px] font-mono space-y-1 animate-in fade-in duration-150 text-amber-200">
          <p><strong>Gelen spotifyUrl:</strong> {spotifyUrl || '(Tanımsız / Boş)'}</p>
          <p><strong>Yüklenen embedSrc:</strong> {embedSrc}</p>
        </div>
      )}

      {/* Spotify Embed Player */}
      <div className="rounded-2xl overflow-hidden shadow-inner border border-white/10 bg-black/40">
        <iframe
          src={embedSrc}
          width="100%"
          height="152"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          loading="lazy"
          className="rounded-2xl border-0 w-full"
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
