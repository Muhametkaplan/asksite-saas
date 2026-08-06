'use client';

import { useState, useEffect } from 'react';

interface RelationshipTimerProps {
  startDateISO: string;
}

export default function RelationshipTimer({ startDateISO }: RelationshipTimerProps) {
  const [timeDiff, setTimeDiff] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const startDate = new Date(startDateISO).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, now - startDate);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeDiff({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startDateISO]);

  return (
    <div className="timer-box my-6 rounded-3xl bg-gradient-to-br from-pink-500/90 to-rose-600/90 p-6 text-center text-white shadow-xl backdrop-blur-md">
      <div className="text-xs font-bold uppercase tracking-[2.5px] opacity-90 mb-4">
        BİRLİKTELİĞİMİZ
      </div>
      <div className="grid grid-cols-4 gap-2">
        <div className="time-segment flex flex-col items-center rounded-2xl bg-white/20 p-3 backdrop-blur-sm">
          <span className="time-val text-2xl font-extrabold sm:text-3xl">{timeDiff.days}</span>
          <span className="time-lbl text-xs font-medium text-pink-100 mt-1">Gün</span>
        </div>
        <div className="time-segment flex flex-col items-center rounded-2xl bg-white/20 p-3 backdrop-blur-sm">
          <span className="time-val text-2xl font-extrabold sm:text-3xl">{timeDiff.hours}</span>
          <span className="time-lbl text-xs font-medium text-pink-100 mt-1">Saat</span>
        </div>
        <div className="time-segment flex flex-col items-center rounded-2xl bg-white/20 p-3 backdrop-blur-sm">
          <span className="time-val text-2xl font-extrabold sm:text-3xl">{timeDiff.minutes}</span>
          <span className="time-lbl text-xs font-medium text-pink-100 mt-1">Dakika</span>
        </div>
        <div className="time-segment flex flex-col items-center rounded-2xl bg-white/20 p-3 backdrop-blur-sm">
          <span className="time-val text-2xl font-extrabold sm:text-3xl">{timeDiff.seconds}</span>
          <span className="time-lbl text-xs font-medium text-pink-100 mt-1">Saniye</span>
        </div>
      </div>
    </div>
  );
}
