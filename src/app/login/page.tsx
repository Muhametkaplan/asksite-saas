'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signOut,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';
import { Heart, Sparkles, Lock, Mail, User, Phone, LogIn, UserPlus, ArrowRight, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { autoClaimCoupleByEmail } from '@/lib/couples';

async function saveUserDataToFirestore(user: any, name?: string, phoneNumber?: string) {
  if (!db || !user?.uid) return;
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(
      userRef,
      {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || name || '',
        phone: phoneNumber || '',
        emailVerified: user.emailVerified ?? false,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (e) {
    console.error('Error saving user data to Firestore:', e);
  }
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams?.get('redirect') || 'checkout';
  const targetSlugParam = searchParams?.get('slug') || '';
  const urlErrorMsg = searchParams?.get('error') || '';

  const initialMode = searchParams?.get('mode') === 'register' ? 'register' : 'login';
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(urlErrorMsg ? decodeURIComponent(urlErrorMsg) : '');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Email Verification Waiting State
  const [verificationPendingUser, setVerificationPendingUser] = useState<any | null>(null);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verificationChecking, setVerificationChecking] = useState(false);
  const [verificationStatusMsg, setVerificationStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleSuccessAuth = async (userObj: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'asksite_user',
        JSON.stringify({
          uid: userObj.uid,
          email: userObj.email,
          displayName: userObj.displayName || fullName || 'Çift Kullanıcısı',
          phone: phone || userObj.phoneNumber || '',
          emailVerified: userObj.emailVerified ?? false,
        })
      );
    }

    const matchedSlug = await autoClaimCoupleByEmail({ uid: userObj.uid, email: userObj.email });

    if (targetSlugParam && targetSlugParam !== 'demo') {
      if (typeof window !== 'undefined') {
        localStorage.setItem('activeCoupleSlug', targetSlugParam);
        localStorage.setItem('asksite_couple_slug', targetSlugParam);
      }
      window.location.href = `/dashboard?slug=${targetSlugParam}`;
    } else if (matchedSlug) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('activeCoupleSlug', matchedSlug);
        localStorage.setItem('asksite_couple_slug', matchedSlug);
      }
      window.location.href = `/dashboard?slug=${matchedSlug}`;
    } else {
      const targetUrl = redirectTarget.startsWith('/') ? redirectTarget : `/${redirectTarget}`;
      window.location.href = targetUrl;
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await signInWithPopup(auth, googleProvider);
      // Google users have emailVerified = true automatically
      await saveUserDataToFirestore(res.user);
      handleSuccessAuth(res.user);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Google giriş penceresi kapatıldı.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setErrorMsg('Giriş isteği iptal edildi.');
      } else if (err.code === 'auth/popup-blocked') {
        setErrorMsg('Açılır pencere (popup) engellendi. Lütfen tarayıcı izinlerinizi kontrol edin.');
      } else {
        setErrorMsg(err.message || 'Google ile giriş yapılırken bir sorun oluştu.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Lütfen e-posta adresi ve şifrenizi girin.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      if (mode === 'register') {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        if (fullName) {
          await updateProfile(res.user, { displayName: fullName });
        }

        // 1. Send Verification Email immediately
        try {
          await sendEmailVerification(res.user);
        } catch (emailErr) {
          console.warn('Error sending initial verification email:', emailErr);
        }

        // 2. Save user to Firestore with emailVerified: false
        await saveUserDataToFirestore(res.user, fullName, phone);

        // 3. Show Verification Pending Screen instead of jumping directly
        setVerificationPendingUser({
          uid: res.user.uid,
          email: res.user.email,
          displayName: fullName || res.user.displayName,
        });
      } else {
        const res = await signInWithEmailAndPassword(auth, email, password);
        await saveUserDataToFirestore(res.user);

        // If email is not verified, show verification pending screen
        if (!res.user.emailVerified) {
          setVerificationPendingUser({
            uid: res.user.uid,
            email: res.user.email,
            displayName: res.user.displayName,
          });
        } else {
          handleSuccessAuth(res.user);
        }
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setErrorMsg('E-posta adresi veya şifre hatalı. Kayıtlı hesabınız yoksa "Kayıt Ol" sekmesinden hesap oluşturun.');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('Bu e-posta adresi zaten kullanımda. "Giriş Yap" sekmesinden oturum açabilirsiniz.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg('Şifreniz en az 6 karakter uzunluğunda olmalıdır.');
      } else if (err.code === 'auth/invalid-email') {
        setErrorMsg('Lütfen geçerli bir e-posta adresi giriniz.');
      } else if (err.code === 'auth/too-many-requests') {
        setErrorMsg('Çok fazla başarısız deneme yapıldı. Lütfen biraz bekleyip tekrar deneyin.');
      } else {
        setErrorMsg(err.message || 'Oturum açılırken bir hata oluştu.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!auth.currentUser || resendCooldown > 0) return;
    setResendingVerification(true);
    setVerificationStatusMsg(null);

    try {
      await sendEmailVerification(auth.currentUser);
      setVerificationStatusMsg({
        type: 'success',
        text: 'Doğrulama linki e-posta adresinize tekrar gönderildi!',
      });
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Error resending email:', err);
      setVerificationStatusMsg({
        type: 'error',
        text: err.code === 'auth/too-many-requests' ? 'Çok fazla deneme yapıldı. Lütfen biraz bekleyin.' : 'E-posta gönderilemedi.',
      });
    } finally {
      setResendingVerification(false);
    }
  };

  const handleCheckEmailVerified = async () => {
    if (!auth.currentUser) return;
    setVerificationChecking(true);
    setVerificationStatusMsg(null);

    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        await saveUserDataToFirestore(auth.currentUser);
        setVerificationStatusMsg({
          type: 'success',
          text: 'E-postanız başarıyla doğrulandı! Yönlendiriliyorsunuz...',
        });
        setTimeout(() => {
          handleSuccessAuth(auth.currentUser);
        }, 1000);
      } else {
        setVerificationStatusMsg({
          type: 'info',
          text: 'Henüz doğrulama bağlantısına tıklanmadı. Lütfen e-postanızı kontrol edip linke tıklayın.',
        });
      }
    } catch (err) {
      console.error('Error checking verification:', err);
      setVerificationStatusMsg({
        type: 'error',
        text: 'Doğrulama kontrol edilirken bir hata oluştu.',
      });
    } finally {
      setVerificationChecking(false);
    }
  };

  // If in Verification Waiting Screen
  if (verificationPendingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-100 flex items-center justify-center py-12 px-4 sm:px-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-2 text-2xl font-black text-rose-600 mb-2">
              <Heart className="h-7 w-7 fill-rose-500 text-rose-500 animate-pulse" /> AskSite SaaS
            </Link>
          </div>

          <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-rose-100 backdrop-blur-md text-center space-y-5">
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-50 text-rose-600 border border-rose-200 shadow-md">
              <Mail className="h-10 w-10 animate-bounce" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>
              </span>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                Hesap Oluşturuldu 🎉
              </span>
              <h2 className="text-2xl font-black text-gray-900 pt-1">
                E-Postanızı Doğrulayın
              </h2>
              <p className="text-xs text-gray-600 leading-relaxed">
                <strong className="text-gray-900 underline font-semibold">{verificationPendingUser.email}</strong> adresine bir doğrulama linki gönderdik. Lütfen linke tıklayarak hesabınızı aktif edin.
              </p>
            </div>

            {verificationStatusMsg && (
              <div
                className={`p-3 rounded-2xl text-xs font-semibold text-left flex items-start gap-2 ${
                  verificationStatusMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : verificationStatusMsg.type === 'info'
                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {verificationStatusMsg.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                )}
                <span>{verificationStatusMsg.text}</span>
              </div>
            )}

            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleCheckEmailVerified}
                disabled={verificationChecking}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 py-3.5 px-4 text-xs font-bold text-white shadow-lg hover:opacity-95 active:scale-98 transition disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${verificationChecking ? 'animate-spin' : ''}`} />
                <span>{verificationChecking ? 'Kontrol Ediliyor...' : 'Doğruladım, Devam Et'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={handleResendVerification}
                disabled={resendingVerification || resendCooldown > 0}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gray-50 border border-gray-200 py-2.5 px-4 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
              >
                <Mail className="h-3.5 w-3.5 text-rose-500" />
                <span>
                  {resendCooldown > 0
                    ? `Tekrar Gönder (${resendCooldown}s)`
                    : resendingVerification
                    ? 'Gönderiliyor...'
                    : 'Doğrulama Linkini Tekrar Gönder'}
                </span>
              </button>
            </div>

            <div className="pt-3 border-t border-gray-100">
              <button
                onClick={() => {
                  setVerificationPendingUser(null);
                  signOut(auth);
                }}
                className="text-xs text-gray-500 hover:text-rose-600 underline font-medium"
              >
                Farklı bir hesapla giriş yap
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-100 flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-md space-y-6">
        {/* Logo & Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-black text-rose-600 mb-2">
            <Heart className="h-7 w-7 fill-rose-500 text-rose-500 animate-pulse" /> AskSite SaaS
          </Link>
          <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">
            {redirectTarget === 'checkout' ? 'Satın Almak Ve Başlamak İçin Giriş Yapın 🚀' : 'Yönetim Paneline Giriş Yapın ✨'}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-gray-100 backdrop-blur-md">
          {/* Tabs */}
          <div className="flex rounded-2xl bg-gray-100 p-1 mb-6">
            <button
              onClick={() => { setMode('login'); setErrorMsg(''); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
                mode === 'login' ? 'bg-rose-500 text-white shadow-md' : 'text-gray-600 hover:text-rose-500'
              }`}
            >
              <LogIn className="h-4 w-4" /> Giriş Yap
            </button>
            <button
              onClick={() => { setMode('register'); setErrorMsg(''); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
                mode === 'register' ? 'bg-rose-500 text-white shadow-md' : 'text-gray-600 hover:text-rose-500'
              }`}
            >
              <UserPlus className="h-4 w-4" /> Kayıt Ol
            </button>
          </div>

          {/* Google Single Sign-On Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white py-3 px-4 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 active:scale-98 transition mb-5 disabled:opacity-50"
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
            <span>Google ile Devam Et</span>
          </button>

          <div className="relative mb-5 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <span className="relative bg-white px-3 text-[11px] font-semibold text-gray-400 uppercase">
              Veya E-Posta ile
            </span>
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div className="mb-4 rounded-2xl bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 border border-rose-200">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Adınız Soyadınız *</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="Örn: Ayşe Yılmaz"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-2xl border border-gray-200 pl-10 pr-4 py-2.5 text-xs font-medium outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">WhatsApp Telefon Numaranız (Opsiyonel)</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      placeholder="905524185530"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-2xl border border-gray-200 pl-10 pr-4 py-2.5 text-xs font-medium outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">E-Posta Adresiniz *</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="ornek@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 pl-10 pr-4 py-2.5 text-xs font-medium outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Şifreniz *</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 pl-10 pr-4 py-2.5 text-xs font-medium outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition"
                />
              </div>
              {mode === 'register' && (
                <p className="text-[10px] text-gray-400 mt-1">En az 6 karakter olmalıdır.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 py-3.5 px-4 text-xs font-bold text-white shadow-xl shadow-rose-500/20 hover:opacity-95 active:scale-98 transition disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span>İşleniyor...</span>
              ) : mode === 'login' ? (
                <>
                  <span>Giriş Yap ve Devam Et</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  <span>Kayıt Ol ve Doğrulama Maili Al</span>
                  <Sparkles className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Trust */}
        <div className="text-center text-[11px] text-gray-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>256-Bit SSL ile Şifrelenmiş Güvenli Giriş</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-pink-50 text-xs font-bold text-gray-500">
          Yükleniyor...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
