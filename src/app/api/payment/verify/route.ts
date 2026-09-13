import { NextRequest, NextResponse } from 'next/server';
import { activateCouplePayment, getCoupleBySlug } from '@/lib/couples';
import { sendOrderSuccessEmail } from '@/lib/mail';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { orderId, email, slug: inputSlug, uid } = body;

    // 1. Zorunlu Alan Kontrolü: Sipariş numarası olmadan aktivasyon ASLA yapılamaz!
    if (!orderId || typeof orderId !== 'string' || !orderId.trim()) {
      return NextResponse.json(
        { success: false, error: 'Lütfen geçerli bir Shopier sipariş numarası giriniz.' },
        { status: 400 }
      );
    }

    const cleanOrderId = orderId.trim();
    let targetSlug = inputSlug ? String(inputSlug).trim() : '';

    const { db } = await import('@/lib/firebase');
    const { doc, getDoc, collection, query, where, getDocs, setDoc, serverTimestamp } = await import('firebase/firestore');

    if (!db) {
      return NextResponse.json({ success: false, error: 'Veritabanı bağlantısı kurulamadı.' }, { status: 500 });
    }

    // 2. Replay Attack Koruması: Bu sipariş numarası daha önce başka bir site için kullanılmış mı?
    const existingOrderQuery = query(collection(db, 'couples'), where('shopier_order_id', '==', cleanOrderId));
    const existingOrderSnap = await getDocs(existingOrderQuery);
    if (!existingOrderSnap.empty) {
      const alreadyAssigned = existingOrderSnap.docs[0].data();
      if (targetSlug && alreadyAssigned.slug !== targetSlug) {
        return NextResponse.json(
          { success: false, error: 'Bu sipariş numarası daha önce başka bir çift sitesi için kullanılmıştır.' },
          { status: 400 }
        );
      }
      if (alreadyAssigned.isPaid) {
        return NextResponse.json({
          success: true,
          slug: alreadyAssigned.slug,
          plan: alreadyAssigned.plan || 'yearly_standard',
          message: 'Bu sipariş zaten başarıyla onaylanmış ve siteniz aktiftir.',
        });
      }
    }

    // 3. Shopier API Üzerinden Gerçek Sipariş Sorgulaması (ZORUNLU)
    const shopierToken = (process.env.SHOPIER_API_TOKEN || '').trim().replace(/^"|"$/g, '');
    if (!shopierToken) {
      console.error('[VerifyPayment] SHOPIER_API_TOKEN tanımlı değil!');
      return NextResponse.json(
        { success: false, error: 'Ödeme doğrulama servisi şu anda kullanılamıyor. Lütfen destek ile iletişime geçiniz.' },
        { status: 503 }
      );
    }

    let sOrder: any = null;
    try {
      const sRes = await fetch(`https://api.shopier.com/v1/orders/${encodeURIComponent(cleanOrderId)}`, {
        headers: { Authorization: `Bearer ${shopierToken}` },
      });

      if (!sRes.ok) {
        console.warn(`[VerifyPayment] Shopier API order not found: ${cleanOrderId} (HTTP ${sRes.status})`);
        return NextResponse.json(
          { success: false, error: 'Belirtilen sipariş numarası Shopier sisteminde bulunamadı. Lütfen numarayı kontrol ediniz.' },
          { status: 404 }
        );
      }
      sOrder = await sRes.json();
    } catch (fetchErr) {
      console.error('[VerifyPayment] Shopier API connection error:', fetchErr);
      return NextResponse.json(
        { success: false, error: 'Shopier sistemine bağlanırken hata oluştu. Lütfen birkaç dakika sonra tekrar deneyiniz.' },
        { status: 502 }
      );
    }

    // 4. Ödeme Durumu Kontrolü (STRICT)
    const isPaid = sOrder && (
      sOrder.paymentStatus === 'paid' ||
      sOrder.status === 'fulfilled' ||
      sOrder.status === 'unfulfilled'
    );

    if (!isPaid) {
      return NextResponse.json(
        { success: false, error: 'Bu sipariş Shopier üzerinde henüz ödenmemiş veya iptal edilmiştir.' },
        { status: 400 }
      );
    }

    // 5. Sipariş Üzerindeki Bilgilerden Çift Sitesini Tespit Etme & Doğrulama
    const sEmail = (
      sOrder.shippingInfo?.email ||
      sOrder.billingInfo?.email ||
      sOrder.buyer_email ||
      sOrder.email ||
      ''
    ).trim().toLowerCase();

    const clientEmail = (email || '').trim().toLowerCase();

    // Hedef slug belirlenmemişse, e-posta veya UID üzerinden bul
    if (!targetSlug && uid) {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const udata = userSnap.data();
        targetSlug = udata.pendingCoupleSlug || udata.coupleSlug || '';
      }
    }

    if (!targetSlug && (sEmail || clientEmail)) {
      const lookupEmail = sEmail || clientEmail;
      const q = query(collection(db, 'couples'), where('authorized_emails', 'array-contains', lookupEmail));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const list = snap.docs.map((d) => d.data());
        const target = list.find((c) => !c.isPaid) || list[0];
        targetSlug = target.slug;
      }
    }

    if (!targetSlug || targetSlug === 'demo') {
      return NextResponse.json(
        { success: false, error: 'Bu sipariş numarasıyla eşleşen bir çift sitesi bulunamadı. Lütfen siparişi oluştururken girdiğiniz e-postayı kontrol ediniz.' },
        { status: 404 }
      );
    }

    // 6. Güvenlik: Sipariş sahibinin e-postası ile çift sitesinin yetkili e-postalarını karşılaştır
    const couple = await getCoupleBySlug(targetSlug);
    if (!couple) {
      return NextResponse.json({ success: false, error: 'Çift sitesi bulunamadı.' }, { status: 404 });
    }

    const authorizedEmails = (couple.authorized_emails || []).map((e: string) => e.toLowerCase().trim());
    if (couple.partner1_email) authorizedEmails.push(couple.partner1_email.toLowerCase().trim());
    if (couple.partner2_email) authorizedEmails.push(couple.partner2_email.toLowerCase().trim());
    if (couple.owner_email) authorizedEmails.push(couple.owner_email.toLowerCase().trim());

    const isEmailMatched =
      !sEmail || // Shopier'da email yoksa
      authorizedEmails.includes(sEmail) ||
      (clientEmail && authorizedEmails.includes(clientEmail) && clientEmail === sEmail);

    if (!isEmailMatched && authorizedEmails.length > 0) {
      console.warn(`[VerifyPayment] Email mismatch: Shopier email (${sEmail}) not in couple authorized emails:`, authorizedEmails);
      return NextResponse.json(
        { success: false, error: 'Sipariş sahibi e-postası ile çift sitesi e-postası uyuşmuyor.' },
        { status: 403 }
      );
    }

    // 2b. Replay Attack Koruması (Yükseltme Siparişleri):
    const existingUpgradeQuery = query(collection(db, 'couples'), where('upgrade_order_id', '==', cleanOrderId));
    const existingUpgradeSnap = await getDocs(existingUpgradeQuery);
    if (!existingUpgradeSnap.empty) {
      const alreadyUpgraded = existingUpgradeSnap.docs[0].data();
      if (alreadyUpgraded.plan === 'yearly_premium') {
        return NextResponse.json({
          success: true,
          slug: alreadyUpgraded.slug,
          plan: 'yearly_premium',
          message: 'Bu yükseltme siparişi zaten onaylanmış ve siteniz Premium VIP pakettedir.',
        });
      }
    }

    // 7. Paket Türünü Shopier Ürün ID veya Tutara Göre Belirle
    const sProdId = String(sOrder.lineItems?.[0]?.productId || '');
    const upgradeProductId = (process.env.SHOPIER_PRODUCT_ID_UPGRADE || '50813693').trim();
    const itemName = String(sOrder.lineItems?.[0]?.name || '').toLowerCase();
    const orderTotal = parseFloat(sOrder.total || '0');

    const isUpgradeOrder =
      Boolean(body.isUpgrade || body.is_upgrade) ||
      sProdId === upgradeProductId ||
      sProdId === '50813693' ||
      itemName.includes('yukselt') ||
      itemName.includes('yükselt') ||
      itemName.includes('upgrade') ||
      (orderTotal >= 140 && orderTotal <= 165);

    let plan: 'yearly_standard' | 'yearly_premium' = 'yearly_standard';

    if (isUpgradeOrder || sProdId === '50201191' || orderTotal >= 350 || itemName.includes('vip') || itemName.includes('premium')) {
      plan = 'yearly_premium';
    } else if (sProdId === '50201181') {
      plan = 'yearly_standard';
    } else {
      plan = 'yearly_standard';
    }

    // 8. Çift Sitesini Onayla ve Aktif Et
    await activateCouplePayment(targetSlug, plan);

    // Sipariş numarasını çift belgesine kaydet (mükerrer kullanımı önlemek için)
    await setDoc(
      doc(db, 'couples', targetSlug),
      {
        ...(isUpgradeOrder
          ? {
              upgrade_order_id: cleanOrderId,
              upgraded_at: serverTimestamp(),
              pending_upgrade: false,
              plan: 'yearly_premium',
              package_type: 'yearly_premium',
            }
          : { shopier_order_id: cleanOrderId }),
        verified_manually_at: serverTimestamp(),
      },
      { merge: true }
    );

    // Kullanıcı belgesini güncelle
    if (uid) {
      try {
        await setDoc(
          doc(db, 'users', uid),
          {
            plan,
            package_type: plan,
            hasActiveSubscription: true,
            hasPurchasedSite: true,
            coupleSlug: targetSlug,
            ...(isUpgradeOrder ? { isUpgraded: true, upgradedAt: serverTimestamp() } : {}),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (uErr) {
        console.error('Error updating user document in verify route:', uErr);
      }
    }

    // Tebrik e-postası gönder
    const targetEmail = sEmail || clientEmail || couple.partner1_email || couple.authorized_emails?.[0];
    if (targetEmail) {
      sendOrderSuccessEmail({
        to: targetEmail,
        partner1Name: couple.partner1_name || 'Partner 1',
        partner2Name: couple.partner2_name || 'Partner 2',
        slug: targetSlug,
        plan,
        inviteCode: couple.inviteCode || couple.pair_code || '',
        orderId: cleanOrderId,
      }).catch((err) => console.error('Error sending order success email in verify route:', err));
    }

    console.log(`[VerifyPayment SUCCESS] Activated/Upgraded ${targetSlug} with plan ${plan}, orderId: ${cleanOrderId}`);

    return NextResponse.json({
      success: true,
      slug: targetSlug,
      plan,
      isUpgrade: isUpgradeOrder,
      message: isUpgradeOrder
        ? 'Tebrikler! Siteniz başarıyla Premium VIP pakete yükseltildi! 🎉'
        : 'Siteniz başarıyla onaylandı ve 1 yıllık yayına alındı! 🎉',
    });
  } catch (error: any) {
    console.error('Error in /api/payment/verify:', error);
    return NextResponse.json({ success: false, error: error.message || 'Doğrulama sırasında beklenmeyen hata oluştu.' }, { status: 500 });
  }
}

