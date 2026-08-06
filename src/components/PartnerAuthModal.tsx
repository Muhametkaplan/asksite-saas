'use client';

import { useState, useEffect } from 'react';
import { Heart, UserCheck, KeyRound, Mail, Sparkles, X, ArrowLeft, User, ShieldCheck } from 'lucide-react';
import { AllowedUsers } from '@/types/couple';
import { updatePartnerPresence } from '@/lib/couples';

interface PartnerAuthModalProps {
  slug: string;
  partner1Name: string;
  partner2Name: string;
  allowedUsers?: AllowedUsers;
}

export default function PartnerAuthModal({
  slug,
  partner1Name,
  partner2Name,
  allowedUsers,
}: PartnerAuthModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [authRole, setAuthRole] = useState<'partner1' | 'partner2' | 'guest' | null>(null);
  
  // 2-Step Flow States
  const [step, setStep] = useState<'select_profile' | 'verify_pin'>('select_profile');
  const [targetRole, setTargetRole] = useState<'partner1' | 'partner2' | null>(null);

  const [pinInput, setPinInput] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [verificationMethod, setVerificationMethod] = useState<'pin' | 'email'>('pin');
  const [errorMessage, setErrorMessage] = useState('');

  const correctPin = allowedUsers?.access_pin || '1234';
  const partner1Email = (allowedUsers?.partner1_email || 'irem@asksite.com').toLowerCase();
  const partner2Email = (allowedUsers?.partner2_email || 'muhammet@asksite.com').toLowerCase();

  useEffect(() => {
    // Check local storage for existing auth
    const storedAuth = localStorage.getItem(`asksite_auth_${slug}`);
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        if (parsed.role) {
          setAuthRole(parsed.role);
          if (parsed.role === 'partner1' || parsed.role === 'partner2') {
            updatePartnerPresence(slug, parsed.role, true);
          }
          return;
        }
      } catch {}
    }

    // Open modal on first load if no auth role stored
    setIsOpen(true);
  }, [slug]);

  useEffect(() => {
    // Custom event listener for re-opening modal from anywhere (e.g. LiveCanvasWidget)
    const handleReopen = () => {
      setStep('select_profile');
      setTargetRole(null);
      setErrorMessage('');
      setIsOpen(true);
    };

    window.addEventListener('open_partner_auth_modal', handleReopen);
    return () => {
      window.removeEventListener('open_partner_auth_modal', handleReopen);
    };
  }, []);

  const handleSelectProfile = (role: 'partner1' | 'partner2') => {
    setTargetRole(role);
    setPinInput('');
    setUserEmail('');
    setErrorMessage('');
    setStep('verify_pin');
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (pinInput.trim() === correctPin) {
      if (targetRole) {
        completeAuth(targetRole, `${targetRole}@asksite.com`);
      }
    } else {
      setErrorMessage('PIN kodu hatalı. Varsayılan PIN: 1234');
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmed = userEmail.trim().toLowerCase();
    const targetEmail = targetRole === 'partner1' ? partner1Email : partner2Email;

    if (trimmed === targetEmail) {
      if (targetRole) {
        completeAuth(targetRole, trimmed);
      }
    } else {
      setErrorMessage(`Girdiğiniz e-posta (${trimmed}) ${targetRole === 'partner1' ? partner1Name : partner2Name} profiline ait değil.`);
    }
  };

  const completeAuth = (role: 'partner1' | 'partner2' | 'guest', email?: string) => {
    setAuthRole(role);
    setIsOpen(false);
    localStorage.setItem(
      `asksite_auth_${slug}`,
      JSON.stringify({ role, email, timestamp: Date.now() })
    );

    if (role === 'partner1' || role === 'partner2') {
      updatePartnerPresence(slug, role, true);
    }
  };

  const handleVisitorMode = () => {
    completeAuth('guest', 'visitor');
  };

  if (!isOpen) {
    return (
      <div className="fixed top-4 right-4 z-30 flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-md px-3.5 py-1.5 text-xs font-semibold shadow-md border border-white/80">
        <UserCheck className="h-4 w-4 text-rose-500" />
        <span className="text-gray-800 font-bold">
          {authRole === 'partner1'
            ? `💗 ${partner1Name}`
            : authRole === 'partner2'
            ? `💙 ${partner2Name}`
            : '👁️ Ziyaretçi'}
        </span>
        <button
          onClick={() => {
            setStep('select_profile');
            setIsOpen(true);
          }}
          className="ml-1 text-[11px] text-rose-500 font-extrabold hover:underline flex items-center gap-0.5"
        >
          Profil Değiştir 🔄
        </button>
      </div>
    );
  }

  const targetName = targetRole === 'partner1' ? partner1Name : partner2Name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-gray-100 text-center">
        <button
          onClick={handleVisitorMode}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
          title="Kapat & Ziyaretçi Ol"
        >
          <X className="h-5 w-5" />
        </button>

        {/* STEP 1: PROFİL SEÇİMİ */}
        {step === 'select_profile' && (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 shadow-sm border border-rose-100">
              <Heart className="h-7 w-7 fill-rose-500 text-rose-500 animate-pulse" />
            </div>

            <h3 className="text-xl font-extrabold text-gray-900 mb-1">
              Profilinizi Seçin 💖
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              Bu özel alan <span className="font-bold text-rose-600">{partner1Name} & {partner2Name}</span> çiftine aittir. Kimliğinizi doğrulayarak devam edin.
            </p>

            {/* Partner Profile Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {/* Partner 1 Card */}
              <button
                onClick={() => handleSelectProfile('partner1')}
                className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-pink-50 to-rose-100/60 border-2 border-rose-200 hover:border-rose-500 hover:shadow-lg transition active:scale-95 text-center"
              >
                <div className="h-12 w-12 rounded-full bg-rose-500 text-white flex items-center justify-center text-lg font-black shadow-md mb-2 group-hover:scale-110 transition">
                  💗
                </div>
                <span className="text-base font-extrabold text-gray-900">{partner1Name}</span>
                <span className="text-[11px] font-semibold text-rose-600 mt-0.5">Partner 1 Profili</span>
              </button>

              {/* Partner 2 Card */}
              <button
                onClick={() => handleSelectProfile('partner2')}
                className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-100/60 border-2 border-indigo-200 hover:border-indigo-500 hover:shadow-lg transition active:scale-95 text-center"
              >
                <div className="h-12 w-12 rounded-full bg-indigo-500 text-white flex items-center justify-center text-lg font-black shadow-md mb-2 group-hover:scale-110 transition">
                  💙
                </div>
                <span className="text-base font-extrabold text-gray-900">{partner2Name}</span>
                <span className="text-[11px] font-semibold text-indigo-600 mt-0.5">Partner 2 Profili</span>
              </button>
            </div>

            {/* Visitor Option */}
            <button
              onClick={handleVisitorMode}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gray-50 border border-gray-200 py-3 text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
            >
              👁️ Ziyaretçi Olarak Sayfayı İncele
            </button>
          </div>
        )}

        {/* STEP 2: ŞİFRE / PIN DOĞRULAMA */}
        {step === 'verify_pin' && targetRole && (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <button
                onClick={() => setStep('select_profile')}
                className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-rose-600 transition"
              >
                <ArrowLeft className="h-4 w-4" /> Profillere Dön
              </button>
              <span className="text-xs font-extrabold text-rose-500 uppercase tracking-wider">
                Adım 2 / 2
              </span>
            </div>

            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 font-extrabold text-xl shadow-xs">
              {targetRole === 'partner1' ? '💗' : '💙'}
            </div>

            <h3 className="text-lg font-extrabold text-gray-900 mb-1">
              {targetName} Giriş Şifresi 🔑
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Lütfen {targetName} için 4 haneli PIN kodunuzu giriniz.
            </p>

            {/* Method Selector Tab */}
            <div className="flex rounded-xl bg-gray-100 p-1 mb-4">
              <button
                onClick={() => setVerificationMethod('pin')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                  verificationMethod === 'pin' ? 'bg-white text-rose-600 shadow-xs' : 'text-gray-500'
                }`}
              >
                🔑 4 Haneli PIN
              </button>
              <button
                onClick={() => setVerificationMethod('email')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                  verificationMethod === 'email' ? 'bg-white text-rose-600 shadow-xs' : 'text-gray-500'
                }`}
              >
                📧 E-Posta İle
              </button>
            </div>

            {errorMessage && (
              <div className="mb-3 rounded-xl bg-red-50 p-2.5 text-xs text-red-600 font-semibold border border-red-100">
                {errorMessage}
              </div>
            )}

            {/* PIN Input Form */}
            {verificationMethod === 'pin' && (
              <form onSubmit={handlePinSubmit} className="space-y-3">
                <div>
                  <input
                    type="password"
                    maxLength={4}
                    autoFocus
                    placeholder="Örn: 1234"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    className="w-full text-center tracking-widest text-xl font-bold rounded-xl border border-gray-200 py-3 outline-none focus:border-rose-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 py-3 text-xs font-bold text-white shadow-md hover:scale-102 active:scale-95 transition"
                >
                  {targetName} Olarak Giriş Yap ✨
                </button>
              </form>
            )}

            {/* Email Input Form */}
            {verificationMethod === 'email' && (
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <div>
                  <input
                    type="email"
                    placeholder={`${targetName.toLowerCase()}@asksite.com`}
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs outline-none focus:border-rose-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 py-3 text-xs font-bold text-white shadow-md hover:scale-102 active:scale-95 transition"
                >
                  E-Posta Doğrula 🚀
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
