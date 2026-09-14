import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebaseAdmin';

function parseUserAgent(ua: string) {
  let device: 'mobile' | 'desktop' | 'tablet' = 'desktop';
  if (/ipad|tablet/i.test(ua)) device = 'tablet';
  else if (/mobile|iphone|android/i.test(ua)) device = 'mobile';

  let browser = 'Diğer';
  if (/edg/i.test(ua)) browser = 'Edge';
  else if (/chrome|crios/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/opera|opr/i.test(ua)) browser = 'Opera';

  let os = 'Diğer';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  return { device, browser, os };
}

function maskIp(ipStr: string | null): string {
  if (!ipStr) return 'Bilinmiyor';
  const clean = ipStr.split(',')[0].trim();
  if (clean.includes('.')) {
    const parts = clean.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.*.*`;
    }
  }
  return clean.slice(0, 8) + '...';
}

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      body = await req.json();
    } else {
      const text = await req.text();
      try {
        body = JSON.parse(text);
      } catch {
        body = {};
      }
    }

    const { visitorId, sessionId, path, referrer, action } = body;

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'sessionId zorunludur' }, { status: 400 });
    }

    // Ignore admin traffic
    if (path && (path.startsWith('/admin') || path.startsWith('/api/admin'))) {
      return NextResponse.json({ ignored: true });
    }

    const db = getAdminFirestore();
    const docRef = db.collection('visitor_sessions').doc(sessionId);
    const now = Date.now();
    const nowIso = new Date().toISOString();

    const docSnap = await docRef.get();

    if (action === 'leave') {
      if (docSnap.exists) {
        const data = docSnap.data() || {};
        const firstSeen = data.firstSeen || now;
        await docRef.update({
          status: 'offline',
          lastHeartbeat: now,
          lastSeenIso: nowIso,
          durationSeconds: Math.max(0, Math.round((now - firstSeen) / 1000)),
        });
      }
      return NextResponse.json({ success: true, action: 'left' });
    }

    const ua = req.headers.get('user-agent') || '';
    const rawIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
    const { device, browser, os } = parseUserAgent(ua);
    const masked = maskIp(rawIp);

    const cleanPath = typeof path === 'string' && path ? path : '/';
    const cleanRef = typeof referrer === 'string' && referrer ? referrer : 'Doğrudan';

    if (!docSnap.exists) {
      const newSession = {
        sessionId,
        visitorId: visitorId || sessionId,
        currentPath: cleanPath,
        pageHistory: [{ path: cleanPath, timestamp: nowIso }],
        referrer: cleanRef,
        device,
        browser,
        os,
        ip: masked,
        firstSeen: now,
        firstSeenIso: nowIso,
        lastHeartbeat: now,
        lastSeenIso: nowIso,
        durationSeconds: 0,
        status: 'online',
      };
      await docRef.set(newSession);
    } else {
      const existing = docSnap.data() || {};
      const firstSeen = existing.firstSeen || now;
      const history = Array.isArray(existing.pageHistory) ? existing.pageHistory : [];

      const updates: any = {
        lastHeartbeat: now,
        lastSeenIso: nowIso,
        status: 'online',
        durationSeconds: Math.max(0, Math.round((now - firstSeen) / 1000)),
      };

      if (existing.currentPath !== cleanPath) {
        updates.currentPath = cleanPath;
        const newHistory = [...history, { path: cleanPath, timestamp: nowIso }].slice(-15);
        updates.pageHistory = newHistory;
      }

      await docRef.update(updates);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Visitor Heartbeat Error]:', err);
    return NextResponse.json({ error: err.message || 'Hata' }, { status: 500 });
  }
}
