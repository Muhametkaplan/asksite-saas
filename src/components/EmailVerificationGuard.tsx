'use client';

import { useState } from 'react';
import { User, sendEmailVerification, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Mail, RefreshCw, CheckCircle2, AlertTriangle, LogOut, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface EmailVerificationGuardProps {
  user: User | null;
  onVerified?: () => void;
  children?: React.ReactNode;
}

export default function EmailVerificationGuard({ user, onVerified, children }: EmailVerificationGuardProps) {
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // If user is null, or verified, or signed in via Google (providerId !== 'password'), render children
  const isPasswordUser = user?.providerData?.some((p) => p.providerId === 'password');
  const isUnverified = user && !user.emailVerified && isPasswordUser;

  if (!isUnverified) {
    return <>{children}</>;
  }

  const handleResend = async () => {
    if (!auth.currentUser || cooldown > 0) return;
    setResending(true);
    setMessage(null);

    try {
      await sendEmailVerification(auth.currentUser);
      setMessage({
        type: 'success',
        text: 'Doğrulama linki e-posta adresinize tekrar gönderildi! Lütfen gelen kutunuzu ve spam klasörünü kontrol edin.',
      });

      // 60-second cooldown
      setCooldown(60);
      const interval = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Error resending verification email:', err);
      if (err.code === 'auth/too-many-requests') {
        setMessage({
          type: 'error',
          text: 'Çok fazla istek gönderildi. Lütfen birkaç dakika bekleyin.',
        });
      } else {
        setMessage({
          type: 'error',
          text: err.message || 'E-posta gönderilirken bir sorun oluştu.',
        });
      }
    } finally {
      setResending(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!auth.currentUser) return;
    setChecking(true);
    setMessage(null);

    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        // Sync with Firestore
        if (db) {
          try {
            await setDoc(
              doc(db, 'users', auth.currentUser.uid),
              {
                emailVerified: true,
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );
          } catch (e) {}
        }

        setMessage({
          type: 'success',
          text: 'Harika! E-postanız başarıyla doğrulandı. Yönlendiriliyorsunuz...',
        });

        if (onVerified) {
          onVerified();
        } else {
          window.location.reload();
        }
      } else {
        setMessage({
          type: 'info',
          text: 'Henüz doğrulama bağlantısına tıklanmadı. Lütfen e-postanızdaki linke tıkladıktan sonra bu butona tekrar basın.',
        });
      }
    } catch (err: any) {
      console.error('Error reloading user:', err);
      setMessage({
        type: 'error',
        text: 'Doğrulama durumu kontrol edilirken bir hata oluştu.',
      });
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('asksite_user');
      }
      window.location.href = '/login';
    } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg rounded-3xl bg-white/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl border border-rose-100 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Animated Envelope Icon */}
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-50 text-rose-600 border border-rose-200 shadow-lg shadow-rose-500/10">
          <Mail className="h-10 w-10 animate-bounce" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>
          </span>
        </div>

        {/* Title & Info */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            <span>E-Posta Doğrulaması Gereklidir</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
            Lütfen E-Postanızı Doğrulayın ✉️
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
            Hesap güvenliğiniz ve çift sitenizin anında yayına alınabilmesi için{' '}
            <strong className="text-gray-900 font-semibold underline">{user?.email}</strong> adresine bir doğrulama bağlantısı gönderdik.
          </p>
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-semibold text-left flex items-start gap-2.5 ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : message.type === 'info'
                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed">{message.text}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {/* Check Verification Button */}
          <button
            onClick={handleCheckVerification}
            disabled={checking}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 py-3.5 px-4 text-sm font-bold text-white shadow-xl shadow-rose-500/20 hover:opacity-95 active:scale-98 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Kontrol Ediliyor...' : 'Doğruladım, Sayfayı Aç'}</span>
            <ArrowRight className="h-4 w-4 ml-1" />
          </button>

          {/* Resend Verification Email Button */}
          <button
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gray-50 border border-gray-200 py-3 px-4 text-xs font-bold text-gray-700 hover:bg-gray-100 active:scale-98 transition disabled:opacity-50"
          >
            <Mail className="h-3.5 w-3.5 text-rose-500" />
            <span>
              {cooldown > 0
                ? `Tekrar Gönder (${cooldown}s)`
                : resending
                ? 'Gönderiliyor...'
                : 'Doğrulama E-postasını Tekrar Gönder'}
            </span>
          </button>
        </div>

        {/* Footer info & Logout */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> 256-Bit SSL Koruması
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-rose-600 font-semibold hover:underline"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Farklı Hesapla Giriş</span>
          </button>
        </div>
      </div>
    </div>
  );
}
