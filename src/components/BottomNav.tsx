'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, Gamepad2, BookOpen, Plane, Brain } from 'lucide-react';

interface BottomNavProps {
  slug: string;
}

export default function BottomNav({ slug }: BottomNavProps) {
  const pathname = usePathname() || '';
  const router = useRouter();
  const prefix = slug === 'demo' ? '/demo' : `/c/${slug}`;

  const [isNight, setIsNight] = useState(false);

  useEffect(() => {
    // 1. Initial check: session storage or time-based (22:00 - 06:00)
    const stored = typeof window !== 'undefined' ? sessionStorage.getItem('asksite_theme_is_night') : null;
    if (stored !== null) {
      setIsNight(stored === 'true');
    } else {
      const h = new Date().getHours();
      setIsNight(h >= 22 || h < 6);
    }

    // 2. Listen to theme changes dispatched from DayNightGreeting
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ isNight: boolean }>;
      if (customEvent.detail && typeof customEvent.detail.isNight === 'boolean') {
        setIsNight(customEvent.detail.isNight);
      }
    };

    window.addEventListener('asksite_theme_change', handleThemeChange);
    return () => window.removeEventListener('asksite_theme_change', handleThemeChange);
  }, []);

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
      activeBg: isNight ? 'bg-indigo-950/80 border-indigo-500/60 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-600',
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
      activeBg: isNight ? 'bg-indigo-950/80 border-indigo-500/60 text-sky-300' : 'bg-sky-50 border-sky-200 text-sky-600',
      hoverColor: 'hover:text-sky-500',
    },
    {
      id: 'quiz',
      label: 'Test',
      icon: Brain,
      href: `${prefix}/quiz`,
      active: isQuiz,
      color: 'text-purple-500',
      activeBg: isNight ? 'bg-indigo-950/80 border-indigo-500/60 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-600',
      hoverColor: 'hover:text-purple-500',
    },
    {
      id: 'games',
      label: 'Oyunlar',
      icon: Gamepad2,
      href: `${prefix}/games`,
      active: isGames,
      color: 'text-amber-500',
      activeBg: isNight ? 'bg-indigo-950/80 border-indigo-500/60 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-600',
      hoverColor: 'hover:text-amber-500',
    },
    {
      id: 'diary',
      label: 'Anılar',
      icon: BookOpen,
      href: `${prefix}/diary`,
      active: isDiary,
      color: 'text-pink-500',
      activeBg: isNight ? 'bg-indigo-950/80 border-indigo-500/60 text-pink-300' : 'bg-pink-50 border-pink-200 text-pink-600',
      hoverColor: 'hover:text-pink-500',
    },
  ];

  return (
    <nav
      aria-label="Çift Navigasyon Menüsü"
      className={`fixed bottom-8 sm:bottom-10 left-1/2 z-50 flex -translate-x-1/2 items-center justify-between gap-1 sm:gap-2.5 rounded-full px-2.5 sm:px-4 py-1.5 sm:py-2 backdrop-blur-2xl transition-all duration-300 w-[94vw] sm:w-auto max-w-md ${
        isNight
          ? 'bg-slate-900/95 border border-indigo-500/40 text-indigo-100 shadow-[0_12px_45px_rgba(99,102,241,0.28)] hover:shadow-[0_16px_50px_rgba(99,102,241,0.35)]'
          : 'bg-white/95 border border-white/90 text-gray-700 shadow-[0_12px_45px_rgba(244,63,94,0.18)] hover:shadow-[0_16px_50px_rgba(244,63,94,0.25)]'
      }`}
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
                : isNight
                ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                : 'text-gray-500 hover:text-gray-900 hover:bg-rose-50/50'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Icon
                className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? item.color : isNight ? 'text-slate-400 ' + item.hoverColor : 'text-gray-500 ' + item.hoverColor
                }`}
              />
              {isActive && (
                <span className="absolute -top-1 -right-1 flex h-1.5 w-1.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isNight ? 'bg-indigo-400' : 'bg-rose-400'}`} />
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isNight ? 'bg-indigo-500' : 'bg-rose-500'}`} />
                </span>
              )}
            </div>
            <span
              className={`mt-0.5 text-[10px] tracking-tight transition-colors duration-150 ${
                isActive
                  ? isNight
                    ? 'font-black text-white'
                    : 'font-black text-gray-900'
                  : isNight
                  ? 'font-bold text-slate-400'
                  : 'font-bold text-gray-500'
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
