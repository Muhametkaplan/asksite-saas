import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/adminAuth';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

export async function GET(req: NextRequest) {
  const session = getAdminSessionFromRequest(req);
  if (!session.valid) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const queryText = (searchParams.get('q') || '').toLowerCase().trim();

  try {
    if (!db) {
      return NextResponse.json({ error: 'Veritabanı bağlı değil.' }, { status: 500 });
    }

    const snap = await getDocs(collection(db, 'users'));
    let users = snap.docs.map((d) => {
      const data = d.data();
      return {
        uid: d.id,
        displayName: data.displayName || 'İsimsiz Kullanıcı',
        email: data.email || '',
        phone: data.phone || '',
        couple_slug: data.couple_slug || null,
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

    if (!uid || !db) {
      return NextResponse.json({ error: 'Kullanıcı UID bilgisi gereklidir.' }, { status: 400 });
    }

    const userRef = doc(db, 'users', uid);

    if (action === 'verify_email') {
      await updateDoc(userRef, { emailVerified: true });
      return NextResponse.json({ success: true, message: 'Kullanıcı e-postası doğrulandı.' });
    }

    if (action === 'link_couple') {
      await updateDoc(userRef, { couple_slug: couple_slug || null });
      return NextResponse.json({ success: true, message: 'Kullanıcı çift sitesi güncellendi.' });
    }

    return NextResponse.json({ error: 'Bilinmeyen aksiyon.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'İşlem başarısız.' }, { status: 500 });
  }
}
