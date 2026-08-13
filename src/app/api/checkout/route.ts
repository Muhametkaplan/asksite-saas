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

function generateRandomInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ASK-${result}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { partner1_name, partner2_name, partner1_email, partner2_email, package_type, shipping_address, whatsapp_number, start_date, owner_uid, owner_email } = body;

    if (!partner1_name || !partner2_name) {
      return NextResponse.json({ error: 'Lütfen çift isimlerini eksiksiz girin.' }, { status: 400 });
    }

    const baseSlug = `${slugify(partner1_name)}-${slugify(partner2_name)}`;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const slug = `${baseSlug}-${randomSuffix}`;
    const pair_code = generateRandomInviteCode();

    const p1Email = (partner1_email || '').toLowerCase().trim();
    const p2Email = (partner2_email || '').toLowerCase().trim();
    const authorized_emails = Array.from(new Set([p1Email, p2Email, (owner_email || '').toLowerCase().trim()].filter(Boolean)));
    const ownerUid = owner_uid || null;
    const ownerEmail = (owner_email || p1Email || '').toLowerCase().trim();

    const newCouple = {
      slug,
      pair_code,
      inviteCode: pair_code,
      isUsed: false,
      pair_code_used: false,
      partner1_name,
      partner2_name,
      partner1_email: p1Email,
      partner2_email: p2Email,
      partner1_score: 0,
      partner2_score: 0,
      partner1_pin: '1234',
      partner2_pin: '5678',
      isPaid: true,
      is_active: true,
      owner_uid: ownerUid,
      owner_email: ownerEmail,
      partner1_uid: ownerUid,
      co_owners: ownerUid ? [ownerUid] : [],
      authorized_emails,
      allowed_users: {
        partner1_email: p1Email,
        partner2_email: p2Email,
        partner1_pin: '1234',
        partner2_pin: '5678',
      },
      subtitle: 'Bizim Dünyamız ❤️',
      start_date: start_date ? new Date(start_date).toISOString() : new Date().toISOString(),
      theme_color_primary: '#ff4d6d',
      theme_color_tech: '#6c5ce7',
      bg_music_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      custom_audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      spotify_url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX506F6QhE9q7',
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
      memories: [],
      diary_entries: [],
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

    return NextResponse.json(
      {
        success: true,
        slug,
        package_type,
        redirect_url: `/dashboard?slug=${slug}&new=true`
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: 'Ödeme işlemi sırasında bir hata oluştu.' }, { status: 500 });
  }
}
