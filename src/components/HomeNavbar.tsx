'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, LayoutDashboard, LogIn, Sparkles, LogOut, User } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export default function HomeNavbar() {
  const [user, setUser] = useState<{ displayName?: string; email?: string; uid?: string } | null>(null);
  const [hasPurchased, setHasPurchased] = useState<boolean>(false);
  const [userCoupleSlug, setUserCoupleSlug] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          displayName: firebaseUser.displayName || '',
          email: firebaseUser.email || '',
          uid: firebaseUser.uid,
        });

        if (db) {
          try {
            const userRef = doc(db, 'users', firebaseUser.uid);
            const snap = await getDoc(userRef);
            if (snap.exists()) {
              const data = snap.data();
              const isPaid =
                data.hasPurchasedSite === true ||
                data.hasActiveSubscription === true ||
                data.isPaid === true ||
                (data.coupleSlug && data.coupleSlug !== 'demo');

              if (isPaid && data.coupleSlug) {
                setHasPurchased(true);
                setUserCoupleSlug(data.coupleSlug);
              } else {
                setHasPurchased(false);
                setUserCoupleSlug(null);
              }
            } else {
              setHasPurchased(false);
            }
          } catch (e) {
            setHasPurchased(false);
          }
        }
      } else {
        setUser(null);
        setHasPurchased(false);
        setUserCoupleSlug(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('asksite_user');
    }
    setUser(null);
    setHasPurchased(false);
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-xs px-4 sm:px-8 py-3.5">
      <div className="mx-auto max-w-5xl flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-black text-rose-600">
          <Heart className="h-6 w-6 fill-rose-500 text-rose-500 animate-pulse" /> AskSite SaaS
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              {hasPurchased ? (
                <Link
                  href={userCoupleSlug ? `/dashboard?slug=${userCoupleSlug}` : '/dashboard'}
                  className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 px-4 py-2 text-xs font-black text-white shadow-md hover:scale-105 transition active:scale-95"
                >
                  <LayoutDashboard className="h-4 w-4" /> Yönetim Paneline Git ➔
                </Link>
              ) : (
                <Link
                  href="/checkout"
                  className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 px-4 py-2 text-xs font-black text-white shadow-md hover:scale-105 transition active:scale-95"
                >
                  <Sparkles className="h-4 w-4" /> Paket Seç / Satın Al 🚀
                </Link>
              )}

              <div className="hidden sm:flex items-center gap-1.5 rounded-2xl bg-gray-50 border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700">
                <User className="h-3.5 w-3.5 text-rose-500" />
                <span className="max-w-[110px] truncate">{user.displayName || user.email}</span>
              </div>

              <button
                onClick={handleSignOut}
                className="p-2 rounded-2xl bg-gray-100 text-gray-600 hover:bg-rose-50 hover:text-rose-600 transition"
                title="Oturumu Kapat"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
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
