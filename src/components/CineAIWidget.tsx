'use client';

import { useState } from 'react';
import { Bot, Film, ChevronDown, ChevronUp, Sparkles, Loader2 } from 'lucide-react';
import { MovieRecommendationResponse } from '@/types/couple';

interface CineAIWidgetProps {
  partnerName: string;
}

export default function CineAIWidget({ partnerName }: CineAIWidgetProps) {
  const [selectedGenre, setSelectedGenre] = useState('');
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [mood, setMood] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MovieRecommendationResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

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
      alert(`Lütfen ${partnerName} için bir film türü seç tatlım! 💖`);
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setResult(null);

    try {
      const res = await fetch('/api/ai/recommend-movie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genre: selectedGenre, mood, partnerName }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Bir hata oluştu.');
      } else {
        setResult(data);
      }
    } catch (e) {
      setErrorMsg('Bağlantı hatası oluştu, lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="box-style my-6 rounded-3xl bg-white/70 backdrop-blur-md p-6 border-t-4 border-indigo-500 border-x border-b border-white/80 shadow-md">
      <h3 className="flex items-center justify-center gap-2 text-lg font-bold text-indigo-600 mb-1">
        <Bot className="h-5 w-5 text-indigo-500" /> Mami-AI Sinema Önerisi
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Hangi tür film istersin? (Gemini Yapay Zeka)
      </p>

      {/* Main genres */}
      <div className="flex flex-wrap justify-center gap-2 mb-3">
        {primaryGenres.map((g) => (
          <button
            key={g}
            onClick={() => setSelectedGenre(g)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              selectedGenre === g
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
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
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                selectedGenre === g
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => setShowAllGenres(!showAllGenres)}
        className="flex items-center gap-1 mx-auto text-xs font-semibold text-indigo-500 hover:underline mb-4"
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
      <p className="text-xs font-semibold text-gray-700 text-left mb-1.5">
        Şu an nasıl hissediyorsun?
      </p>
      <input
        type="text"
        value={mood}
        onChange={(e) => setMood(e.target.value)}
        placeholder="Örn: Tatlı bir hüzün var, sarılmak istiyorum..."
        className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 mb-4"
      />

      <button
        onClick={handleAskAI}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Mami-AI düşünüyor...
          </>
        ) : (
          <>
            <Film className="h-4 w-4" /> Bana Film Öner 🎬
          </>
        )}
      </button>

      {/* Result ticket */}
      {result && (
        <div className="mt-4 rounded-2xl bg-amber-50/90 border border-amber-200 p-4 text-left shadow-sm animate-in fade-in duration-300">
          <div className="text-center font-bold text-xs tracking-wider text-amber-700 mb-2 border-b border-amber-200 pb-2">
            🍿 CINE-AI SEÇİMİ 🍿
          </div>
          <div className="text-base font-extrabold text-indigo-900 mb-1">
            🎬 {result.title}
          </div>
          <div className="text-xs text-gray-700 mb-2">
            <span className="font-bold text-indigo-600">📜 Konu:</span> {result.plot}
          </div>
          <div className="text-xs text-gray-700">
            <span className="font-bold text-rose-500">❤️ Neden İzlemelisiniz:</span>{' '}
            {result.reason}
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mt-3 rounded-xl bg-rose-50 p-3 text-xs text-rose-600 font-medium">
          {errorMsg}
        </div>
      )}
    </div>
  );
}
