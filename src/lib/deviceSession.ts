import { CoupleConfig, AuthenticatedDevice } from '@/types/couple';
import { db, isFirebaseConfigured } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export function getOrCreateDeviceToken(): string {
  if (typeof window === 'undefined') return '';
  let token = localStorage.getItem('asksite_device_token');
  if (!token) {
    token = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    localStorage.setItem('asksite_device_token', token);
  }
  return token;
}

export function isDeviceAuthorized(couple: CoupleConfig): { isAuthorized: boolean; partnerName?: string; role?: 'partner1' | 'partner2' } {
  if (typeof window === 'undefined') return { isAuthorized: false };
  const token = getOrCreateDeviceToken();

  if (!couple.authenticated_devices || couple.authenticated_devices.length === 0) {
    return { isAuthorized: false };
  }

  const found = couple.authenticated_devices.find((d) => d.device_token === token);
  if (found) {
    const determinedRole: 'partner1' | 'partner2' =
      found.role ||
      (found.partner_name === couple.partner1_name ||
      (couple.allowed_users?.partner1_email && found.email?.toLowerCase() === couple.allowed_users.partner1_email.toLowerCase())
        ? 'partner1'
        : 'partner2');

    return {
      isAuthorized: true,
      partnerName: found.partner_name,
      role: determinedRole,
    };
  }

  return { isAuthorized: false };
}

export async function registerDeviceToken(
  slug: string,
  partnerName: string,
  email?: string,
  uid?: string,
  role?: 'partner1' | 'partner2'
): Promise<boolean> {
  const token = getOrCreateDeviceToken();

  if (isFirebaseConfigured && db) {
    try {
      const coupleRef = doc(db, 'couples', slug);
      const snap = await getDoc(coupleRef);
      if (snap.exists()) {
        const data = snap.data();
        const devices: AuthenticatedDevice[] = data.authenticated_devices || [];
        
        const existingIdx = devices.findIndex((d) => d.device_token === token);
        const newDevice: AuthenticatedDevice = {
          device_token: token,
          partner_name: partnerName,
          role: role || (partnerName === data.partner1_name ? 'partner1' : 'partner2'),
          email: email || '',
          uid: uid || '',
          added_at: new Date().toISOString(),
        };

        if (existingIdx >= 0) {
          devices[existingIdx] = newDevice;
        } else {
          devices.push(newDevice);
        }

        await setDoc(coupleRef, { authenticated_devices: devices }, { merge: true });
        return true;
      }
    } catch (e) {
      console.error('Error registering device token in Firestore:', e);
    }
  }

  return true;
}
