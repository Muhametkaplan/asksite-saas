import { NextRequest, NextResponse } from 'next/server';
import { resetDatabaseAndCollections } from '@/lib/couples';

export async function POST(req: NextRequest) {
  try {
    const res = await resetDatabaseAndCollections();
    return NextResponse.json({
      message: 'Firestore veritabanı (couples, users ve tüm alt koleksiyonlar) başarıyla sıfırlandı.',
      ...res,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Veritabanı sıfırlanırken hata oluştu.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const res = await resetDatabaseAndCollections();
    return NextResponse.json({
      message: 'Firestore veritabanı (couples, users ve tüm alt koleksiyonlar) başarıyla sıfırlandı.',
      ...res,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Veritabanı sıfırlanırken hata oluştu.' }, { status: 500 });
  }
}
