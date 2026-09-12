import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebaseAdmin';
import { sendWebPushToPartner, PushNotificationPayload } from '@/lib/notifications/push';
import { CoupleConfig } from '@/types/couple';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      slug,
      trigger = 'custom',
      senderRole,
      senderName,
      extraData = {},
      customPayload,
      targetRole: explicitTargetRole,
    } = body;

    if (!slug) {
      return NextResponse.json({ error: 'Slug parametresi zorunludur.' }, { status: 400 });
    }

    const adminDb = getAdminFirestore();
    const coupleDoc = await adminDb.collection('couples').doc(slug).get();

    if (!coupleDoc.exists) {
      return NextResponse.json({ error: 'Çift sitesi bulunamadı.' }, { status: 404 });
    }

    const coupleData = coupleDoc.data() as CoupleConfig;
    const settings = coupleData.notification_settings || {};

    // Check if web push is disabled in settings
    if (settings.web_push_enabled === false && trigger !== 'test') {
      return NextResponse.json({
        success: false,
        message: 'Bu site için anlık bildirimler devre dışı bırakılmış.',
      });
    }

    // Determine target role: opposite partner
    let targetRole: 'partner1' | 'partner2' | 'both' = explicitTargetRole || 'both';
    if (!explicitTargetRole && senderRole) {
      targetRole = senderRole === 'partner1' ? 'partner2' : 'partner1';
    }

    const p1Name = coupleData.partner1_name || 'Partner 1';
    const p2Name = coupleData.partner2_name || 'Partner 2';
    const effectiveSenderName =
      senderName || (senderRole === 'partner1' ? p1Name : senderRole === 'partner2' ? p2Name : 'Partnerin');

    let payload: PushNotificationPayload;

    if (trigger === 'game_record') {
      if (settings.game_record_push === false) {
        return NextResponse.json({ success: false, message: 'Oyun rekoru bildirimleri kapalı.' });
      }

      const gameName = extraData.gameName || 'Flappy Bird';
      const score = extraData.score;
      const scoreText = score !== undefined ? ` (${score} puan)` : '';

      payload = {
        title: 'Yeni Rekor Kırıldı! 🏆',
        body: `${effectiveSenderName} senin ${gameName} rekorunu kırdı!${scoreText} 🚀 Hadi gel rekorunu geri al!`,
        url: `/c/${slug}/arcade`,
        icon: '/logo-icon.png',
        tag: 'game-record',
      };
    } else if (trigger === 'diary_entry') {
      if (settings.diary_entry_push === false) {
        return NextResponse.json({ success: false, message: 'Anı defteri bildirimleri kapalı.' });
      }

      const notePreview = extraData.content
        ? ` "${extraData.content.slice(0, 45)}..."`
        : '';

      payload = {
        title: 'Anı Defterine Yeni Sayfa! 📖',
        body: `${effectiveSenderName} anı defterinize yeni bir sayfa ekledi!${notePreview} Hemen okumak için tıkla ✨`,
        url: `/c/${slug}/diary`,
        icon: '/logo-icon.png',
        tag: 'diary-entry',
      };
    } else if (trigger === 'memory_photo') {
      payload = {
        title: 'Yeni Fotoğraf Eklendi! 📸',
        body: `${effectiveSenderName} aşk albümünüze yeni bir fotoğraf ekledi. Gel ve ilk sen gör! 💖`,
        url: `/c/${slug}/memory`,
        icon: '/logo-icon.png',
        tag: 'memory-photo',
      };
    } else if (customPayload) {
      payload = {
        title: customPayload.title || 'Aşk Dünyamız ❤️',
        body: customPayload.body || 'Sana özel bir mesaj var!',
        url: customPayload.url || `/c/${slug}`,
        icon: customPayload.icon || '/logo-icon.png',
        tag: customPayload.tag || 'asksite-custom',
      };
    } else {
      payload = {
        title: 'Aşk Dünyamız Bildirimi ❤️',
        body: `${effectiveSenderName} seninle etkileşime geçti! ✨`,
        url: `/c/${slug}`,
        icon: '/logo-icon.png',
        tag: 'asksite-default',
      };
    }

    const result = await sendWebPushToPartner({
      slug,
      targetRole,
      payload,
    });

    return NextResponse.json({
      success: result.success,
      sentCount: result.sentCount,
      errorCount: result.errorCount,
      totalSubs: result.totalSubs,
      targetRole,
      payload,
      errors: result.errors,
    });
  } catch (error: any) {
    console.error('[API/notifications/send-push] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Bildirim gönderilirken hata oluştu.' },
      { status: 500 }
    );
  }
}
