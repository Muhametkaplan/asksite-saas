'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, Gamepad2, BookOpen, Plane, Brain, Sparkles } from 'lucide-react';

interface BottomNavProps {
  slug: string;
}

export default function BottomNav({ slug }: BottomNavProps) {
  const pathname = usePathname() || '';
  const router = useRouter();
  const prefix = slug === 'demo' ? '/demo' : `/c/${slug}`;

  const isHome = pathname === prefix || pathname === `${prefix}/`;
  const isQuiz = pathname.includes('/quiz');
  const isGames = pathname.includes('/games');
  const isDiary = pathname.includes('/diary');

  const scrollToElementWithFlash = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-4', 'ring-rose-400/50', 'transition-all', 'duration-500');
      setTimeout(() => {
        el.classList.remove('ring-4', 'ring-rose-400/50');
      }, 1500);
      return true;
    }
    return false;
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    if (isHome) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleRotaClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isHome) {
      const scrolled = scrollToElementWithFlash('bucketlist') || scrollToElementWithFlash('rota');
      if (!scrolled) {
        window.location.hash = 'bucketlist';
      }
    } else {
      router.push(`${prefix}#bucketlist`);
      setTimeout(() => {
        scrollToElementWithFlash('bucketlist');
      }, 400);
    }
  };

  const navItems = [
    {
      id: 'home',
      label: 'Ana Sayfa',
      icon: Home,
      href: prefix,
      active: isHome,
      onClick: handleHomeClick,
      color: 'text-rose-500',
      activeBg: 'bg-rose-50/90 border-rose-200 text-rose-600',
      hoverColor: 'hover:text-rose-500',
    },
    {
      id: 'rota',
      label: 'Rota',
      icon: Plane,
      href: `${prefix}#bucketlist`,
      active: false,
      onClick: handleRotaClick,
      color: 'text-sky-500',
      activeBg: 'bg-sky-50/90 border-sky-200 text-sky-600',
      hoverColor: 'hover:text-sky-500',
    },
    {
      id: 'quiz',
      label: 'Test',
      icon: Brain,
      href: `${prefix}/quiz`,
      active: isQuiz,
      color: 'text-purple-500',
      activeBg: 'bg-purple-50/90 border-purple-200 text-purple-600',
      hoverColor: 'hover:text-purple-500',
    },
    {
      id: 'games',
      label: 'Oyunlar',
      icon: Gamepad2,
      href: `${prefix}/games`,
      active: isGames,
      color: 'text-amber-500',
      activeBg: 'bg-amber-50/90 border-amber-200 text-amber-600',
      hoverColor: 'hover:text-amber-500',
    },
    {
      id: 'diary',
      label: 'Anılar',
      icon: BookOpen,
      href: `${prefix}/diary`,
      active: isDiary,
      color: 'text-pink-500',
      activeBg: 'bg-pink-50/90 border-pink-200 text-pink-600',
      hoverColor: 'hover:text-pink-500',
    },
  ];

  return (
    <nav
      aria-label="Çift Navigasyon Menüsü"
      className="fixed bottom-3 sm:bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center justify-between gap-1 sm:gap-2.5 rounded-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl px-2.5 sm:px-4 py-1.5 sm:py-2 shadow-[0_12px_45px_rgba(244,63,94,0.18)] border border-white/80 dark:border-white/10 w-[94vw] sm:w-auto max-w-md transition-all duration-300 hover:shadow-[0_16px_50px_rgba(244,63,94,0.25)] hover:scale-[1.01]"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.active;

        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={item.onClick}
            title={item.label}
            className={`group relative flex flex-1 sm:flex-initial flex-col items-center justify-center py-1.5 px-2.5 sm:px-3.5 rounded-2xl transition-all duration-200 active:scale-90 min-w-[56px] min-h-[46px] ${
              isActive
                ? `${item.activeBg} border shadow-xs scale-102 font-black`
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/60'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Icon
                className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? item.color : `text-gray-500 ${item.hoverColor}`
                }`}
              />
              {isActive && (
                <span className="absolute -top-1 -right-1 flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                </span>
              )}
            </div>
            <span
              className={`mt-0.5 text-[10px] tracking-tight transition-colors duration-150 ${
                isActive ? 'font-black text-gray-900' : 'font-bold text-gray-500'
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
