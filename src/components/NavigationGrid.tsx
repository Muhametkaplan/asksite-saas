'use client';

import Link from 'next/link';
import { Gamepad2, Ticket, Palette, BookOpen, Hourglass, Film, Disc, Brain } from 'lucide-react';

interface NavigationGridProps {
  slug: string;
}

export default function NavigationGrid({ slug }: NavigationGridProps) {
  const items = [
    { label: 'Oyunlar', icon: Gamepad2, color: 'text-rose-500', href: `/c/${slug}/games` },
    { label: 'Kuponlar', icon: Ticket, color: 'text-amber-500', href: `/c/${slug}/coupons` },
    { label: 'Sanat Galerisi', icon: Palette, color: 'text-purple-500', href: `/c/${slug}/therapy` },
    { label: 'Anı Defteri', icon: BookOpen, color: 'text-indigo-500', href: `/c/${slug}/diary` },
    { label: 'Zaman Kapsülü', icon: Hourglass, color: 'text-teal-500', href: `/c/${slug}/capsule` },
    { label: 'Sinemamız', icon: Film, color: 'text-blue-500', href: `/c/${slug}/cinema` },
    { label: 'Aşk Çarkı', icon: Disc, color: 'text-pink-500', href: `/c/${slug}/wheel` },
    { label: 'Aşk Testi', icon: Brain, color: 'text-emerald-500', href: `/c/${slug}/quiz` },
  ];

  return (
    <div className="menu-grid my-6 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <Link
            key={idx}
            href={item.href}
            className="menu-item group flex flex-col items-center justify-center rounded-2xl bg-white/70 backdrop-blur-md p-4 shadow-sm border border-white/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:bg-white/90"
          >
            <Icon className={`h-7 w-7 ${item.color} transition-transform duration-300 group-hover:scale-110 mb-2`} />
            <span className="text-xs font-semibold text-gray-700">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
