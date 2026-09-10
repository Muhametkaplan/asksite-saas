'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, ArrowRight, Sparkles, KeyRound } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (typeof window !== 'undefined' && data.token) {
          localStorage.setItem('asksite_admin_token', data.token);
          localStorage.setItem('asksite_admin_email', data.email);
        }
        router.push('/admin');
      } else {
        setErrorMsg(data.error || 'Giriş yapılamadı. Bilgilerinizi kontrol ediniz.');
      }
    } catch (err: any) {
      setErrorMsg('Sunucu bağlantı hatası oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header Card */}
        <div className="rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-purple-600 text-white shadow-lg shadow-rose-500/30">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] font-bold text-rose-400 uppercase tracking-widest mt-2">
              <Sparkles className="h-3 w-3" /> Süper Admin Girişi
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              AskSite Yönetim Masası
            </h1>
            <p className="text-xs text-slate-400">
              admin.asksite.com.tr kontrol merkezine erişmek için kimliğinizi doğrulayın.
            </p>
          </div>

          {errorMsg && (
            <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 p-3.5 text-xs font-semibold text-rose-400 text-center animate-in fade-in duration-200">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Yönetici E-Postası
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="admin@asksite.com.tr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-slate-950/70 border border-slate-700/80 pl-10 pr-4 py-3 text-xs font-semibold text-white outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Yönetici Şifresi / Anahtarı
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl bg-slate-950/70 border border-slate-700/80 pl-10 pr-4 py-3 text-xs font-semibold text-white outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition placeholder:text-slate-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 py-3 text-xs font-black text-white shadow-lg shadow-rose-500/25 hover:opacity-95 active:scale-98 transition disabled:opacity-50 cursor-pointer pt-3.5 pb-3.5 mt-2"
            >
              {loading ? (
                'Yetki Doğrulanıyor...'
              ) : (
                <>
                  <KeyRound className="h-4 w-4" /> Güvenli Giriş Yap <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-[11px] text-slate-600 border-t border-slate-800/80">
            AskSite SaaS v2.0 • Güvenli Yönetici Protokolü
          </div>
        </div>
      </div>
    </div>
  );
}
