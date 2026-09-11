import { NextRequest, NextResponse } from 'next/server';
import { activateCouplePayment, getCoupleBySlug } from '@/lib/couples';
import { sendOrderSuccessEmail } from '@/lib/mail';
import { verifyShopierOrder } from '@/lib/shopier';

function extractSlugFromOrderId(orderId: string): string {
  if (!orderId) return '';
  if (orderId.startsWith('ask_')) {
    const parts = orderId.replace(/^ask_/, '').split('_');
    if (parts.length > 1) {
      parts.pop();
      return parts.join('_');
    }
    return parts[0];
  }
  return '';
}

async function findCoupleByEmailOrOrderId(email: string, orderId?: string): Promise<{ slug: string; plan?: string } | null> {
  try {
    const { db } = await import('@/lib/firebase');
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    if (!db) return null;

    const cleanEmail = (email || '').trim().toLowerCase();

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

      const qUser = query(collection(db, 'users'), where('email', '==', cleanEmail));
      const snapUser = await getDocs(qUser);
      if (!snapUser.empty) {
        const userData = snapUser.docs[0].data();
        const pendingSlug = userData.pendingCoupleSlug || userData.coupleSlug;
        if (pendingSlug) {
          return {
            slug: pendingSlug,
            plan: userData.pendingPackageType === 'yearly_premium' ? 'yearly_premium' : 'yearly_standard',
          };
        }
      }
    }
  } catch (err) {
    console.error('[ShopierCallback] Error finding couple by email:', err);
  }
  return null;
}

export async function POST(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.asksite.com.tr';

  try {
    let orderId = '';
    let slug = '';
    let buyerEmail = '';

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const json = await req.json().catch(() => ({}));
      orderId =
        json.id ||
        json.platform_order_id ||
        json.order_id ||
        json.orderId ||
        json.data?.id ||
        json.data?.order_id ||
        '';
      slug = json.slug || json.metadata?.slug || json.data?.metadata?.slug || '';
      buyerEmail =
        json.shippingInfo?.email ||
        json.billingInfo?.email ||
        json.buyer_email ||
        json.email ||
        '';
    } else {
      const formData = await req.formData().catch(() => new FormData());
      orderId = (formData.get('platform_order_id') || formData.get('order_id') || formData.get('orderId') || formData.get('id') || '') as string;
      slug = (formData.get('slug') || '') as string;
      buyerEmail = (formData.get('buyer_email') || formData.get('email') || '') as string;
    }

    const urlParams = req.nextUrl.searchParams;
    if (!slug) slug = urlParams.get('slug') || '';
    if (!orderId) orderId = urlParams.get('platform_order_id') || urlParams.get('order_id') || '';
    if (!buyerEmail) buyerEmail = urlParams.get('email') || urlParams.get('buyer_email') || '';

    // GÜVENLİK ADIMI 1: Sipariş numarası olmadan hiçbir aktivasyon yapılamaz!
    if (!orderId) {
      console.warn('[Shopier Callback POST] Rejected: No orderId provided');
      return NextResponse.json({ success: false, error: 'Siparis numarasi eksik.' }, { status: 400 });
    }

    // GÜVENLİK ADIMI 2: Shopier REST API üzerinden sipariş durumunu DOĞRULA
    const verification = await verifyShopierOrder(orderId);
    if (!verification.success || !verification.order) {
      console.warn(`[Shopier Callback POST] Rejected: Order ${orderId} could not be verified by Shopier API:`, verification.error);
      return NextResponse.json({ success: false, error: verification.error || 'Shopier uzerinde dogrulanamadi.' }, { status: 400 });
    }

    const { plan, buyerEmail: sEmail, orderId: cleanOrderId } = verification.order;

    // GÜVENLİK ADIMI 3: Hedef çift sitesini tespit et
    if (!slug && cleanOrderId.startsWith('ask_')) {
      slug = extractSlugFromOrderId(cleanOrderId);
    }

    const effectiveEmail = buyerEmail || sEmail;
    if (!slug && effectiveEmail) {
      const match = await findCoupleByEmailOrOrderId(effectiveEmail, cleanOrderId);
      if (match?.slug) slug = match.slug;
    }

    if (!slug || slug === 'demo') {
      console.warn(`[Shopier Callback POST] Verified order ${cleanOrderId} but could not find matching couple for email: ${effectiveEmail}`);
      return NextResponse.json({ success: false, error: 'Siparise ait cift sitesi bulunamadi.' }, { status: 404 });
    }

    // GÜVENLİK ADIMI 4: Replay attack kontrolü
    const { db } = await import('@/lib/firebase');
    const { collection, query, where, getDocs, doc, setDoc, serverTimestamp } = await import('firebase/firestore');

    if (db) {
      const existingSnap = await getDocs(query(collection(db, 'couples'), where('shopier_order_id', '==', cleanOrderId)));
      if (!existingSnap.empty && existingSnap.docs[0].data().slug !== slug) {
        console.warn(`[Shopier Callback POST] Replay attack: order ${cleanOrderId} already used for ${existingSnap.docs[0].data().slug}`);
        return NextResponse.json({ success: false, error: 'Bu siparis daha once baska bir site icin kullanilmistir.' }, { status: 400 });
      }
    }

    // GÜVENLİK ADIMI 5: Onaylanmış Çift Sitesini Aktif Et
    await activateCouplePayment(slug, plan);

    if (db) {
      await setDoc(
        doc(db, 'couples', slug),
        {
          shopier_order_id: cleanOrderId,
          verified_via_webhook_at: serverTimestamp(),
        },
        { merge: true }
      );
    }

    const existingCouple = await getCoupleBySlug(slug);
    const targetEmail = effectiveEmail || existingCouple?.partner1_email || existingCouple?.authorized_emails?.[0];
    if (targetEmail) {
      sendOrderSuccessEmail({
        to: targetEmail,
        partner1Name: existingCouple?.partner1_name || 'Partner 1',
        partner2Name: existingCouple?.partner2_name || 'Partner 2',
        slug,
        plan,
        inviteCode: existingCouple?.inviteCode || existingCouple?.pair_code || '',
        orderId: cleanOrderId,
      }).catch((err) => console.error('Error sending email in callback:', err));
    }

    console.log(`[Shopier Callback POST SUCCESS] Activated couple: ${slug} (${plan}) with order ${cleanOrderId}`);

    const isWebhook =
      contentType.includes('json') ||
      Boolean(req.headers.get('shopier-event')) ||
      req.headers.get('user-agent')?.toLowerCase().includes('shopier') ||
      !req.headers.get('accept')?.includes('text/html');

    if (isWebhook) {
      return NextResponse.json({ success: true, message: 'Odeme basariyla dogrulandi ve site aktif edildi.', slug, plan }, { status: 200 });
    }

    return NextResponse.redirect(new URL(`/c/${slug}?payment=success`, appUrl), { status: 302 });
  } catch (error) {
    console.error('Error in Shopier POST callback:', error);
    return NextResponse.redirect(new URL('/checkout?error=payment_failed', appUrl), { status: 302 });
  }
}

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.asksite.com.tr';

  try {
    const urlParams = req.nextUrl.searchParams;
    let slug = urlParams.get('slug') || '';
    const orderId = urlParams.get('platform_order_id') || urlParams.get('order_id') || '';
    const buyerEmail = urlParams.get('email') || urlParams.get('buyer_email') || '';

    // GÜVENLİK ADIMI 1: URL'de sipariş numarası yoksa kesinlikle aktif etme!
    if (!orderId) {
      console.warn('[Shopier GET Callback] Rejected: No orderId in GET parameters');
      return NextResponse.redirect(new URL('/checkout?error=payment_unverified', appUrl), { status: 302 });
    }

    // GÜVENLİK ADIMI 2: Shopier REST API üzerinden siparişi doğrula
    const verification = await verifyShopierOrder(orderId);
    if (!verification.success || !verification.order) {
      console.warn(`[Shopier GET Callback] Order ${orderId} unverified by Shopier:`, verification.error);
      return NextResponse.redirect(new URL('/checkout?error=payment_unverified', appUrl), { status: 302 });
    }

    const { plan, buyerEmail: sEmail, orderId: cleanOrderId } = verification.order;

    if (!slug && cleanOrderId.startsWith('ask_')) {
      slug = extractSlugFromOrderId(cleanOrderId);
    }

    const effectiveEmail = buyerEmail || sEmail;
    if (!slug && effectiveEmail) {
      const match = await findCoupleByEmailOrOrderId(effectiveEmail, cleanOrderId);
      if (match?.slug) slug = match.slug;
    }

    if (!slug || slug === 'demo') {
      return NextResponse.redirect(new URL('/checkout?error=couple_not_found', appUrl), { status: 302 });
    }

    // GÜVENLİK ADIMI 3: Replay attack kontrolü
    const { db } = await import('@/lib/firebase');
    const { collection, query, where, getDocs, doc, setDoc, serverTimestamp } = await import('firebase/firestore');

    if (db) {
      const existingSnap = await getDocs(query(collection(db, 'couples'), where('shopier_order_id', '==', cleanOrderId)));
      if (!existingSnap.empty && existingSnap.docs[0].data().slug !== slug) {
        return NextResponse.redirect(new URL('/checkout?error=order_already_used', appUrl), { status: 302 });
      }
    }

    // GÜVENLİK ADIMI 4: Doğrulanmış Çift Sitesini Aktif Et
    await activateCouplePayment(slug, plan);

    if (db) {
      await setDoc(
        doc(db, 'couples', slug),
        {
          shopier_order_id: cleanOrderId,
          verified_via_redirect_at: serverTimestamp(),
        },
        { merge: true }
      );
    }

    const existingCouple = await getCoupleBySlug(slug);
    const targetEmail = effectiveEmail || existingCouple?.partner1_email || existingCouple?.authorized_emails?.[0];
    if (targetEmail) {
      sendOrderSuccessEmail({
        to: targetEmail,
        partner1Name: existingCouple?.partner1_name || 'Partner 1',
        partner2Name: existingCouple?.partner2_name || 'Partner 2',
        slug,
        plan,
        inviteCode: existingCouple?.inviteCode || existingCouple?.pair_code || '',
        orderId: cleanOrderId,
      }).catch((err) => console.error('Error sending email in GET callback:', err));
    }

    console.log(`[Shopier GET Callback SUCCESS] Verified & Activated: ${slug} (${plan})`);
    return NextResponse.redirect(new URL(`/c/${slug}?payment=success`, appUrl), { status: 302 });
  } catch (error) {
    console.error('Error in Shopier GET payment callback:', error);
    return NextResponse.redirect(new URL('/checkout?error=payment_failed', appUrl), { status: 302 });
  }
}
