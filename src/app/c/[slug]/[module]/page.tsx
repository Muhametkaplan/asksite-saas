import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Heart, Gamepad2, Ticket, Palette, BookOpen, Hourglass, Film, Disc, Brain } from 'lucide-react';
import { getCoupleBySlug } from '@/lib/couples';
import SubmoduleInteractiveClient from './SubmoduleInteractiveClient';

import PartnerAuthModal from '@/components/PartnerAuthModal';

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
    <main className="relative min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 pb-20 pt-6 px-4">
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
    </main>
  );
}
