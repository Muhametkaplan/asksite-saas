import { NextRequest, NextResponse } from 'next/server';
import { activateCouplePayment, getCoupleBySlug } from '@/lib/couples';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, email, slug: inputSlug, uid } = body;

    let targetSlug = inputSlug || '';
    let plan: '1_year' | 'lifetime' = '1_year';

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
        if (udata.pendingPackageType === 'lifetime' || udata.pendingPackageType === 'nfc') {
          plan = 'lifetime';
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

    if (!targetSlug || targetSlug === 'demo') {
      return NextResponse.json(
        { success: false, error: 'Eşleşen aktif veya beklemede olan bir çift siparişi bulunamadı. Lütfen e-posta veya sipariş bilgilerinizi kontrol ediniz.' },
        { status: 404 }
      );
    }

    const couple = await getCoupleBySlug(targetSlug);
    if (couple?.plan === 'lifetime' || couple?.package_type === 'lifetime' || couple?.package_type === 'nfc') {
      plan = 'lifetime';
    }

    // Activate the couple site
    await activateCouplePayment(targetSlug, plan);

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
