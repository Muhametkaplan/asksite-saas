import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Gamepad2, Ticket, Palette, BookOpen, Hourglass, Film, Disc, Brain } from 'lucide-react';
import { DEMO_COUPLE } from '@/lib/couples';
import SubmoduleInteractiveClient from '@/app/c/[slug]/[module]/SubmoduleInteractiveClient';

interface DemoModulePageProps {
  params: Promise<{ module: string }>;
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

export async function generateMetadata({ params }: DemoModulePageProps) {
  const { module } = await params;
  const modInfo = VALID_MODULES[module];
  if (!modInfo) return { title: 'Modül Bulunamadı' };
  return { title: `${modInfo.title} - Pure Demo Vitrin` };
}

export default async function DemoSubmodulePage({ params }: DemoModulePageProps) {
  const { module } = await params;
  const modInfo = VALID_MODULES[module];

  if (!modInfo) {
    notFound();
  }

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 pb-20 pt-6 px-4">
      {/* Top Header with Back Button */}
      <div className="mx-auto max-w-lg flex items-center justify-between mb-6">
        <Link
          href="/demo"
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
          {modInfo.subtitle} • Salt Okunur Vitrin
        </p>
      </div>

      {/* Interactive Submodule Client Component with DEMO_COUPLE */}
      <div className="mx-auto max-w-lg">
        <SubmoduleInteractiveClient module={module} couple={DEMO_COUPLE} />
      </div>
    </main>
  );
}
