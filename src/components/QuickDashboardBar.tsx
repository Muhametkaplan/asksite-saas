'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Settings } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getOrCreateDeviceToken } from '@/lib/deviceSession';

interface QuickDashboardBarProps {
  slug: string;
}

export default function QuickDashboardBar({ slug }: QuickDashboardBarProps) {
  const [isPartner, setIsPartner] = useState(false);

  useEffect(() => {
    const storedAuth = typeof window !== 'undefined'
      ? sessionStorage.getItem(`asksite_auth_${slug}`) || localStorage.getItem(`asksite_auth_${slug}`)
      : null;
    const deviceToken = typeof window !== 'undefined' ? localStorage.getItem('asksite_device_token') : null;

    if (storedAuth || deviceToken) {
      setIsPartner(true);
    }

    // 2. Check Firebase auth
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setIsPartner(true);
      }
    });

    return () => unsubscribe();
  }, [slug]);

  if (!isPartner) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 z-30 animate-in fade-in duration-200">
      <Link
        href={`/dashboard?slug=${slug}`}
        className="flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 via-pink-600 to-purple-600 px-4 py-2 text-xs font-black text-white shadow-xl hover:scale-105 transition active:scale-95 group"
      >
        <LayoutDashboard className="h-4 w-4 text-white group-hover:rotate-12 transition-transform duration-300" />
        <span>Yönetim Paneline Git ➔</span>
      </Link>
    </div>
  );
}
