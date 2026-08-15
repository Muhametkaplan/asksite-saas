'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, Sparkles, Shield, Rocket, ArrowRight, Smartphone, Gift, Loader2, Gamepad2, Image, Music, MapPin } from 'lucide-react';
import HomeNavbar from '@/components/HomeNavbar';
import PricingSection from '@/components/PricingSection';
import Footer from '@/components/Footer';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function SaaSPlatformHome() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    // 1. Instant check in localStorage/sessionStorage for fast auto-redirect & cookie renewal
    if (typeof window !== 'undefined') {
      const storedSlug = localStorage.getItem('activeCoupleSlug') || localStorage.getItem('asksite_couple_slug');
      if (storedSlug && storedSlug !== 'demo') {
        document.cookie = `couple_slug=${storedSlug}; path=/; max-age=31536000; SameSite=Lax`;
        window.location.replace(`/c/${storedSlug}`);
        return;
      }

      const storedUser = localStorage.getItem('asksite_user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed.coupleSlug && parsed.coupleSlug !== 'demo') {
            document.cookie = `couple_slug=${parsed.coupleSlug}; path=/; max-age=31536000; SameSite=Lax`;
            window.location.replace(`/c/${parsed.coupleSlug}`);
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
                document.cookie = `couple_slug=${data.coupleSlug}; path=/; max-age=31536000; SameSite=Lax`;
                localStorage.setItem('activeCoupleSlug', data.coupleSlug);
                localStorage.setItem('asksite_couple_slug', data.coupleSlug);
              }
              window.location.replace(`/c/${data.coupleSlug}`);
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
    <div className="relative min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-100 text-gray-900 overflow-hidden flex flex-col justify-between">
      {/* Top Shared Navbar */}
      <HomeNavbar />

      {/* Hero Header */}
      <header className="container mx-auto max-w-5xl px-6 py-12 sm:py-16 text-center relative z-10">
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
          Kendi isimleriniz, tanışma tarihiniz, romantik haritanız, 4 bağımlılık yapan mini oyun, canlı çizim tuvali ve unutulmaz anılarınızla saniyeler içinde benzersiz çift sayfanızı oluşturun.
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
      <section id="ozellikler" className="container mx-auto max-w-5xl px-6 py-12 relative z-10">
        <div className="text-center space-y-2 mb-10">
          <span className="text-xs font-black uppercase tracking-wider text-purple-600 bg-purple-100 px-3 py-1 rounded-full border border-purple-200">
            Zengin Modüller & Deneyim
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
            Neden AskSite SaaS? ✨
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-3xl bg-white/80 backdrop-blur-md p-6 border border-white shadow-md text-left space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-500">
              <Smartphone className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Özel Dynamic Slug URL</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              <code>asksite.com/c/isminiz</code> formatında kendinize özel linkinizi anında alın ve sevgilinizle paylaşın.
            </p>
          </div>

          <div className="rounded-3xl bg-white/80 backdrop-blur-md p-6 border border-white shadow-md text-left space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
              <Gamepad2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">4 Mini Oyun & Canlı Skor</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              2048, Chrome Dinozor, Flappy Bird ve Tower Stacker oyunlarında partnerinizle eş zamanlı yarışın.
            </p>
          </div>

          <div className="rounded-3xl bg-white/80 backdrop-blur-md p-6 border border-white shadow-md text-left space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <Gift className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">NFC & HD QR Kod Hediyesi</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Sitenize doğrudan erişim sağlayan özel indirilebilir HD QR kod ve akıllı hediye kartı altyapısı.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Table Section */}
      <PricingSection />

      {/* Corporate Compliance Footer */}
      <Footer />
    </div>
  );
}
