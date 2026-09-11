/**
 * Shopier Güvenli Ödeme ve Sipariş Doğrulama Yardımcısı
 * 
 * Bu modül, Shopier REST API üzerinden siparişlerin durumunu doğrudan teyit eder.
 * Sahte callback, sahte verify veya manipüle edilmiş parametrelere izin vermez.
 */

export interface VerifiedShopierOrder {
  orderId: string;
  isPaid: boolean;
  buyerEmail: string;
  productId: string;
  total: number;
  plan: 'yearly_standard' | 'yearly_premium';
  raw: any;
}

export async function verifyShopierOrder(
  orderId: string
): Promise<{ success: boolean; order?: VerifiedShopierOrder; error?: string }> {
  const cleanId = (orderId || '').trim();
  if (!cleanId) {
    return { success: false, error: 'Sipariş numarası boş olamaz.' };
  }

  const token = (process.env.SHOPIER_API_TOKEN || '').trim().replace(/^"|"$/g, '');
  if (!token) {
    console.error('[ShopierHelper] SHOPIER_API_TOKEN yapılandırılmamış!');
    return { success: false, error: 'Ödeme doğrulama servisi yapılandırılamadı.' };
  }

  try {
    const res = await fetch(`https://api.shopier.com/v1/orders/${encodeURIComponent(cleanId)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      return { success: false, error: `Shopier siparişi bulunamadı (HTTP ${res.status}).` };
    }

    const data = await res.json();
    const isPaid =
      data &&
      (data.paymentStatus === 'paid' ||
        data.status === 'fulfilled' ||
        data.status === 'unfulfilled');

    if (!isPaid) {
      return { success: false, error: 'Sipariş Shopier üzerinde henüz ödenmemiş veya iptal edilmiştir.' };
    }

    const email = (
      data.shippingInfo?.email ||
      data.billingInfo?.email ||
      data.buyer_email ||
      data.email ||
      ''
    ).trim().toLowerCase();

    const productId = String(data.lineItems?.[0]?.productId || '');
    const total = parseFloat(data.total || '0');

    let plan: 'yearly_standard' | 'yearly_premium' = 'yearly_standard';
    if (productId === '50201191') {
      plan = 'yearly_premium';
    } else if (productId === '50201181') {
      plan = 'yearly_standard';
    } else {
      plan = total >= 350 ? 'yearly_premium' : 'yearly_standard';
    }

    return {
      success: true,
      order: {
        orderId: cleanId,
        isPaid: true,
        buyerEmail: email,
        productId,
        total,
        plan,
        raw: data,
      },
    };
  } catch (err: any) {
    console.error('[ShopierHelper] Connection exception:', err);
    return { success: false, error: 'Shopier sistemine bağlanırken hata oluştu.' };
  }
}
