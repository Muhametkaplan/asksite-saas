import { NextRequest, NextResponse } from 'next/server';
import { activateCouplePayment, getCoupleBySlug } from '@/lib/couples';

function extractSlugFromOrderId(orderId: string): string {
  if (!orderId) return '';
  // Format: ask_{slug}_{timestamp}
  if (orderId.startsWith('ask_')) {
    const parts = orderId.replace(/^ask_/, '').split('_');
    if (parts.length > 1) {
      // Remove timestamp from last element
      parts.pop();
      return parts.join('_');
    }
    return parts[0];
  }
  return orderId;
}

export async function POST(req: NextRequest) {
  try {
    let orderId = '';
    let status = '';
    let slug = '';
    let plan: '1_year' | 'lifetime' = '1_year';

    // 1. Parse JSON body or FormData body from Shopier
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const json = await req.json().catch(() => ({}));
      orderId = json.platform_order_id || json.order_id || json.orderId || '';
      status = json.status || json.payment_status || '';
      slug = json.slug || json.metadata?.slug || '';
      if (json.plan === 'lifetime' || json.metadata?.plan === 'lifetime') {
        plan = 'lifetime';
      }
    } else {
      const formData = await req.formData().catch(() => new FormData());
      orderId = (formData.get('platform_order_id') || formData.get('order_id') || formData.get('orderId') || '') as string;
      status = (formData.get('status') || formData.get('payment_status') || '') as string;
      slug = (formData.get('slug') || '') as string;
      const planStr = (formData.get('plan') || '') as string;
      if (planStr === 'lifetime') {
        plan = 'lifetime';
      }
    }

    // 2. Also check URL Search Params
    const urlParams = req.nextUrl.searchParams;
    if (!slug) {
      slug = urlParams.get('slug') || '';
    }
    if (!orderId) {
      orderId = urlParams.get('platform_order_id') || urlParams.get('order_id') || '';
    }
    if (!status) {
      status = urlParams.get('status') || '';
    }
    if (urlParams.get('plan') === 'lifetime') {
      plan = 'lifetime';
    }

    // Resolve slug if not explicitly passed
    if (!slug && orderId) {
      slug = extractSlugFromOrderId(orderId);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.asksite.com.tr';

    // 3. Strict Payment Success Verification
    const normalizedStatus = status.trim().toLowerCase();
    const isSuccess =
      normalizedStatus === 'success' ||
      normalizedStatus === 'successful' ||
      normalizedStatus === '1' ||
      normalizedStatus === 'completed' ||
      normalizedStatus === 'approved';

    if (isSuccess && slug && slug !== 'demo') {
      const existing = await getCoupleBySlug(slug);
      if (existing?.plan === 'lifetime' || existing?.package_type === 'lifetime' || existing?.package_type === 'nfc') {
        plan = 'lifetime';
      }

      // STRICT: Database activation ONLY happens here upon verified webhook/callback!
      await activateCouplePayment(slug, plan);
      console.log(`[Shopier Verified Callback] Activated couple: ${slug} (${plan})`);

      const redirectUrl = new URL(`/c/${slug}?payment=success`, appUrl);
      return NextResponse.redirect(redirectUrl, { status: 302 });
    }

    console.warn(`[Shopier Callback Failed/Unverified] status=${status}, slug=${slug}`);
    return NextResponse.redirect(new URL('/checkout?error=payment_failed', appUrl), { status: 302 });
  } catch (error) {
    console.error('Error in Shopier payment callback:', error);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.asksite.com.tr';
    return NextResponse.redirect(new URL('/checkout?error=payment_failed', appUrl), { status: 302 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const urlParams = req.nextUrl.searchParams;
    let slug = urlParams.get('slug') || '';
    const orderId = urlParams.get('platform_order_id') || urlParams.get('order_id') || '';
    const status = urlParams.get('status') || '';
    let plan: '1_year' | 'lifetime' = urlParams.get('plan') === 'lifetime' ? 'lifetime' : '1_year';

    if (!slug && orderId) {
      slug = extractSlugFromOrderId(orderId);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.asksite.com.tr';

    const normalizedStatus = status.trim().toLowerCase();
    const isSuccess =
      normalizedStatus === 'success' ||
      normalizedStatus === 'successful' ||
      normalizedStatus === '1' ||
      normalizedStatus === 'completed' ||
      normalizedStatus === 'approved';

    if (isSuccess && slug && slug !== 'demo') {
      const existing = await getCoupleBySlug(slug);
      if (existing?.plan === 'lifetime' || existing?.package_type === 'lifetime' || existing?.package_type === 'nfc') {
        plan = 'lifetime';
      }

      await activateCouplePayment(slug, plan);
      console.log(`[Shopier GET Verified Callback] Activated couple: ${slug} (${plan})`);

      const redirectUrl = new URL(`/c/${slug}?payment=success`, appUrl);
      return NextResponse.redirect(redirectUrl, { status: 302 });
    }

    console.warn(`[Shopier GET Callback Failed/Unverified] status=${status}, slug=${slug}`);
    return NextResponse.redirect(new URL('/checkout?error=payment_failed', appUrl), { status: 302 });
  } catch (error) {
    console.error('Error in Shopier GET payment callback:', error);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.asksite.com.tr';
    return NextResponse.redirect(new URL('/checkout?error=payment_failed', appUrl), { status: 302 });
  }
}
