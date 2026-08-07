'use client';

import { useState, useEffect } from 'react';
import { CalendarHeart, MapPin, Sparkles } from 'lucide-react';
import { UpcomingEvent } from '@/types/couple';
import { parseLocalStartDate } from './RelationshipTimer';

interface EventCountdownProps {
  event?: UpcomingEvent;
}

export default function EventCountdown({ event }: EventCountdownProps) {
  const targetEvent = event || {
    title: 'Kapadokya Yıl Dönümü Kaçamağı 🎈',
    date: '2026-09-15T00:00:00.000Z',
    location: 'Kapadokya',
  };

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const targetDate = parseLocalStartDate(targetEvent.date).getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, targetDate - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [targetEvent.date]);

  return (
    <div className="event-countdown-card my-6 rounded-3xl bg-gradient-to-br from-purple-600/90 to-indigo-700/90 p-6 text-center text-white shadow-xl backdrop-blur-md relative overflow-hidden">
      {/* Background Subtle Shapes */}
      <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-xl pointer-events-none" />

      <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-[2px] opacity-90 mb-2">
        <CalendarHeart className="h-4 w-4 text-pink-300" /> Yaklaşan Etkinlik Geri Sayımı <Sparkles className="h-3.5 w-3.5 text-amber-300" />
      </div>

      <h3 className="text-base font-extrabold sm:text-lg mb-1 text-purple-100">
        {targetEvent.title}
      </h3>

      {targetEvent.location && (
        <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-200 bg-white/10 px-3 py-1 rounded-full mb-4 border border-white/10">
          <MapPin className="h-3 w-3 text-rose-300" /> {targetEvent.location}
        </div>
      )}

      <div className="grid grid-cols-4 gap-2 mt-2">
        <div className="flex flex-col items-center rounded-2xl bg-white/15 p-2.5 backdrop-blur-sm">
          <span className="text-xl font-extrabold sm:text-2xl">{timeLeft.days}</span>
          <span className="text-[10px] font-medium text-purple-200 mt-0.5">Gün</span>
        </div>
        <div className="flex flex-col items-center rounded-2xl bg-white/15 p-2.5 backdrop-blur-sm">
          <span className="text-xl font-extrabold sm:text-2xl">{timeLeft.hours}</span>
          <span className="text-[10px] font-medium text-purple-200 mt-0.5">Saat</span>
        </div>
        <div className="flex flex-col items-center rounded-2xl bg-white/15 p-2.5 backdrop-blur-sm">
          <span className="text-xl font-extrabold sm:text-2xl">{timeLeft.minutes}</span>
          <span className="text-[10px] font-medium text-purple-200 mt-0.5">Dakika</span>
        </div>
        <div className="flex flex-col items-center rounded-2xl bg-white/15 p-2.5 backdrop-blur-sm">
          <span className="text-xl font-extrabold sm:text-2xl">{timeLeft.seconds}</span>
          <span className="text-[10px] font-medium text-purple-200 mt-0.5">Saniye</span>
        </div>
      </div>
    </div>
  );
}
