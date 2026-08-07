'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Settings, Sparkles, ExternalLink } from 'lucide-react';

interface QuickDashboardBarProps {
  slug: string;
}

export default function QuickDashboardBar({ slug }: QuickDashboardBarProps) {
  const [isPartner, setIsPartner] = useState(false);

  useEffect(() => {
    const storedAuth = localStorage.getItem(`asksite_auth_${slug}`);
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        if (parsed.role === 'partner1' || parsed.role === 'partner2') {
          setIsPartner(true);
        }
      } catch {}
    }
  }, [slug]);

  if (!isPartner) {
    return null; // Hidden for visitors / guests
  }

  return (
    <div className="fixed top-4 left-4 z-30 animate-in fade-in duration-200">
      <Link
        href={`/dashboard?slug=${slug}`}
        className="flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-md px-4 py-1.5 text-xs font-extrabold text-gray-900 shadow-lg border border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition active:scale-95 group"
      >
        <Settings className="h-4 w-4 text-rose-500 group-hover:rotate-90 transition-transform duration-300" />
        <span>Sayfamı Düzenle</span>
        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] text-rose-600 font-bold hidden sm:inline">
          Yönetim Paneli
        </span>
      </Link>
    </div>
  );
}
