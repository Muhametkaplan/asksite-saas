import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebaseAdmin';
import { PushSubscriptionItem, CoupleConfig } from '@/types/couple';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, subscription, role = 'partner1', action = 'subscribe', userAgent } = body;

    if (!slug || !subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json(
        { error: 'Eksik veya hatalı abonelik verisi.' },
        { status: 400 }
      );
    }

    const adminDb = getAdminFirestore();
    const coupleDocRef = adminDb.collection('couples').doc(slug);
    const snap = await coupleDocRef.get();

    if (!snap.exists) {
      return NextResponse.json({ error: 'Çift sitesi bulunamadı.' }, { status: 404 });
    }

    const coupleData = snap.data() as CoupleConfig;
    const existingSubs: PushSubscriptionItem[] = coupleData.push_subscriptions || [];

    if (action === 'unsubscribe') {
      const updatedSubs = existingSubs.filter((s) => s.endpoint !== subscription.endpoint);
      await coupleDocRef.update({
        push_subscriptions: updatedSubs,
      });

      return NextResponse.json({
        success: true,
        message: 'Bildirim aboneliği başarıyla kaldırıldı.',
        count: updatedSubs.length,
      });
    }

    // Upsert subscription
    const existingIndex = existingSubs.findIndex((s) => s.endpoint === subscription.endpoint);
    const newSubItem: PushSubscriptionItem = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      role: role as 'partner1' | 'partner2' | 'both',
      userAgent: userAgent || 'Unknown Browser',
      created_at: new Date().toISOString(),
    };

    let updatedSubs: PushSubscriptionItem[];
    if (existingIndex >= 0) {
      updatedSubs = [...existingSubs];
      updatedSubs[existingIndex] = newSubItem;
    } else {
      updatedSubs = [...existingSubs, newSubItem];
    }

    await coupleDocRef.update({
      push_subscriptions: updatedSubs,
      'notification_settings.web_push_enabled': true,
    });

    return NextResponse.json({
      success: true,
      message: 'Bildirim aboneliği başarıyla kaydedildi.',
      count: updatedSubs.length,
    });
  } catch (error: any) {
    console.error('[API/notifications/subscribe] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Abonelik kaydedilemedi.' },
      { status: 500 }
    );
  }
}
