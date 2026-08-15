import Link from 'next/link';
import { ArrowLeft, Shield, FileText, Lock, RefreshCw, Truck } from 'lucide-react';
import Footer from '@/components/Footer';

const LEGAL_TABS = [
  {
    name: 'Mesafeli Satış Sözleşmesi',
    href: '/legal/mesafeli-satis-sozlesmesi',
    icon: FileText,
  },
  {
    name: 'İptal ve İade Koşulları',
    href: '/legal/iptal-ve-iade-kosullari',
    icon: RefreshCw,
  },
  {
    name: 'Gizlilik ve KVKK Politikası',
    href: '/legal/gizlilik-ve-kvkk',
    icon: Lock,
  },
  {
    name: 'Teslimat ve Ödeme Şartları',
    href: '/legal/teslimat-ve-odeme',
    icon: Truck,
  },
];

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/30 to-purple-50/40 text-gray-900 flex flex-col justify-between">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-gray-200/80 px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-700 hover:text-rose-600 transition"
          >
            <ArrowLeft className="h-4 w-4 text-rose-500" />
            <span>Ana Sayfaya Dön</span>
          </Link>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-[11px] font-black text-rose-600">
            <Shield className="h-3.5 w-3.5" />
            <span>Yasal & Güvenlik Merkezi</span>
          </div>
        </div>
      </header>

      {/* Main Legal Content Container */}
      <main className="mx-auto max-w-4xl w-full px-4 sm:px-6 py-10 flex-1">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 pb-8 mb-8 border-b border-gray-200/80">
          {LEGAL_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/80 hover:bg-white text-gray-700 hover:text-rose-600 border border-gray-200 shadow-2xs transition active:scale-98"
              >
                <Icon className="h-3.5 w-3.5 text-rose-500" />
                <span>{tab.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Content Card */}
        <article className="rounded-3xl bg-white p-6 sm:p-10 shadow-xl border border-gray-100/90 text-gray-800 leading-relaxed space-y-6">
          {children}
        </article>
      </main>

      {/* Corporate Footer */}
      <Footer />
    </div>
  );
}
