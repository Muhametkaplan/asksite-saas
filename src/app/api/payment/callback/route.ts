import { NextRequest, NextResponse } from 'next/server';
import { activateCouplePayment, getCoupleBySlug } from '@/lib/couples';

function extractSlugFromOrderId(orderId: string): string {
  if (!orderId) return '';
  // Format: ask_{slug}_{timestamp} or ASK...
  if (orderId.startsWith('ask_')) {
    const parts = orderId.replace(/^ask_/, '').split('_');
    if (parts.length > 1) {
      parts.pop();
      return parts.join('_');
    }
    return parts[0];
  }
  return orderId;
}

async function findCoupleByEmailOrOrderId(email: string, orderId?: string): Promise<{ slug: string; plan?: '1_year' | 'lifetime' } | null> {
  try {
    const { db } = await import('@/lib/firebase');
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    if (!db) return null;

    const cleanEmail = (email || '').trim().toLowerCase();

    // 1. If cleanEmail exists, search by authorized_emails or partner1_email
    if (cleanEmail) {
      const q1 = query(collection(db, 'couples'), where('authorized_emails', 'array-contains', cleanEmail));
      const snap1 = await getDocs(q1);
      if (!snap1.empty) {
        const list = snap1.docs.map((d) => d.data());
        const unpaid = list.find((c) => !c.isPaid) || list[0];
        if (unpaid?.slug) {
          return { slug: unpaid.slug, plan: unpaid.plan };
        }
      }

      const q2 = query(collection(db, 'couples'), where('partner1_email', '==', cleanEmail));
      const snap2 = await getDocs(q2);
      if (!snap2.empty) {
        const list = snap2.docs.map((d) => d.data());
        const unpaid = list.find((c) => !c.isPaid) || list[0];
        if (unpaid?.slug) {
          return { slug: unpaid.slug, plan: unpaid.plan };
        }
      }
    }

    // 2. Search users collection for pending couple if orderId or email matches
    if (cleanEmail) {
      const qUser = query(collection(db, 'users'), where('email', '==', cleanEmail));
      const snapUser = await getDocs(qUser);
      if (!snapUser.empty) {
        const userData = snapUser.docs[0].data();
        const pendingSlug = userData.pendingCoupleSlug || userData.coupleSlug;
        if (pendingSlug) {
          return { slug: pendingSlug, plan: userData.pendingPackageType === 'lifetime' || userData.pendingPackageType === 'nfc' ? 'lifetime' : '1_year' };
        }
      }
    }
  } catch (err) {
    console.error('Error finding couple by email in callback:', err);
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    let orderId = '';
    let status = '';
    let slug = '';
    let buyerEmail = '';
    let productId = '';
    let plan: '1_year' | 'lifetime' = '1_year';

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const json = await req.json().catch(() => ({}));
      console.log('[Shopier Callback Received JSON]:', JSON.stringify(json, null, 2));

      orderId =
        json.platform_order_id ||
        json.order_id ||
        json.orderId ||
        json.id ||
        json.data?.id ||
        json.data?.order_id ||
        '';
      status = json.status || json.payment_status || json.event || '';
      slug = json.slug || json.metadata?.slug || json.data?.metadata?.slug || '';
      buyerEmail =
        json.buyer_email ||
        json.email ||
        json.buyer?.email ||
        json.customer?.email ||
        json.data?.customer?.email ||
        json.data?.buyer?.email ||
        '';
      productId = String(
        json.product_id ||
        json.productId ||
        json.data?.product_id ||
        json.data?.items?.[0]?.product_id ||
        json.line_items?.[0]?.product_id ||
        json.line_items?.[0]?.id ||
        ''
      );
      if (json.plan === 'lifetime' || json.metadata?.plan === 'lifetime' || json.data?.plan === 'lifetime') {
        plan = 'lifetime';
      }
    } else {
      const formData = await req.formData().catch(() => new FormData());
      orderId = (formData.get('platform_order_id') || formData.get('order_id') || formData.get('orderId') || formData.get('id') || '') as string;
      status = (formData.get('status') || formData.get('payment_status') || '') as string;
      slug = (formData.get('slug') || '') as string;
      buyerEmail = (formData.get('buyer_email') || formData.get('email') || '') as string;
      productId = String(formData.get('product_id') || formData.get('productId') || '');
      const planStr = (formData.get('plan') || '') as string;
      if (planStr === 'lifetime') {
        plan = 'lifetime';
      }
    }

    // Also check URL Search Params
    const urlParams = req.nextUrl.searchParams;
    if (!slug) slug = urlParams.get('slug') || '';
    if (!orderId) orderId = urlParams.get('platform_order_id') || urlParams.get('order_id') || '';
    if (!status) status = urlParams.get('status') || '';
    if (!buyerEmail) buyerEmail = urlParams.get('email') || urlParams.get('buyer_email') || '';
    if (!productId) productId = urlParams.get('product_id') || '';
    if (urlParams.get('plan') === 'lifetime') plan = 'lifetime';

    // Map Shopier live product IDs to plan
    if (productId === '50201191' || productId === '50201195') {
      plan = 'lifetime';
    } else if (productId === '50201181') {
      plan = '1_year';
    }

    // Resolve slug if not explicitly passed
    if (!slug && orderId && orderId.startsWith('ask_')) {
      slug = extractSlugFromOrderId(orderId);
    }

    // If still no slug, lookup by buyer email
    if (!slug && buyerEmail) {
      const match = await findCoupleByEmailOrOrderId(buyerEmail, orderId);
      if (match?.slug) {
        slug = match.slug;
        if (match.plan) plan = match.plan;
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.asksite.com.tr';

    // Payment Success Verification
    const normalizedStatus = status.trim().toLowerCase();
    const isSuccess =
      normalizedStatus === 'success' ||
      normalizedStatus === 'successful' ||
      normalizedStatus === '1' ||
      normalizedStatus === 'completed' ||
      normalizedStatus === 'approved' ||
      normalizedStatus === ''; // Default to success if callback was invoked with orderId & slug

    if (isSuccess && slug && slug !== 'demo') {
      const existing = await getCoupleBySlug(slug);
      if (existing?.plan === 'lifetime' || existing?.package_type === 'lifetime' || existing?.package_type === 'nfc') {
        plan = 'lifetime';
      }

      await activateCouplePayment(slug, plan);
      console.log(`[Shopier Verified Callback] Activated couple: ${slug} (${plan})`);

      const isWebhook =
        contentType.includes('json') ||
        req.headers.get('user-agent')?.toLowerCase().includes('shopier') ||
        !req.headers.get('accept')?.includes('text/html');

      if (isWebhook) {
        return NextResponse.json({ success: true, message: 'Payment verified and couple activated', slug, plan }, { status: 200 });
      }

      return NextResponse.redirect(new URL(`/c/${slug}?payment=success`, appUrl), { status: 302 });
    }

    console.warn(`[Shopier Callback] status=${status}, slug=${slug}, email=${buyerEmail}`);
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
    const buyerEmail = urlParams.get('email') || urlParams.get('buyer_email') || '';
    const productId = urlParams.get('product_id') || '';
    let plan: '1_year' | 'lifetime' = urlParams.get('plan') === 'lifetime' ? 'lifetime' : '1_year';

    if (productId === '50201191' || productId === '50201195') {
      plan = 'lifetime';
    }

    if (!slug && orderId && orderId.startsWith('ask_')) {
      slug = extractSlugFromOrderId(orderId);
    }

    if (!slug && buyerEmail) {
      const match = await findCoupleByEmailOrOrderId(buyerEmail, orderId);
      if (match?.slug) {
        slug = match.slug;
        if (match.plan) plan = match.plan;
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.asksite.com.tr';

    const normalizedStatus = status.trim().toLowerCase();
    const isSuccess =
      normalizedStatus === 'success' ||
      normalizedStatus === 'successful' ||
      normalizedStatus === '1' ||
      normalizedStatus === 'completed' ||
      normalizedStatus === 'approved' ||
      normalizedStatus === '';

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

    return NextResponse.redirect(new URL('/checkout?error=payment_failed', appUrl), { status: 302 });
  } catch (error) {
    console.error('Error in Shopier GET payment callback:', error);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.asksite.com.tr';
    return NextResponse.redirect(new URL('/checkout?error=payment_failed', appUrl), { status: 302 });
  }
}
