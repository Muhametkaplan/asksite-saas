import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/adminAuth';
import { db } from '@/lib/firebase';
import { collection, getDocs, getDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export async function GET(req: NextRequest) {
  const session = getAdminSessionFromRequest(req);
  if (!session.valid) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const queryText = (searchParams.get('q') || '').toLowerCase().trim();
  const statusFilter = searchParams.get('status') || 'all';

  try {
    if (!db) {
      return NextResponse.json({ error: 'Veritabanı bağlı değil.' }, { status: 500 });
    }

    const snap = await getDocs(collection(db, 'couples'));
    let couples = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        slug: data.slug || d.id,
        partner1_name: data.partner1_name || 'Partner 1',
        partner2_name: data.partner2_name || 'Partner 2',
        partner1_email: data.partner1_email || '',
        partner2_email: data.partner2_email || '',
        owner_email: data.owner_email || '',
        owner_uid: data.owner_uid || '',
        isPaid: data.isPaid === true,
        package_type: data.package_type || data.plan || 'yearly_standard',
        plan: data.plan || data.package_type || 'yearly_standard',
        expires_at: data.expires_at || null,
        subscription_status: data.subscription_status || (data.isPaid ? 'active' : 'expired'),
        is_active: data.is_active !== false,
        partner1_pin: data.allowed_users?.partner1_pin || data.partner1_pin || '1234',
        partner2_pin: data.allowed_users?.partner2_pin || data.partner2_pin || '5678',
        whatsapp_number: data.whatsapp_number || '',
        start_date: data.start_date || '',
        shipping_address: data.shipping_address || null,
        created_at: data.created_at || null,
        paid_at: data.paid_at || null,
        shopier_order_id: data.shopier_order_id || null,
      };
    });

    // Apply Search Filter
    if (queryText) {
      couples = couples.filter(
        (c) =>
          c.slug.toLowerCase().includes(queryText) ||
          c.partner1_name.toLowerCase().includes(queryText) ||
          c.partner2_name.toLowerCase().includes(queryText) ||
          c.partner1_email.toLowerCase().includes(queryText) ||
          c.partner2_email.toLowerCase().includes(queryText) ||
          c.owner_email.toLowerCase().includes(queryText)
      );
    }

    // Apply Status Filter
    if (statusFilter === 'active') {
      couples = couples.filter((c) => c.is_active);
    } else if (statusFilter === 'passive') {
      couples = couples.filter((c) => !c.is_active);
    } else if (statusFilter === 'paid') {
      couples = couples.filter((c) => c.isPaid);
    } else if (statusFilter === 'unpaid') {
      couples = couples.filter((c) => !c.isPaid);
    }

    // Sort: Newest first
    couples.sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });

    return NextResponse.json({
      success: true,
      count: couples.length,
      couples,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Çiftler alınamadı.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = getAdminSessionFromRequest(req);
  if (!session.valid) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { slug, updates } = body;

    if (!slug || !updates || !db) {
      return NextResponse.json({ error: 'Slug ve güncellenecek alanlar gereklidir.' }, { status: 400 });
    }

    const docRef = doc(db, 'couples', slug);
    const snap = await getDoc(docRef);
    const coupleData = snap.exists() ? snap.data() : null;

    const payload: Record<string, any> = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (updates.isPaid !== undefined) {
      const isPaidBool = updates.isPaid === true;
      payload.isPaid = isPaidBool;
      if (isPaidBool) {
        payload.isActive = true;
        payload.is_active = true;
      }
    }

    if (updates.package_type || updates.plan) {
      const p = updates.package_type || updates.plan;
      payload.package_type = p;
      payload.plan = p;
      if (!updates.expires_at) {
        payload.expires_at = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      }
      payload.subscription_status = 'active';
    }

    if (updates.is_active !== undefined) {
      payload.is_active = updates.is_active;
      payload.isActive = updates.is_active;
    }

    await updateDoc(docRef, payload);

    // Sync with owner user in users collection if exists
    const ownerUid = coupleData?.owner_uid || coupleData?.partner1_uid;
    if (ownerUid) {
      const userRef = doc(db, 'users', ownerUid);
      if (updates.isPaid === true || updates.package_type || updates.plan) {
        await updateDoc(userRef, {
          hasPurchasedSite: true,
          hasActiveSubscription: true,
          isPaid: true,
          package_type: payload.package_type || coupleData?.package_type || 'yearly_standard',
          coupleSlug: slug,
          pendingCoupleSlug: null,
          updatedAt: new Date().toISOString(),
        }).catch(() => {});
      } else if (updates.isPaid === false) {
        await updateDoc(userRef, {
          hasPurchasedSite: false,
          hasActiveSubscription: false,
          isPaid: false,
          pendingCoupleSlug: slug,
          updatedAt: new Date().toISOString(),
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      message: `${slug} çift bilgileri ve ödeme durumu güncellendi.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Güncelleme başarısız.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = getAdminSessionFromRequest(req);
  if (!session.valid) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (!slug || !db) {
      return NextResponse.json({ error: 'Silinecek çift slug bilgisi gereklidir.' }, { status: 400 });
    }

    if (slug === 'demo') {
      return NextResponse.json({ error: 'Demo çifti silinemez.' }, { status: 400 });
    }

    // Delete subcollections
    const subCols = [
      'modules_memories',
      'modules_bucket',
      'modules_coupons',
      'modules_diary',
      'modules_capsule',
      'modules_cinema',
      'modules_wheel',
      'modules_quiz',
      'modules_map_markers',
      'modules_canvas',
      'canvas_drawings',
    ];

    for (const sub of subCols) {
      try {
        const subSnap = await getDocs(collection(db, `couples/${slug}/${sub}`));
        for (const subDoc of subSnap.docs) {
          await deleteDoc(subDoc.ref);
        }
      } catch (e) {}
    }

    // Delete root couple document
    const docRef = doc(db, 'couples', slug);
    await deleteDoc(docRef);

    return NextResponse.json({
      success: true,
      message: `${slug} çifti ve tüm verileri kalıcı olarak silindi.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Silme işlemi başarısız.' }, { status: 500 });
  }
}
