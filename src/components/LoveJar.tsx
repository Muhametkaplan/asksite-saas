'use client';

import { useState } from 'react';
import { Heart, Sparkles, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LoveJarProps {
  reasons: string[];
}

export default function LoveJar({ reasons }: LoveJarProps) {
  const [isShaking, setIsShaking] = useState(false);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);

  const pickReason = () => {
    if (isShaking) return;
    setIsShaking(true);

    setTimeout(() => {
      setIsShaking(false);
      const randomReason = reasons[Math.floor(Math.random() * reasons.length)];
      setSelectedNote(randomReason);

      // Trigger rich celebration confetti & heart explosion
      confetti({
        particleCount: 65,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#ff4d6d', '#ff758f', '#ffb3c1', '#6c5ce7', '#ffd166', '#e84393'],
      });

      setTimeout(() => {
        confetti({
          particleCount: 35,
          angle: 60,
          spread: 45,
          origin: { x: 0.1, y: 0.7 },
          colors: ['#ff4d6d', '#ff758f', '#fd79a8'],
        });
        confetti({
          particleCount: 35,
          angle: 120,
          spread: 45,
          origin: { x: 0.9, y: 0.7 },
          colors: ['#ff4d6d', '#ff758f', '#fd79a8'],
        });
      }, 150);
    }, 600);
  };

  return (
    <div className="box-style my-6 rounded-3xl bg-white/70 backdrop-blur-md p-6 border border-white/80 shadow-md text-center">
      <h3 className="flex items-center justify-center gap-2 text-lg font-bold text-pink-600 mb-1">
        <Heart className="h-5 w-5 fill-pink-500 text-pink-500" /> Sevgi Kavanozu
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Kavanoza tıklayıp kalbinden bir not çek...
      </p>

      <div
        onClick={pickReason}
        className={`jar-container my-4 inline-block cursor-pointer transition-transform hover:scale-105 active:scale-95 ${
          isShaking ? 'animate-bounce' : ''
        }`}
      >
        <svg
          className="h-32 w-28 drop-shadow-md mx-auto"
          viewBox="0 0 100 130"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Lid */}
          <rect x="25" y="10" width="50" height="12" rx="4" fill="#c5a880" stroke="#7d613b" strokeWidth="2" />
          <rect x="22" y="17" width="56" height="5" rx="2" fill="#d8be96" />
          {/* Neck Ribbon */}
          <path d="M 28 22 C 38 28, 62 28, 72 22" stroke="#e05a76" strokeWidth="3" strokeLinecap="round" />
          <path d="M 50 25 L 42 42 M 50 25 L 58 42" stroke="#e05a76" strokeWidth="2" strokeLinecap="round" />
          {/* Glass Body */}
          <path
            d="M 28 22 L 28 35 C 28 40, 15 50, 15 70 L 15 105 C 15 118, 30 125, 50 125 C 70 125, 85 118, 85 105 L 85 70 C 85 50, 72 40, 72 35 L 72 22 Z"
            fill="rgba(255, 255, 255, 0.45)"
            stroke="rgba(180, 210, 230, 0.8)"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Hearts inside */}
          <path d="M 45 60 C 45 55, 55 55, 50 60 C 45 55, 35 55, 45 60" fill="#ff7675" opacity="0.8" />
          <path d="M 32 82 C 32 78, 40 78, 36 82 C 32 78, 24 78, 32 82" fill="#ff7675" opacity="0.9" transform="rotate(15, 32, 82)" />
          <path d="M 62 75 C 62 71, 70 71, 66 75 C 62 71, 54 71, 62 75" fill="#e84393" opacity="0.85" transform="rotate(-20, 62, 75)" />
          <path d="M 48 98 C 48 93, 58 93, 53 98 C 48 93, 38 93, 48 98" fill="#fd79a8" opacity="0.9" />
          {/* Reflections */}
          <path d="M 22 70 Q 20 90, 24 105" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="2" strokeLinecap="round" />
          <path d="M 78 70 Q 80 90, 76 105" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>

      <button
        onClick={pickReason}
        className="flex items-center justify-center gap-2 mx-auto rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg active:scale-95"
      >
        <Sparkles className="h-4 w-4" /> Not Çek ✨
      </button>

      {/* Note Modal */}
      {selectedNote && (
        <div
          onClick={() => setSelectedNote(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-3xl bg-gradient-to-br from-pink-50 to-rose-100 p-6 shadow-2xl border border-white text-center"
          >
            <button
              onClick={() => setSelectedNote(null)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-500 hover:bg-white"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="text-3xl mb-2">💌</div>
            <p className="text-base font-semibold text-rose-900 leading-relaxed">
              ✨ {selectedNote} ✨
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
