import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCoupleBySlug } from '@/lib/couples';

import FloatingHearts from '@/components/FloatingHearts';
import MusicPlayer from '@/components/MusicPlayer';
import RelationshipTimer from '@/components/RelationshipTimer';
import NavigationGrid from '@/components/NavigationGrid';
import RomanticMap from '@/components/RomanticMap';
import LoveJar from '@/components/LoveJar';
import CineAIWidget from '@/components/CineAIWidget';
import EmergencyHug from '@/components/EmergencyHug';
import BottomNav from '@/components/BottomNav';
import Ticker from '@/components/Ticker';
import DayNightGreeting from '@/components/DayNightGreeting';
import SpotifyWidget from '@/components/SpotifyWidget';
import RandomMemoryWidget from '@/components/RandomMemoryWidget';
import CoupleBucketList from '@/components/CoupleBucketList';
import EventCountdown from '@/components/EventCountdown';
import CustomAudioPlayer from '@/components/CustomAudioPlayer';
import PartnerAuthModal from '@/components/PartnerAuthModal';
import LiveCanvasWidget from '@/components/LiveCanvasWidget';
import QuickDashboardBar from '@/components/QuickDashboardBar';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const couple = await getCoupleBySlug(slug);

  if (!couple) {
    return {
      title: 'Çift Bulunamadı',
      description: 'Aradığınız çift sayfası bulunamadı.',
    };
  }

  const title = `${couple.partner1_name} & ${couple.partner2_name} ❤️`;
  const description = `${couple.partner1_name} ve ${couple.partner2_name} çiftinin özel dijital dünyası. ${couple.subtitle}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'Aşk Platformu SaaS',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function CouplePage({ params }: PageProps) {
  const { slug } = await params;
  const couple = await getCoupleBySlug(slug);

  if (!couple) {
    notFound();
  }

  if (couple.is_active === false) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-rose-950 to-slate-900 flex items-center justify-center p-6 text-center text-white">
        <div className="max-w-md rounded-3xl bg-white/10 backdrop-blur-xl p-8 border border-white/20 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 text-3xl">
            🔒
          </div>
          <h1 className="text-2xl font-black text-rose-300">
            {couple.partner1_name} & {couple.partner2_name}
          </h1>
          <p className="text-sm font-medium text-gray-200 leading-relaxed">
            Bu sayfa sahibi tarafından geçici olarak erişime kapatılmıştır.
          </p>
          <div className="pt-2 text-xs text-gray-400 font-mono">
            AskSite SaaS • Sayfa Pasif Durumda 🚫
          </div>
        </div>
      </main>
    );
  }

  const toggles = couple.feature_toggles || {
    spotify: true,
    memory: true,
    bucket_list: true,
    day_night: true,
    countdown: true,
    custom_audio: true,
    canvas: true,
    love_jar: true,
    map: true,
  };

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 pb-28 pt-8">
      {/* Dynamic Background Floating Hearts */}
      <FloatingHearts />

      {/* Quick Dashboard Access Bar (Only visible for authenticated partners) */}
      <QuickDashboardBar slug={couple.slug} />

      {/* Partner Identity Verification & PIN Auth Modal */}
      <PartnerAuthModal
        slug={couple.slug}
        partner1Name={couple.partner1_name}
        partner2Name={couple.partner2_name}
        couple={couple}
      />

      <div className="container relative z-10 mx-auto max-w-lg px-5 text-center">
        {/* Dynamic Day/Night Greeting Theme */}
        {toggles.day_night !== false && (
          <DayNightGreeting partner1={couple.partner1_name} partner2={couple.partner2_name} />
        )}

        {/* Title & Subtitle */}
        <h1 className="font-serif text-5xl font-extrabold text-rose-500 drop-shadow-sm sm:text-6xl animate-pulse">
          {couple.partner1_name} & {couple.partner2_name}
        </h1>
        <div className="mt-2 text-sm font-semibold uppercase tracking-widest text-rose-400">
          {couple.subtitle}
        </div>

        {/* Custom Pink/Red HTML5 Audio Player */}
        {toggles.custom_audio !== false ? (
          <CustomAudioPlayer
            audioUrl={couple.custom_audio_url || couple.bg_music_url}
            title={`${couple.partner1_name} & ${couple.partner2_name} Melodisi`}
          />
        ) : (
          <div className="mt-6">
            <MusicPlayer musicUrl={couple.bg_music_url} />
          </div>
        )}

        {/* Live Relationship Timer & Event Countdown */}
        <RelationshipTimer startDateISO={couple.start_date} />

        {toggles.countdown !== false && (
          <EventCountdown event={couple.upcoming_event} />
        )}

        {/* Real-time Collaborative Live Canvas */}
        {toggles.canvas !== false && (
          <LiveCanvasWidget
            slug={couple.slug}
            partner1Name={couple.partner1_name}
            partner2Name={couple.partner2_name}
          />
        )}

        {/* Spotify Integration & Dynamic Karaoke */}
        {toggles.spotify !== false && (
          <SpotifyWidget spotifyUrl={couple.spotify_url} lyrics={couple.spotify_lyrics} />
        )}

        {/* Random Memory Surprise Card */}
        {toggles.memory !== false && (
          <RandomMemoryWidget memories={couple.memories} />
        )}

        {/* Couple Bucket List */}
        {toggles.bucket_list !== false && (
          <CoupleBucketList items={couple.bucket_list} />
        )}

        {/* Navigation Grid to Subpages */}
        <NavigationGrid slug={couple.slug} />

        {/* Romantic Map Widget */}
        {toggles.map !== false && (
          <RomanticMap coupleId={couple.id || couple.slug} />
        )}

        {/* Love Jar */}
        {toggles.love_jar !== false && (
          <LoveJar reasons={couple.love_reasons} />
        )}

        {/* Emergency Hug WhatsApp Button */}
        <EmergencyHug phone={couple.whatsapp_number} message={couple.whatsapp_message} />
      </div>

      {/* Floating Bottom Nav */}
      <BottomNav slug={couple.slug} />

      {/* Marquee Ticker at very bottom */}
      <Ticker />
    </main>
  );
}
