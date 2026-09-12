/**
 * Unified Analytics & Conversion Tracking Service for AskSite SaaS
 * Supports:
 * - Google Analytics 4 (GA4)
 * - Meta Pixel (Facebook & Instagram)
 * - TikTok Pixel
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    fbq?: (...args: any[]) => void;
    _fbq?: any;
    ttq?: {
      track: (event: string, data?: any) => void;
      page: () => void;
      load: (id: string) => void;
      [key: string]: any;
    };
  }
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || '';
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || '';
export const TIKTOK_PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID?.trim() || '';

/**
 * 1. Track Page View across all platforms
 */
export function trackPageView(url?: string) {
  if (typeof window === 'undefined') return;
  const currentUrl = url || window.location.pathname + window.location.search;

  // Google Analytics 4
  if (typeof window.gtag === 'function' && GA_MEASUREMENT_ID) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: currentUrl,
      page_title: document.title,
    });
  }

  // Meta Pixel
  if (typeof window.fbq === 'function' && META_PIXEL_ID) {
    window.fbq('track', 'PageView');
  }

  // TikTok Pixel
  if (window.ttq && typeof window.ttq.page === 'function' && TIKTOK_PIXEL_ID) {
    window.ttq.page();
  }
}

/**
 * 2. Track Package View (ViewContent)
 */
export function trackViewPackage(packageName: string, price: number) {
  if (typeof window === 'undefined') return;

  // Google Analytics 4
  if (typeof window.gtag === 'function' && GA_MEASUREMENT_ID) {
    window.gtag('event', 'view_item', {
      currency: 'TRY',
      value: price,
      items: [
        {
          item_id: packageName.toLowerCase().replace(/\s+/g, '_'),
          item_name: packageName,
          price: price,
          quantity: 1,
        },
      ],
    });
  }

  // Meta Pixel
  if (typeof window.fbq === 'function' && META_PIXEL_ID) {
    window.fbq('track', 'ViewContent', {
      content_name: packageName,
      content_category: 'Couple SaaS Subscription',
      currency: 'TRY',
      value: price,
    });
  }

  // TikTok Pixel
  if (window.ttq && typeof window.ttq.track === 'function' && TIKTOK_PIXEL_ID) {
    window.ttq.track('ViewContent', {
      content_name: packageName,
      content_type: 'product',
      currency: 'TRY',
      value: price,
    });
  }
}

/**
 * 3. Track Initiate Checkout (Selecting a package and starting details)
 */
export function trackInitiateCheckout(packageName: string, price: number) {
  if (typeof window === 'undefined') return;

  // Google Analytics 4
  if (typeof window.gtag === 'function' && GA_MEASUREMENT_ID) {
    window.gtag('event', 'begin_checkout', {
      currency: 'TRY',
      value: price,
      items: [
        {
          item_id: packageName.toLowerCase().replace(/\s+/g, '_'),
          item_name: packageName,
          price: price,
          quantity: 1,
        },
      ],
    });
  }

  // Meta Pixel
  if (typeof window.fbq === 'function' && META_PIXEL_ID) {
    window.fbq('track', 'InitiateCheckout', {
      content_name: packageName,
      currency: 'TRY',
      value: price,
      num_items: 1,
    });
  }

  // TikTok Pixel
  if (window.ttq && typeof window.ttq.track === 'function' && TIKTOK_PIXEL_ID) {
    window.ttq.track('InitiateCheckout', {
      content_name: packageName,
      currency: 'TRY',
      value: price,
      quantity: 1,
    });
  }
}

/**
 * 4. Track Add Payment Info (Proceeding to Shopier gateway)
 */
export function trackAddPaymentInfo(packageName: string, price: number) {
  if (typeof window === 'undefined') return;

  // Google Analytics 4
  if (typeof window.gtag === 'function' && GA_MEASUREMENT_ID) {
    window.gtag('event', 'add_payment_info', {
      currency: 'TRY',
      value: price,
      payment_type: 'Shopier Gateway',
      items: [
        {
          item_name: packageName,
          price: price,
        },
      ],
    });
  }

  // Meta Pixel
  if (typeof window.fbq === 'function' && META_PIXEL_ID) {
    window.fbq('track', 'AddPaymentInfo', {
      content_name: packageName,
      currency: 'TRY',
      value: price,
    });
  }

  // TikTok Pixel
  if (window.ttq && typeof window.ttq.track === 'function' && TIKTOK_PIXEL_ID) {
    window.ttq.track('AddPaymentInfo', {
      content_name: packageName,
      currency: 'TRY',
      value: price,
    });
  }
}

/**
 * 5. Track Purchase (Completed and Verified Payment)
 */
export function trackPurchase(params: {
  orderId: string;
  value: number;
  packageName?: string;
  currency?: string;
}) {
  if (typeof window === 'undefined') return;
  const { orderId, value, packageName = 'AskSite Çift Paketi', currency = 'TRY' } = params;

  // Google Analytics 4
  if (typeof window.gtag === 'function' && GA_MEASUREMENT_ID) {
    window.gtag('event', 'purchase', {
      transaction_id: orderId,
      value: value,
      currency: currency,
      items: [
        {
          item_name: packageName,
          price: value,
          quantity: 1,
        },
      ],
    });
  }

  // Meta Pixel
  if (typeof window.fbq === 'function' && META_PIXEL_ID) {
    window.fbq('track', 'Purchase', {
      content_name: packageName,
      currency: currency,
      value: value,
      order_id: orderId,
    });
  }

  // TikTok Pixel
  if (window.ttq && typeof window.ttq.track === 'function' && TIKTOK_PIXEL_ID) {
    window.ttq.track('CompletePayment', {
      content_name: packageName,
      currency: currency,
      value: value,
      order_id: orderId,
    });
  }
}

/**
 * 6. Track Lead / Registration
 */
export function trackLead(leadType: string = 'Kayıt / Çift Başlangıcı') {
  if (typeof window === 'undefined') return;

  if (typeof window.gtag === 'function' && GA_MEASUREMENT_ID) {
    window.gtag('event', 'generate_lead', {
      lead_type: leadType,
    });
  }

  if (typeof window.fbq === 'function' && META_PIXEL_ID) {
    window.fbq('track', 'Lead', {
      content_name: leadType,
    });
  }

  if (window.ttq && typeof window.ttq.track === 'function' && TIKTOK_PIXEL_ID) {
    window.ttq.track('Contact', {
      content_name: leadType,
    });
  }
}
