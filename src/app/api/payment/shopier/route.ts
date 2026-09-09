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

function sanitizePhone(rawPhone: string | null | undefined): string {
  if (!rawPhone) return '05524185530';
  // Strip all non-digit characters
  let digits = rawPhone.replace(/\D/g, '');
  if (!digits || digits.length < 7) {
    return '05524185530';
  }
  // If starts with 90 and 12 digits, convert to 05xx or 5xx
  if (digits.startsWith('90') && digits.length === 12) {
    digits = '0' + digits.substring(2);
  } else if (!digits.startsWith('0') && digits.length === 10) {
    digits = '0' + digits;
  }
  return digits;
}

function sanitizeNameAndSurname(fullName: string, fallbackName = 'Musteri', fallbackSurname = 'Kullanici') {
  const trimmed = (fullName || '').trim().replace(/\s+/g, ' ');
  if (!trimmed) {
    return { name: fallbackName, surname: fallbackSurname };
  }
  const parts = trimmed.split(' ');
  if (parts.length === 1) {
    return {
      name: parts[0] || fallbackName,
      surname: fallbackSurname,
    };
  }
  const surname = parts.pop() || fallbackSurname;
  const name = parts.join(' ') || fallbackName;
  return { name, surname };
}

function sanitizeEmail(email: string | null | undefined): string {
  const clean = (email || '').trim().toLowerCase();
  if (clean && clean.includes('@') && clean.includes('.')) {
    return clean;
  }
  return 'destek@asksite.com.tr';
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
      return NextResponse.json({ success: false, error: 'Lütfen çift isimlerini eksiksiz girin.' }, { status: 400 });
    }

    const baseSlug = `${slugify(partner1_name)}-${slugify(partner2_name)}`;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const slug = `${baseSlug}-${randomSuffix}`;
    const pair_code = generateRandomInviteCode();

    const p1Email = sanitizeEmail(partner1_email);
    const p2Email = partner2_email ? sanitizeEmail(partner2_email) : '';
    const customerEmail = p1Email || sanitizeEmail(owner_email);
    const authorized_emails = Array.from(new Set([p1Email, p2Email, sanitizeEmail(owner_email)].filter(Boolean)));
    const ownerUid = owner_uid || null;
    const ownerEmail = sanitizeEmail(owner_email || p1Email);

    // Determine package pricing & plan
    const selectedPkg = (package_type || 'yearly').toLowerCase();
    let price = 199;
    let packageName = 'AskSite 1 Yillik Cift Paketi';
    let plan: '1_year' | 'lifetime' = '1_year';

    if (selectedPkg === 'lifetime') {
      price = 349;
      packageName = 'AskSite Omur Boyu Ask Paketi';
      plan = 'lifetime';
    } else if (selectedPkg === 'nfc') {
      price = 499;
      packageName = 'AskSite NFC Akilli Kart VIP Paketi';
      plan = 'lifetime';
    } else {
      price = 199;
      packageName = 'AskSite 1 Yillik Cift Paketi';
      plan = '1_year';
    }

    // 1. Pre-register couple in Firestore (STRICTLY PENDING PAYMENT: isActive = false, isPaid = false)
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
      isPaid: false, // STRICT: Only activated via verified Shopier webhook
      isActive: false, // STRICT: Only activated via verified Shopier webhook
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
      whatsapp_number: sanitizePhone(whatsapp_number),
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

    // 2. Map directly to the live verified Shopier product URLs
    let paymentUrl = '';
    let shopierProductId = '50201181';

    if (selectedPkg === 'lifetime') {
      paymentUrl = process.env.SHOPIER_PRODUCT_URL_LIFETIME || 'https://www.shopier.com/50201191';
      shopierProductId = '50201191';
    } else if (selectedPkg === 'nfc') {
      paymentUrl = process.env.SHOPIER_PRODUCT_URL_NFC || 'https://www.shopier.com/50201195';
      shopierProductId = '50201195';
    } else {
      paymentUrl = process.env.SHOPIER_PRODUCT_URL_YEARLY || 'https://www.shopier.com/50201181';
      shopierProductId = '50201181';
    }

    const cleanOrderId = `ASK${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`;

    // If owner UID exists, associate pending couple slug with the user in Firestore
    if (ownerUid) {
      try {
        const { db } = await import('@/lib/firebase');
        const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
        if (db) {
          await setDoc(
            doc(db, 'users', ownerUid),
            {
              pendingCoupleSlug: slug,
              pendingPackageType: selectedPkg,
              pendingOrderId: cleanOrderId,
              shopierProductId,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
      } catch (e) {
        console.error('Error saving pending couple to user in Firestore:', e);
      }
    }

    console.log(`[Shopier Checkout Initiated] slug=${slug}, pkg=${selectedPkg}, url=${paymentUrl}`);

    // Return strictly { success: true, paymentUrl, slug }
    return NextResponse.json(
      {
        success: true,
        paymentUrl,
        slug,
        orderId: cleanOrderId,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Shopier payment initialization error:', err);
    return NextResponse.json({ success: false, error: 'Ödeme başlatılamadı, lütfen tekrar deneyiniz.' }, { status: 500 });
  }
}
