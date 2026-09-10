import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/adminAuth';
import { sendOrderSuccessEmail } from '@/lib/mail';

export async function POST(req: NextRequest) {
  const session = getAdminSessionFromRequest(req);
  if (!session.valid) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
  }

  try {
    const { targetEmail } = await req.json();
    if (!targetEmail) {
      return NextResponse.json({ error: 'Hedef e-posta adresi gereklidir.' }, { status: 400 });
    }

    const res = await sendOrderSuccessEmail({
      to: targetEmail,
      partner1Name: 'Test Partner 1',
      partner2Name: 'Test Partner 2',
      slug: 'test-couple-' + Date.now().toString().slice(-4),
      orderId: 'TEST-' + Math.floor(100000 + Math.random() * 900000),
      plan: 'lifetime',
    });

    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'E-posta testi başarısız.' }, { status: 500 });
  }
}
