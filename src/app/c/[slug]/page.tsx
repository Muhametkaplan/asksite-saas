import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCoupleBySlug, isSubscriptionExpired, isFeatureAllowedForPackage } from '@/lib/couples';

import FloatingHearts from '@/components/FloatingHearts';
import MusicPlayer from '@/components/MusicPlayer';
import RelationshipTimer from '@/components/RelationshipTimer';
import NavigationGrid from '@/components/NavigationGrid';
import RomanticMap from '@/components/RomanticMap';
import LoveJar from '@/components/LoveJar';
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
import StoryShareButton from '@/components/StoryShareButton';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

  if (slug !== 'demo' && couple.isPaid !== true) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-rose-950 to-slate-900 flex items-center justify-center p-6 text-center text-white">
        <div className="max-w-md rounded-3xl bg-white/10 backdrop-blur-xl p-8 border border-white/20 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 text-3xl">
            💳
          </div>
          <h1 className="text-2xl font-black text-rose-300">
            {couple.partner1_name} & {couple.partner2_name}
          </h1>
          <p className="text-sm font-medium text-gray-200 leading-relaxed">
            Bu çift sitesinin yayına alınabilmesi için ödeme işleminin tamamlanması gerekmektedir.
          </p>
          <div className="pt-3">
            <a
              href="/checkout"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-sm shadow-lg hover:brightness-110 transition-all"
            >
              Ödemeyi Tamamla ve Siteni Aç ✨
            </a>
          </div>
          <div className="pt-2 text-xs text-gray-400 font-mono">
            AskSite SaaS • Ödeme Bekleniyor ⏳
          </div>
        </div>
      </main>
    );
  }

  // Check 1-Year Subscription Expiry (365 days)
  if (slug !== 'demo' && isSubscriptionExpired(couple.expires_at)) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-rose-950 to-slate-900 flex items-center justify-center p-6 text-center text-white">
        <div className="max-w-md rounded-3xl bg-white/10 backdrop-blur-xl p-8 border border-white/20 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 text-3xl">
            ⏳
          </div>
          <h1 className="text-2xl font-black text-rose-300">
            {couple.partner1_name} & {couple.partner2_name}
          </h1>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 border border-rose-500/30 px-3.5 py-1 text-xs font-bold text-rose-300">
            Abonelik Süresi Doldu
          </div>
          <p className="text-sm font-medium text-gray-200 leading-relaxed">
            Bu çift sitesinin 1 yıllık (365 gün) yayın süresi tamamlanmıştır. Aşk sayfanızı yeniden yayına almak ve tüm anılarınızı korumaya devam etmek için aboneliğinizi yenileyin.
          </p>
          <div className="pt-3">
            <a
              href="/checkout"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-sm shadow-lg hover:brightness-110 transition-all"
            >
              Aboneliği 1 Yıl Yenile (₺250) ✨
            </a>
          </div>
          <div className="pt-2 text-xs text-gray-400 font-mono">
            AskSite SaaS • 365 Günlük Abonelik Modeli
          </div>
        </div>
      </main>
    );
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
    <main className="relative min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 pb-40 pt-6 sm:pt-8 overflow-x-hidden max-w-full">
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

      <div className="container relative z-10 mx-auto max-w-lg px-3 sm:px-5 text-center overflow-x-hidden">
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
          <EventCountdown event={couple.upcoming_event} slug={couple.slug} isDemo={couple.slug === 'demo'} />
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

        {/* Random Memory Surprise Card (Premium'a Özel) */}
        {toggles.memory !== false && isFeatureAllowedForPackage(couple.plan || couple.package_type, 'daily_memory') && (
          <RandomMemoryWidget memories={couple.memories} />
        )}

        {/* Couple Bucket List */}
        {toggles.bucket_list !== false && (
          <CoupleBucketList items={couple.bucket_list} />
        )}

        {/* Navigation Grid to Subpages */}
        <NavigationGrid slug={couple.slug} />

        {/* Romantic Map Widget (Standart pakette kilitli, Premium'da açık) */}
        {toggles.map !== false && (
          isFeatureAllowedForPackage(couple.plan || couple.package_type, 'map') ? (
            <RomanticMap coupleId={couple.id || couple.slug} />
          ) : (
            <div className="my-6 rounded-3xl bg-white/70 backdrop-blur-md p-6 border border-white/80 shadow-md text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 text-2xl">
                📍
              </div>
              <h3 className="text-base font-extrabold text-gray-800">
                Aşk Haritası (Bizim Haritamız) 🔒
              </h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Birlikte gezdiğiniz yerleri kalplerle haritaya işaretleme özelliği <strong>Premium VIP Yıllık Pakete</strong> özeldir.
              </p>
              <a
                href="/checkout?plan=yearly_premium"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold shadow-md hover:opacity-90 transition"
              >
                ⭐ Premium VIP&apos;ye Yükselt (₺150 Farkla)
              </a>
            </div>
          )
        )}

        {/* Love Jar */}
        {toggles.love_jar !== false && (
          <LoveJar reasons={couple.love_reasons} />
        )}

        {/* Emergency Hug WhatsApp Button */}
        <EmergencyHug phone={couple.whatsapp_number} message={couple.whatsapp_message} />
      </div>

      {/* Floating Instagram Story Share Button */}
      <StoryShareButton couple={couple} />

      {/* Floating Bottom Nav */}
      <BottomNav slug={couple.slug} />

      {/* Marquee Ticker at very bottom */}
      <Ticker />
    </main>
  );
}
