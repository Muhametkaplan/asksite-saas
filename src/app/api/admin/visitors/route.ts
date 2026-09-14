import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/adminAuth';
import { getAdminFirestore } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = getAdminSessionFromRequest(req);
  if (!session.valid) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
  }

  try {
    const db = getAdminFirestore();
    const now = Date.now();
    const ONLINE_THRESHOLD_MS = 75 * 1000; // Son 75 saniye içinde heartbeat atanlar online

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTodayTs = startOfToday.getTime();

    // En son hareket gören 100 oturumu çek
    const snap = await db
      .collection('visitor_sessions')
      .orderBy('lastHeartbeat', 'desc')
      .limit(100)
      .get();

    const visitors: any[] = [];
    let onlineCount = 0;
    const onlineByPath: Record<string, number> = {};
    let todayCount = 0;

    snap.forEach((doc) => {
      const data = doc.data();
      const lastHeartbeat = data.lastHeartbeat || 0;
      const firstSeen = data.firstSeen || 0;
      const status = data.status || 'offline';

      const isOnline = now - lastHeartbeat <= ONLINE_THRESHOLD_MS && status !== 'offline';

      if (isOnline) {
        onlineCount++;
        const p = data.currentPath || '/';
        onlineByPath[p] = (onlineByPath[p] || 0) + 1;
      }

      if (firstSeen >= startOfTodayTs) {
        todayCount++;
      }

      visitors.push({
        id: doc.id,
        sessionId: data.sessionId,
        visitorId: data.visitorId,
        currentPath: data.currentPath || '/',
        pageHistory: Array.isArray(data.pageHistory) ? data.pageHistory : [],
        referrer: data.referrer || 'Doğrudan',
        device: data.device || 'desktop',
        browser: data.browser || 'Bilinmiyor',
        os: data.os || 'Bilinmiyor',
        ip: data.ip || 'Gizli',
        firstSeen: data.firstSeen,
        firstSeenIso: data.firstSeenIso,
        lastHeartbeat: data.lastHeartbeat,
        lastSeenIso: data.lastSeenIso,
        durationSeconds: Math.max(0, Math.round(((isOnline ? now : lastHeartbeat) - firstSeen) / 1000)),
        status: isOnline ? 'online' : 'offline',
        isOnline,
      });
    });

    return NextResponse.json({
      success: true,
      onlineCount,
      onlineByPath,
      todayCount,
      totalCount: visitors.length,
      visitors,
    });
  } catch (err: any) {
    console.error('[Admin Visitors Error]:', err);
    return NextResponse.json({ error: err.message || 'Hata oluştu' }, { status: 500 });
  }
}
