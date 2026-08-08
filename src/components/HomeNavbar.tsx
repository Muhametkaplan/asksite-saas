'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, LayoutDashboard, LogIn } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function HomeNavbar() {
  const [user, setUser] = useState<{ displayName?: string; email?: string } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          displayName: firebaseUser.displayName || '',
          email: firebaseUser.email || '',
        });
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-xs px-4 sm:px-8 py-3.5">
      <div className="mx-auto max-w-5xl flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-black text-rose-600">
          <Heart className="h-6 w-6 fill-rose-500 text-rose-500 animate-pulse" /> AskSite SaaS
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 px-4 py-2 text-xs font-black text-white shadow-md hover:scale-105 transition active:scale-95"
            >
              <LayoutDashboard className="h-4 w-4" /> Yönetim Paneline Git ➔
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-2xl bg-white border border-gray-200 px-4 py-2 text-xs font-extrabold text-gray-800 shadow-xs hover:bg-gray-50 transition"
            >
              <LogIn className="h-4 w-4 text-rose-500" /> Giriş Yap / Kayıt Ol
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
