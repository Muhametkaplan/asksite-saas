import { CoupleConfig, MapMarker, CouponItem, DiaryEntry } from '@/types/couple';
import { db, isFirebaseConfigured } from './firebase';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';

export const DEMO_COUPLE: CoupleConfig = {
  id: 'irem-muhammet',
  slug: 'irem-muhammet',
  partner1_name: 'İrem',
  partner2_name: 'Muhammet',
  subtitle: 'Bizim Dünyamız ❤️',
  start_date: '2023-01-01T00:00:00.000Z',
  theme_color_primary: '#ff4d6d',
  theme_color_tech: '#6c5ce7',
  bg_music_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  custom_audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  spotify_url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M',
  spotify_lyrics: [
    'Sen benim kalbimin en tatlı melodisisin... 🎶',
    'Gözlerine baktığım an zaman duruyor...',
    'Birlikte yazacağımız nice masallara ❤️',
    'Sensiz geçen her saniye eksik bir parça...',
  ],
  whatsapp_number: '905524185530',
  whatsapp_message: 'Acil sarılmana ihtiyacım var 🥺',
  love_reasons: [
    'Gülüşünle en karanlık günlerimi bile aydınlatıyorsun.',
    'Bana her durumda güç veriyorsun ve hep arkamda duruyorsun.',
    'Seninleyken zamanın nasıl aktığını unutuyorum.',
    'Gözlerinin içi parlayarak güldüğün an dünyadaki her şey güzelleşiyor.',
    'Senin sesin, duyduğum en huzurlu ve en tatlı melodi.',
    'Beni tüm çocuksu hallerimle ve kusurlarımla kusursuz seviyorsun.',
    'Birlikte saçmalayabiliyor, en anlamsız şeylere dakikalarca gülebiliyoruz.',
    'Benim hayattaki en yakın arkadaşım, en sırdaşım ve tek aşkımsın.',
    'Varlığın ve kokun bana evdeymişim hissi veriyor, huzur buluyorum.',
    'Kötü bir gün geçirsem bile sana sarıldığım an her şeyi arkamda bırakabiliyorum.',
    'Geleceğe dair kurduğum her hayalin başrolünde sen varsın.',
    'Küçük sürprizlerinle, bana kendimi dünyanın en şanslı insanı hissettiriyorsun.',
    'Ellerim ellerindeyken kendimi hiç olmadığım kadar güçlü ve cesur hissediyorum.',
    'Sadece sevgilim değil, ruh eşim olduğunu her gün bana hissettiriyorsun.',
    'Dünyadaki en güzel, en yumuşak ve en huzurlu sarılmalara sahipsin.',
  ],
  memories: [
    {
      id: 'm1',
      photo_url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=800&auto=format&fit=crop',
      date: '2023-01-01',
      title: 'İlk Karşılaşmamız ✨',
      note: 'Gözlerinin içine ilk baktığım an dünyadaki tüm sesler sustu.',
    },
    {
      id: 'm2',
      photo_url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=800&auto=format&fit=crop',
      date: '2023-07-15',
      title: 'Deniz Kenarı Gün Batımı 🌅',
      note: 'Rüzgar saçlarını savururken gülüşünü unutmak imkansızdı.',
    },
    {
      id: 'm3',
      photo_url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=800&auto=format&fit=crop',
      date: '2024-02-14',
      title: 'Romantik Mum Işığı Akşamı 🍷',
      note: 'Ellerimiz hiç ayrılmadı, saatlerce geleceğimizi düşledik.',
    },
  ],
  bucket_list: [
    { id: 'b1', title: 'Roma & Venedik Gezisi 🇮🇹', category: 'city', completed: false },
    { id: 'b2', title: 'Kapadokya Balon Turu 🎈', category: 'activity', completed: true },
    { id: 'b3', title: 'Interstellar Sinema Gecesi 🍿', category: 'movie', completed: true },
    { id: 'b4', title: 'Paris’te Eyfel Altında Kahve ☕', category: 'city', completed: false },
    { id: 'b5', title: 'Kuzey Işıkları (Aurora) Kampı 🌌', category: 'activity', completed: false },
  ],
  coupons: [
    {
      id: 'c1',
      title: '1 Saat Kesintisiz Sırt & Omuz Masajı 💆‍♂️',
      description: 'Yorgunluğunu unutturacak yumuşacık ve son derece rahatlatıcı masaj hakkı.',
      category: 'massage',
      icon: '💆‍♂️',
      is_used: false,
    },
    {
      id: 'c2',
      title: 'Soru Sormadan Affedilme & Barışma Kartı 🕊️',
      description: 'Ufak anlaşmazlıklarda koşulsuz şartsız barışma ve sarılma jokeri.',
      category: 'forgive',
      icon: '🕊️',
      is_used: false,
    },
    {
      id: 'c3',
      title: 'İstediğin Filmi & Diziyi Seçme Hakkı 🍿',
      description: 'Bu gece kumanda tamamen sende! Dilediğin yapımı mısır eşliğinde izliyoruz.',
      category: 'movie',
      icon: '🍿',
      is_used: false,
    },
    {
      id: 'c4',
      title: 'En Sevdiğin Restoranda Akşam Yemeği 🍕',
      description: 'Senin seçtiğin mekanda baş başa lezzetli akşam yemeği kaçamağı.',
      category: 'food',
      icon: '🍕',
      is_used: false,
    },
    {
      id: 'c5',
      title: 'Gece Yarısı Dondurma & Tatlı Kaçamağı 🍦',
      description: 'Saat kaç olursa olsun en yakın tatlıcıya gitme sözü.',
      category: 'custom',
      icon: '🍦',
      is_used: true,
      used_at: '2026-02-14T21:30:00.000Z',
    },
  ],
  diary_entries: [
    {
      id: 'd1',
      author: 'Muhammet',
      role: 'partner2',
      date: '2023-01-01',
      content: 'Gözlerinin içine ilk baktığım an dünyadaki tüm gürültüler sustu. İyi ki geldin hayatıma sevgilim.',
      mood: '❤️',
    },
    {
      id: 'd2',
      author: 'İrem',
      role: 'partner1',
      date: '2023-07-15',
      content: 'Deniz kenarında gün batımını izlerken elimi tuttuğun o anı hiç unutmayacağım.',
      mood: '🌅',
    },
    {
      id: 'd3',
      author: 'Muhammet',
      role: 'partner2',
      date: '2024-02-14',
      content: 'Yağmurlu bir akşamda kahvelerimizi yudumlarken geleceğe dair hayaller kurmak harikaydı.',
      mood: '☕',
    },
  ],
  upcoming_event: {
    title: 'Kapadokya Yıl Dönümü Kaçamağı 🎈',
    date: '2026-09-15T00:00:00.000Z',
    location: 'Kapadokya',
  },
  allowed_users: {
    partner1_email: 'irem@asksite.com',
    partner2_email: 'muhammet@asksite.com',
    access_pin: '1234',
    visitor_pin: '1111',
  },
  feature_toggles: {
    spotify: true,
    memory: true,
    bucket_list: true,
    day_night: true,
    countdown: true,
    custom_audio: true,
    canvas: true,
    coupons: true,
  },
};

const localCouplesMemoryStore = new Map<string, CoupleConfig>();
localCouplesMemoryStore.set('irem-muhammet', DEMO_COUPLE);

export async function getCoupleBySlug(slug: string): Promise<CoupleConfig | null> {
  // If Firestore is available, fetch from 'couples' collection
  if (isFirebaseConfigured && db) {
    try {
      const coupleRef = doc(db, 'couples', slug);
      const snap = await getDoc(coupleRef);

      if (snap.exists()) {
        const data = snap.data();

        // Also fetch sub-collections if present
        const memoriesSnap = await getDocs(collection(db, `couples/${slug}/modules_memories`));
        const memories = memoriesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));

        const bucketSnap = await getDocs(collection(db, `couples/${slug}/modules_bucket`));
        const bucketList = bucketSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));

        return {
          id: snap.id,
          slug: data.slug || slug,
          partner1_name: data.names?.partner1 || data.partner1_name || 'Partner 1',
          partner2_name: data.names?.partner2 || data.partner2_name || 'Partner 2',
          subtitle: data.subtitle || 'Bizim Dünyamız ❤️',
          start_date: data.startDate || data.start_date || '2023-01-01T00:00:00.000Z',
          theme_color_primary: data.theme?.primaryColor || data.theme_color_primary || '#ff4d6d',
          theme_color_tech: data.theme?.techColor || data.theme_color_tech || '#6c5ce7',
          bg_music_url: data.bgMusicUrl || data.bg_music_url || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
          custom_audio_url: data.customAudioUrl || data.custom_audio_url || data.bg_music_url,
          spotify_url: data.spotify?.spotifyUrl || data.spotify_url || DEMO_COUPLE.spotify_url,
          spotify_lyrics: data.spotify?.lyrics || data.spotify_lyrics || DEMO_COUPLE.spotify_lyrics,
          whatsapp_number: data.whatsapp?.number || data.whatsapp_number || '905524185530',
          whatsapp_message: data.whatsapp?.message || data.whatsapp_message || 'Acil sarılmana ihtiyacım var 🥺',
          love_reasons: data.love_reasons || DEMO_COUPLE.love_reasons,
          memories: memories.length > 0 ? memories : data.memories || DEMO_COUPLE.memories,
          bucket_list: bucketList.length > 0 ? bucketList : data.bucket_list || DEMO_COUPLE.bucket_list,
          coupons: data.coupons || DEMO_COUPLE.coupons,
          diary_entries: data.diary_entries || DEMO_COUPLE.diary_entries,
          upcoming_event: data.upcoming_event || DEMO_COUPLE.upcoming_event,
          allowed_users: data.allowed_users || DEMO_COUPLE.allowed_users,
          feature_toggles: data.feature_toggles || DEMO_COUPLE.feature_toggles,
          is_active: data.isActive !== undefined ? data.isActive : true,
        };
      } else if (slug === 'irem-muhammet') {
        // Auto-seed demo couple on first request
        await seedDemoCoupleToFirebase();
        return DEMO_COUPLE;
      }
    } catch (e) {
      console.error('Error fetching couple from Firestore:', e);
    }
  }

  // Fallback to local memory store
  if (localCouplesMemoryStore.has(slug)) {
    return localCouplesMemoryStore.get(slug)!;
  }

  return null;
}

export async function saveCoupleConfig(config: CoupleConfig): Promise<CoupleConfig | null> {
  localCouplesMemoryStore.set(config.slug, config);

  if (isFirebaseConfigured && db) {
    try {
      const coupleRef = doc(db, 'couples', config.slug);

      const payload = {
        slug: config.slug,
        partner1_name: config.partner1_name,
        partner2_name: config.partner2_name,
        names: {
          partner1: config.partner1_name,
          partner2: config.partner2_name,
        },
        subtitle: config.subtitle,
        startDate: config.start_date,
        start_date: config.start_date,
        theme: {
          primaryColor: config.theme_color_primary,
          techColor: config.theme_color_tech,
          isDarkMode: false,
          customCss: '',
        },
        theme_color_primary: config.theme_color_primary,
        theme_color_tech: config.theme_color_tech,
        bgMusicUrl: config.bg_music_url,
        bg_music_url: config.bg_music_url,
        customAudioUrl: config.custom_audio_url,
        custom_audio_url: config.custom_audio_url,
        spotify: {
          spotifyUrl: config.spotify_url,
          lyrics: config.spotify_lyrics || [],
        },
        spotify_url: config.spotify_url,
        spotify_lyrics: config.spotify_lyrics || [],
        whatsapp: {
          number: config.whatsapp_number,
          message: config.whatsapp_message,
        },
        whatsapp_number: config.whatsapp_number,
        whatsapp_message: config.whatsapp_message,
        love_reasons: config.love_reasons || [],
        memories: config.memories || [],
        bucket_list: config.bucket_list || [],
        coupons: config.coupons || [],
        diary_entries: config.diary_entries || [],
        upcoming_event: config.upcoming_event || null,
        allowed_users: config.allowed_users || {
          partner1_email: 'irem@asksite.com',
          partner2_email: 'muhammet@asksite.com',
          access_pin: '1234',
          visitor_pin: '1111',
        },
        feature_toggles: config.feature_toggles || {},
        packageType: 'digital',
        isActive: true,
        updatedAt: serverTimestamp(),
      };

      await setDoc(coupleRef, payload, { merge: true });

      return config;
    } catch (e) {
      console.error('Error saving couple to Firestore:', e);
    }
  }

  return config;
}

export async function getMapMarkers(coupleId: string): Promise<MapMarker[]> {
  if (isFirebaseConfigured && db) {
    try {
      const markersRef = collection(db, `couples/${coupleId}/modules_map_markers`);
      const snap = await getDocs(markersRef);
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, couple_id: coupleId, ...d.data() } as MapMarker));
      }
    } catch (e) {
      console.error('Error fetching map markers from Firestore:', e);
    }
  }
  return [];
}

export async function addMapMarker(marker: Omit<MapMarker, 'id' | 'created_at'>): Promise<MapMarker | null> {
  const coupleSlug = marker.couple_id || 'irem-muhammet';

  if (isFirebaseConfigured && db) {
    try {
      const markersRef = collection(db, `couples/${coupleSlug}/modules_map_markers`);
      const docRef = await addDoc(markersRef, {
        lat: marker.lat,
        lng: marker.lng,
        title: marker.title || 'Bizim Aşk Noktamız ❤️',
        createdAt: serverTimestamp(),
      });

      return {
        id: docRef.id,
        couple_id: coupleSlug,
        lat: marker.lat,
        lng: marker.lng,
        title: marker.title,
        created_at: new Date().toISOString(),
      };
    } catch (e) {
      console.error('Error adding map marker to Firestore:', e);
    }
  }

  return {
    id: `local-${Date.now()}`,
    ...marker,
    created_at: new Date().toISOString(),
  };
}

export async function clearMapMarkers(coupleId: string): Promise<boolean> {
  if (isFirebaseConfigured && db) {
    try {
      const markersRef = collection(db, `couples/${coupleId}/modules_map_markers`);
      const snap = await getDocs(markersRef);
      const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletePromises);
      return true;
    } catch (e) {
      console.error('Error clearing map markers in Firestore:', e);
      return false;
    }
  }
  return true;
}

// Seed Demo Couple function
export async function seedDemoCoupleToFirebase(): Promise<boolean> {
  if (isFirebaseConfigured && db) {
    try {
      const coupleRef = doc(db, 'couples', 'irem-muhammet');
      const snap = await getDoc(coupleRef);
      if (!snap.exists()) {
        await saveCoupleConfig(DEMO_COUPLE);
        console.log('Seeded demo couple (irem-muhammet) into Firestore!');
        return true;
      }
    } catch (e) {
      console.error('Failed to seed demo couple to Firestore:', e);
    }
  }
  return false;
}

// ================= PRESENCE STATUS SERVICES =================
export async function updatePartnerPresence(
  slug: string,
  role: 'partner1' | 'partner2',
  isOnline: boolean
): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      const presenceRef = doc(db, `couples/${slug}/presence/status`);
      await setDoc(
        presenceRef,
        {
          [role]: {
            isOnline,
            lastSeen: new Date().toISOString(),
            activeRole: role,
          },
        },
        { merge: true }
      );
    } catch (e) {
      console.error('Error updating presence:', e);
    }
  }
}

export function subscribeToPartnerPresence(
  slug: string,
  callback: (presence: { partner1?: any; partner2?: any }) => void
): () => void {
  if (isFirebaseConfigured && db) {
    const presenceRef = doc(db, `couples/${slug}/presence/status`);
    return onSnapshot(
      presenceRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data());
        } else {
          callback({});
        }
      },
      (error) => console.error('Presence snapshot error:', error)
    );
  }
  return () => {};
}

// ================= REAL-TIME LIVE CANVAS SERVICES =================
export interface CanvasStrokeData {
  id?: string;
  points: Array<{ x: number; y: number }>;
  color: string;
  strokeWidth: number;
  role: 'partner1' | 'partner2' | 'guest';
  timestamp?: number;
}

export async function sendCanvasStroke(slug: string, stroke: CanvasStrokeData): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      const canvasRef = collection(db, `couples/${slug}/modules_canvas`);
      await addDoc(canvasRef, {
        ...stroke,
        createdAt: serverTimestamp(),
        timestamp: Date.now(),
      });
    } catch (e) {
      console.error('Error sending canvas stroke to Firestore:', e);
    }
  }
}

export function subscribeToLiveCanvas(
  slug: string,
  callback: (strokes: CanvasStrokeData[]) => void
): () => void {
  if (isFirebaseConfigured && db) {
    const canvasRef = collection(db, `couples/${slug}/modules_canvas`);
    const q = query(canvasRef, orderBy('createdAt', 'asc'), limit(300));
    return onSnapshot(
      q,
      (snapshot) => {
        const strokes = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CanvasStrokeData));
        callback(strokes);
      },
      (error) => console.error('Canvas snapshot error:', error)
    );
  }
  return () => {};
}

export async function clearLiveCanvas(slug: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      const canvasRef = collection(db, `couples/${slug}/modules_canvas`);
      const snap = await getDocs(canvasRef);
      const deletes = snap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletes);
    } catch (e) {
      console.error('Error clearing live canvas in Firestore:', e);
    }
  }
}

// ================= COUPON SERVICES =================
export async function useCoupon(slug: string, couponId: string): Promise<boolean> {
  const couple = await getCoupleBySlug(slug);
  if (!couple) return false;

  const updatedCoupons = (couple.coupons || []).map((c) =>
    c.id === couponId ? { ...c, is_used: true, used_at: new Date().toISOString() } : c
  );

  const updated = await saveCoupleConfig({
    ...couple,
    coupons: updatedCoupons,
  });

  return !!updated;
}

export async function resetAllCoupons(slug: string): Promise<boolean> {
  const couple = await getCoupleBySlug(slug);
  if (!couple) return false;

  const resetCoupons = (couple.coupons || []).map((c) => ({
    ...c,
    is_used: false,
    used_at: undefined,
  }));

  const updated = await saveCoupleConfig({
    ...couple,
    coupons: resetCoupons,
  });

  return !!updated;
}

// ================= DIARY SERVICES =================
export async function addDiaryEntry(slug: string, entry: Omit<DiaryEntry, 'id'>): Promise<boolean> {
  const couple = await getCoupleBySlug(slug);
  if (!couple) return false;

  const newEntry: DiaryEntry = {
    ...entry,
    id: `d-${Date.now()}`,
  };

  const updatedEntries = [newEntry, ...(couple.diary_entries || [])];

  const updated = await saveCoupleConfig({
    ...couple,
    diary_entries: updatedEntries,
  });

  return !!updated;
}

export async function deleteDiaryEntry(slug: string, entryId: string): Promise<boolean> {
  const couple = await getCoupleBySlug(slug);
  if (!couple) return false;

  const updatedEntries = (couple.diary_entries || []).filter((e) => e.id !== entryId);

  const updated = await saveCoupleConfig({
    ...couple,
    diary_entries: updatedEntries,
  });

  return !!updated;
}
