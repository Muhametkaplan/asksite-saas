'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import RelationshipTimer from '@/components/RelationshipTimer';
import DayNightGreeting from '@/components/DayNightGreeting';
import SpotifyWidget from '@/components/SpotifyWidget';
import RandomMemoryWidget from '@/components/RandomMemoryWidget';
import CoupleBucketList from '@/components/CoupleBucketList';
import RomanticMap from '@/components/RomanticMap';
import LoveJar from '@/components/LoveJar';
import EmergencyHug from '@/components/EmergencyHug';
import BottomNav from '@/components/BottomNav';
import Ticker from '@/components/Ticker';
import NavigationGrid from '@/components/NavigationGrid';
import { Heart, Sparkles, Shield, Rocket, ExternalLink, ArrowRight } from 'lucide-react';
import { CoupleConfig } from '@/types/couple';

const GENERIC_DEMO_COUPLE: CoupleConfig = {
  slug: 'demo',
  partner1_name: 'Partner 1',
  partner2_name: 'Partner 2',
  subtitle: 'Bizim Dünyamız ❤️',
  start_date: '2023-01-01T00:00:00.000Z',
  theme_color_primary: '#ff4d6d',
  theme_color_tech: '#6c5ce7',
  bg_music_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  custom_audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  spotify_url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M',
  spotify_lyrics: [
    'Sen benim kalbimin en tatlı melodisisin... 🎶',
    'Gözlerine baktığım an zaman duruyor...',
    'Birlikte yazacağımız nice güzel masallara ❤️',
  ],
  whatsapp_number: '905520000000',
  whatsapp_message: 'Seni çok seviyorum 💖',
  love_reasons: [
    'Gülüşünle en karanlık günlerimi bile aydınlatıyorsun.',
    'Bana her durumda güç veriyorsun ve hep arkamda duruyorsun.',
    'Seninleyken zamanın nasıl aktığını unutuyorum.',
    'Gözlerinin içi parlayarak güldüğün an dünyadaki her şey güzelleşiyor.',
    'Senin sesin, duyduğum en huzurlu ve en tatlı melodi.',
    'Varlığın ve kokun bana evdeymişim hissi veriyor, huzur buluyorum.',
  ],
  memories: [
    {
      id: 'm1',
      photo_url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=800&auto=format&fit=crop',
      date: '2023-01-01',
      title: 'İlk Karşılaşmamız ✨',
      note: 'Gözlerinin içine ilk baktığım an dünyadaki tüm sesler sustu.',
    },
    {
      id: 'm2',
      photo_url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=800&auto=format&fit=crop',
      date: '2023-07-15',
      title: 'Deniz Kenarı Gün Batımı 🌅',
      note: 'Rüzgar saçlarını savururken gülüşünü unutmak imkansızdı.',
    },
  ],
  bucket_list: [
    { id: 'b1', title: 'Roma & Venedik Gezisi 🇮🇹', category: 'city', completed: false },
    { id: 'b2', title: 'Kapadokya Balon Turu 🎈', category: 'activity', completed: true },
    { id: 'b3', title: 'Interstellar Sinema Gecesi 🍿', category: 'movie', completed: true },
  ],
  partner1_score: 120,
  partner2_score: 150,
  feature_toggles: {
    spotify: true,
    memory: true,
    bucket_list: true,
    day_night: true,
    countdown: true,
    custom_audio: true,
    canvas: true,
    love_jar: true,
    map: true,
    coupons: true,
    diary: true,
    capsule: true,
    wheel: true,
    quiz: true,
  },
};

export default function PureDemoPage() {
  const couple = GENERIC_DEMO_COUPLE;
  const toggles = couple.feature_toggles || {};

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-100 text-gray-900 pb-32 text-center relative">
      {/* Top Pure Demo Banner Banner */}
      <div className="bg-gradient-to-r from-purple-700 via-rose-600 to-pink-600 text-white text-xs font-bold py-2.5 px-4 shadow-md flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 mx-auto sm:mx-0">
          <Sparkles className="h-4 w-4 text-amber-300" />
          <span>Salt Okunur (Read-Only) Vitrin Demosu — Partner 1 & Partner 2</span>
        </div>
        <Link
          href="/login?redirect=checkout"
          className="mx-auto sm:mx-0 rounded-full bg-white px-4 py-1 text-[11px] font-black text-rose-600 hover:bg-rose-50 shadow-sm transition active:scale-95 flex items-center gap-1"
        >
          Kendi Siteni Oluştur / Satın Al 🚀
        </Link>
      </div>

      {/* Main Container */}
      <div className="container mx-auto max-w-xl px-4 pt-6 space-y-6">
        {/* Dynamic Day/Night Mode Greeting Header */}
        {toggles.day_night !== false && (
          <DayNightGreeting partner1={couple.partner1_name} partner2={couple.partner2_name} />
        )}

        {/* Title Header */}
        <div className="box-style my-4 py-8 rounded-3xl bg-white/80 backdrop-blur-md shadow-xl border border-white/90">
          <h1 className="text-3xl font-extrabold tracking-tight text-rose-600 flex items-center justify-center gap-2">
            <Heart className="h-7 w-7 fill-rose-500 text-rose-500 animate-pulse" />
            {couple.partner1_name} & {couple.partner2_name}
          </h1>
          <p className="mt-2 text-sm font-semibold text-gray-500">{couple.subtitle}</p>
        </div>

        {/* Relationship Counter */}
        {toggles.countdown !== false && (
          <RelationshipTimer startDateISO={couple.start_date} />
        )}

        {/* Spotify Integration & Dynamic Lyrics */}
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
        <NavigationGrid slug="demo" />

        {/* Romantic Map Widget */}
        {toggles.map !== false && (
          <RomanticMap coupleId="demo" />
        )}

        {/* Love Jar */}
        {toggles.love_jar !== false && (
          <LoveJar reasons={couple.love_reasons} />
        )}

        {/* Emergency Hug WhatsApp Button */}
        <EmergencyHug phone={couple.whatsapp_number} message={couple.whatsapp_message} />
      </div>

      {/* Floating Bottom Nav */}
      <BottomNav slug="demo" />

      {/* Marquee Ticker at very bottom */}
      <Ticker />
    </main>
  );
}
