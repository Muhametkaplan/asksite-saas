import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCredentials, createAdminSessionToken, getAdminSessionFromRequest } from '@/lib/adminAuth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'E-posta ve şifre gereklidir.' }, { status: 400 });
    }

    const isValid = verifyAdminCredentials(email, password);
    if (!isValid) {
      return NextResponse.json({ error: 'Geçersiz yönetici e-postası veya yetki anahtarı.' }, { status: 401 });
    }

    const token = createAdminSessionToken(email);

    const res = NextResponse.json({
      success: true,
      email: email.trim().toLowerCase(),
      token,
      message: 'Yönetici girişi başarılı.',
    });

    // Set secure cookie
    res.cookies.set('asksite_admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Giriş işlemi başarısız.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Check current session
  const session = getAdminSessionFromRequest(req);
  if (session.valid) {
    return NextResponse.json({ authenticated: true, email: session.email });
  }
  return NextResponse.json({ authenticated: false }, { status: 401 });
}

export async function DELETE(req: NextRequest) {
  // Logout
  const res = NextResponse.json({ success: true, message: 'Oturum kapatıldı.' });
  res.cookies.set('asksite_admin_session', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });
  return res;
}
