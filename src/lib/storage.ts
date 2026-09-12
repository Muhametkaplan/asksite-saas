import { storage, isFirebaseConfigured } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Compresses an image file client-side using an HTML5 Canvas to keep file sizes small (~50KB-120KB)
 * and ensure lightning-fast loading across all mobile devices.
 */
export function compressImageToDataUrl(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadFileToStorage(
  file: File,
  slug: string = 'demo',
  folder: 'music' | 'photos' = 'photos'
): Promise<string> {
  // 1. If Firebase Storage is configured, try uploading to cloud storage bucket
  if (isFirebaseConfigured && storage) {
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `couples-assets/${slug}/${folder}/${fileName}`;

      const storageRef = ref(storage, filePath);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);

      if (downloadUrl) {
        return downloadUrl;
      }
    } catch (e) {
      console.warn('Firebase Storage upload failed, using optimized local compression fallback:', e);
    }
  }

  // 2. Fallback for images: Compress client-side to compact base64 data URL (works everywhere, permanent, no backend storage needed)
  if (file.type.startsWith('image/')) {
    try {
      const compressedDataUrl = await compressImageToDataUrl(file);
      if (compressedDataUrl) {
        return compressedDataUrl;
      }
    } catch (err) {
      console.error('Local image compression failed:', err);
    }
  }

  // 3. Ultimate fallback
  return URL.createObjectURL(file);
}

export const uploadFileToSupabase = uploadFileToStorage;

