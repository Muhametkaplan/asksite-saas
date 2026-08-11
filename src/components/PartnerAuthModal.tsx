'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ShieldAlert, LogOut, ArrowRight, UserCheck, Sparkles } from 'lucide-react';
import { onAuthStateChanged, signInWithPopup, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { CoupleConfig } from '@/types/couple';
import { isDeviceAuthorized, registerDeviceToken } from '@/lib/deviceSession';
import { updatePartnerPresence } from '@/lib/couples';

interface PartnerAuthModalProps {
  slug: string;
  partner1Name: string;
  partner2Name: string;
  couple: CoupleConfig;
}

export default function PartnerAuthModal({
  slug,
  partner1Name,
  partner2Name,
  couple,
}: PartnerAuthModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [authorizedPartner, setAuthorizedPartner] = useState<string | null>(null);
  const [authRole, setAuthRole] = useState<'partner1' | 'partner2' | null>(null);
  const [isAccessDenied, setIsAccessDenied] = useState(false);

  // Email / Password / PIN Form State
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [authMethod, setAuthMethod] = useState<'pin' | 'google' | 'email'>('pin');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const saveSession = (role: 'partner1' | 'partner2', pName: string) => {
    if (typeof window !== 'undefined') {
      const authData = JSON.stringify({
        isAuthenticated: true,
        role,
        partnerName: pName,
        authenticatedAt: Date.now(),
      });
      sessionStorage.setItem(`asksite_auth_${slug}`, authData);
      localStorage.setItem(`asksite_auth_${slug}`, authData);
    }
  };

  useEffect(() => {
    // 0. Check Session Storage / Local Storage first for single-PIN verification
    const storedAuth = typeof window !== 'undefined'
      ? sessionStorage.getItem(`asksite_auth_${slug}`) || localStorage.getItem(`asksite_auth_${slug}`)
      : null;

    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        if (parsed.isAuthenticated && parsed.role) {
          const pName = parsed.partnerName || (parsed.role === 'partner1' ? partner1Name : partner2Name);
          setAuthorizedPartner(pName);
          setAuthRole(parsed.role);
          setIsOpen(false);
          if (parsed.role) {
            updatePartnerPresence(slug, parsed.role, true);
          }
          return;
        }
      } catch (e) {}
    }

    // 1. Device Token Auto-Recognition
    const deviceCheck = isDeviceAuthorized(couple);
    if (deviceCheck.isAuthorized && deviceCheck.partnerName) {
      const role = deviceCheck.role || 'partner1';
      setAuthorizedPartner(deviceCheck.partnerName);
      setAuthRole(role);
      setIsOpen(false);
      saveSession(role, deviceCheck.partnerName);
      if (deviceCheck.role) {
        updatePartnerPresence(slug, deviceCheck.role, true);
      }
      return;
    }

    // 2. Firebase Auth Observer if device/session not recognized
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userEmail = (firebaseUser.email || '').toLowerCase().trim();
        const p1Email = (couple.allowed_users?.partner1_email || couple.partner1_email || '').toLowerCase().trim();
        const p2Email = (couple.allowed_users?.partner2_email || couple.partner2_email || '').toLowerCase().trim();
        const authEmails = (couple.authorized_emails || []).map((e) => e.toLowerCase().trim());
        const isCoOwner = (couple.co_owners || []).includes(firebaseUser.uid);
        const isAuthorizedEmail = userEmail && authEmails.includes(userEmail);

        let role: 'partner1' | 'partner2' | null = null;
        let pName = firebaseUser.displayName || partner1Name;

        if (userEmail && userEmail === p1Email) {
          role = 'partner1';
          pName = partner1Name;
        } else if (userEmail && userEmail === p2Email) {
          role = 'partner2';
          pName = partner2Name;
        } else if (isAuthorizedEmail || isCoOwner) {
          role = 'partner2';
          pName = partner2Name;
        }

        if (role) {
          await registerDeviceToken(slug, pName, userEmail, firebaseUser.uid);
          setAuthorizedPartner(pName);
          setAuthRole(role);
          setIsAccessDenied(false);
          setIsOpen(false);
          saveSession(role, pName);
          updatePartnerPresence(slug, role, true);
        } else {
          setIsAccessDenied(true);
          setIsOpen(true);
        }
      } else {
        setIsAccessDenied(false);
        setIsOpen(true);
      }
    });

    return () => unsubscribe();
  }, [slug, couple, partner1Name, partner2Name]);

  // Google Sign In Handler
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userEmail = (user.email || '').toLowerCase().trim();
      const p1Email = (couple.allowed_users?.partner1_email || couple.partner1_email || '').toLowerCase().trim();
      const p2Email = (couple.allowed_users?.partner2_email || couple.partner2_email || '').toLowerCase().trim();
      const authEmails = (couple.authorized_emails || []).map((e) => e.toLowerCase().trim());
      const isCoOwner = (couple.co_owners || []).includes(user.uid);
      const isAuthorizedEmail = userEmail && authEmails.includes(userEmail);

      let role: 'partner1' | 'partner2' | null = null;
      let pName = user.displayName || partner1Name;

      if (userEmail && userEmail === p1Email) {
        role = 'partner1';
        pName = partner1Name;
      } else if (userEmail && userEmail === p2Email) {
        role = 'partner2';
        pName = partner2Name;
      } else if (isAuthorizedEmail || isCoOwner) {
        role = 'partner2';
        pName = partner2Name;
      }

      if (role) {
        await registerDeviceToken(slug, pName, userEmail, user.uid);
        setAuthorizedPartner(pName);
        setAuthRole(role);
        setIsAccessDenied(false);
        setIsOpen(false);
        saveSession(role, pName);
        updatePartnerPresence(slug, role, true);
      } else {
        setIsAccessDenied(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Google girişi sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Email/Password Sign In Handler
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      const result = await signInWithEmailAndPassword(auth, emailInput, passwordInput);
      const user = result.user;
      const userEmail = (user.email || '').toLowerCase().trim();
      const p1Email = (couple.allowed_users?.partner1_email || couple.partner1_email || '').toLowerCase().trim();
      const p2Email = (couple.allowed_users?.partner2_email || couple.partner2_email || '').toLowerCase().trim();
      const authEmails = (couple.authorized_emails || []).map((e) => e.toLowerCase().trim());
      const isCoOwner = (couple.co_owners || []).includes(user.uid);
      const isAuthorizedEmail = userEmail && authEmails.includes(userEmail);

      let role: 'partner1' | 'partner2' | null = null;
      let pName = partner1Name;

      if (userEmail && userEmail === p1Email) {
        role = 'partner1';
        pName = partner1Name;
      } else if (userEmail && userEmail === p2Email) {
        role = 'partner2';
        pName = partner2Name;
      } else if (isAuthorizedEmail || isCoOwner) {
        role = 'partner2';
        pName = partner2Name;
      }

      if (role) {
        await registerDeviceToken(slug, pName, userEmail, user.uid);
        setAuthorizedPartner(pName);
        setAuthRole(role);
        setIsAccessDenied(false);
        setIsOpen(false);
        saveSession(role, pName);
        updatePartnerPresence(slug, role, true);
      } else {
        setIsAccessDenied(true);
      }
    } catch (err: any) {
      setErrorMessage('E-posta adresi veya şifre hatalı.');
    } finally {
      setLoading(false);
    }
  };

  // Single-PIN Verification Handler
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const p1Pin = (couple.partner1_pin || couple.allowed_users?.partner1_pin || '1234').trim();
    const p2Pin = (couple.partner2_pin || couple.allowed_users?.partner2_pin || '5678').trim();
    const enteredPin = pinInput.trim();

    if (enteredPin === p1Pin) {
      const pName = partner1Name;
      await registerDeviceToken(slug, pName, couple.partner1_email || `${slug}@asksite.com`, 'pin-user', 'partner1');
      setAuthorizedPartner(pName);
      setAuthRole('partner1');
      setIsAccessDenied(false);
      setIsOpen(false);
      saveSession('partner1', pName);
      updatePartnerPresence(slug, 'partner1', true);
    } else if (enteredPin === p2Pin) {
      const pName = partner2Name;
      await registerDeviceToken(slug, pName, couple.partner2_email || `${slug}@asksite.com`, 'pin-user', 'partner2');
      setAuthorizedPartner(pName);
      setAuthRole('partner2');
      setIsAccessDenied(false);
      setIsOpen(false);
      saveSession('partner2', pName);
      updatePartnerPresence(slug, 'partner2', true);
    } else {
      setErrorMessage('Hatalı Çift Şifresi. Lütfen sevgilinizin belirlediği şifreyi girin.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('asksite_user');
      sessionStorage.removeItem(`asksite_auth_${slug}`);
      localStorage.removeItem(`asksite_auth_${slug}`);
    }
    setIsAccessDenied(false);
    setAuthorizedPartner(null);
    setIsOpen(true);
  };

  if (!isOpen && authorizedPartner) {
    return (
      <div className="fixed top-4 right-4 z-30 flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-md px-4 py-2 text-xs font-semibold shadow-lg border border-rose-100 animate-in fade-in duration-200">
        <UserCheck className="h-4 w-4 text-emerald-500" />
        <span className="text-gray-900 font-extrabold">
          {authRole === 'partner1' ? `💖 ${partner1Name}` : `💙 ${partner2Name}`} (Tanındı 🟢)
        </span>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-xl p-4 animate-in fade-in duration-200 text-left">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-5 sm:p-8 shadow-2xl border border-gray-100 text-center space-y-6">
        {/* ACCESS DENIED STATE */}
        {isAccessDenied ? (
          <div className="space-y-4 animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 shadow-sm text-3xl">
              🚫
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900">
                Erişim Yetkiniz Bulunmamaktadır 🔒
              </h3>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                Bu özel çift alanı yalnızca <span className="font-extrabold text-rose-600">{partner1Name} & {partner2Name}</span> çiftine aittir. Oturum açtığınız e-posta adresi bu çiftin yetkili partner bilgileriyle eşleşmemektedir.
              </p>
            </div>

            <div className="pt-3 space-y-2">
              <button
                onClick={handleSignOut}
                className="w-full rounded-2xl bg-rose-600 py-3 text-xs font-extrabold text-white shadow-lg hover:bg-rose-700 transition active:scale-98 flex items-center justify-center gap-2"
              >
                <LogOut className="h-4 w-4" /> Farklı Hesap İle Giriş Yap
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full rounded-2xl border border-gray-200 py-3 text-xs font-bold text-gray-700 hover:bg-gray-100 transition"
              >
                Ana Sayfaya Dön ➔
              </button>
            </div>
          </div>
        ) : (
          /* MANDATORY AUTH GUARD STATE */
          <div className="space-y-5 animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-xl text-3xl">
              ❤️
            </div>

            <div>
              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-rose-500 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                <Sparkles className="h-3.5 w-3.5" /> Özel Çift Alanı Koruması
              </span>
              <h2 className="text-2xl font-black text-gray-900 mt-2">
                {partner1Name} & {partner2Name}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Devam etmek için 4 haneli PIN şifrenizi girin veya oturum açın.
              </p>
            </div>

            {errorMessage && (
              <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-600 border border-rose-100 text-center">
                {errorMessage}
              </div>
            )}

            {/* Auth Method Selector */}
            <div className="flex rounded-xl bg-gray-100 p-1 text-xs font-bold">
              <button
                onClick={() => setAuthMethod('pin')}
                className={`flex-1 py-2 rounded-lg transition ${
                  authMethod === 'pin' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500'
                }`}
              >
                🔑 PIN Kodu
              </button>
              <button
                onClick={() => setAuthMethod('google')}
                className={`flex-1 py-2 rounded-lg transition ${
                  authMethod === 'google' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500'
                }`}
              >
                🌐 Google
              </button>
              <button
                onClick={() => setAuthMethod('email')}
                className={`flex-1 py-2 rounded-lg transition ${
                  authMethod === 'email' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500'
                }`}
              >
                📧 E-Posta
              </button>
            </div>

            {/* Method 1: Google Sign In */}
            {authMethod === 'google' && (
              <div className="space-y-3 pt-1">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 rounded-2xl bg-white border border-gray-200 py-3.5 text-xs font-extrabold text-gray-800 shadow-md hover:bg-gray-50 transition active:scale-98 disabled:opacity-50"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  Google ile Giriş Yap & Cihazı Tanıt
                </button>
              </div>
            )}

            {/* Method 2: Email Sign In */}
            {authMethod === 'email' && (
              <form onSubmit={handleEmailSignIn} className="space-y-3 pt-1">
                <input
                  type="email"
                  required
                  placeholder="E-Posta Adresiniz"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-xs outline-none focus:border-rose-500"
                />
                <input
                  type="password"
                  required
                  placeholder="Şifreniz"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-xs outline-none focus:border-rose-500"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 py-3.5 text-xs font-extrabold text-white shadow-xl hover:opacity-95 transition active:scale-98 disabled:opacity-50"
                >
                  {loading ? 'Doğrulanıyor...' : 'E-Posta İle Giriş Yap 🚀'}
                </button>
              </form>
            )}

            {/* Method 3: PIN Code */}
            {authMethod === 'pin' && (
              <form onSubmit={handlePinSubmit} className="space-y-3 pt-1">
                <input
                  type="password"
                  maxLength={4}
                  required
                  placeholder="Örn: 1234"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full text-center text-2xl font-mono tracking-widest font-black rounded-2xl border border-gray-200 py-3 outline-none focus:border-rose-500"
                />
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 py-3.5 text-xs font-extrabold text-white shadow-xl hover:opacity-95 transition active:scale-98"
                >
                  4 Haneli PIN İle Giriş Yap 🗝️
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
