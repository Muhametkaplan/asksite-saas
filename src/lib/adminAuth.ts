import crypto from 'crypto';

export function getAdminSecret(): string {
  const envKey = process.env.ADMIN_SECRET_KEY;
  if (envKey && envKey.trim().length > 0) {
    return envKey.replace(/^["']|["']$/g, '').trim();
  }
  return 'AskSiteAdmin2026!*';
}

export function getAdminEmails(): string[] {
  const envEmails = process.env.ADMIN_EMAILS || 'byzehrajewels@gmail.com,muhammet.2713ka@gmail.com,asksitesaas@gmail.com';
  return envEmails
    .replace(/^["']|["']$/g, '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function verifyAdminCredentials(email: string, secretKey: string): boolean {
  if (!email || !secretKey) return false;
  const cleanEmail = email.trim().toLowerCase();
  const cleanKey = secretKey.trim();

  const allowedEmails = getAdminEmails();
  const emailAllowed = allowedEmails.includes(cleanEmail);
  if (!emailAllowed) return false;

  const currentSecret = getAdminSecret();
  if (cleanKey !== currentSecret) return false;

  return true;
}

export function createAdminSessionToken(email: string): string {
  const payload = {
    email: email.trim().toLowerCase(),
    timestamp: Date.now(),
    role: 'super_admin',
  };
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadStr, 'utf-8').toString('base64url');

  const secret = getAdminSecret();
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

export function verifyAdminSessionToken(token?: string | null): { valid: boolean; email?: string } {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return { valid: false };
  }

  try {
    const [payloadB64, signature] = token.split('.');
    if (!payloadB64 || !signature) return { valid: false };

    const secret = getAdminSecret();
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(payloadB64)
      .digest('base64url');

    if (signature.length !== expectedSig.length) {
      return { valid: false };
    }

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return { valid: false };
    }

    const payloadStr = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    const data = JSON.parse(payloadStr);

    // Expire token after 7 days
    const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - data.timestamp > maxAgeMs) {
      return { valid: false };
    }

    const allowed = getAdminEmails();
    if (!allowed.includes(data.email?.toLowerCase())) {
      return { valid: false };
    }

    return { valid: true, email: data.email };
  } catch (e) {
    return { valid: false };
  }
}

export function getAdminSessionFromRequest(req: Request): { valid: boolean; email?: string } {
  // Check Authorization header
  const authHeader = req.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    const verified = verifyAdminSessionToken(token);
    if (verified.valid) return verified;
  }

  // Check Cookie
  const cookieHeader = req.headers.get('cookie') || '';
  const cookies = cookieHeader.split(';').map((c) => c.trim());
  const adminCookie = cookies.find((c) => c.startsWith('asksite_admin_session='));
  if (adminCookie) {
    const token = adminCookie.replace('asksite_admin_session=', '').trim();
    const verified = verifyAdminSessionToken(token);
    if (verified.valid) return verified;
  }

  return { valid: false };
}
