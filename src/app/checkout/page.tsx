'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import {
  Heart,
  Sparkles,
  CreditCard,
  CheckCircle2,
  Truck,
  ShieldCheck,
  ArrowRight,
  User,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  LogIn,
  QrCode,
  Users,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { connectPartnerWithPairCode, getCoupleBySlug } from '@/lib/couples';
import { CoupleConfig } from '@/types/couple';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import confetti from 'canvas-confetti';

export default function CheckoutPage() {
  const router = useRouter();
  const [packageType, setPackageType] = useState<'digital' | 'nfc'>('digital');
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStage, setPaymentStage] = useState<'processing' | 'success'>('processing');

  const [partner1, setPartner1] = useState('');
  const [partner2, setPartner2] = useState('');
  const [partner1Email, setPartner1Email] = useState('');
  const [partner2Email, setPartner2Email] = useState('');
  const [startDate, setStartDate] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  // NFC Shipping Address fields
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');

  // Auth User & Subscription State
  const [currentUser, setCurrentUser] = useState<{ displayName?: string; email?: string } | null>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const [hasPurchased, setHasPurchased] = useState<boolean | null>(null);
  const [userCoupleSlug, setUserCoupleSlug] = useState<string>('demo');
  const [forceShowPurchaseForm, setForceShowPurchaseForm] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setCurrentUser({
          displayName: firebaseUser.displayName || '',
          email: firebaseUser.email || '',
        });
        if (firebaseUser.email) {
          setPartner1Email((prev) => prev || firebaseUser.email || '');
        }

        if (db) {
          try {
            const userRef = doc(db, 'users', firebaseUser.uid);
            const snap = await getDoc(userRef);
            if (snap.exists()) {
              const data = snap.data();
              if (data.hasPurchasedSite === true || data.coupleSlug) {
                setHasPurchased(true);
                setUserCoupleSlug(data.coupleSlug || 'demo');
                return;
              }
            }
          } catch (e) {}
        }
        setHasPurchased(false);
      } else if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('asksite_user');
        if (stored) {
          try {
            setCurrentUser(JSON.parse(stored));
          } catch (e) {}
        }
        setHasPurchased(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const [userCoupleConfig, setUserCoupleConfig] = useState<CoupleConfig | null>(null);

  // Invite Code Form State for Unpurchased Users
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [inviteConnecting, setInviteConnecting] = useState(false);
  const [inviteStatusMsg, setInviteStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedPurchasedPairCode, setCopiedPurchasedPairCode] = useState(false);

  useEffect(() => {
    async function loadCoupleConfig() {
      if (hasPurchased === true && userCoupleSlug) {
        const c = await getCoupleBySlug(userCoupleSlug);
        if (c) {
          setUserCoupleConfig(c);
        }
      }
    }
    loadCoupleConfig();
  }, [hasPurchased, userCoupleSlug]);

  const handleConnectWithInviteCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) {
      setInviteStatusMsg({ type: 'error', text: 'Lütfen geçerli bir davet kodu girin (Örn: ASK-X79B2).' });
      return;
    }
    setInviteConnecting(true);
    setInviteStatusMsg(null);

    try {
      const uid = auth.currentUser?.uid || `user-${Date.now()}`;
      const email = auth.currentUser?.email || 'partner2@example.com';
      const res = await connectPartnerWithPairCode(uid, email, inviteCodeInput);

      if (res.success && res.slug) {
        setInviteStatusMsg({ type: 'success', text: res.message || 'Davet kodu doğrulandı! Sitenize yönlendiriliyorsunuz...' });
        confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 } });
        setTimeout(() => {
          router.push(`/dashboard?slug=${res.slug}`);
        }, 1200);
      } else {
        setInviteStatusMsg({ type: 'error', text: res.message || 'Geçersiz eşleşme kodu.' });
        setInviteConnecting(false);
      }
    } catch (err: any) {
      setInviteStatusMsg({ type: 'error', text: err.message || 'Bir hata oluştu.' });
      setInviteConnecting(false);
    }
  };

  const fallbackInviteCode = useMemo(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `ASK-${result}`;
  }, []);

  const copyPurchasedPairCode = () => {
    const code = userCoupleConfig?.inviteCode || userCoupleConfig?.pair_code || fallbackInviteCode;
    navigator.clipboard.writeText(code);
    setCopiedPurchasedPairCode(true);
    setTimeout(() => setCopiedPurchasedPairCode(false), 2000);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('asksite_user');
    }
    setCurrentUser(null);
    setProfileDropdownOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!partner1 || !partner2) {
      alert('Lütfen eşlerin isimlerini giriniz.');
      return;
    }

    if (packageType === 'nfc' && (!address || !city)) {
      alert('Lütfen NFC Kart teslimat adresinizi eksiksiz doldurun.');
      return;
    }

    setLoading(true);

    try {
      const currentUid = auth.currentUser?.uid || null;
      const currentEmail = auth.currentUser?.email || partner1Email;

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner1_name: partner1,
          partner2_name: partner2,
          partner1_email: partner1Email,
          partner2_email: partner2Email,
          package_type: packageType,
          start_date: startDate,
          whatsapp_number: whatsapp,
          shipping_address: packageType === 'nfc' ? `${fullName} - ${address}, ${city}` : null,
          owner_uid: currentUid,
          owner_email: currentEmail,
        }),
      });

      const data = await res.json();

      if (res.ok && data.redirect_url && data.slug) {
        setHasPurchased(true);
        setUserCoupleSlug(data.slug);

        // Open Payment Modal Simulation
        setShowPaymentModal(true);
        setPaymentStage('processing');

        // Transition to success after 1 second
        setTimeout(() => {
          setPaymentStage('success');
          confetti({ particleCount: 70, spread: 90, origin: { y: 0.5 } });
        }, 1000);

        // Auto Redirect to Dashboard after 1.8 seconds (No holding on checkout!)
        setTimeout(() => {
          router.push(data.redirect_url || `/dashboard?slug=${data.slug}`);
        }, 1800);
      } else {
        alert(data.error || 'Ödeme tamamlanamadı.');
        setLoading(false);
      }
    } catch (e) {
      alert('Bir hata oluştu, lütfen tekrar deneyin.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-100 pb-16">
      {/* Shared Header / Navbar Integration */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-xs px-4 sm:px-8 py-3.5">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-black text-rose-600">
            <Heart className="h-6 w-6 fill-rose-500 text-rose-500 animate-pulse" /> AskSite SaaS
          </Link>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <>
                {hasPurchased === true && (
                  <a
                    href={userCoupleSlug && userCoupleSlug !== 'demo' ? `/dashboard?slug=${userCoupleSlug}` : '/dashboard'}
                    onClick={() => {
                      if (userCoupleSlug && typeof window !== 'undefined') {
                        localStorage.setItem('activeCoupleSlug', userCoupleSlug);
                        localStorage.setItem('asksite_couple_slug', userCoupleSlug);
                      }
                    }}
                    className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 px-4 py-2 text-xs font-black text-white shadow-md hover:scale-102 transition active:scale-95"
                  >
                    <LayoutDashboard className="h-4 w-4" /> Yönetim Paneline Git ➔
                  </a>
                )}

                {/* Profile Dropdown (ALWAYS visible when user is logged in) */}
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 rounded-2xl bg-gray-50 border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-800 hover:bg-gray-100 transition"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white font-extrabold text-[11px]">
                      {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                    </div>
                    <span className="max-w-[100px] truncate hidden sm:inline">{currentUser.displayName || currentUser.email}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute right-0 top-11 z-50 w-52 rounded-2xl bg-white p-2 shadow-2xl border border-gray-100 animate-in fade-in duration-150 text-left">
                      <div className="p-2 border-b border-gray-100">
                        <div className="text-xs font-extrabold text-gray-900 truncate">
                          {currentUser.displayName || 'Müşteri Hesabı'}
                        </div>
                        <div className="text-[11px] text-gray-400 truncate">
                          {currentUser.email}
                        </div>
                      </div>

                      <div className="py-1">
                        {hasPurchased === true && userCoupleSlug ? (
                          <>
                            <a
                              href={`/dashboard?slug=${userCoupleSlug}`}
                              onClick={() => {
                                setProfileDropdownOpen(false);
                                if (userCoupleSlug && typeof window !== 'undefined') {
                                  localStorage.setItem('activeCoupleSlug', userCoupleSlug);
                                  localStorage.setItem('asksite_couple_slug', userCoupleSlug);
                                }
                              }}
                              className="w-full text-left flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition"
                            >
                              <LayoutDashboard className="h-4 w-4 text-rose-500" /> Çift Sitem / Panel ➔
                            </a>
                            <a
                              href={`/c/${userCoupleSlug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="w-full text-left flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition"
                            >
                              <ExternalLink className="h-4 w-4 text-purple-500" /> Sitemi Gör 🔗
                            </a>
                          </>
                        ) : (
                          <Link
                            href="/checkout"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="w-full text-left flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                          >
                            <Sparkles className="h-4 w-4 text-rose-500" /> Paket Seç / Satın Al 🚀
                          </Link>
                        )}
                        <button
                          onClick={handleSignOut}
                          className="w-full text-left flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition border-t border-gray-100 mt-1"
                        >
                          <LogOut className="h-4 w-4 text-rose-600" /> Oturumu Kapat
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                href="/login?redirect=checkout"
                className="flex items-center gap-1.5 rounded-2xl bg-white border border-gray-200 px-4 py-2 text-xs font-bold text-gray-800 shadow-xs hover:bg-gray-50 transition"
              >
                <LogIn className="h-4 w-4 text-rose-500" /> Giriş Yap
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="mx-auto max-w-3xl pt-8 px-4 sm:px-6">
        {/* Satın Almış Kullanıcı İçin Davet Kodu & QR Paylaşım Görünümü (Kod Girme Formu Gizli) */}
        {hasPurchased === true && !forceShowPurchaseForm ? (
          <div className="mx-auto max-w-2xl text-center space-y-6 pt-4">
            <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6 animate-in fade-in zoom-in-95 duration-200 text-left">
              <div className="text-center space-y-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" /> VIP Paketiniz Aktif & Siteniz Yayında 🟢
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                  Çift Siteniz ve Davet Kartınız 💖
                </h1>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  Siteniz hazır ve yayında. Aşağıdaki davet kodunu veya QR kodu sevgilinize göndererek onu sitenize eş yönetici yapabilirsiniz.
                </p>
              </div>

              {/* Sadece Davet Kodunu Göster (Kod Girme Formu Yok) */}
              <div className="bg-gradient-to-r from-rose-50 via-purple-50 to-pink-50 p-5 rounded-2xl border border-rose-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                    <Users className="h-4 w-4" /> Davet Kodunuz
                  </span>
                  <span className="text-[10px] font-bold text-gray-400">
                    Sevgilinizle Paylaşın 💌
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-xl bg-white border border-rose-200 px-4 py-3 font-mono text-base font-black text-rose-600 tracking-widest text-center shadow-inner">
                    {userCoupleConfig?.inviteCode || userCoupleConfig?.pair_code || fallbackInviteCode}
                  </div>
                  <button
                    type="button"
                    onClick={copyPurchasedPairCode}
                    className="rounded-xl bg-rose-500 px-5 py-3 text-xs font-extrabold text-white shadow-md hover:bg-rose-600 transition shrink-0 active:scale-95 flex items-center gap-1.5"
                  >
                    <Copy className="h-4 w-4" /> {copiedPurchasedPairCode ? 'Kopyalandı! ✓' : 'Kodu Kopyala'}
                  </button>
                </div>
              </div>

              {/* QR Kod Paylaşım Kartı */}
              <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 text-center">
                <h4 className="text-xs font-bold text-gray-700 mb-3 flex items-center justify-center gap-1.5">
                  <QrCode className="h-4 w-4 text-purple-600" /> Sevgiliniz İçin HD QR Kod Davetiyesi
                </h4>
                <QRCodeGenerator
                  slug={userCoupleSlug}
                  partner1={userCoupleConfig?.partner1_name || 'Partner 1'}
                  partner2={userCoupleConfig?.partner2_name || 'Partner 2'}
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <a
                  href={`/c/${userCoupleSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 px-8 py-3.5 text-sm font-extrabold text-white shadow-xl hover:scale-105 transition active:scale-95"
                >
                  <ExternalLink className="h-4 w-4" /> Siteme Git 🔗
                </a>
                <a
                  href={userCoupleSlug ? `/dashboard?slug=${userCoupleSlug}` : '/dashboard'}
                  onClick={(e) => {
                    e.preventDefault();
                    const targetSlug = userCoupleSlug || '';
                    if (targetSlug && typeof window !== 'undefined') {
                      localStorage.setItem('activeCoupleSlug', targetSlug);
                      localStorage.setItem('asksite_couple_slug', targetSlug);
                    }
                    const targetUrl = targetSlug ? `/dashboard?slug=${targetSlug}` : '/dashboard';
                    window.location.href = targetUrl;
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-3.5 text-sm font-extrabold text-white shadow-xl hover:scale-105 transition active:scale-95"
                >
                  <LayoutDashboard className="h-4 w-4" /> Yönetim Paneline Geç ⚙️
                </a>
              </div>

              <div className="border-t border-gray-100 pt-4 text-center">
                <button
                  onClick={() => setForceShowPurchaseForm(true)}
                  className="text-xs font-semibold text-gray-500 hover:text-rose-600 underline transition"
                >
                  Başka bir paket almak veya yeni bir site daha oluşturmak için tıklayın 🛒
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Paket Üstü Davet Kodu Kutusu (Partner 2 için Ödemesiz Doğrudan Bağlantı) */}
            <div className="mb-8 rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 text-white shadow-2xl border border-purple-800/50 space-y-3 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="space-y-0.5 text-left">
                  <span className="inline-block rounded-full bg-purple-500/30 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-purple-300 border border-purple-400/30">
                    Ödemesiz Partner Katılımı 🎟️
                  </span>
                  <h3 className="text-lg font-black text-white">
                    Elinizde Çift Davet Kodu Var Mı?
                  </h3>
                  <p className="text-xs text-purple-200/80">
                    Sevgiliniz daha önce paket satın aldıysa, size verdiği 6 haneli kodu (Örn: ASK-X79B2) girerek ödeme yapmadan doğrudan çift sayfanıza bağlanabilirsiniz.
                  </p>
                </div>
              </div>

              <form onSubmit={handleConnectWithInviteCode} className="pt-2 flex flex-col sm:flex-row items-stretch gap-2.5">
                <input
                  type="text"
                  placeholder="Örn: ASK-X79B2"
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                  className="flex-1 rounded-2xl bg-white/10 border border-white/20 px-4 py-3 text-xs font-mono font-bold uppercase tracking-widest text-white placeholder-white/40 outline-none focus:border-rose-400 focus:bg-white/20 transition"
                />
                <button
                  type="submit"
                  disabled={inviteConnecting}
                  className="rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 px-6 py-3 text-xs font-black text-white shadow-xl hover:opacity-95 transition active:scale-95 disabled:opacity-50 shrink-0 flex items-center justify-center gap-1.5"
                >
                  {inviteConnecting ? 'Doğrulanıyor...' : 'Davet Kodu ile Bağlan 🚀'}
                </button>
              </form>

              {inviteStatusMsg && (
                <div
                  className={`rounded-xl p-3 text-xs font-bold border text-left ${
                    inviteStatusMsg.type === 'success'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {inviteStatusMsg.text}
                </div>
              )}
            </div>

            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-4 py-1 text-xs font-bold text-rose-600 mb-3">
                <Sparkles className="h-4 w-4" /> Güvenli Ödeme & Otomatik Kurulum
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                Aşk Sitenizi Şimdi Oluşturun ❤️
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Paketinizi seçin, 1 dakikada kişisel sitenize kavuşun.
              </p>
            </div>

        {/* Package Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Dijital Paket */}
          <div
            onClick={() => setPackageType('digital')}
            className={`cursor-pointer rounded-3xl p-6 transition-all border-2 ${
              packageType === 'digital'
                ? 'border-rose-500 bg-white shadow-xl ring-2 ring-rose-500/20'
                : 'border-white/80 bg-white/60 hover:bg-white/90'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-500">
                  Popüler Dijital Paket
                </span>
                <h3 className="text-xl font-bold text-gray-900 mt-1">Dijital Aşk Sayfası</h3>
              </div>
              <CheckCircle2
                className={`h-6 w-6 ${
                  packageType === 'digital' ? 'text-rose-500' : 'text-gray-300'
                }`}
              />
            </div>
            <div className="text-3xl font-extrabold text-gray-900 mb-4">
              ₺399 <span className="text-xs font-normal text-gray-500">/ 1 Yıllık Yayın</span>
            </div>
            <ul className="space-y-2 text-xs text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Size Özel Çift Linki (/c/...)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> İndirilebilir Yüksek Çözünürlüklü HD QR Kod
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Yapay Zeka (Gemini AI) Film Robotu
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Sevgi Kavanozu & Harita Anı Noktaları
              </li>
            </ul>
          </div>

          {/* Fiziksel NFC Paketi */}
          <div
            onClick={() => setPackageType('nfc')}
            className={`cursor-pointer rounded-3xl p-6 transition-all border-2 relative overflow-hidden ${
              packageType === 'nfc'
                ? 'border-purple-600 bg-white shadow-xl ring-2 ring-purple-600/20'
                : 'border-white/80 bg-white/60 hover:bg-white/90'
            }`}
          >
            <div className="absolute top-3 right-3 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 px-3 py-1 text-[10px] font-extrabold text-white shadow-sm">
              SÜPRİZ HEDİYE
            </div>

            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
                  Fiziksel + Dijital V.I.P Paket
                </span>
                <h3 className="text-xl font-bold text-gray-900 mt-1">NFC Akıllı Kart & Anahtarlık</h3>
              </div>
              <CheckCircle2
                className={`h-6 w-6 ${
                  packageType === 'nfc' ? 'text-purple-600' : 'text-gray-300'
                }`}
              />
            </div>
            <div className="text-3xl font-extrabold text-gray-900 mb-4">
              ₺699 <span className="text-xs font-normal text-gray-500">/ Kargo Dahil</span>
            </div>
            <ul className="space-y-2 text-xs text-gray-600">
              <li className="flex items-center gap-2 font-semibold text-purple-700">
                <Truck className="h-4 w-4 text-purple-600" /> Adrese Ücretsiz Kargo
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-purple-600" /> Telefonu Yaklaştırınca Açılan Akıllı NFC Çip
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-purple-600" /> Dijital Paket İçeriğinin Tamamı
              </li>
            </ul>
          </div>
        </div>

        {/* Checkout Form */}
        <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-6 sm:p-8 shadow-xl border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-500" /> Çift Bilgileri
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                1. Partner İsmi (Kız Partner) *
              </label>
              <input
                type="text"
                required
                placeholder="Örn: Ayşe"
                value={partner1}
                onChange={(e) => setPartner1(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                1. Partner E-Posta Adresi (Kız) *
              </label>
              <input
                type="email"
                required
                placeholder="ayse@example.com"
                value={partner1Email}
                onChange={(e) => setPartner1Email(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                2. Partner İsmi (Erkek Partner) *
              </label>
              <input
                type="text"
                required
                placeholder="Örn: Ahmet"
                value={partner2}
                onChange={(e) => setPartner2(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                2. Partner E-Posta Adresi (Erkek) *
              </label>
              <input
                type="email"
                required
                placeholder="ahmet@example.com"
                value={partner2Email}
                onChange={(e) => setPartner2Email(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                İlişki Başlangıç Tarihi
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                WhatsApp Numarası (Ülke kodu ile)
              </label>
              <input
                type="text"
                placeholder="905520000000"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
              />
            </div>
          </div>

          {/* NFC Shipping Address Form */}
          {packageType === 'nfc' && (
            <div className="mb-6 rounded-2xl bg-purple-50 p-4 border border-purple-100 animate-in fade-in duration-300">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-3 flex items-center gap-1.5">
                <Truck className="h-4 w-4" /> NFC Kart Teslimat Adresi
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Ad Soyad</label>
                  <input
                    type="text"
                    placeholder="Ahmet Yılmaz"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Şehir</label>
                  <input
                    type="text"
                    placeholder="İstanbul"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Açık Adres</label>
                <textarea
                  rows={2}
                  placeholder="Mahalle, Sokak, No, Daire..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs outline-none"
                />
              </div>
            </div>
          )}

          {/* Payment Button */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 py-4 text-base font-bold text-white shadow-xl transition hover:opacity-95 active:scale-98 disabled:opacity-50"
          >
            {loading ? (
              'Ödeme İşleniyor...'
            ) : (
              <>
                <CreditCard className="h-5 w-5" /> Güvenli Öde ({packageType === 'digital' ? '₺399' : '₺699'}) ve Paneli Aç <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>

          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> 256-Bit SSL ile %100 Güvenli Ödeme & Anında Aktivasyon
          </div>
        </form>

        {/* Demo Ödeme İşleniyor & Başarılı Modalı */}
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl border border-gray-100 flex flex-col items-center">
              {paymentStage === 'processing' ? (
                <>
                  <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 border-4 border-rose-200 text-rose-500">
                    <CreditCard className="h-9 w-9 animate-pulse" />
                    <div className="absolute inset-0 rounded-full border-4 border-rose-500 border-t-transparent animate-spin" />
                  </div>
                  <h3 className="text-lg font-extrabold text-gray-900 mb-1">
                    Ödeme İşleniyor... 💳
                  </h3>
                  <p className="text-xs text-gray-500">
                    Güvenli 256-Bit SSL ödeme ağ geçidine bağlanılıyor...
                  </p>
                </>
              ) : (
                <>
                  <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 animate-bounce">
                    <CheckCircle2 className="h-12 w-12" />
                  </div>
                  <h3 className="text-xl font-extrabold text-emerald-600 mb-1">
                    Demo Ödeme Başarılı! 🎉
                  </h3>
                  <p className="text-xs text-gray-600 font-semibold mb-2">
                    {partner1} & {partner2} için özel web siteniz ve paneli hazırlandı.
                  </p>
                  <span className="text-[11px] text-gray-400">Yönetim paneline yönlendiriliyorsunuz...</span>
                </>
              )}
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
