'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun, Stars } from 'lucide-react';

interface DayNightGreetingProps {
  partner1: string;
  partner2: string;
}

export default function DayNightGreeting({ partner1, partner2 }: DayNightGreetingProps) {
  const [isNight, setIsNight] = useState(false);
  const [hour, setHour] = useState<number | null>(null);

  useEffect(() => {
    const currentHour = new Date().getHours();
    setHour(currentHour);
    // Night is defined as 22:00 to 06:00
    setIsNight(currentHour >= 22 || currentHour < 6);
  }, []);

  if (hour === null) return null;

  return (
    <div
      className={`my-4 rounded-3xl p-5 border text-center backdrop-blur-md shadow-lg transition-all duration-500 relative overflow-hidden ${
        isNight
          ? 'bg-slate-900/90 border-indigo-500/30 text-indigo-100 shadow-indigo-900/20'
          : 'bg-amber-50/80 border-amber-200/80 text-amber-900 shadow-amber-500/10'
      }`}
    >
      {/* Background Decorative Elements */}
      {isNight ? (
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-2 left-4 text-xs">✨</div>
          <div className="absolute top-6 right-8 text-sm">⭐</div>
          <div className="absolute bottom-3 left-10 text-xs">✨</div>
          <div className="absolute bottom-4 right-5 text-xs">🌟</div>
        </div>
      ) : (
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-200/40 blur-xl pointer-events-none" />
      )}

      <div className="relative z-10 flex flex-col items-center justify-center gap-1.5">
        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur-sm border shadow-xs">
          {isNight ? (
            <>
              <Moon className="h-4 w-4 text-indigo-300 animate-pulse" />
              <span className="text-indigo-200">Gece Modu Aktif</span>
              <Stars className="h-3.5 w-3.5 text-yellow-300" />
            </>
          ) : (
            <>
              <Sun className="h-4 w-4 text-amber-500 animate-spin-slow" />
              <span className="text-amber-800">Gündüz Modu</span>
            </>
          )}
        </div>

        <h2 className="text-lg font-bold sm:text-xl tracking-tight">
          {isNight ? (
            <span className="bg-gradient-to-r from-indigo-200 via-pink-200 to-rose-200 bg-clip-text text-transparent">
              İyi geceler bir tanem 🌙
            </span>
          ) : (
            <span className="bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
              Harika bir gün olsun! ☀️
            </span>
          )}
        </h2>

        <p className="text-xs opacity-80 max-w-xs mx-auto">
          {isNight
            ? `${partner1} & ${partner2} için tatlı rüyalar ve yıldızlı bir gece dileriz ✨`
            : `${partner1} & ${partner2} çiftinin sevgi dolu yeni günü başlasın! 💕`}
        </p>
      </div>
    </div>
  );
}
