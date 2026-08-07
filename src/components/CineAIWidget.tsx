'use client';

import { useState } from 'react';
import { Bot, Film, ChevronDown, ChevronUp, Sparkles, Loader2, Plus, Check } from 'lucide-react';
import { AskSiteAIMovieItem, AskSiteAIResponse } from '@/types/couple';
import { addMovie } from '@/lib/couples';

interface AskSiteAIWidgetProps {
  partnerName: string;
  slug?: string;
}

// Confetti helper
const triggerConfetti = async () => {
  if (typeof window !== 'undefined') {
    try {
      const confetti = (await import('canvas-confetti')).default;
      confetti({ particleCount: 50, spread: 60 });
    } catch (e) {}
  }
};

export default function AskSiteAIWidget({ partnerName, slug = 'irem-muhammet' }: AskSiteAIWidgetProps) {
  const [selectedGenre, setSelectedGenre] = useState('');
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [mood, setMood] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AskSiteAIResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [addedMovieTitles, setAddedMovieTitles] = useState<Set<string>>(new Set());

  const primaryGenres = ['Romantik', 'Komedi', 'Korku', 'Bilim Kurgu', 'Animasyon'];
  const extraGenres = [
    'Aksiyon',
    'Dram',
    'Gerilim',
    'Gizem',
    'Macera',
    'Polisiye',
    'Suç',
    'Belgesel',
    'Fantastik',
    'Müzikal',
  ];

  const handleAskAI = async () => {
    if (!selectedGenre) {
      alert(`Lütfen ${partnerName} için bir film türü seçin! 💖`);
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setResult(null);

    try {
      const res = await fetch('/api/asksite-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genre: selectedGenre, mood, partnerName }),
      });

      const data: AskSiteAIResponse = await res.json().catch(() => ({} as AskSiteAIResponse));

      if (!res.ok) {
        setErrorMsg(data.error || 'Yapay zeka önerileri alınırken bir sorun oluştu.');
        if (data.movies && data.movies.length > 0) {
          setResult(data);
        }
      } else {
        setResult(data);
        if (data.error) {
          setErrorMsg(data.error);
        }
      }
    } catch (e) {
      setErrorMsg('Bağlantı hatası oluştu, lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMovieToCinema = async (movie: AskSiteAIMovieItem) => {
    const success = await addMovie(slug, {
      title: movie.title,
      genre: movie.genre || selectedGenre || 'Romantik',
      poster_url: movie.poster_url || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop',
      watch_url: movie.watch_url || '',
      rating: 0,
      note: movie.reason || 'AskSite-AI tarafından önerildi.',
      status: 'watchlist',
      added_by: 'AskSite-AI',
    });

    if (success) {
      setAddedMovieTitles((prev) => new Set(prev).add(movie.title));
      triggerConfetti();
    }
  };

  return (
    <div className="box-style my-6 rounded-3xl bg-gradient-to-br from-indigo-900/90 via-slate-900 to-purple-950 p-6 text-white shadow-2xl border border-indigo-500/30 relative overflow-hidden backdrop-blur-md">
      {/* Subtle Glowing Background Orbs */}
      <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-rose-500/20 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />

      <h3 className="flex items-center justify-center gap-2 text-lg font-extrabold text-rose-300 mb-1">
        <Bot className="h-5 w-5 text-rose-400 animate-pulse" /> AskSite-AI Yapay Zeka Asistanı
      </h3>
      <p className="text-xs text-indigo-200 text-center mb-5">
        Çiftinize özel sinema ve dizi önerileri sunan akıllı AI danışmanınız ✨
      </p>

      {/* Main genres */}
      <div className="flex flex-wrap justify-center gap-2 mb-3">
        {primaryGenres.map((g) => (
          <button
            key={g}
            onClick={() => setSelectedGenre(g)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
              selectedGenre === g
                ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-lg scale-105'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Extra genres toggle */}
      {showAllGenres && (
        <div className="flex flex-wrap justify-center gap-2 mb-3 animate-in fade-in duration-200">
          {extraGenres.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                selectedGenre === g
                  ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-lg scale-105'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => setShowAllGenres(!showAllGenres)}
        className="flex items-center gap-1 mx-auto text-xs font-semibold text-rose-300 hover:underline mb-4"
      >
        {showAllGenres ? (
          <>
            Gizle <ChevronUp className="h-3.5 w-3.5" />
          </>
        ) : (
          <>
            Tüm Türleri Göster <ChevronDown className="h-3.5 w-3.5" />
          </>
        )}
      </button>

      {/* Mood Input */}
      <p className="text-xs font-bold text-slate-300 text-left mb-1.5">
        Şu an nasıl hissediyorsunuz? (Mod/Hava):
      </p>
      <input
        type="text"
        value={mood}
        onChange={(e) => setMood(e.target.value)}
        placeholder="Örn: Yağmurlu bir akşam, battaniye altında sarılmalık romantik..."
        className="w-full rounded-2xl border border-slate-700 bg-slate-800/90 px-4 py-2.5 text-xs text-white placeholder-slate-400 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 mb-4 shadow-inner"
      />

      <button
        onClick={handleAskAI}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 py-3 text-xs font-extrabold text-white shadow-xl transition hover:scale-102 active:scale-95 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> AskSite-AI Sizin İçin 3-5 Öneri Hazırlıyor... 🤖
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 text-amber-300" /> AskSite-AI İle Öneri Al 🍿
          </>
        )}
      </button>

      {/* Movie Recommendations List */}
      {result && result.movies && result.movies.length > 0 && (
        <div className="mt-6 space-y-3.5 text-left animate-in fade-in duration-300">
          <div className="text-center font-extrabold text-xs tracking-wider text-rose-300 border-b border-slate-800 pb-2 uppercase flex items-center justify-center gap-1.5">
            🍿 ASKSITE-AI ÇİFT SEÇİMLERİ ({result.movies.length} FİLM) 🍿
          </div>

          <div className="space-y-3">
            {result.movies.map((movie, idx) => {
              const isAdded = addedMovieTitles.has(movie.title);

              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-slate-800/90 border border-slate-700 p-4 shadow-lg space-y-2 relative overflow-hidden transition hover:border-rose-400/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-black text-rose-200 leading-snug">
                      🎬 {movie.title}
                    </h4>
                    <span className="rounded-full bg-rose-950/80 px-2.5 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-800/60 shrink-0">
                      {movie.genre}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-serif bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    <span className="font-bold text-rose-400">❤️ Neden İzlemelisiniz:</span> {movie.reason}
                  </p>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => handleAddMovieToCinema(movie)}
                      disabled={isAdded}
                      className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition flex items-center gap-1.5 shadow-md ${
                        isAdded
                          ? 'bg-emerald-600 text-white cursor-default'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:scale-102 active:scale-95'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> Sinema Listesinde 🍿
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" /> Sinema Listeme Ekle 🍿
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mt-3 rounded-xl bg-rose-900/40 border border-rose-700/50 p-3 text-xs text-rose-300 font-semibold text-center">
          {errorMsg}
        </div>
      )}
    </div>
  );
}
