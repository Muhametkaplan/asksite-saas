'use client';

import { useState, useEffect } from 'react';
import { Lock, Heart, ShieldCheck, UserCheck, KeyRound, Mail, Sparkles, X } from 'lucide-react';
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
  const [userEmail, setUserEmail] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [activeTab, setActiveTab] = useState<'pin' | 'email'>('pin');
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

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (pinInput.trim() === correctPin) {
      // Default to partner1 or let user pick, default partner1
      completeAuth('partner1', `partner1@${slug}.com`);
    } else {
      setErrorMessage('PIN kodu hatalı. Varsayılan PIN: 1234');
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmed = userEmail.trim().toLowerCase();
    if (trimmed === partner1Email) {
      completeAuth('partner1', trimmed);
    } else if (trimmed === partner2Email) {
      completeAuth('partner2', trimmed);
    } else {
      setErrorMessage(`Girdiğiniz e-posta (${trimmed}) bu çifte ait değil.`);
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
        <span className="text-gray-700">
          {authRole === 'partner1'
            ? `👑 ${partner1Name} (Partner 1)`
            : authRole === 'partner2'
            ? `👑 ${partner2Name} (Partner 2)`
            : '👁️ Ziyaretçi'}
        </span>
        <button
          onClick={() => setIsOpen(true)}
          className="ml-1 text-[10px] text-rose-500 underline font-bold hover:text-rose-700"
        >
          Değiştir
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-gray-100 text-center">
        <button
          onClick={handleVisitorMode}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
          title="Kapat & Ziyaretçi Ol"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 shadow-sm border border-rose-100">
          <Heart className="h-7 w-7 fill-rose-500 text-rose-500 animate-pulse" />
        </div>

        <h3 className="text-lg font-extrabold text-gray-900 mb-1">
          {partner1Name} & {partner2Name} Çift Girişi ❤️
        </h3>

        <p className="text-xs text-gray-600 mb-5 leading-relaxed">
          Bu özel alan <span className="font-bold text-rose-600">{partner1Name} & {partner2Name}</span> çiftine aittir. Lütfen e-postanız veya 4 haneli PIN ile giriş yapın.
        </p>

        {/* Tab Selector */}
        <div className="flex rounded-xl bg-gray-100 p-1 mb-4">
          <button
            onClick={() => setActiveTab('pin')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'pin' ? 'bg-white text-rose-600 shadow-xs' : 'text-gray-500'
            }`}
          >
            🔑 PIN İle Giriş
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'email' ? 'bg-white text-rose-600 shadow-xs' : 'text-gray-500'
            }`}
          >
            📧 E-Posta İle Giriş
          </button>
        </div>

        {errorMessage && (
          <div className="mb-3 rounded-xl bg-red-50 p-2.5 text-xs text-red-600 font-semibold border border-red-100">
            {errorMessage}
          </div>
        )}

        {/* PIN Form */}
        {activeTab === 'pin' && (
          <form onSubmit={handlePinSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">4 Haneli Çift PIN Kodu</label>
              <input
                type="password"
                maxLength={4}
                placeholder="Örn: 1234"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full text-center tracking-widest text-lg font-bold rounded-xl border border-gray-200 py-2.5 outline-none focus:border-rose-500"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 py-2.5 text-xs font-bold text-white shadow-md hover:scale-102 active:scale-95 transition"
            >
              Çift Olarak Giriş Yap ✨
            </button>
          </form>
        )}

        {/* Email Form */}
        {activeTab === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Çift E-Posta Adresi</label>
              <input
                type="email"
                placeholder="irem@asksite.com veya muhammet@asksite.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs outline-none focus:border-rose-500"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 py-2.5 text-xs font-bold text-white shadow-md hover:scale-102 active:scale-95 transition"
            >
              E-Posta İle Doğrula 🚀
            </button>
          </form>
        )}

        {/* Guest Option */}
        <div className="mt-4 pt-3 border-t">
          <button
            onClick={handleVisitorMode}
            className="text-xs font-semibold text-gray-500 hover:text-rose-500 transition"
          >
            Ziyaretçi Olarak İncele 👁️
          </button>
        </div>
      </div>
    </div>
  );
}
