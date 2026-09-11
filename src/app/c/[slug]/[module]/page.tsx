import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Heart, Gamepad2, Ticket, Palette, BookOpen, Hourglass, Film, Disc, Brain } from 'lucide-react';
import { getCoupleBySlug, isSubscriptionExpired, isFeatureAllowedForPackage } from '@/lib/couples';
import SubmoduleInteractiveClient from './SubmoduleInteractiveClient';
import PartnerAuthModal from '@/components/PartnerAuthModal';
import BottomNav from '@/components/BottomNav';

interface ModulePageProps {
  params: Promise<{ slug: string; module: string }>;
}

const VALID_MODULES: { [key: string]: { title: string; subtitle: string; icon: any } } = {
  games: { title: 'Aşk Salonumuz 🎮', subtitle: 'Eğlenelim ve Yarışalım', icon: Gamepad2 },
  coupons: { title: 'Aşk Kuponları 🎟️', subtitle: 'İstediğin Zaman Kullanabilirsin', icon: Ticket },
  therapy: { title: 'Sanat Galerisi 🎨', subtitle: 'Renklerle Aşk ve Terapi', icon: Palette },
  diary: { title: 'Anı Defteri 📖', subtitle: 'Unutulmaz Anılarımız', icon: BookOpen },
  capsule: { title: 'Zaman Kapsülü ⏳', subtitle: 'Geleceğe Notlar', icon: Hourglass },
  cinema: { title: 'Sinemamız 🎬', subtitle: 'Ortak Film Arşivimiz', icon: Film },
  wheel: { title: 'Aşk Çarkı 🎡', subtitle: 'Çarkı Çevir Sürprizi Gör', icon: Disc },
  quiz: { title: 'Aşk Testi 🧠', subtitle: 'Beni Ne Kadar Tanıyorsun?', icon: Brain },
};

export async function generateMetadata({ params }: ModulePageProps) {
  const { slug, module } = await params;
  const couple = await getCoupleBySlug(slug);
  const modInfo = VALID_MODULES[module];

  if (!couple || !modInfo) {
    return { title: 'Modül Bulunamadı' };
  }

  return {
    title: `${modInfo.title} - ${couple.partner1_name} & ${couple.partner2_name}`,
  };
}

export default async function SubmodulePage({ params }: ModulePageProps) {
  const { slug, module } = await params;
  const couple = await getCoupleBySlug(slug);
  const modInfo = VALID_MODULES[module];

  if (!couple || !modInfo) {
    notFound();
  }

  if (slug !== 'demo' && couple.isPaid !== true) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-rose-950 to-slate-900 flex items-center justify-center p-6 text-center text-white">
        <div className="max-w-md rounded-3xl bg-white/10 backdrop-blur-xl p-8 border border-white/20 shadow-2xl space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 text-3xl">
            💳
          </div>
          <h1 className="text-xl font-black text-rose-300">
            {couple.partner1_name} & {couple.partner2_name}
          </h1>
          <p className="text-sm font-medium text-gray-200">
            Bu modüle erişebilmek için ödeme işleminin tamamlanması gerekmektedir.
          </p>
          <div className="pt-2">
            <a
              href="/checkout"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-sm shadow-lg hover:brightness-110 transition-all"
            >
              Ödemeyi Tamamla ve Siteni Aç ✨
            </a>
          </div>
        </div>
      </main>
    );
  }

  // Check 1-Year Subscription Expiry (365 days)
  if (slug !== 'demo' && isSubscriptionExpired(couple.expires_at)) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-rose-950 to-slate-900 flex items-center justify-center p-6 text-center text-white">
        <div className="max-w-md rounded-3xl bg-white/10 backdrop-blur-xl p-8 border border-white/20 shadow-2xl space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 text-3xl">
            ⏳
          </div>
          <h1 className="text-xl font-black text-rose-300">
            {couple.partner1_name} & {couple.partner2_name}
          </h1>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 border border-rose-500/30 px-3.5 py-1 text-xs font-bold text-rose-300">
            Abonelik Süresi Doldu
          </div>
          <p className="text-xs text-gray-200 leading-relaxed">
            Bu çift sitesinin 1 yıllık yayın süresi tamamlanmıştır. Modüle erişmek ve sitenizi aktif tutmak için aboneliğinizi yenileyin.
          </p>
          <div className="pt-2">
            <a
              href="/checkout"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-sm shadow-lg hover:brightness-110 transition-all"
            >
              Aboneliği 1 Yıl Yenile (₺250) ✨
            </a>
          </div>
        </div>
      </main>
    );
  }

  // Feature Gate: Check if current package has access to this module (Diary and Capsule are Premium only)
  if (
    slug !== 'demo' &&
    ((module === 'diary' && !isFeatureAllowedForPackage(couple.plan || couple.package_type, 'diary')) ||
     (module === 'capsule' && !isFeatureAllowedForPackage(couple.plan || couple.package_type, 'capsule')))
  ) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-rose-950 to-slate-900 flex items-center justify-center p-6 text-center text-white">
        <div className="max-w-md rounded-3xl bg-white/10 backdrop-blur-xl p-8 border border-white/20 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 text-3xl">
            ⭐
          </div>
          <h1 className="text-xl font-black text-rose-300">
            {modInfo.title}
          </h1>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/20 border border-purple-500/30 px-3.5 py-1 text-xs font-bold text-purple-300">
            Premium VIP Pakete Özeldir 🔒
          </div>
          <p className="text-sm font-medium text-gray-200 leading-relaxed">
            Bu özel modül yalnızca <strong>Premium VIP Yıllık Paket</strong> abonelerine açıktır. Paketinizi yükselterek bu modüle ve tüm ayrıcalıklara hemen erişebilirsiniz.
          </p>
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <a
              href="/checkout?plan=yearly_premium"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xs shadow-lg hover:brightness-110 transition-all"
            >
              Premium VIP&apos;ye Yükselt (₺150 Farkla) ✨
            </a>
            <Link
              href={`/c/${slug}`}
              className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition-all border border-white/20"
            >
              Geri Dön
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (couple.is_active === false) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-rose-950 to-slate-900 flex items-center justify-center p-6 text-center text-white">
        <div className="max-w-md rounded-3xl bg-white/10 backdrop-blur-xl p-8 border border-white/20 shadow-2xl space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 text-3xl">
            🔒
          </div>
          <h1 className="text-xl font-black text-rose-300">
            {couple.partner1_name} & {couple.partner2_name}
          </h1>
          <p className="text-xs text-gray-300">
            Bu modül sayfa sahibi tarafından geçici olarak erişime kapatılmıştır.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 pb-32 pt-6 px-3 sm:px-4 overflow-x-hidden max-w-full">
      {/* Device Session Guard & Auth Modal */}
      <PartnerAuthModal
        slug={couple.slug}
        partner1Name={couple.partner1_name}
        partner2Name={couple.partner2_name}
        couple={couple}
      />

      {/* Top Header with Back Button */}
      <div className="mx-auto max-w-lg flex items-center justify-between mb-6">
        <Link
          href={`/c/${slug}`}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-md shadow-sm border border-white text-gray-700 hover:bg-white transition active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-serif text-2xl font-extrabold text-rose-500">
          {modInfo.title}
        </h1>
        <div className="w-10" />
      </div>

      <div className="mx-auto max-w-lg text-center mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-rose-400">
          {modInfo.subtitle}
        </p>
      </div>

      {/* Interactive Submodule Client Component */}
      <div className="mx-auto max-w-lg">
        <SubmoduleInteractiveClient module={module} couple={couple} />
      </div>

      {/* Floating Bottom App Navigation */}
      <BottomNav slug={couple.slug} />
    </main>
  );
}
