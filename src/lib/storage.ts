import { storage, isFirebaseConfigured } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function uploadFileToStorage(
  file: File,
  slug: string = 'irem-muhammet',
  folder: 'music' | 'photos' = 'photos'
): Promise<string | null> {
  if (isFirebaseConfigured && storage) {
    try {
      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `couples-assets/${slug}/${folder}/${fileName}`;

      const storageRef = ref(storage, filePath);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);

      return downloadUrl;
    } catch (e) {
      console.error('Firebase Storage upload error:', e);
    }
  }

  // Fallback blob URL for client-side testing when Firebase credentials are dummy/offline
  return URL.createObjectURL(file);
}

// Backwards compatibility alias
export const uploadFileToSupabase = uploadFileToStorage;
