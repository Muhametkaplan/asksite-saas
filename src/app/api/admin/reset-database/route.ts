import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/adminAuth';
import { resetDatabaseAndCollections } from '@/lib/couples';

export async function POST(req: NextRequest) {
  try {
    // 1. Yetki Kontrolü: Sadece doğrulanmış Süper Adminler çağırabilir
    const session = getAdminSessionFromRequest(req);
    if (!session.valid) {
      return NextResponse.json(
        { error: 'Yetkisiz erişim. Bu işlem sadece doğrulanmış süper yöneticiler tarafından çalıştırılabilir.' },
        { status: 401 }
      );
    }

    // 2. Yanlışlıkla çalıştırmayı önlemek için zorunlu onay parametresi
    const body = await req.json().catch(() => ({}));
    if (body.confirm !== 'RESET_DATABASE_CONFIRMED_BY_SUPERADMIN') {
      return NextResponse.json(
        { error: 'Güvenlik doğrulaması başarısız. Veritabanını sıfırlamak için onay parametresi gereklidir.' },
        { status: 400 }
      );
    }

    const res = await resetDatabaseAndCollections();
    return NextResponse.json({
      message: 'Firestore veritabanı başarıyla sıfırlandı.',
      ...res,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Veritabanı sıfırlanırken hata oluştu.' }, { status: 500 });
  }
}

