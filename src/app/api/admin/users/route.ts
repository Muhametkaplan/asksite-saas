import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/adminAuth';
import { getAdminFirestore } from '@/lib/firebaseAdmin';

export async function GET(req: NextRequest) {
  const session = getAdminSessionFromRequest(req);
  if (!session.valid) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const queryText = (searchParams.get('q') || '').toLowerCase().trim();

  try {
    const db = getAdminFirestore();
    const snap = await db.collection('users').get();
    let users = snap.docs.map((d) => {
      const data = d.data();
      const coupleSlug = data.coupleSlug || data.couple_slug || data.pendingCoupleSlug || null;
      return {
        uid: d.id,
        displayName: data.displayName || 'İsimsiz Kullanıcı',
        email: data.email || '',
        phone: data.phone || '',
        couple_slug: coupleSlug,
        isPaid: data.isPaid === true,
        emailVerified: data.emailVerified === true,
        createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : null,
        updatedAt: data.updatedAt ? (data.updatedAt.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt) : null,
      };
    });

    if (queryText) {
      users = users.filter(
        (u) =>
          u.displayName.toLowerCase().includes(queryText) ||
          u.email.toLowerCase().includes(queryText) ||
          u.phone.toLowerCase().includes(queryText) ||
          (u.couple_slug && u.couple_slug.toLowerCase().includes(queryText))
      );
    }

    return NextResponse.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (err: any) {
    console.error('Error fetching admin users:', err);
    return NextResponse.json({ error: err.message || 'Kullanıcılar alınamadı.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = getAdminSessionFromRequest(req);
  if (!session.valid) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, uid, couple_slug } = body;

    if (!uid) {
      return NextResponse.json({ error: 'Kullanıcı UID bilgisi gereklidir.' }, { status: 400 });
    }

    const db = getAdminFirestore();
    const userRef = db.collection('users').doc(uid);

    if (action === 'verify_email') {
      await userRef.update({ emailVerified: true });
      return NextResponse.json({ success: true, message: 'Kullanıcı e-postası doğrulandı.' });
    }

    if (action === 'link_couple') {
      await userRef.update({ coupleSlug: couple_slug || null, couple_slug: couple_slug || null });
      return NextResponse.json({ success: true, message: 'Kullanıcı çift sitesi güncellendi.' });
    }

    return NextResponse.json({ error: 'Bilinmeyen aksiyon.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'İşlem başarısız.' }, { status: 500 });
  }
}
