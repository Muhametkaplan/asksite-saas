import { CoupleConfig, MapMarker } from '@/types/couple';
import { supabase, isSupabaseConfigured } from './supabase';

export const DEMO_COUPLE: CoupleConfig = {
  id: 'demo-uuid-irem-muhammet',
  slug: 'irem-muhammet',
  partner1_name: 'İrem',
  partner2_name: 'Muhammet',
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
    'Birlikte yazacağımız nice masallara ❤️',
    'Sensiz geçen her saniye eksik bir parça...',
  ],
  whatsapp_number: '905524185530',
  whatsapp_message: 'Acil sarılmana ihtiyacım var 🥺',
  love_reasons: [
    'Gülüşünle en karanlık günlerimi bile aydınlatıyorsun.',
    'Bana her durumda güç veriyorsun ve hep arkamda duruyorsun.',
    'Seninleyken zamanın nasıl aktığını unutuyorum.',
    'Gözlerinin içi parlayarak güldüğün an dünyadaki her şey güzelleşiyor.',
    'Senin sesin, duyduğum en huzurlu ve en tatlı melodi.',
    'Beni tüm çocuksu hallerimle ve kusurlarımla kusursuz seviyorsun.',
    'Birlikte saçmalayabiliyor, en anlamsız şeylere dakikalarca gülebiliyoruz.',
    'Benim hayattaki en yakın arkadaşım, en sırdaşım ve tek aşkımsın.',
    'Varlığın ve kokun bana evdeymişim hissi veriyor, huzur buluyorum.',
    'Kötü bir gün geçirsem bile sana sarıldığım an her şeyi arkamda bırakabiliyorum.',
    'Geleceğe dair kurduğum her hayalin başrolünde sen varsın.',
    'Küçük sürprizlerinle, bana kendimi dünyanın en şanslı insanı hissettiriyorsun.',
    'Ellerim ellerindeyken kendimi hiç olmadığım kadar güçlü ve cesur hissediyorum.',
    'Sadece sevgilim değil, ruh eşim olduğunu her gün bana hissettiriyorsun.',
    'Dünyadaki en güzel, en yumuşak ve en huzurlu sarılmalara sahipsin.'
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
    {
      id: 'm3',
      photo_url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=800&auto=format&fit=crop',
      date: '2024-02-14',
      title: 'Romantik Mum Işığı Akşamı 🍷',
      note: 'Ellerimiz hiç ayrılmadı, saatlerce geleceğimizi düşledik.',
    },
  ],
  bucket_list: [
    { id: 'b1', title: 'Roma & Venedik Gezisi 🇮🇹', category: 'city', completed: false },
    { id: 'b2', title: 'Kapadokya Balon Turu 🎈', category: 'activity', completed: true },
    { id: 'b3', title: 'Interstellar Sinema Gecesi 🍿', category: 'movie', completed: true },
    { id: 'b4', title: 'Paris’te Eyfel Altında Kahve ☕', category: 'city', completed: false },
    { id: 'b5', title: 'Kuzey Işıkları (Aurora) Kampı 🌌', category: 'activity', completed: false },
  ],
  upcoming_event: {
    title: 'Kapadokya Yıl Dönümü Kaçamağı 🎈',
    date: '2026-09-15T00:00:00.000Z',
    location: 'Kapadokya',
  },
  feature_toggles: {
    spotify: true,
    memory: true,
    bucket_list: true,
    day_night: true,
    countdown: true,
    custom_audio: true,
  },
};

const localCouplesMemoryStore = new Map<string, CoupleConfig>();
localCouplesMemoryStore.set('irem-muhammet', DEMO_COUPLE);

const parseJsonField = <T>(val: any, fallback: T): T => {
  if (!val) return fallback;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return fallback;
    }
  }
  return val;
};

export async function getCoupleBySlug(slug: string): Promise<CoupleConfig | null> {
  if (localCouplesMemoryStore.has(slug)) {
    return localCouplesMemoryStore.get(slug)!;
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('couples')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (data && !error) {
        return {
          ...data,
          love_reasons: parseJsonField(data.love_reasons, []),
          memories: parseJsonField(data.memories, DEMO_COUPLE.memories),
          bucket_list: parseJsonField(data.bucket_list, DEMO_COUPLE.bucket_list),
          upcoming_event: parseJsonField(data.upcoming_event, DEMO_COUPLE.upcoming_event),
          feature_toggles: parseJsonField(data.feature_toggles, DEMO_COUPLE.feature_toggles),
          spotify_lyrics: parseJsonField(data.spotify_lyrics, DEMO_COUPLE.spotify_lyrics),
        };
      }
    } catch (e) {
      console.error('Error fetching couple from Supabase:', e);
    }
  }

  return null;
}

export async function saveCoupleConfig(config: CoupleConfig): Promise<CoupleConfig | null> {
  localCouplesMemoryStore.set(config.slug, config);

  if (isSupabaseConfigured && supabase) {
    try {
      const payload = {
        slug: config.slug,
        partner1_name: config.partner1_name,
        partner2_name: config.partner2_name,
        subtitle: config.subtitle,
        start_date: config.start_date,
        theme_color_primary: config.theme_color_primary,
        theme_color_tech: config.theme_color_tech,
        bg_music_url: config.bg_music_url,
        custom_audio_url: config.custom_audio_url,
        spotify_url: config.spotify_url,
        spotify_lyrics: JSON.stringify(config.spotify_lyrics || []),
        whatsapp_number: config.whatsapp_number,
        whatsapp_message: config.whatsapp_message,
        love_reasons: JSON.stringify(config.love_reasons || []),
        memories: JSON.stringify(config.memories || []),
        bucket_list: JSON.stringify(config.bucket_list || []),
        upcoming_event: JSON.stringify(config.upcoming_event || null),
        feature_toggles: JSON.stringify(config.feature_toggles || {}),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('couples')
        .upsert(payload, { onConflict: 'slug' })
        .select()
        .single();

      if (data && !error) {
        return {
          ...data,
          love_reasons: parseJsonField(data.love_reasons, []),
          memories: parseJsonField(data.memories, config.memories),
          bucket_list: parseJsonField(data.bucket_list, config.bucket_list),
          upcoming_event: parseJsonField(data.upcoming_event, config.upcoming_event),
          feature_toggles: parseJsonField(data.feature_toggles, config.feature_toggles),
          spotify_lyrics: parseJsonField(data.spotify_lyrics, config.spotify_lyrics),
        };
      }
    } catch (e) {
      console.error('Error saving couple to Supabase:', e);
    }
  }

  return config;
}

export async function getMapMarkers(coupleId: string): Promise<MapMarker[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('map_markers')
        .select('*')
        .eq('couple_id', coupleId);

      if (data && !error) {
        return data;
      }
    } catch (e) {
      console.error('Error fetching map markers:', e);
    }
  }
  return [];
}

export async function addMapMarker(marker: Omit<MapMarker, 'id' | 'created_at'>): Promise<MapMarker | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('map_markers')
        .insert([marker])
        .select()
        .single();

      if (data && !error) {
        return data;
      }
    } catch (e) {
      console.error('Error inserting map marker:', e);
    }
  }
  return {
    id: `local-${Date.now()}`,
    ...marker,
    created_at: new Date().toISOString()
  };
}

export async function clearMapMarkers(coupleId: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('map_markers')
        .delete()
        .eq('couple_id', coupleId);

      return !error;
    } catch (e) {
      console.error('Error clearing map markers:', e);
      return false;
    }
  }
  return true;
}
