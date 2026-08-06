'use client';

import { PhoneCall } from 'lucide-react';
import confetti from 'canvas-confetti';

interface EmergencyHugProps {
  phone: string;
  message: string;
}

export default function EmergencyHug({ phone, message }: EmergencyHugProps) {
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Fire dynamic upward heart & confetti burst
    confetti({
      particleCount: 60,
      spread: 100,
      origin: { y: 0.8 },
      colors: ['#ff4d6d', '#ff758f', '#ffb3c1', '#6c5ce7', '#38ef7d'],
    });

    // Fire second burst after 200ms
    setTimeout(() => {
      confetti({
        particleCount: 40,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ff4d6d', '#e84393'],
      });
      confetti({
        particleCount: 40,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ff4d6d', '#e84393'],
      });
    }, 200);
  };

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-emerald-600 active:scale-95"
    >
      <PhoneCall className="h-5 w-5" /> Acil Sarılma Butonu 🥺
    </a>
  );
}
