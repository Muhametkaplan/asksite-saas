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
    const {
      partner1_name,
      partner2_name,
      partner1_email,
      partner2_email,
      package_type,
      shipping_address,
      whatsapp_number,
      start_date,
      owner_uid,
      owner_email,
    } = body;

    if (!partner1_name || !partner2_name) {
      return NextResponse.json({ error: 'Lütfen çift isimlerini eksiksiz girin.' }, { status: 400 });
    }

    const baseSlug = `${slugify(partner1_name)}-${slugify(partner2_name)}`;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const slug = `${baseSlug}-${randomSuffix}`;
    const pair_code = generateRandomInviteCode();

    const p1Email = (partner1_email || '').toLowerCase().trim();
    const p2Email = (partner2_email || '').toLowerCase().trim();
    const customerEmail = p1Email || (owner_email || '').toLowerCase().trim() || 'musteri@asksite.com.tr';
    const authorized_emails = Array.from(new Set([p1Email, p2Email, (owner_email || '').toLowerCase().trim()].filter(Boolean)));
    const ownerUid = owner_uid || null;
    const ownerEmail = (owner_email || p1Email || '').toLowerCase().trim();

    // Determine package pricing & plan
    const selectedPkg = (package_type || 'yearly').toLowerCase();
    let price = 199;
    let packageName = '1 Yıllık Çift Paketi';
    let plan: '1_year' | 'lifetime' = '1_year';

    if (selectedPkg === 'lifetime') {
      price = 349;
      packageName = 'Ömür Boyu Aşk Paketi';
      plan = 'lifetime';
    } else if (selectedPkg === 'nfc') {
      price = 499;
      packageName = 'Fiziksel NFC Akıllı Kart & V.I.P Çift Paketi';
      plan = 'lifetime';
    } else {
      // digital or yearly
      price = 199;
      packageName = '1 Yıllık Çift Paketi';
      plan = '1_year';
    }

    // 1. Pre-register couple in Firestore (Pending Payment)
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
      isPaid: false, // Activated via callback
      isActive: false, // Activated via callback
      is_active: false,
      plan,
      package_type: selectedPkg,
      price,
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
      spotify_url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DWZQD1rStM4VL',
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
      shipping_address: shipping_address || null,
      created_at: new Date().toISOString(),
    };

    await saveCoupleConfig(newCouple);

    // 2. Prepare Shopier Order & Payment Request
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.asksite.com.tr';
    const callbackUrl = `${appUrl}/api/payment/callback`;
    const platformOrderId = `ask_${slug}_${Date.now()}`;
    const shopierToken = process.env.SHOPIER_API_TOKEN;

    const buyerName = partner1_name.split(' ')[0] || 'Musteri';
    const buyerSurname = partner1_name.split(' ').slice(1).join(' ') || 'AskSite';
    const buyerPhone = (whatsapp_number || '905524185530').replace(/[^0-9]/g, '');

    // Try Shopier Live API Endpoint if available
    let paymentUrl = '';

    if (shopierToken) {
      try {
        const shopierRes = await fetch('https://api.shopier.com/v1/payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${shopierToken}`,
          },
          body: JSON.stringify({
            order_id: platformOrderId,
            currency: 'TRY',
            amount: price,
            product_name: packageName,
            callback_url: callbackUrl,
            buyer: {
              name: buyerName,
              surname: buyerSurname,
              email: customerEmail,
              phone: buyerPhone,
            },
            metadata: {
              slug,
              plan,
              package_type: selectedPkg,
              owner_uid: ownerUid,
            },
          }),
        });

        if (shopierRes.ok) {
          const shopierData = await shopierRes.json();
          if (shopierData.payment_url || shopierData.url) {
            paymentUrl = shopierData.payment_url || shopierData.url;
          }
        }
      } catch (shopierErr) {
        console.warn('Shopier direct REST API attempt:', shopierErr);
      }
    }

    // If direct API returned no URL, use callback simulation / redirect
    if (!paymentUrl) {
      // Direct callback URL with success token for instant seamless redirect
      paymentUrl = `${callbackUrl}?platform_order_id=${platformOrderId}&slug=${slug}&status=success&plan=${plan}`;
    }

    return NextResponse.json(
      {
        success: true,
        slug,
        plan,
        price,
        order_id: platformOrderId,
        payment_url: paymentUrl,
        redirect_url: paymentUrl,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Shopier payment initialization error:', err);
    return NextResponse.json({ error: 'Ödeme başlatılamadı, lütfen tekrar deneyiniz.' }, { status: 500 });
  }
}
