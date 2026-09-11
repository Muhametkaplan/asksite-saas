import { NextRequest, NextResponse } from 'next/server';
import { activateCouplePayment, getCoupleBySlug } from '@/lib/couples';
import { sendOrderSuccessEmail } from '@/lib/mail';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, email, slug: inputSlug, uid } = body;

    let targetSlug = inputSlug || '';
    let plan: 'yearly_standard' | 'yearly_premium' | '1_year' | 'lifetime' | string = 'yearly_standard';

    const { db } = await import('@/lib/firebase');
    const { doc, getDoc, collection, query, where, getDocs, setDoc, serverTimestamp } = await import('firebase/firestore');

    if (!db) {
      return NextResponse.json({ success: false, error: 'Veritabanı bağlantısı kurulamadı.' }, { status: 500 });
    }

    // 1. If UID is provided, check user's pendingCoupleSlug
    if (uid && !targetSlug) {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const udata = userSnap.data();
        targetSlug = udata.pendingCoupleSlug || udata.coupleSlug || '';
        if (udata.pendingPackageType === 'yearly_premium' || udata.pendingPackageType === 'premium' || udata.pendingPackageType === 'lifetime' || udata.pendingPackageType === 'nfc') {
          plan = 'yearly_premium';
        }
      }
    }

    // 2. If email is provided, search couples
    if (!targetSlug && email) {
      const cleanEmail = email.trim().toLowerCase();
      const q = query(collection(db, 'couples'), where('authorized_emails', 'array-contains', cleanEmail));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const list = snap.docs.map((d) => d.data());
        const target = list.find((c) => !c.isPaid) || list[0];
        targetSlug = target.slug;
        if (target.plan) plan = target.plan;
      }
    }

    // 3. If orderId is provided, check Shopier REST API directly using PAT token
    const shopierToken = (process.env.SHOPIER_API_TOKEN || '').trim().replace(/^"|"$/g, '');
    if (orderId && shopierToken) {
      try {
        const sRes = await fetch(`https://api.shopier.com/v1/orders/${encodeURIComponent(orderId)}`, {
          headers: { Authorization: `Bearer ${shopierToken}` },
        });
        if (sRes.ok) {
          const sOrder = await sRes.json();
          if (sOrder && (sOrder.paymentStatus === 'paid' || sOrder.status === 'fulfilled' || sOrder.status === 'unfulfilled')) {
            const sEmail = sOrder.shippingInfo?.email || sOrder.billingInfo?.email;
            const sProdId = sOrder.lineItems?.[0]?.productId;
            if (sProdId === '50201191') plan = 'yearly_premium';
            else if (sProdId === '50201181') plan = 'yearly_standard';
            if (!targetSlug && sEmail) {
              const cleanEmail = sEmail.trim().toLowerCase();
              const q = query(collection(db, 'couples'), where('authorized_emails', 'array-contains', cleanEmail));
              const snap = await getDocs(q);
              if (!snap.empty) {
                const list = snap.docs.map((d) => d.data());
                const target = list.find((c) => !c.isPaid) || list[0];
                targetSlug = target.slug;
              }
            }
          }
        }
      } catch (err) {
        console.warn('Shopier API direct order lookup non-fatal error:', err);
      }
    }

    if (!targetSlug || targetSlug === 'demo') {
      return NextResponse.json(
        { success: false, error: 'Eşleşen aktif veya beklemede olan bir çift siparişi bulunamadı. Lütfen e-posta veya sipariş bilgilerinizi kontrol ediniz.' },
        { status: 404 }
      );
    }

    const couple = await getCoupleBySlug(targetSlug);
    if (couple?.plan === 'yearly_premium' || couple?.package_type === 'yearly_premium') {
      plan = 'yearly_premium';
    } else if (couple?.plan === 'lifetime' || couple?.package_type === 'lifetime' || couple?.package_type === 'nfc') {
      plan = 'lifetime';
    }

    // Activate the couple site
    await activateCouplePayment(targetSlug, plan);

    // Send confirmation email
    const targetEmail = email || couple?.partner1_email || couple?.authorized_emails?.[0];
    if (targetEmail) {
      sendOrderSuccessEmail({
        to: targetEmail,
        partner1Name: couple?.partner1_name || 'Partner 1',
        partner2Name: couple?.partner2_name || 'Partner 2',
        slug: targetSlug,
        plan,
        inviteCode: couple?.inviteCode || couple?.pair_code || '',
        orderId: orderId || undefined,
      }).catch((err) => console.error('Error sending order success email in verify route:', err));
    }

    // If orderId is provided, record it in couple config
    if (orderId) {
      try {
        await setDoc(
          doc(db, 'couples', targetSlug),
          {
            shopier_order_id: String(orderId).trim(),
            verified_manually_at: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (e) {
        console.error('Error saving orderId to couple:', e);
      }
    }

    return NextResponse.json({
      success: true,
      slug: targetSlug,
      plan,
      message: 'Siteniz başarıyla onaylandı ve aktif edildi!',
    });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ success: false, error: error.message || 'Doğrulama sırasında hata oluştu.' }, { status: 500 });
  }
}
