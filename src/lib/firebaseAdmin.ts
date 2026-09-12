import crypto from 'crypto';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

function cleanString(val?: string): string {
  if (!val) return '';
  let clean = val.trim();
  while ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
    clean = clean.slice(1, -1).trim();
  }
  return clean;
}

function formatPrivateKey(rawKey?: string): string {
  if (!rawKey) return '';
  let clean = cleanString(rawKey);
  clean = clean.replace(/\\n/g, '\n').replace(/\r\n/g, '\n');
  return clean;
}

export function getAdminFirestore(): Firestore {
  const projectId = cleanString(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) || 'asksite-saas';
  const clientEmail = cleanString(process.env.FIREBASE_CLIENT_EMAIL);
  const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (!getApps().length) {
    if (clientEmail && privateKey) {
      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
    } else {
      initializeApp({ projectId });
    }
  }

  const db = getFirestore();
  try {
    db.settings({ ignoreUndefinedProperties: true });
  } catch (e) {
    // ignore if already configured
  }
  return db;
}

async function getGoogleAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/identitytoolkit https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const b64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signInput = `${b64Header}.${b64Payload}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signInput);
  const signature = signer.sign(privateKey, 'base64url');

  const assertion = `${signInput}.${signature}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error(`Google OAuth error: ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token;
}

/**
 * Generates official Firebase email verification link directly using Google Cloud Identity Platform REST API.
 * Eliminates native Node/CJS bundle crashes on Vercel Serverless Functions.
 */
export async function generateVerificationLinkNative(email: string, continueUrl?: string): Promise<string> {
  const projectId = cleanString(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) || 'asksite-saas';
  const clientEmail = cleanString(process.env.FIREBASE_CLIENT_EMAIL);
  const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (!clientEmail || !privateKey) {
    throw new Error('MISSING_SERVICE_ACCOUNT_CREDENTIALS');
  }

  const accessToken = await getGoogleAccessToken(clientEmail, privateKey);

  const reqBody: any = {
    requestType: 'VERIFY_EMAIL',
    email,
    returnOobLink: true,
  };

  if (continueUrl) {
    reqBody.continueUrl = continueUrl;
  }

  const oobRes = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:sendOobCode`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(reqBody),
  });

  const oobData = await oobRes.json();
  if (!oobData.oobLink) {
    if (continueUrl) {
      console.warn('[OOB] Failed with continueUrl, retrying without continueUrl:', oobData);
      delete reqBody.continueUrl;
      const retryRes = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:sendOobCode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(reqBody),
      });
      const retryData = await retryRes.json();
      if (retryData.oobLink) {
        return retryData.oobLink;
      }
    }
    throw new Error(`Failed to generate oobLink: ${JSON.stringify(oobData)}`);
  }

  return oobData.oobLink;
}
