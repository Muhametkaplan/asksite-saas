'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function getOrSetStorage(storage: Storage, key: string, prefix: string): string {
  try {
    let val = storage.getItem(key);
    if (!val) {
      val = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      storage.setItem(key, val);
    }
    return val;
  } catch {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}

export default function VisitorPresenceTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Admin sayfalarını takip etme (istatistikleri kirletmesin)
    if (pathname && (pathname.startsWith('/admin') || pathname.startsWith('/api/admin'))) {
      return;
    }

    const visitorId = getOrSetStorage(localStorage, 'asksite_vis_id', 'vis');
    const sessionId = getOrSetStorage(sessionStorage, 'asksite_sess_id', 'sess');
    const currentUrl = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');

    const sendSignal = (action: 'heartbeat' | 'leave' = 'heartbeat') => {
      const payload = JSON.stringify({
        visitorId,
        sessionId,
        path: currentUrl,
        referrer: document.referrer || 'Doğrudan',
        action,
      });

      if (action === 'leave') {
        if (typeof navigator.sendBeacon === 'function') {
          const blob = new Blob([payload], { type: 'application/json' });
          navigator.sendBeacon('/api/analytics/heartbeat', blob);
          return;
        }
      }

      fetch('/api/analytics/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    };

    // İlk giriş sinyali
    sendSignal('heartbeat');

    // 25 saniyede bir nabız (heartbeat)
    if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    heartbeatIntervalRef.current = setInterval(() => {
      sendSignal('heartbeat');
    }, 25000);

    const handleBeforeUnload = () => {
      sendSignal('leave');
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendSignal('leave');
      } else if (document.visibilityState === 'visible') {
        sendSignal('heartbeat');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pathname, searchParams]);

  return null;
}
