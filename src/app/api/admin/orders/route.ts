import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/adminAuth';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { sendOrderSuccessEmail } from '@/lib/mail';

export async function GET(req: NextRequest) {
  const session = getAdminSessionFromRequest(req);
  if (!session.valid) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const queryText = (searchParams.get('q') || '').toLowerCase().trim();

  try {
    const shopierToken = (process.env.SHOPIER_API_TOKEN || '').trim().replace(/^"|"$/g, '');
    let rawOrders: any[] = [];

    if (shopierToken) {
      try {
        const sRes = await fetch('https://api.shopier.com/v1/orders', {
          headers: { Authorization: `Bearer ${shopierToken}` },
          cache: 'no-store',
        });
        if (sRes.ok) {
          const data = await sRes.json();
          rawOrders = Array.isArray(data) ? data : data.items || data.data || [];
        }
      } catch (err) {
        console.error('Error fetching Shopier orders:', err);
      }
    }

    // Fetch all couples to cross-reference
    const couplesMap: Record<string, any> = {};
    const emailToCoupleMap: Record<string, any> = {};
    const orderIdToCoupleMap: Record<string, any> = {};

    if (db) {
      const snap = await getDocs(collection(db, 'couples'));
      snap.docs.forEach((d) => {
        const c = d.data();
        couplesMap[c.slug] = c;
        if (c.shopier_order_id) {
          orderIdToCoupleMap[String(c.shopier_order_id)] = c;
        }
        if (c.partner1_email) emailToCoupleMap[c.partner1_email.toLowerCase()] = c;
        if (c.partner2_email) emailToCoupleMap[c.partner2_email.toLowerCase()] = c;
        if (c.owner_email) emailToCoupleMap[c.owner_email.toLowerCase()] = c;
        if (Array.isArray(c.authorized_emails)) {
          c.authorized_emails.forEach((em: string) => {
            if (em) emailToCoupleMap[em.toLowerCase()] = c;
          });
        }
      });
    }

    // Correlate and format orders
    let enriched = rawOrders.map((o: any) => {
      const orderId = String(o.id || o.order_id || '');
      const email = (
        o.shippingInfo?.email ||
        o.buyer_email ||
        o.email ||
        ''
      ).toLowerCase().trim();
      const matchedCouple = orderIdToCoupleMap[orderId] || emailToCoupleMap[email] || null;

      const buyerName = o.shippingInfo
        ? `${o.shippingInfo.firstName || ''} ${o.shippingInfo.lastName || ''}`.trim()
        : `${o.buyer_name || ''} ${o.buyer_surname || ''}`.trim() || 'Müşteri';

      const totalVal = parseFloat(o.totals?.total ?? o.total_amount ?? o.price ?? 0);
      const phone = o.shippingInfo?.phone || o.buyer_phone || o.phone || '';
      const address = o.shippingInfo
        ? `${o.shippingInfo.address || ''}${o.shippingInfo.district ? ', ' + o.shippingInfo.district : ''}${o.shippingInfo.city ? ' / ' + o.shippingInfo.city : ''}`.trim()
        : '';
      const productTitle = o.lineItems?.[0]?.title || '';
      const isPaid = (o.paymentStatus || '').toLowerCase() === 'paid' || (o.status || '').toLowerCase() === 'unfulfilled';

      return {
        id: orderId,
        total: totalVal,
        currency: o.currency || 'TRY',
        status: isPaid ? 'paid' : (o.status || 'unfulfilled'),
        statusDisplay: (o.status || '').toLowerCase() === 'unfulfilled' ? 'Açık Sipariş' : 'Tamamlandı',
        productTitle,
        buyerName,
        buyerEmail: email,
        buyerPhone: phone,
        shippingAddress: address,
        note: o.note || '',
        createdAt: o.dateCreated || o.created_at || o.createdAt,
        matchedCoupleSlug: matchedCouple ? matchedCouple.slug : null,
        matchedCoupleNames: matchedCouple ? `${matchedCouple.partner1_name} & ${matchedCouple.partner2_name}` : null,
        matchedCouplePaid: matchedCouple ? matchedCouple.isPaid : false,
        matchedCoupleActive: matchedCouple ? matchedCouple.is_active : false,
        matchedCouplePackage: matchedCouple ? matchedCouple.package_type || matchedCouple.plan : null,
      };
    });

    // If query filter is provided
    if (queryText) {
      enriched = enriched.filter(
        (o) =>
          o.id.toLowerCase().includes(queryText) ||
          o.buyerName.toLowerCase().includes(queryText) ||
          o.buyerEmail.toLowerCase().includes(queryText) ||
          (o.matchedCoupleSlug && o.matchedCoupleSlug.toLowerCase().includes(queryText)) ||
          (o.matchedCoupleNames && o.matchedCoupleNames.toLowerCase().includes(queryText))
      );
    }

    return NextResponse.json({
      success: true,
      count: enriched.length,
      orders: enriched,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Siparişler alınamadı.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = getAdminSessionFromRequest(req);
  if (!session.valid) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, slug, orderId, email, plan, partner1, partner2 } = body;

    if (!action) {
      return NextResponse.json({ error: 'Aksiyon belirtilmedi.' }, { status: 400 });
    }

    // Action 1: Manuel Aktivasyon
    if (action === 'activate_couple') {
      if (!slug || !db) {
        return NextResponse.json({ error: 'Çift slug parametresi gereklidir.' }, { status: 400 });
      }

      const docRef = doc(db, 'couples', slug);
      const isLifetime = (plan || '').toLowerCase().includes('lifetime') || (plan || '').toLowerCase().includes('nfc');
      const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

      await updateDoc(docRef, {
        isPaid: true,
        is_active: true,
        package_type: plan || 'lifetime',
        plan: isLifetime ? 'lifetime' : '1_year',
        paid_at: new Date().toISOString(),
        expires_at: isLifetime ? null : oneYearLater,
        shopier_order_id: orderId ? String(orderId) : 'MANUAL_ADMIN_ACTIVATION',
      });

      return NextResponse.json({
        success: true,
        message: `${slug} çifti başarıyla VIP/Aktif yapıldı.`,
      });
    }

    // Action 2: Aktivasyon E-postası Gönder
    if (action === 'resend_email') {
      if (!email || !slug) {
        return NextResponse.json({ error: 'E-posta ve slug gereklidir.' }, { status: 400 });
      }

      const isLifetime = (plan || '').toLowerCase().includes('lifetime') || (plan || '').toLowerCase().includes('nfc');
      const planName = (plan || '').toLowerCase().includes('nfc')
        ? 'NFC Akıllı Kartlı Özel Hediye Kutusu'
        : isLifetime
        ? 'Ömür Boyu Sınırsız VIP Paket'
        : '1 Yıllık Dijital Aşk Paketi';

      const mailRes = await sendOrderSuccessEmail({
        to: email,
        partner1Name: partner1 || 'Partner 1',
        partner2Name: partner2 || 'Partner 2',
        slug: slug,
        orderId: orderId || 'MANUAL-' + Date.now(),
        plan: isLifetime ? 'lifetime' : '1_year',
      });

      return NextResponse.json({
        success: mailRes.success,
        message: mailRes.success ? 'E-posta başarıyla gönderildi.' : 'E-posta gönderilemedi.',
        details: mailRes,
      });
    }

    return NextResponse.json({ error: 'Bilinmeyen aksiyon.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'İşlem başarısız.' }, { status: 500 });
  }
}
