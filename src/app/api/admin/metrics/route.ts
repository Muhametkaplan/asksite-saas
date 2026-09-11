import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/adminAuth';
import { getAdminFirestore } from '@/lib/firebaseAdmin';

export async function GET(req: NextRequest) {
  const session = getAdminSessionFromRequest(req);
  if (!session.valid) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
  }

  try {
    let totalCouples = 0;
    let activeCouples = 0;
    let passiveCouples = 0;
    let paidCouples = 0;
    const packageCounts: Record<string, number> = {
      yearly: 0,
      lifetime: 0,
      nfc: 0,
      digital: 0,
      other: 0,
    };

    let totalUsers = 0;
    let verifiedUsers = 0;

    const db = getAdminFirestore();

    // Fetch Couples
    try {
      const couplesSnap = await db.collection('couples').get();
      totalCouples = couplesSnap.size;
      couplesSnap.docs.forEach((doc) => {
        const data = doc.data();
        if (data.is_active !== false) activeCouples++;
        else passiveCouples++;

        if (data.isPaid === true) paidCouples++;

        const pkg = (data.package_type || data.plan || '').toLowerCase();
        if (pkg.includes('nfc')) packageCounts.nfc++;
        else if (pkg.includes('lifetime') || pkg.includes('vip') || pkg.includes('349') || pkg.includes('399')) packageCounts.lifetime++;
        else if (pkg.includes('year') || pkg.includes('199') || pkg.includes('digital')) packageCounts.yearly++;
        else packageCounts.other++;
      });
    } catch (e) {
      console.error('Error fetching couples for metrics:', e);
    }

    // Fetch Users
    try {
      const usersSnap = await db.collection('users').get();
      totalUsers = usersSnap.size;
      usersSnap.docs.forEach((doc) => {
        const data = doc.data();
        if (data.emailVerified) verifiedUsers++;
      });
    } catch (e) {
      console.error('Error fetching users for metrics:', e);
    }

    // Fetch Shopier Live Orders to compute Real Revenue
    let totalRevenue = 0;
    let totalOrders = 0;
    let completedOrders = 0;
    let shopierStatus = 'offline';
    let recentOrders: any[] = [];

    const shopierToken = (process.env.SHOPIER_API_TOKEN || '').trim().replace(/^"|"$/g, '');
    if (shopierToken) {
      try {
        const sRes = await fetch('https://api.shopier.com/v1/orders', {
          headers: { Authorization: `Bearer ${shopierToken}` },
          next: { revalidate: 30 },
        });

        if (sRes.ok) {
          const sData = await sRes.json();
          shopierStatus = 'connected';
          const items = Array.isArray(sData) ? sData : sData.items || sData.data || [];
          totalOrders = items.length;

          items.forEach((item: any) => {
            const price = parseFloat(
              item.totals?.total ?? item.total_amount ?? item.price ?? item.total ?? 0
            );
            const paymentStatus = (item.paymentStatus || '').toLowerCase();
            const status = (item.status || '').toLowerCase();
            const isCompleted = paymentStatus === 'paid' || status === 'completed' || status === 'unfulfilled' || status === 'success';

            if (isCompleted) {
              totalRevenue += isNaN(price) ? 0 : price;
              completedOrders++;
            }
          });

          recentOrders = items.slice(0, 5).map((o: any) => {
            const buyerName = o.shippingInfo
              ? `${o.shippingInfo.firstName || ''} ${o.shippingInfo.lastName || ''}`.trim()
              : `${o.buyer_name || ''} ${o.buyer_surname || ''}`.trim() || 'Müşteri';
            const email = o.shippingInfo?.email || o.buyer_email || o.email || '';
            const phone = o.shippingInfo?.phone || o.buyer_phone || o.phone || '';
            const total = parseFloat(o.totals?.total ?? o.total_amount ?? o.price ?? 0);

            return {
              id: o.id || o.order_id,
              total,
              currency: o.currency || 'TRY',
              buyer: buyerName || email,
              email,
              phone,
              createdAt: o.dateCreated || o.created_at || o.createdAt,
              status: o.paymentStatus === 'paid' ? 'Ödendi' : (o.status || 'Açık'),
            };
          });
        } else {
          shopierStatus = `api_error_${sRes.status}`;
        }
      } catch (err: any) {
        shopierStatus = 'fetch_failed';
        console.error('Error fetching Shopier orders for metrics:', err);
      }
    }

    // If Shopier returned 0 orders, estimate from paid couples
    if (totalOrders === 0 && totalRevenue === 0 && paidCouples > 0) {
      totalRevenue =
        packageCounts.yearly * 199 +
        packageCounts.lifetime * 349 +
        packageCounts.nfc * 499;
    }

    return NextResponse.json({
      success: true,
      metrics: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalOrders,
        completedOrders,
        totalCouples,
        activeCouples,
        passiveCouples,
        paidCouples,
        totalUsers,
        verifiedUsers,
        packageCounts,
        recentOrders,
      },
      health: {
        firebase: db ? 'connected' : 'disconnected',
        shopier: shopierStatus,
        emailService: process.env.GMAIL_USER ? 'configured' : 'missing_credentials',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Metrikler alınamadı.' }, { status: 500 });
  }
}
