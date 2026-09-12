import webpush from 'web-push';
import { getAdminFirestore } from '@/lib/firebaseAdmin';
import { CoupleConfig, PushSubscriptionItem } from '@/types/couple';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BLQaVLaw9t1uqiGHRmq3ilMdZPo9J8B45CQciMjUenDL-Sf1rLV5TTcF2553mtsGTWWfmQ0GJ2UOxot0G_u2vI4';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'VHxoU9vkvnfsv0SUDVGdBnv6bgPiGx93ZCYNc6KOjiY';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@asksite.com.tr';

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (err) {
  console.error('[WebPush] setVapidDetails error:', err);
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
}

export interface SendPushResult {
  success: boolean;
  sentCount: number;
  errorCount: number;
  totalSubs: number;
  errors?: string[];
}

/**
 * Send web push notification to a couple's partner(s)
 */
export async function sendWebPushToPartner({
  slug,
  targetRole,
  payload,
}: {
  slug: string;
  targetRole: 'partner1' | 'partner2' | 'both';
  payload: PushNotificationPayload;
}): Promise<SendPushResult> {
  try {
    const adminDb = getAdminFirestore();
    const coupleDocRef = adminDb.collection('couples').doc(slug);
    const snap = await coupleDocRef.get();

    if (!snap.exists) {
      return { success: false, sentCount: 0, errorCount: 0, totalSubs: 0, errors: ['Couple not found'] };
    }

    const data = snap.data() as CoupleConfig;
    const subscriptions: PushSubscriptionItem[] = data.push_subscriptions || [];

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`[WebPush] No push subscriptions found for slug: ${slug}`);
      return { success: true, sentCount: 0, errorCount: 0, totalSubs: 0 };
    }

    // Filter by target role
    const filteredSubs = subscriptions.filter((sub) => {
      if (targetRole === 'both') return true;
      return sub.role === targetRole || sub.role === 'both';
    });

    if (filteredSubs.length === 0) {
      console.log(`[WebPush] No matching push subscriptions for targetRole '${targetRole}' in slug: ${slug}`);
      return { success: true, sentCount: 0, errorCount: 0, totalSubs: subscriptions.length };
    }

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/logo-icon.png',
      badge: payload.badge || '/favicon.ico',
      url: payload.url || `/c/${slug}`,
      tag: payload.tag || 'asksite-alert',
      data: {
        url: payload.url || `/c/${slug}`,
        ...payload.data,
      },
    });

    let sentCount = 0;
    let errorCount = 0;
    const deadEndpoints: string[] = [];
    const errors: string[] = [];

    await Promise.all(
      filteredSubs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.keys.p256dh,
                auth: sub.keys.auth,
              },
            },
            notificationPayload,
            {
              TTL: 60 * 60 * 24, // 24 hours
            }
          );
          sentCount++;
        } catch (err: any) {
          errorCount++;
          const statusCode = err?.statusCode;
          errors.push(err?.message || 'Push error');
          console.warn(`[WebPush] Failed sending push to endpoint: ${statusCode}`, err?.message);

          // 410 Gone or 404 Not Found means subscription has expired or unregistered
          if (statusCode === 404 || statusCode === 410) {
            deadEndpoints.push(sub.endpoint);
          }
        }
      })
    );

    // Clean up expired subscriptions if any
    if (deadEndpoints.length > 0) {
      const remainingSubs = subscriptions.filter((s) => !deadEndpoints.includes(s.endpoint));
      await coupleDocRef.update({
        push_subscriptions: remainingSubs,
      }).catch((e) => console.error('[WebPush] Error cleaning up dead subscriptions:', e));
    }

    return {
      success: sentCount > 0 || errorCount === 0,
      sentCount,
      errorCount,
      totalSubs: subscriptions.length,
      errors: errors.length > 0 ? errors : [],
    };
  } catch (error: any) {
    console.error('[WebPush] Error in sendWebPushToPartner:', error);
    return {
      success: false,
      sentCount: 0,
      errorCount: 1,
      totalSubs: 0,
      errors: [error?.message || 'Internal push error'],
    };
  }
}
