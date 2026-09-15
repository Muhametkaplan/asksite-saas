import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebaseAdmin';
import { BucketListItem } from '@/types/couple';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, itemId, completed, items } = body;

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ error: 'Slug zorunludur' }, { status: 400 });
    }

    if (slug === 'demo') {
      return NextResponse.json({ success: true, mode: 'demo' });
    }

    const db = getAdminFirestore();
    const docRef = db.collection('couples').doc(slug);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json({ error: 'Çift profili bulunamadı' }, { status: 404 });
    }

    const data = snap.data() || {};
    let updatedBucketList: BucketListItem[] = [];

    if (Array.isArray(items) && items.length > 0) {
      updatedBucketList = items;
    } else {
      const currentList: BucketListItem[] = Array.isArray(data.bucket_list) ? data.bucket_list : [];
      let found = false;
      updatedBucketList = currentList.map((item) => {
        if (item.id === itemId) {
          found = true;
          const nextCompleted = completed !== undefined ? completed : !item.completed;
          return {
            ...item,
            completed: nextCompleted,
          };
        }
        return item;
      });

      if (!found && itemId) {
        updatedBucketList.push({
          id: itemId,
          title: 'Yeni Rota',
          category: 'activity',
          completed: completed !== undefined ? completed : true,
        });
      }
    }

    await docRef.update({
      bucket_list: updatedBucketList,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      bucket_list: updatedBucketList,
    });
  } catch (err: any) {
    console.error('[BucketList Save Error]:', err);
    return NextResponse.json({ error: err.message || 'Kaydedilemedi' }, { status: 500 });
  }
}
