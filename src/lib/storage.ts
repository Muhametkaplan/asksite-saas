import { supabase, isSupabaseConfigured } from './supabase';

export async function uploadFileToSupabase(
  file: File,
  folder: 'music' | 'photos' = 'photos'
): Promise<string | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('couples-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (data && !error) {
        const { data: publicUrlData } = supabase.storage
          .from('couples-assets')
          .getPublicUrl(fileName);

        return publicUrlData.publicUrl;
      } else {
        console.error('Storage upload error:', error);
      }
    } catch (e) {
      console.error('Exception during file upload:', e);
    }
  }

  // Fallback blob URL for client-side local testing when Supabase is not connected
  return URL.createObjectURL(file);
}
