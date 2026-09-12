import { NextRequest, NextResponse } from 'next/server';
import { generatePasswordResetLinkNative } from '@/lib/firebaseAdmin';
import { sendPasswordResetEmailTemplate } from '@/lib/mail';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// In-memory rate limiting map (Email/IP -> timestamp)
const rateLimitMap = new Map<string, number>();

// Periodic cleanup of rate limit map every 10 minutes
function cleanOldRateLimits() {
  const now = Date.now();
  for (const [key, timestamp] of rateLimitMap.entries()) {
    if (now - timestamp > 10 * 60 * 1000) {
      rateLimitMap.delete(key);
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    cleanOldRateLimits();

    const body = await req.json().catch(() => ({}));
    const rawEmail = body.email;

    if (!rawEmail || typeof rawEmail !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Lütfen geçerli bir e-posta adresi girin.' },
        { status: 400 }
      );
    }

    const cleanEmail = rawEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail) || cleanEmail.length > 100) {
      return NextResponse.json(
        { success: false, error: 'E-posta adresi biçimi geçersiz.' },
        { status: 400 }
      );
    }

    // IP Extraction for Rate Limiting
    const forwardedFor = req.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown-ip';

    const now = Date.now();
    const emailLastRequest = rateLimitMap.get(`email:${cleanEmail}`);
    const ipLastRequest = rateLimitMap.get(`ip:${clientIp}`);

    // Enforce 60s cooldown per email
    if (emailLastRequest && now - emailLastRequest < 60 * 1000) {
      const waitSec = Math.ceil((60 * 1000 - (now - emailLastRequest)) / 1000);
      return NextResponse.json(
        {
          success: false,
          error: `Çok sık talep gönderdiniz. Lütfen ${waitSec} saniye sonra tekrar deneyin.`,
        },
        { status: 429 }
      );
    }

    // Check environment credentials
    const hasAdminConfig = Boolean(
      process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY
    );
    const hasMailConfig = Boolean(
      process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS
    );

    if (!hasAdminConfig || !hasMailConfig) {
      console.warn('[ForgotPassword] SMTP or Firebase Admin not configured. Falling back to client-side reset.');
      return NextResponse.json({
        success: false,
        fallbackToClient: true,
        reason: 'CREDENTIALS_MISSING',
      });
    }

    // Mark rate limit timestamp
    rateLimitMap.set(`email:${cleanEmail}`, now);
    rateLimitMap.set(`ip:${clientIp}`, now);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.asksite.com.tr';
    const continueUrl = `${appUrl}/login?mode=login`;

    try {
      const { oobLink, oobCode } = await generatePasswordResetLinkNative(cleanEmail, continueUrl);

      // Construct custom branded reset page link if oobCode is present
      let resetUrl = oobLink;
      if (oobCode) {
        resetUrl = `${appUrl}/reset-password?oobCode=${encodeURIComponent(oobCode)}`;
      } else {
        try {
          const parsed = new URL(oobLink);
          const extractedCode = parsed.searchParams.get('oobCode');
          if (extractedCode) {
            resetUrl = `${appUrl}/reset-password?oobCode=${encodeURIComponent(extractedCode)}`;
          }
        } catch {
          // fallback to native oobLink
        }
      }

      await sendPasswordResetEmailTemplate({
        to: cleanEmail,
        resetLink: resetUrl,
      });

      console.log(`[ForgotPassword] Successfully sent branded password reset email to: ${cleanEmail}`);
    } catch (authErr: any) {
      const errMsg = authErr?.message || '';

      // SECURITY: If email is not found in database, do not reveal it to the user!
      // Add a slight realistic timing delay to prevent timing attacks
      if (errMsg.includes('EMAIL_NOT_FOUND')) {
        console.log(`[ForgotPassword] Email not found in auth (${cleanEmail}), obfuscating response.`);
        await new Promise((resolve) => setTimeout(resolve, 350 + Math.random() * 200));
      } else {
        console.error('[ForgotPassword] Error generating link or sending mail:', authErr);
      }
    }

    // Always return a generic success message to prevent user enumeration
    return NextResponse.json({
      success: true,
      message:
        'Eğer bu e-posta adresine kayıtlı bir hesap bulunuyorsa, şifre sıfırlama bağlantısı gönderilmiştir. Lütfen gelen kutunuzu ve spam klasörünüzü kontrol edin.',
    });
  } catch (error: any) {
    console.error('[ForgotPassword API] Critical Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Şifre sıfırlama talebi işlenirken bir hata oluştu. Lütfen birazdan tekrar deneyin.',
      },
      { status: 500 }
    );
  }
}
