'use client';

import Link from 'next/link';
import { Heart, ShieldCheck, Lock, CreditCard, Mail, MessageCircle, Phone, MapPin, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-[#0a0f1d] text-gray-300 pt-16 pb-12 border-t border-gray-800/80 m-0">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-gray-800/80">
          {/* Brand & About */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 text-xl font-black text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 shadow-md shadow-rose-500/20">
                <Heart className="h-5 w-5 fill-white text-white" />
              </span>
              <span>AskSite SaaS</span>
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed">
              Aşkınızı ve en güzel anılarınızı dijital dünyada ölümsüzleştiren, Türkiye&apos;nin lider çift web sitesi ve dijital hediye platformu.
            </p>
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span>7/24 Anında Dijital Aktivasyon</span>
              </div>
              <div className="text-[11px] text-gray-400 font-semibold">
                Yetkili Satıcı: <span className="text-gray-200">Muhammet Kaplan</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Hızlı Bağlantılar</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/#ozellikler" className="hover:text-rose-400 transition flex items-center gap-1">
                  <span>Öne Çıkan Özellikler</span>
                </Link>
              </li>
              <li>
                <Link href="/#fiyatlandirma" className="hover:text-rose-400 transition flex items-center gap-1">
                  <span>Paketler & Fiyatlandırma</span>
                </Link>
              </li>
              <li>
                <Link href="/demo" className="hover:text-rose-400 transition flex items-center gap-1">
                  <span>Canlı Çift Demosu</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60" />
                </Link>
              </li>
              <li>
                <Link href="/checkout" className="hover:text-rose-400 transition flex items-center gap-1">
                  <span>Sipariş & Satın Al</span>
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-rose-400 transition flex items-center gap-1">
                  <span>Çift Yönetim Paneli</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Yasal & Sözleşmeler</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/legal/mesafeli-satis-sozlesmesi" className="hover:text-rose-400 transition">
                  Mesafeli Satış Sözleşmesi
                </Link>
              </li>
              <li>
                <Link href="/legal/iptal-ve-iade-kosullari" className="hover:text-rose-400 transition">
                  İptal ve İade Koşulları
                </Link>
              </li>
              <li>
                <Link href="/legal/gizlilik-ve-kvkk" className="hover:text-rose-400 transition">
                  Gizlilik ve KVKK Politikası
                </Link>
              </li>
              <li>
                <Link href="/legal/teslimat-ve-odeme" className="hover:text-rose-400 transition">
                  Teslimat ve Ödeme Şartları
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Müşteri Destek & İletişim</h4>
            <div className="space-y-2.5 text-xs text-gray-400">
              <a
                href="mailto:muhammet.2713ka@gmail.com"
                className="flex items-center gap-2 hover:text-white transition group"
              >
                <Mail className="h-4 w-4 text-rose-400 group-hover:scale-110 transition shrink-0" />
                <span className="truncate">muhammet.2713ka@gmail.com</span>
              </a>
              <a
                href="https://wa.me/905524185530"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-emerald-400 transition group"
              >
                <MessageCircle className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition shrink-0" />
                <span>WhatsApp Destek Hattı</span>
              </a>
              <div className="flex items-center gap-2 text-gray-400">
                <Phone className="h-4 w-4 text-purple-400 shrink-0" />
                <span>+90 552 418 55 30</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <MapPin className="h-4 w-4 text-rose-500 shrink-0" />
                <span>Şahinbey / Gaziantep, Türkiye</span>
              </div>
              <div className="pt-2 text-[11px] text-gray-500">
                Haftanın 7 Günü 09:00 - 23:00 Destek
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods & Security Trust Badges */}
        <div className="py-8 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-gray-800/80">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-800/60 border border-gray-700/60 text-xs font-semibold text-gray-200">
              <Lock className="h-3.5 w-3.5 text-emerald-400" />
              <span>256-Bit SSL Güvenli Ödeme</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-800/60 border border-gray-700/60 text-xs font-semibold text-gray-200">
              <ShieldCheck className="h-3.5 w-3.5 text-rose-400" />
              <span>3D Secure Koruması</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-800/60 border border-gray-700/60 text-xs font-semibold text-gray-200">
              <CreditCard className="h-3.5 w-3.5 text-blue-400" />
              <span>Tüm Banka & Kredi Kartları</span>
            </div>
          </div>

          {/* Card Logos Badge */}
          <div className="flex items-center gap-2 text-[11px] font-black tracking-wider text-gray-400">
            <span className="px-2.5 py-1 rounded-md bg-gray-800 border border-gray-700 font-serif font-black text-white">VISA</span>
            <span className="px-2.5 py-1 rounded-md bg-gray-800 border border-gray-700 font-black text-red-400">MasterCard</span>
            <span className="px-2.5 py-1 rounded-md bg-gray-800 border border-gray-700 font-black text-cyan-400">TROY</span>
            <span className="px-2.5 py-1 rounded-md bg-gray-800 border border-gray-700 font-mono text-[10px] text-gray-300">Havale/EFT</span>
          </div>
        </div>

        {/* Copyright & Disclaimer */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 text-center sm:text-left">
          <p>© 2026 AskSite SaaS - Muhammet Kaplan. Tüm hakları saklıdır.</p>
          <p className="text-[11px] text-gray-600">
            Dijital içerik ve mikro-hizmet platformu. Fiyatlara yasal KDV dahildir.
          </p>
        </div>
      </div>
    </footer>
  );
}
