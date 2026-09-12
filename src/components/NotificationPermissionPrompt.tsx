'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Check, X, Sparkles, Heart } from 'lucide-react';

interface NotificationPermissionPromptProps {
  slug: string;
  partnerRole?: 'partner1' | 'partner2';
  partnerName?: string;
  otherPartnerName?: string;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function NotificationPermissionPrompt({
  slug,
  partnerRole,
  partnerName,
  otherPartnerName,
}: NotificationPermissionPromptProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [showPrompt, setShowPrompt] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribedSuccess, setSubscribedSuccess] = useState(false);

  const VAPID_KEY =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    'BLQaVLaw9t1uqiGHRmq3ilMdZPo9J8B45CQciMjUenDL-Sf1rLV5TTcF2553mtsGTWWfmQ0GJ2UOxot0G_u2vI4';

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);

    if (supported) {
      setPermissionState(Notification.permission);

      // If user hasn't made a choice or already dismissed today
      const dismissed = localStorage.getItem(`asksite_push_dismissed_${slug}`);
      if (Notification.permission === 'default' && !dismissed) {
        // Show after a gentle 3-second delay
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [slug]);

  const handleSubscribe = async () => {
    if (!isSupported) return;

    setIsSubscribing(true);
    try {
      // 1. Request permission
      const perm = await Notification.requestPermission();
      setPermissionState(perm);

      if (perm !== 'granted') {
        setShowPrompt(false);
        setIsSubscribing(false);
        return;
      }

      // 2. Register Service Worker
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // 3. Subscribe to push manager
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
        });
      }

      // 4. Determine role (partner1 or partner2)
      let resolvedRole = partnerRole;
      if (!resolvedRole) {
        try {
          const authData = sessionStorage.getItem(`asksite_auth_${slug}`);
          if (authData) {
            const parsed = JSON.parse(authData);
            if (parsed.role === 'partner1' || parsed.role === 'partner2') {
              resolvedRole = parsed.role;
            }
          }
        } catch {
          // ignore
        }
      }

      // 5. Send subscription to API
      const subJson = sub.toJSON();
      const res = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          subscription: {
            endpoint: sub.endpoint,
            keys: {
              p256dh: subJson.keys?.p256dh,
              auth: subJson.keys?.auth,
            },
          },
          role: resolvedRole || 'partner1',
          userAgent: navigator.userAgent,
        }),
      });

      if (res.ok) {
        setSubscribedSuccess(true);
        setTimeout(() => {
          setShowPrompt(false);
        }, 3000);
      }
    } catch (err) {
      console.error('[WebPush] Subscription error:', err);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(`asksite_push_dismissed_${slug}`, 'true');
  };

  if (!isSupported) return null;

  // Render floating prompt banner
  if (showPrompt) {
    return (
      <div className="fixed bottom-6 right-6 z-50 max-w-sm w-[92vw] sm:w-[380px] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-rose-200 dark:border-rose-900/40 rounded-2xl shadow-2xl p-4.5 animate-in fade-in slide-in-from-bottom-5 duration-300">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/25">
            <Bell className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0 pr-1">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              Anlık Bildirimler
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
              {otherPartnerName
                ? `${otherPartnerName} anı eklediğinde veya oyun rekorunu kırdığında anında telefonuna bildirim gelsin!`
                : 'Sevgilin yeni anı eklediğinde veya oyun rekorunu kırdığında anında bildirim al!'}
            </p>

            {subscribedSuccess ? (
              <div className="mt-3 py-1.5 px-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-lg text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Bildirimler açıldı! ❤️
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-3.5">
                <button
                  type="button"
                  onClick={handleSubscribe}
                  disabled={isSubscribing}
                  className="flex-1 py-2 px-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs font-bold rounded-xl shadow-sm transition active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Heart className="w-3.5 h-3.5 fill-current" />
                  {isSubscribing ? 'Açılıyor...' : 'Bildirimleri Aç'}
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="py-2 px-3 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
                >
                  Şimdilik Değil
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // If permission is default and user dismissed before, show a discreet bell icon to re-open anytime
  if (permissionState === 'default') {
    return (
      <button
        type="button"
        onClick={() => setShowPrompt(true)}
        title="Anlık Bildirimleri Aç"
        className="fixed bottom-6 left-6 z-40 w-11 h-11 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-rose-200 dark:border-rose-900/40 text-rose-500 hover:scale-105 transition shadow-lg flex items-center justify-center group"
      >
        <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
      </button>
    );
  }

  return null;
}
