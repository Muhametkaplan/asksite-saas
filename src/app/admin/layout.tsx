'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, LogOut, ExternalLink, Sparkles, Globe } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      setChecking(false);
      return;
    }

    // Verify session
    async function checkAuth() {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('asksite_admin_token') : null;
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/admin/login', { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setAdminEmail(data.email || localStorage.getItem('asksite_admin_email') || 'Super Admin');
            setChecking(false);
            return;
          }
        }
      } catch (err) {}

      // If not authenticated, redirect to login
      router.push('/admin/login');
    }

    checkAuth();
  }, [pathname, isLoginPage, router]);

  const handleLogout = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('asksite_admin_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch('/api/admin/login', { method: 'DELETE', headers });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('asksite_admin_token');
        localStorage.removeItem('asksite_admin_email');
      }
      router.push('/admin/login');
    } catch (e) {
      router.push('/admin/login');
    }
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-950 text-rose-500 font-bold flex flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
        <span className="text-xs font-bold text-slate-400">Yönetici yetkisi doğrulanıyor...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Admin Header Bar */}
      <header className="sticky top-0 z-40 w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-500 to-purple-600 text-white shadow-md shadow-rose-500/20">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div className="flex flex-col text-left leading-tight">
              <span className="text-sm font-black text-white tracking-tight flex items-center gap-1.5">
                AskSite <span className="text-rose-500">Süper Admin</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <Globe className="h-2.5 w-2.5 text-purple-400" /> admin.asksite.com.tr
              </span>
            </div>
          </Link>
          <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Canlı Sistem
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="hidden sm:flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-white transition px-3 py-1.5 rounded-xl hover:bg-slate-800"
          >
            Siteyi Gör <ExternalLink className="h-3 w-3" />
          </Link>

          {adminEmail && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs font-medium text-slate-300">
              <span className="text-slate-400">Yönetici:</span>
              <span className="font-bold text-rose-400">{adminEmail}</span>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
            title="Güvenli Çıkış"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Çıkış</span>
          </button>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-8">
        {children}
      </main>

      {/* Admin Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-600">
        AskSite SaaS Super Admin Backoffice • admin.asksite.com.tr • Tüm hakları saklıdır.
      </footer>
    </div>
  );
}
