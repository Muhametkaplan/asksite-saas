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
                (data.hasPurchasedSite === true || data.hasActiveSubscription === true || data.isPaid === true) &&
                Boolean(data.coupleSlug && data.coupleSlug !== 'demo');

              if (isPaid && data.coupleSlug) {
                // Verify couple actually has isPaid in Firestore
                const cSnap = await getDoc(doc(db, 'couples', data.coupleSlug));
                if (cSnap.exists() && cSnap.data().isPaid === true) {
                  setHasPurchased(true);
                  setUserCoupleSlug(data.coupleSlug);
                } else {
                  setHasPurchased(false);
                  setUserCoupleSlug(null);
                }
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
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src="/logo.png"
              alt="AskSite"
              className="h-10 w-10 rounded-xl object-cover shadow-md shadow-rose-500/10 border border-slate-800/10 group-hover:scale-105 transition"
            />
            <div className="flex flex-col text-left leading-none">
              <span className="text-xl font-black tracking-tight text-slate-900">
                Ask<span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500">Site</span>
              </span>
              <span className="text-[9px] font-bold text-rose-500 tracking-widest uppercase mt-0.5">
                Hikayeniz, Sizinle
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-4 text-xs font-bold text-gray-600">
            <Link href="/#ozellikler" className="hover:text-rose-600 transition">
              Özellikler
            </Link>
            <Link href="/#fiyatlandirma" className="hover:text-rose-600 transition">
              Paketler & Fiyatlar
            </Link>
            <Link href="/demo" className="hover:text-rose-600 transition">
              Canlı Demo
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              {hasPurchased ? (
                <a
                  href={userCoupleSlug ? `/dashboard?slug=${userCoupleSlug}` : '/dashboard'}
                  onClick={() => {
                    if (userCoupleSlug && typeof window !== 'undefined') {
                      localStorage.setItem('activeCoupleSlug', userCoupleSlug);
                      localStorage.setItem('asksite_couple_slug', userCoupleSlug);
                    }
                  }}
                  className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 px-4 py-2 text-xs font-black text-white shadow-md hover:scale-105 transition active:scale-95"
                >
                  <LayoutDashboard className="h-4 w-4" /> Yönetim Paneline Git ➔
                </a>
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
