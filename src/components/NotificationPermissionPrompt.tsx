'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Check, X, Sparkles, Heart, Smartphone, RefreshCw, Send } from 'lucide-react';

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
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribedSuccess, setSubscribedSuccess] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSentSuccess, setTestSentSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const VAPID_KEY =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    'BLQaVLaw9t1uqiGHRmq3ilMdZPo9J8B45CQciMjUenDL-Sf1rLV5TTcF2553mtsGTWWfmQ0GJ2UOxot0G_u2vI4';

  const getResolvedRole = useCallback((): 'partner1' | 'partner2' => {
    if (partnerRole) return partnerRole;
    try {
      const authData =
        sessionStorage.getItem(`asksite_auth_${slug}`) ||
        localStorage.getItem(`asksite_auth_${slug}`);
      if (authData) {
        const parsed = JSON.parse(authData);
        if (parsed.role === 'partner1' || parsed.role === 'partner2') {
          return parsed.role;
        }
      }
    } catch {}
    return 'partner1';
  }, [partnerRole, slug]);

  const syncSubscriptionToBackend = useCallback(
    async (sub: PushSubscription) => {
      try {
        const subJson = sub.toJSON();
        const role = getResolvedRole();

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
            role,
            userAgent: navigator.userAgent,
          }),
        });

        if (res.ok) {
          localStorage.setItem(`asksite_push_synced_${slug}`, 'true');
          setSubscribedSuccess(true);
        }
      } catch (err: any) {
        console.error('[WebPush] Error syncing to backend:', err);
      }
    },
    [getResolvedRole, slug]
  );

  const handleSubscribe = async () => {
    if (!isSupported) return;

    setIsSubscribing(true);
    setErrorMessage(null);
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

      // 4. Send subscription to API
      await syncSubscriptionToBackend(sub);
      setSubscribedSuccess(true);
      setTimeout(() => {
        setShowPrompt(false);
      }, 2500);
    } catch (err: any) {
      console.error('[WebPush] Subscription error:', err);
      setErrorMessage(
        err?.message ||
          'Bildirim aboneliği başlatılamadı. iPhone kullanıyorsanız siteyi Ana Ekrana Ekleyerek açmayı deneyin.'
      );
    } finally {
      setIsSubscribing(false);
    }
  };

  // Auto-sync if permission is already granted in the browser
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const supported =
      'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);

    if (supported) {
      setPermissionState(Notification.permission);

      if (Notification.permission === 'granted') {
        // Auto-register service worker & sync push subscription
        navigator.serviceWorker.register('/sw.js').then(async (reg) => {
          await navigator.serviceWorker.ready;
          let sub = await reg.pushManager.getSubscription();
          if (!sub) {
            try {
              sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
              });
            } catch (e) {
              console.warn('[WebPush] Auto-subscribe pending user interaction:', e);
            }
          }
          if (sub) {
            syncSubscriptionToBackend(sub);
          }
        }).catch((err) => console.warn('[WebPush] ServiceWorker error:', err));
      } else if (Notification.permission === 'default') {
        const dismissed = localStorage.getItem(`asksite_push_dismissed_${slug}`);
        if (!dismissed) {
          const timer = setTimeout(() => {
            setShowPrompt(true);
          }, 2500);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [slug, VAPID_KEY, syncSubscriptionToBackend]);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(`asksite_push_dismissed_${slug}`, 'true');
  };

  const handleSendSelfTestPush = async () => {
    setIsSendingTest(true);
    setTestSentSuccess(false);
    try {
      const res = await fetch('/api/notifications/send-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          trigger: 'game_record',
          senderRole: getResolvedRole(),
          targetRole: 'both',
          senderName: partnerName || 'Sevgilin',
          extraData: {
            gameName: 'Flappy Bird',
            score: 77,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestSentSuccess(true);
        setTimeout(() => setTestSentSuccess(false), 5000);
      }
    } catch (err) {
      console.error('Self test push error:', err);
    } finally {
      setIsSendingTest(false);
    }
  };

  if (!isSupported) return null;

  return (
    <>
      {/* 1. Initial Prompt Card (Floating Above BottomNav) */}
      {showPrompt && (
        <div className="fixed bottom-28 sm:bottom-24 left-4 right-4 sm:left-auto sm:right-6 z-[60] max-w-sm sm:w-[380px] mx-auto sm:mx-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-rose-200 dark:border-rose-900/40 rounded-3xl shadow-2xl p-4.5 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/25">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0 pr-1">
              <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                Anlık Bildirimler
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                {otherPartnerName
                  ? `${otherPartnerName} anı eklediğinde veya oyun rekorunu kırdığında anında telefonuna bildirim gelsin!`
                  : 'Sevgilin yeni anı eklediğinde veya oyun rekorunu kırdığında anında bildirim al!'}
              </p>

              {errorMessage && (
                <div className="mt-2.5 p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 font-medium">
                  {errorMessage}
                </div>
              )}

              {subscribedSuccess ? (
                <div className="mt-3 py-2 px-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> Bildirimler açıldı! ❤️
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-3.5">
                  <button
                    type="button"
                    onClick={handleSubscribe}
                    disabled={isSubscribing}
                    className="flex-1 py-2.5 px-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs font-black rounded-xl shadow-md shadow-rose-500/20 transition active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Heart className="w-3.5 h-3.5 fill-current" />
                    {isSubscribing ? 'Açılıyor...' : 'Bildirimleri Aç'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="py-2.5 px-3 text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition cursor-pointer"
                  >
                    Şimdilik Değil
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Floating Bell Icon (Bottom Left, Always Visible & Accessible) */}
      <button
        type="button"
        onClick={() => {
          if (permissionState === 'granted') {
            setShowStatusModal(true);
          } else {
            setShowPrompt(true);
          }
        }}
        title="Anlık Bildirim Ayarları"
        className="fixed bottom-24 left-4 sm:left-6 z-40 w-11 h-11 rounded-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-rose-200 dark:border-rose-900/40 text-rose-500 hover:scale-105 transition shadow-lg flex items-center justify-center group cursor-pointer"
      >
        <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        {permissionState === 'granted' && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white"></span>
          </span>
        )}
      </button>

      {/* 3. Status & Self-Test Modal when already granted */}
      {showStatusModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-rose-100 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                  Bildirimleriniz Aktif!
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Bu cihaz sisteme başarıyla kaydedildi. Sevgiliniz yeni bir anı eklediğinde veya oyun rekorunuzu kırdığında anında kilit ekranınıza bildirim düşecektir.
            </p>

            <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 p-3 text-xs space-y-1.5 border border-zinc-200/60 dark:border-zinc-700/60">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Cihaz Rolü:</span>
                <span className="font-bold text-rose-500">
                  {getResolvedRole() === 'partner1' ? 'Partner 1 (Kız/Giriş Yapan)' : 'Partner 2 (Erkek)'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">İzin Durumu:</span>
                <span className="font-bold text-emerald-600">İzin Verildi (Granted) ✓</span>
              </div>
            </div>

            {testSentSuccess && (
              <div className="py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4" /> Test bildirimi telefonunuza gönderildi! 🚀
              </div>
            )}

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleSendSelfTestPush}
                disabled={isSendingTest}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 text-white text-xs font-black shadow-md transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                {isSendingTest ? 'Gönderiliyor...' : 'Bu Cihaza Test Bildirimi Gönder 📲'}
              </button>

              <button
                type="button"
                onClick={handleSubscribe}
                disabled={isSubscribing}
                className="w-full py-2 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSubscribing ? 'animate-spin' : ''}`} />
                {isSubscribing ? 'Yenileniyor...' : 'Aboneliği Yenile / Tekrar Senkronize Et'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
