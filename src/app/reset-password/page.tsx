'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Lock, Eye, EyeOff, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, KeyRound, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams?.get('oobCode') || '';

  const [verifyingCode, setVerifyingCode] = useState(true);
  const [codeValid, setCodeValid] = useState(false);
  const [accountEmail, setAccountEmail] = useState('');
  const [codeError, setCodeError] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Validate the oobCode on mount
  useEffect(() => {
    if (!oobCode) {
      setVerifyingCode(false);
      setCodeValid(false);
      setCodeError('Şifre sıfırlama kodu bulunamadı veya bağlantı eksik.');
      return;
    }

    let isMounted = true;
    verifyPasswordResetCode(auth, oobCode)
      .then((email) => {
        if (isMounted) {
          setAccountEmail(email);
          setCodeValid(true);
          setVerifyingCode(false);
        }
      })
      .catch((err) => {
        console.error('Password reset code verification failed:', err);
        if (isMounted) {
          setCodeValid(false);
          setVerifyingCode(false);
          if (err.code === 'auth/expired-action-code') {
            setCodeError('Bu şifre sıfırlama bağlantısının geçerlilik süresi dolmuş. Lütfen yeni bir bağlantı talep edin.');
          } else if (err.code === 'auth/invalid-action-code') {
            setCodeError('Bu bağlantı geçersiz veya daha önce kullanılmış. Lütfen yeni bir şifre sıfırlama bağlantısı isteyin.');
          } else {
            setCodeError('Şifre sıfırlama bağlantısı doğrulanamadı. Lütfen tekrar deneyin.');
          }
        }
      });

    return () => {
      isMounted = false;
    };
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (newPassword.length < 6) {
      setFormError('Yeni şifreniz en az 6 karakterden oluşmalıdır.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError('Girdiğiniz şifreler birbiriyle eşleşmiyor.');
      return;
    }

    setSubmitting(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setResetSuccess(true);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      setTimeout(() => {
        router.push('/login?mode=login');
      }, 3500);
    } catch (err: any) {
      console.error('Password reset confirmation failed:', err);
      if (err.code === 'auth/expired-action-code') {
        setFormError('Sıfırlama kodunun süresi doldu. Lütfen yeniden şifre sıfırlama talebinde bulunun.');
      } else if (err.code === 'auth/weak-password') {
        setFormError('Şifreniz çok zayıf. Lütfen harf ve rakam içeren daha güçlü bir şifre seçin.');
      } else {
        setFormError(err.message || 'Şifre güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-100 flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-md space-y-6">
        {/* Logo & Header */}
        <div className="text-center">
          <Link href="/" className="inline-block group mb-3">
            <img
              src="/logo.png"
              alt="AskSite Logo"
              className="h-20 w-20 mx-auto rounded-3xl object-cover shadow-2xl border-2 border-slate-800/10 shadow-rose-500/25 group-hover:scale-105 transition duration-300"
            />
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Ask<span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500">Site</span>
          </h1>
          <p className="text-[11px] font-bold text-rose-500 tracking-widest uppercase mt-0.5 mb-1.5">
            Hikayeniz, Sizinle...
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-gray-100 backdrop-blur-md">
          {verifyingCode ? (
            <div className="py-12 text-center space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 animate-spin">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-800">Sıfırlama Bağlantısı Doğrulanıyor...</h3>
              <p className="text-xs text-gray-500">Lütfen bekleyin, güvenlik kontrolü yapılıyor.</p>
            </div>
          ) : !codeValid ? (
            <div className="text-center space-y-5 py-4">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 border border-rose-200">
                <AlertTriangle className="h-7 w-7 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-gray-900 mb-2">Bağlantı Geçersiz veya Süresi Dolmuş</h3>
                <p className="text-xs text-gray-600 leading-relaxed max-w-xs mx-auto">
                  {codeError}
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/login?mode=forgot"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 px-6 py-3 text-xs font-bold text-white shadow-lg hover:brightness-105 active:scale-98 transition"
                >
                  <KeyRound className="h-4 w-4" />
                  <span>Yeni Sıfırlama Bağlantısı İste</span>
                </Link>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <Link href="/login" className="text-xs font-semibold text-gray-500 hover:text-rose-600 underline">
                  Giriş Sayfasına Dön
                </Link>
              </div>
            </div>
          ) : resetSuccess ? (
            <div className="text-center space-y-5 py-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-gray-900 mb-2">Şifreniz Başarıyla Yenilendi! 🎉</h3>
                <p className="text-xs text-gray-600 leading-relaxed max-w-xs mx-auto">
                  Yeni şifreniz aktif edildi. Şimdi yeni şifrenizle hesabınıza güvenle giriş yapabilirsiniz.
                </p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800 font-semibold">
                Giriş ekranına yönlendiriliyorsunuz... ✨
              </div>
              <div className="pt-2">
                <Link
                  href="/login?mode=login"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 px-6 py-3 text-xs font-bold text-white shadow-lg hover:brightness-105 active:scale-98 transition"
                >
                  <span>Hemen Giriş Yap</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 border border-rose-100 mb-3">
                  <KeyRound className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-extrabold text-gray-900">Yeni Şifrenizi Belirleyin</h2>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="font-semibold text-gray-700">{accountEmail}</span> hesabı için yeni şifrenizi oluşturun.
                </p>
              </div>

              {formError && (
                <div className="rounded-2xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Yeni Şifre *</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="En az 6 karakter"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-2xl border border-gray-200 pl-10 pr-10 py-2.5 text-xs font-medium outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Yeni Şifre (Tekrar) *</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Yeni şifrenizi tekrar girin"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-2xl border border-gray-200 pl-10 pr-4 py-2.5 text-xs font-medium outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition"
                    />
                  </div>
                  {newPassword && confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-[11px] text-rose-500 font-semibold mt-1">Şifreler uyuşmuyor.</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 py-3.5 px-4 text-xs font-bold text-white shadow-xl shadow-rose-500/20 hover:opacity-95 active:scale-98 transition disabled:opacity-50 mt-2"
                >
                  <Lock className="h-4 w-4" />
                  <span>{submitting ? 'Şifre Güncelleniyor...' : 'Şifremi Güncelle ve Giriş Yap'}</span>
                </button>
              </form>

              <div className="pt-2 text-center border-t border-gray-100">
                <Link href="/login" className="text-xs font-semibold text-gray-500 hover:text-rose-600 underline">
                  Giriş Ekranına Dön
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Security Trust Footer */}
        <div className="text-center text-[11px] text-gray-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>256-Bit SSL ile Şifrelenmiş Güvenli Şifre Sıfırlama</span>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-pink-50 text-xs font-bold text-gray-500">
          Yükleniyor...
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
