'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, Sparkles, Shield, Rocket, ArrowRight, Smartphone, Gift, Loader2 } from 'lucide-react';
import HomeNavbar from '@/components/HomeNavbar';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function SaaSPlatformHome() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    // 1. Instant check in localStorage/sessionStorage for fast auto-redirect
    if (typeof window !== 'undefined') {
      const storedSlug = localStorage.getItem('activeCoupleSlug') || localStorage.getItem('asksite_couple_slug');
      if (storedSlug && storedSlug !== 'demo') {
        router.replace(`/c/${storedSlug}`);
        return;
      }

      const storedUser = localStorage.getItem('asksite_user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed.coupleSlug && parsed.coupleSlug !== 'demo') {
            router.replace(`/c/${parsed.coupleSlug}`);
            return;
          }
        } catch (e) {}
      }
    }

    // 2. Firebase Auth observer check for logged in user
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && db) {
        try {
          const uSnap = await getDoc(doc(db, 'users', user.uid));
          if (uSnap.exists()) {
            const data = uSnap.data();
            if (data.coupleSlug && data.coupleSlug !== 'demo') {
              if (typeof window !== 'undefined') {
                localStorage.setItem('activeCoupleSlug', data.coupleSlug);
                localStorage.setItem('asksite_couple_slug', data.coupleSlug);
              }
              router.replace(`/c/${data.coupleSlug}`);
              return;
            }
          }
        } catch (e) {
          console.error('Error checking user session at root:', e);
        }
      }
      setCheckingSession(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-rose-50 to-purple-100 text-rose-600 font-bold p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
          <span className="text-xs font-black tracking-wide">Özel Çift Dünyanız Yükleniyor... ✨</span>
        </div>
      </div>
    );
  }
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-100 text-gray-900 overflow-hidden">
      {/* Top Shared Navbar */}
      <HomeNavbar />

      {/* Hero Header */}
      <header className="container mx-auto max-w-5xl px-6 py-12 text-center relative z-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-4 py-1.5 text-xs font-bold text-rose-600 mb-6 shadow-sm">
          <Sparkles className="h-4 w-4" /> B2C Micro-SaaS Dijital Hediye Platformu
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-gray-900 mb-6 leading-tight">
          Aşkınızı Ölümsüzleştiren <br />
          <span className="bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent">
            Kişiselleştirilebilir Çift Web Siteleri
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-gray-600 mb-8 leading-relaxed">
          Kendi isimleriniz, tanışma tarihiniz, romantik haritanız, yapay zeka destekli film öneriniz ve unutulmaz anılarınızla saniyeler içinde benzersiz çift sayfanızı oluşturun.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/demo"
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 px-8 py-4 text-base font-bold text-white shadow-xl transition-all hover:scale-105 active:scale-95 hover:shadow-rose-500/25 w-full sm:w-auto text-center"
          >
            <Heart className="h-5 w-5 fill-white" /> Canlı Çift Demosunu İncele <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/login?redirect=checkout"
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-rose-600 px-8 py-4 text-base font-bold text-white shadow-xl transition-all hover:scale-105 active:scale-95 hover:shadow-purple-500/25 border border-white/20 w-full sm:w-auto text-center"
          >
            <Rocket className="h-5 w-5" /> Kendi Siteni Oluştur / Satın Al 🚀
          </Link>
        </div>
      </header>

      {/* Feature Cards */}
      <section className="container mx-auto max-w-5xl px-6 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-3xl bg-white/70 backdrop-blur-md p-6 border border-white/80 shadow-md text-left">
            <Smartphone className="h-8 w-8 text-rose-500 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Özel Dynamic Slug URL</h3>
            <p className="text-sm text-gray-600">
              `/c/ahmet-ayse` formatında kendinize özel linkinizi anında alın ve sevgilinizle paylaşın.
            </p>
          </div>

          <div className="rounded-3xl bg-white/70 backdrop-blur-md p-6 border border-white/80 shadow-md text-left">
            <Sparkles className="h-8 w-8 text-purple-500 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Gemini AI Sinema Robotu</h3>
            <p className="text-sm text-gray-600">
              Modunuza ve istediğiniz türe göre size özel film tavsiyesi veren entegre yapay zeka asistanı.
            </p>
          </div>

          <div className="rounded-3xl bg-white/70 backdrop-blur-md p-6 border border-white/80 shadow-md text-left">
            <Gift className="h-8 w-8 text-emerald-500 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">NFC & QR Hediye Entegrasyonu</h3>
            <p className="text-sm text-gray-600">
              Dijital sitenize doğrudan erişim sağlayan özel QR kod veya NFC baskılı fiziksel hediye kartı altyapısı.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto max-w-5xl px-6 py-8 text-center text-xs text-gray-500 border-t border-gray-200/50">
        © 2026 Aşk Platformu SaaS - Tüm Hakları Saklıdır.
      </footer>
    </div>
  );
}
