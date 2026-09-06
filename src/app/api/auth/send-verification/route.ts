import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const adminMod = await import('@/lib/firebaseAdmin');
    const mailMod = await import('@/lib/mail');

    return NextResponse.json({
      status: 'ok',
      modulesLoaded: true,
      hasClientEmail: Boolean(process.env.FIREBASE_CLIENT_EMAIL),
      hasPrivateKey: Boolean(process.env.FIREBASE_PRIVATE_KEY),
      hasGmailUser: Boolean(process.env.GMAIL_USER),
      hasGmailPass: Boolean(process.env.GMAIL_APP_PASSWORD),
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://www.asksite.com.tr',
    });
  } catch (err: any) {
    console.error('[Diagnostic GET] Error:', err);
    return NextResponse.json({
      status: 'error',
      message: err?.message,
      stack: err?.stack,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, error: 'Geçersiz e-posta adresi.' }, { status: 400 });
    }

    const hasAdminConfig = Boolean(
      process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY
    );

    const hasMailConfig = Boolean(
      process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS
    );

    // If server credentials are not yet added, signal client to fallback gracefully
    if (!hasAdminConfig || !hasMailConfig) {
      console.warn('[SendVerification] Admin SDK or SMTP not fully configured. Falling back to client verification.');
      return NextResponse.json({
        success: false,
        fallbackToClient: true,
        reason: 'CREDENTIALS_MISSING',
      });
    }

    // Dynamic import to protect serverless container from import-time crashes
    const { getFirebaseAdmin, getAuth } = await import('@/lib/firebaseAdmin');
    const { sendVerificationEmail } = await import('@/lib/mail');

    const app = getFirebaseAdmin();
    const adminAuth = getAuth(app);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.asksite.com.tr';
    const actionCodeSettings = {
      url: `${appUrl}/checkout`,
      handleCodeInApp: false,
    };

    let link: string;
    try {
      link = await adminAuth.generateEmailVerificationLink(email, actionCodeSettings);
    } catch (urlErr: any) {
      console.warn('[SendVerification] generateEmailVerificationLink failed with continue URL, retrying without actionCodeSettings:', urlErr?.message);
      link = await adminAuth.generateEmailVerificationLink(email);
    }

    const result = await sendVerificationEmail({
      to: email,
      name,
      verificationLink: link,
    });

    if (!result.success) {
      console.warn('[SendVerification] sendVerificationEmail failed:', result.reason);
      return NextResponse.json({
        success: false,
        fallbackToClient: true,
        reason: result.reason,
      });
    }

    console.log('[SendVerification] Custom HTML verification email sent successfully to:', email);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[SendVerification] Exception in verification endpoint:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    });
    return NextResponse.json({
      success: false,
      fallbackToClient: true,
      error: error?.message,
      code: error?.code,
    });
  }
}
