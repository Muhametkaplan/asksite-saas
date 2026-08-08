'use client';

import Link from 'next/link';
import { Home, Gamepad2, BookOpen, Plane, Brain } from 'lucide-react';

interface BottomNavProps {
  slug: string;
}

export default function BottomNav({ slug }: BottomNavProps) {
  const prefix = slug === 'demo' ? '/demo' : `/c/${slug}`;

  return (
    <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-5 rounded-full bg-white/85 backdrop-blur-xl px-6 py-3 shadow-2xl border border-white/90 transition-all hover:scale-105">
      <Link href={prefix} className="text-gray-500 hover:text-rose-500 transition flex flex-col items-center gap-0.5" title="Ana Sayfa">
        <Home className="h-5 w-5" />
        <span className="text-[9px] font-bold">Ana Sayfa</span>
      </Link>
      <Link href={`${prefix}#bucketlist`} className="text-gray-500 hover:text-rose-500 transition flex flex-col items-center gap-0.5" title="Bucket List">
        <Plane className="h-5 w-5" />
        <span className="text-[9px] font-bold">Rota</span>
      </Link>
      <Link href={`${prefix}/quiz`} className="text-gray-500 hover:text-rose-500 transition flex flex-col items-center gap-0.5" title="Aşk Testi">
        <Brain className="h-5 w-5 text-emerald-500" />
        <span className="text-[9px] font-bold text-emerald-600">Test</span>
      </Link>
      <Link href={`${prefix}/games`} className="text-gray-500 hover:text-rose-500 transition flex flex-col items-center gap-0.5" title="Oyunlar">
        <Gamepad2 className="h-5 w-5" />
        <span className="text-[9px] font-bold">Oyunlar</span>
      </Link>
      <Link href={`${prefix}/diary`} className="text-gray-500 hover:text-rose-500 transition flex flex-col items-center gap-0.5" title="Anı Defteri">
        <BookOpen className="h-5 w-5" />
        <span className="text-[9px] font-bold">Anılar</span>
      </Link>
    </div>
  );
}
