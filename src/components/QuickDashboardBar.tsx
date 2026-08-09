'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LayoutDashboard } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getCoupleBySlug } from '@/lib/couples';

interface QuickDashboardBarProps {
  slug: string;
}

export default function QuickDashboardBar({ slug }: QuickDashboardBarProps) {
  const [isPartner, setIsPartner] = useState(false);

  useEffect(() => {
    const storedAuth = typeof window !== 'undefined'
      ? sessionStorage.getItem(`asksite_auth_${slug}`) || localStorage.getItem(`asksite_auth_${slug}`)
      : null;
    const deviceToken = typeof window !== 'undefined' ? localStorage.getItem('asksite_device_token') : null;

    if (storedAuth || deviceToken) {
      setIsPartner(true);
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setIsPartner(true);
      }
    });

    return () => unsubscribe();
  }, [slug]);

  const handleDashboardClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    const firebaseUser = auth.currentUser;
    const storedAuth = typeof window !== 'undefined'
      ? sessionStorage.getItem(`asksite_auth_${slug}`) || localStorage.getItem(`asksite_auth_${slug}`)
      : null;

    if (!firebaseUser && !storedAuth) {
      window.location.href = `/login?slug=${slug}&redirect=dashboard`;
      return;
    }

    if (firebaseUser) {
      const activeEmail = (firebaseUser.email || '').toLowerCase().trim();
      const couple = await getCoupleBySlug(slug);

      if (couple) {
        const authEmails = (couple.authorized_emails || []).map((e) => e.toLowerCase().trim());
        const p1Email = (couple.partner1_email || couple.allowed_users?.partner1_email || '').toLowerCase().trim();
        const p2Email = (couple.partner2_email || couple.allowed_users?.partner2_email || '').toLowerCase().trim();
        const ownerEmail = (couple.owner_email || '').toLowerCase().trim();
        const coOwners = couple.co_owners || [];

        const isAuthorized = Boolean(
          activeEmail && (
            authEmails.includes(activeEmail) ||
            activeEmail === p1Email ||
            activeEmail === p2Email ||
            activeEmail === ownerEmail ||
            coOwners.includes(firebaseUser.uid) ||
            firebaseUser.uid === couple.owner_uid ||
            firebaseUser.uid === couple.partner1_uid ||
            firebaseUser.uid === couple.partner2_uid
          )
        );

        if (!isAuthorized) {
          await signOut(auth);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('asksite_user');
            sessionStorage.removeItem(`asksite_auth_${slug}`);
            localStorage.removeItem(`asksite_auth_${slug}`);
          }
          const errMsg = encodeURIComponent("Girdiğiniz e-posta bu çift sitesinin yöneticisi değildir. Lütfen yetkili partner e-postanızla giriş yapın.");
          window.location.href = `/login?slug=${slug}&error=${errMsg}&redirect=dashboard`;
          return;
        }
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('activeCoupleSlug', slug);
      localStorage.setItem('asksite_couple_slug', slug);
    }
    window.location.href = `/dashboard?slug=${slug}`;
  };

  return (
    <div className="fixed top-4 left-4 z-30 animate-in fade-in duration-200">
      <a
        href={`/dashboard?slug=${slug}`}
        onClick={handleDashboardClick}
        className="flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 via-pink-600 to-purple-600 px-4 py-2 text-xs font-black text-white shadow-xl hover:scale-105 transition active:scale-95 group cursor-pointer"
      >
        <LayoutDashboard className="h-4 w-4 text-white group-hover:rotate-12 transition-transform duration-300" />
        <span>Yönetim Paneline Git ➔</span>
      </a>
    </div>
  );
}
