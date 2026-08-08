'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';
import { Heart, Sparkles, Lock, Mail, User, Phone, LogIn, UserPlus, ArrowRight } from 'lucide-react';

async function saveUserDataToFirestore(user: any, name?: string, phoneNumber?: string) {
  if (!db) return;
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(
      userRef,
      {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || name || '',
        phone: phoneNumber || '',
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

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleSuccessAuth = (userObj: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'asksite_user',
        JSON.stringify({
          uid: userObj.uid,
          email: userObj.email,
          displayName: userObj.displayName || fullName || 'Çift Kullanıcısı',
          phone: phone || userObj.phoneNumber || '',
        })
      );
    }
    const targetUrl = redirectTarget.startsWith('/') ? redirectTarget : `/${redirectTarget}`;
    router.push(targetUrl);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await signInWithPopup(auth, googleProvider);
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
        await saveUserDataToFirestore(res.user, fullName, phone);
        handleSuccessAuth({ ...res.user, displayName: fullName || res.user.displayName });
      } else {
        const res = await signInWithEmailAndPassword(auth, email, password);
        await saveUserDataToFirestore(res.user);
        handleSuccessAuth(res.user);
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
            Google İle Tek Tıkla Devam Et
          </button>

          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <span className="relative bg-white px-3 text-[11px] uppercase font-bold text-gray-400">veya</span>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Ad Soyad *</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="Ahmet Yılmaz"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-xs outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Telefon Numarası</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      placeholder="905520000000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-xs outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">E-posta Adresi *</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="ornek@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-xs outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Parola *</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-xs outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="rounded-xl bg-rose-50 p-2.5 text-xs text-rose-600 font-semibold text-center border border-rose-100">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 py-3 text-xs font-extrabold text-white shadow-lg hover:opacity-95 active:scale-98 transition disabled:opacity-50 mt-4"
            >
              {loading ? (
                'İşleniyor...'
              ) : mode === 'login' ? (
                <>
                  Giriş Yap ve Devam Et <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  Hesap Oluştur ve Devam Et <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs font-bold text-gray-500">Yükleniyor...</div>}>
      <LoginContent />
    </Suspense>
  );
}
