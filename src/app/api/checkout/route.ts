import { NextRequest, NextResponse } from 'next/server';
import { saveCoupleConfig } from '@/lib/couples';

function slugify(text: string): string {
  const trMap: { [key: string]: string } = {
    ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g', ı: 'i', İ: 'i',
    ö: 'o', Ö: 'o', ş: 's', Ş: 's', ü: 'u', Ü: 'u'
  };
  return text
    .split('')
    .map((char) => trMap[char] || char)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { partner1_name, partner2_name, package_type, shipping_address, whatsapp_number, start_date } = body;

    if (!partner1_name || !partner2_name) {
      return NextResponse.json({ error: 'Lütfen çift isimlerini eksiksiz girin.' }, { status: 400 });
    }

    const baseSlug = `${slugify(partner1_name)}-${slugify(partner2_name)}`;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const slug = `${baseSlug}-${randomSuffix}`;

    const newCouple = {
      slug,
      partner1_name,
      partner2_name,
      subtitle: 'Bizim Dünyamız ❤️',
      start_date: start_date ? new Date(start_date).toISOString() : new Date().toISOString(),
      theme_color_primary: '#ff4d6d',
      theme_color_tech: '#6c5ce7',
      bg_music_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      custom_audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      spotify_url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M',
      spotify_lyrics: [
        'Sen benim kalbimin en tatlı melodisisin... 🎶',
        'Gözlerine baktığım an zaman duruyor...',
        'Birlikte yazacağımız nice masallara ❤️',
      ],
      whatsapp_number: whatsapp_number || '905524185530',
      whatsapp_message: 'Acil sarılmana ihtiyacım var 🥺',
      love_reasons: [
        'Gülüşünle en karanlık günlerimi bile aydınlatıyorsun.',
        'Bana her durumda güç veriyorsun ve hep arkamda duruyorsun.',
        'Seninleyken zamanın nasıl aktığını unutuyorum.',
        'Gözlerinin içi parlayarak güldüğün an dünyadaki her şey güzelleşiyor.',
        'Senin sesin, duyduğum en huzurlu ve en tatlı melodi.'
      ],
      memories: [
        {
          id: `m-${Date.now()}-1`,
          photo_url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=800&auto=format&fit=crop',
          date: start_date ? new Date(start_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          title: 'İlk Karşılaşmamız ✨',
          note: 'Gözlerinin içine ilk baktığım an dünyadaki tüm sesler sustu.',
        },
      ],
      bucket_list: [
        { id: `b-${Date.now()}-1`, title: 'Roma & Venedik Gezisi 🇮🇹', category: 'city' as const, completed: false },
        { id: `b-${Date.now()}-2`, title: 'Kapadokya Balon Turu 🎈', category: 'activity' as const, completed: false },
        { id: `b-${Date.now()}-3`, title: 'Romantik Sinema Gecesi 🍿', category: 'movie' as const, completed: true },
      ],
      upcoming_event: {
        title: `${partner1_name} & ${partner2_name} Yıldönümü Kaçamağı 🎈`,
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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

    await saveCoupleConfig(newCouple);

    return NextResponse.json({
      success: true,
      slug,
      package_type,
      redirect_url: `/dashboard?slug=${slug}&new=true`
    });
  } catch (err: any) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: 'Ödeme işlemi sırasında bir hata oluştu.' }, { status: 500 });
  }
}
