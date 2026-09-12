import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebaseAdmin';
import { sendSmsReminder } from '@/lib/notifications/sms';
import { sendWhatsAppReminder } from '@/lib/notifications/whatsapp';
import { sendWebPushToPartner } from '@/lib/notifications/push';
import { CoupleConfig } from '@/types/couple';

interface PendingReminder {
  slug: string;
  eventName: string;
  eventKey: string;
  daysRemaining: number;
  recipientRole: 'partner1' | 'partner2' | 'both';
  recipientName: string;
  recipientPhone?: string;
  siteUrl: string;
  message: string;
}

/**
 * Calculates days difference between current date and target event in the current or next year
 */
function getDaysUntilDate(targetMonth: number, targetDay: number, today: Date): number {
  const currentYear = today.getFullYear();
  let nextEventDate = new Date(currentYear, targetMonth - 1, targetDay);

  // Normalize hours to midnight for accurate day difference
  nextEventDate.setHours(0, 0, 0, 0);
  const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  let diffTime = nextEventDate.getTime() - normalizedToday.getTime();
  let diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  // If already passed this year, check next year
  if (diffDays < 0) {
    nextEventDate = new Date(currentYear + 1, targetMonth - 1, targetDay);
    diffTime = nextEventDate.getTime() - normalizedToday.getTime();
    diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  }

  return diffDays;
}

/**
 * Parses YYYY-MM-DD or ISO string into month (1-12) and day (1-31)
 */
function parseDateMonthDay(dateStr?: string): { month: number; day: number } | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return {
      month: d.getMonth() + 1,
      day: d.getDate(),
    };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  return handleReminders(req);
}

export async function POST(req: NextRequest) {
  return handleReminders(req);
}

async function handleReminders(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const specificSlug = searchParams.get('slug');
    const isTest = searchParams.get('test') === 'true';
    const force = searchParams.get('force') === 'true' || isTest;

    const adminDb = getAdminFirestore();
    const today = new Date();
    const currentYear = today.getFullYear();
    const results: any[] = [];

    // Fetch couples
    let couples: CoupleConfig[] = [];
    if (specificSlug) {
      const docSnap = await adminDb.collection('couples').doc(specificSlug).get();
      if (docSnap.exists) {
        couples.push({ ...docSnap.data(), slug: docSnap.id } as CoupleConfig);
      }
    } else {
      const snap = await adminDb.collection('couples').get();
      snap.forEach((doc) => {
        couples.push({ ...doc.data(), slug: doc.id } as CoupleConfig);
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.asksite.com.tr';

    for (const couple of couples) {
      const slug = couple.slug;
      const settings = couple.notification_settings || {};
      const targetLeadDays = settings.remind_days_before || 3;

      const p1Name = couple.partner1_name || 'Partner 1';
      const p2Name = couple.partner2_name || 'Partner 2';
      const p1Phone = couple.partner1_phone || couple.whatsapp_number;
      const p2Phone = couple.partner2_phone;
      const siteUrl = `${appUrl}/c/${slug}`;

      const pendingReminders: PendingReminder[] = [];

      // 1. Anniversary Check (start_date)
      const annivParts = parseDateMonthDay(couple.start_date);
      if (annivParts) {
        const daysToAnniv = isTest ? 3 : getDaysUntilDate(annivParts.month, annivParts.day, today);
        if (daysToAnniv === targetLeadDays || (isTest && daysToAnniv <= targetLeadDays)) {
          const msg = `Sürprizin hazır mı? 💖 Yıldönümünüze sadece ${daysToAnniv} gün kaldı! Sitenizdeki anı defterine yeni bir sayfa eklemeyi ve aşkını tazelemeyi unutma: ${siteUrl}`;
          // Remind Partner 1
          if (p1Phone) {
            pendingReminders.push({
              slug,
              eventName: 'Yıl Dönümü',
              eventKey: `anniv_${currentYear}_p1`,
              daysRemaining: daysToAnniv,
              recipientRole: 'partner1',
              recipientName: p1Name,
              recipientPhone: p1Phone,
              siteUrl,
              message: msg,
            });
          }
          // Remind Partner 2
          if (p2Phone) {
            pendingReminders.push({
              slug,
              eventName: 'Yıl Dönümü',
              eventKey: `anniv_${currentYear}_p2`,
              daysRemaining: daysToAnniv,
              recipientRole: 'partner2',
              recipientName: p2Name,
              recipientPhone: p2Phone,
              siteUrl,
              message: msg,
            });
          }
        }
      }

      // 2. Valentine's Day Check (February 14)
      const daysToValentines = isTest ? 3 : getDaysUntilDate(2, 14, today);
      if (daysToValentines === targetLeadDays) {
        const msg = `14 Şubat Sevgililer Günü'ne sadece ${daysToValentines} gün kaldı! 🌹 Sitenizdeki anı defterine unutulmaz bir aşk notu eklemeyi unutma: ${siteUrl}`;
        if (p1Phone) {
          pendingReminders.push({
            slug,
            eventName: 'Sevgililer Günü',
            eventKey: `valentines_${currentYear}_p1`,
            daysRemaining: daysToValentines,
            recipientRole: 'partner1',
            recipientName: p1Name,
            recipientPhone: p1Phone,
            siteUrl,
            message: msg,
          });
        }
        if (p2Phone) {
          pendingReminders.push({
            slug,
            eventName: 'Sevgililer Günü',
            eventKey: `valentines_${currentYear}_p2`,
            daysRemaining: daysToValentines,
            recipientRole: 'partner2',
            recipientName: p2Name,
            recipientPhone: p2Phone,
            siteUrl,
            message: msg,
          });
        }
      }

      // 3. Partner 1 Birthday -> Remind Partner 2!
      const p1BirthParts = parseDateMonthDay(couple.partner1_birthday);
      if (p1BirthParts) {
        const daysToP1Birth = isTest ? 3 : getDaysUntilDate(p1BirthParts.month, p1BirthParts.day, today);
        if (daysToP1Birth === targetLeadDays && p2Phone) {
          pendingReminders.push({
            slug,
            eventName: `${p1Name} Doğum Günü`,
            eventKey: `bday_p1_${currentYear}`,
            daysRemaining: daysToP1Birth,
            recipientRole: 'partner2',
            recipientName: p2Name,
            recipientPhone: p2Phone,
            siteUrl,
            message: `Sürprizin hazır mı? 🎂 ${p1Name}'nin doğum gününe sadece ${daysToP1Birth} gün kaldı! Sitenize yeni bir hediye kuponu veya anı ekleyerek şaşırt: ${siteUrl}`,
          });
        }
      }

      // 4. Partner 2 Birthday -> Remind Partner 1!
      const p2BirthParts = parseDateMonthDay(couple.partner2_birthday);
      if (p2BirthParts) {
        const daysToP2Birth = isTest ? 3 : getDaysUntilDate(p2BirthParts.month, p2BirthParts.day, today);
        if (daysToP2Birth === targetLeadDays && p1Phone) {
          pendingReminders.push({
            slug,
            eventName: `${p2Name} Doğum Günü`,
            eventKey: `bday_p2_${currentYear}`,
            daysRemaining: daysToP2Birth,
            recipientRole: 'partner1',
            recipientName: p1Name,
            recipientPhone: p1Phone,
            siteUrl,
            message: `Sürprizin hazır mı? 🎂 ${p2Name}'nin doğum gününe sadece ${daysToP2Birth} gün kaldı! Sitenize yeni bir hediye kuponu veya anı ekleyerek şaşırt: ${siteUrl}`,
          });
        }
      }

      // Process reminders for this couple
      for (const reminder of pendingReminders) {
        const logRef = adminDb
          .collection('couples')
          .doc(slug)
          .collection('reminder_logs')
          .doc(reminder.eventKey);

        if (!force) {
          const logSnap = await logRef.get();
          if (logSnap.exists) {
            // Already sent this year
            continue;
          }
        }

        const dispatchLog: any = {
          reminder,
          dispatchedAt: new Date().toISOString(),
          channels: {},
        };

        // Channel A: WhatsApp
        if (settings.whatsapp_reminders_enabled !== false && reminder.recipientPhone) {
          const waRes = await sendWhatsAppReminder({
            phone: reminder.recipientPhone,
            message: reminder.message,
          });
          dispatchLog.channels.whatsapp = waRes;
        }

        // Channel B: SMS
        if (settings.sms_reminders_enabled && reminder.recipientPhone) {
          const smsRes = await sendSmsReminder({
            phone: reminder.recipientPhone,
            message: reminder.message,
          });
          dispatchLog.channels.sms = smsRes;
        }

        // Channel C: Web Push
        if (settings.web_push_enabled !== false) {
          const pushRes = await sendWebPushToPartner({
            slug,
            targetRole: reminder.recipientRole,
            payload: {
              title: `${reminder.eventName} Yaklaşıyor! 💌`,
              body: reminder.message,
              url: `/c/${slug}/diary`,
              tag: reminder.eventKey,
            },
          });
          dispatchLog.channels.push = pushRes;
        }

        // Save log to avoid resending (clean all undefined values)
        try {
          const cleanLog = JSON.parse(JSON.stringify(dispatchLog));
          await logRef.set({
            ...cleanLog,
            status: 'sent',
            year: currentYear,
            timestamp: new Date().toISOString(),
          });
        } catch (logErr) {
          console.warn('[Cron/Reminders] Log write skipped:', logErr);
        }

        results.push(dispatchLog);
      }
    }

    return NextResponse.json({
      success: true,
      processedCouples: couples.length,
      sentRemindersCount: results.length,
      results,
    });
  } catch (error: any) {
    console.error('[API/cron/reminders] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Hatırlatıcılar işlenirken hata oluştu.' },
      { status: 500 }
    );
  }
}
