import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { getAuth } from 'firebase-admin/auth';
import { sendVerificationEmail } from '@/lib/mail';

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

    // If server credentials are not yet added to .env.local, signal client to fallback
    if (!hasAdminConfig || !hasMailConfig) {
      console.warn('[SendVerification] Admin SDK or SMTP not fully configured. Falling back to client verification.');
      return NextResponse.json({
        success: false,
        fallbackToClient: true,
        reason: 'CREDENTIALS_MISSING',
      });
    }

    const app = getFirebaseAdmin();
    const adminAuth = getAuth(app);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.asksite.com.tr';
    const actionCodeSettings = {
      url: `${appUrl}/checkout`,
      handleCodeInApp: false,
    };

    const link = await adminAuth.generateEmailVerificationLink(email, actionCodeSettings);

    const result = await sendVerificationEmail({
      to: email,
      name,
      verificationLink: link,
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        fallbackToClient: true,
        reason: result.reason,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[SendVerification] Error generating or sending verification email:', error);
    return NextResponse.json(
      { success: false, fallbackToClient: true, error: error.message },
      { status: 500 }
    );
  }
}
