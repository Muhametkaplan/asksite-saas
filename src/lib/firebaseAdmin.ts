import { getApps, getApp, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

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

export function getFirebaseAdmin() {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0]!;
  }

  const projectId = cleanString(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) || 'asksite-saas';
  const clientEmail = cleanString(process.env.FIREBASE_CLIENT_EMAIL);
  const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  // Fallback to default credentials or mock if not configured
  return initializeApp({
    projectId,
  });
}

export { getAuth };


