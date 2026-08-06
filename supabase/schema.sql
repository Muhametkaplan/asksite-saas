-- Supabase Schema for Couple SaaS Platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Couples Table (Kiracı / Çift Konfigürasyonu)
CREATE TABLE IF NOT EXISTS public.couples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    partner1_name TEXT NOT NULL,
    partner2_name TEXT NOT NULL,
    subtitle TEXT DEFAULT 'Bizim Dünyamız ❤️',
    start_date TIMESTAMPTZ NOT NULL,
    theme_color_primary TEXT DEFAULT '#ff4d6d',
    theme_color_tech TEXT DEFAULT '#6c5ce7',
    bg_music_url TEXT DEFAULT 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    custom_audio_url TEXT DEFAULT 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    spotify_url TEXT DEFAULT 'https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M',
    spotify_lyrics JSONB DEFAULT '[]'::jsonb,
    whatsapp_number TEXT DEFAULT '905524185530',
    whatsapp_message TEXT DEFAULT 'Acil sarılmana ihtiyacım var 🥺',
    love_reasons JSONB DEFAULT '[]'::jsonb,
    memories JSONB DEFAULT '[]'::jsonb,
    bucket_list JSONB DEFAULT '[]'::jsonb,
    upcoming_event JSONB DEFAULT '{}'::jsonb,
    feature_toggles JSONB DEFAULT '{"spotify": true, "memory": true, "bucket_list": true, "day_night": true, "countdown": true, "custom_audio": true}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index on slug for fast query performance
CREATE INDEX IF NOT EXISTS idx_couples_slug ON public.couples(slug);

-- 2. Map Markers Table (Romantik Harita Anı Noktaları)
CREATE TABLE IF NOT EXISTS public.map_markers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    title TEXT DEFAULT 'Bizim Aşk Noktamız ❤️',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_map_markers_couple_id ON public.map_markers(couple_id);

-- Row Level Security (RLS) policies
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_markers ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active couple pages
CREATE POLICY "Public couples are viewable by slug" 
ON public.couples FOR SELECT 
USING (is_active = true);

-- Allow public read & insert for map markers linked to active couples
CREATE POLICY "Map markers viewable by anyone" 
ON public.map_markers FOR SELECT 
USING (true);

CREATE POLICY "Map markers insertable by anyone" 
ON public.map_markers FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Map markers deletable by anyone" 
ON public.map_markers FOR DELETE 
USING (true);

-- Seed Initial Demo Couple (İrem & Muhammet)
INSERT INTO public.couples (
    slug, partner1_name, partner2_name, subtitle, start_date, 
    theme_color_primary, theme_color_tech, bg_music_url, 
    whatsapp_number, whatsapp_message, love_reasons
) VALUES (
    'irem-muhammet',
    'İrem',
    'Muhammet',
    'Bizim Dünyamız ❤️',
    '2023-01-01T00:00:00Z',
    '#ff4d6d',
    '#6c5ce7',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    '905524185530',
    'Acil sarılmana ihtiyacım var 🥺',
    '[
        "Gülüşünle en karanlık günlerimi bile aydınlatıyorsun.",
        "Bana her durumda güç veriyorsun ve hep arkamda duruyorsun.",
        "Seninleyken zamanın nasıl aktığını unutuyorum.",
        "Gözlerinin içi parlayarak güldüğün an dünyadaki her şey güzelleşiyor.",
        "Senin sesin, duyduğum en huzurlu ve en tatlı melodi.",
        "Beni tüm çocuksu hallerimle ve kusurlarımla kusursuz seviyorsun.",
        "Birlikte saçmalayabiliyor, en anlamsız şeylere dakikalarca gülebiliyoruz.",
        "Benim hayattaki en yakın arkadaşım, en sırdaşım ve tek aşkımsın.",
        "Varlığın ve kokun bana evdeymişim hissi veriyor, huzur buluyorum.",
        "Kötü bir gün geçirsem bile sana sarıldığım an her şeyi arkamda bırakabiliyorum."
    ]'::jsonb
) ON CONFLICT (slug) DO NOTHING;
