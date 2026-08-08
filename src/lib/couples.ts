import { CoupleConfig, MapMarker, CouponItem, DiaryEntry, CapsuleItem, MovieItem, QuizQuestion } from '@/types/couple';
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
  partner1_name: 'Partner 1',
  partner2_name: 'Partner 2',
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
      date: '2023-01-01T14:30:00.000Z',
      content: 'Gözlerinin içine ilk baktığım an dünyadaki tüm gürültüler sustu. İyi ki geldin hayatıma sevgilim.',
      mood: '❤️',
    },
    {
      id: 'd2',
      author: 'İrem',
      role: 'partner1',
      date: '2023-07-15T19:45:00.000Z',
      content: 'Deniz kenarında gün batımını izlerken elimi tuttuğun o anı hiç unutmayacağım.',
      mood: '🌅',
    },
    {
      id: 'd3',
      author: 'Muhammet',
      role: 'partner2',
      date: '2024-02-14T21:15:00.000Z',
      content: 'Yağmurlu bir akşamda kahvelerimizi yudumlarken geleceğe dair hayaller kurmak harikaydı.',
      mood: '☕',
    },
  ],
  time_capsules: [
    {
      id: 'tc1',
      title: '1. Yıl Dönümü Gelecek Mektubumuz ⏳',
      content: 'Gelecekteki bize not: Umarım yine böyle sarılarak, gülerek ve aşkla birbirimizin gözlerine bakıyoruzdur. Seni çok seviyorum!',
      open_date: '2026-12-31T00:00:00.000Z',
      created_at: '2023-01-01T00:00:00.000Z',
      creator: 'Muhammet',
      is_opened: false,
    },
    {
      id: 'tc2',
      title: 'İlk Tatil Sürpriz Notu 🏖️',
      content: 'Deniz kenarında tuttuğumuz o ilk dilek gerçekleşti! Birlikte nice tatillere ve güzel anılara.',
      open_date: '2024-01-01T00:00:00.000Z',
      created_at: '2023-07-15T00:00:00.000Z',
      creator: 'İrem',
      is_opened: true,
    },
  ],
  movies: [
    {
      id: 'm1',
      title: 'Interstellar (Yıldızlararası) 🚀',
      genre: 'Bilim Kurgu / Drama',
      poster_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop',
      watch_url: 'https://www.netflix.com',
      rating: 5,
      note: 'Birlikte izlediğimiz en büyüleyici ve duygusal filmlerden biriydi!',
      status: 'watched',
      added_by: 'Muhammet',
      created_at: '2023-02-14T00:00:00.000Z',
    },
    {
      id: 'm2',
      title: 'La La Land (Aşıklar Şehri) 💃',
      genre: 'Romantik / Müzikal',
      poster_url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop',
      watch_url: 'https://www.primevideo.com',
      rating: 5,
      note: 'Müzikleri ve atmosferi harikaydı, son sahnesinde sarıldık.',
      status: 'watched',
      added_by: 'İrem',
      created_at: '2023-05-20T00:00:00.000Z',
    },
    {
      id: 'm3',
      title: 'About Time (Zamanda Aşk) ⏳',
      genre: 'Romantik Komedi',
      poster_url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=600&auto=format&fit=crop',
      watch_url: 'https://www.netflix.com',
      rating: 0,
      note: 'Yağmurlu bir pazar gecesi patlamış mısır eşliğinde izleyeceğiz!',
      status: 'watchlist',
      added_by: 'İrem',
      created_at: '2024-01-10T00:00:00.000Z',
    },
  ],
  wheel_items: [
    '10 Saniye Sımsıkı Sarıl 🫂',
    'İstediğin Bir Şeyi Yaptır 👑',
    'Akşam Yemeği Ismarla 🍕',
    'Sinema Biletleri Benden 🍿',
    'Masaj Yap 💆‍♂️',
    'Romantik Bir Öpücük 💋',
    'Kahve Demle & Yatakta Sun ☕',
    'Soru Sormadan Affet 🕊️',
  ],
  quiz_partner1: [
    {
      id: 'q1-1',
      question: 'Benim en sevdiğim kahve çeşidi hangisidir?',
      options: ['Latte', 'Espresso', 'Iced Americano', 'Türk Kahvesi'],
      correct_index: 3,
      created_by: 'partner1',
    },
    {
      id: 'q1-2',
      question: 'Birlikte gittiğimiz ilk baş başa tatil neresiydi?',
      options: ['Antalya', 'Kapadokya', 'Bodrum', 'Eskişehir'],
      correct_index: 1,
      created_by: 'partner1',
    },
    {
      id: 'q1-3',
      question: 'Birlikteyken en çok neye gülerim?',
      options: ['Kötü Esprilere', 'Kedi / Köpek Videolarına', 'Birlikte Anlattığımız Anılara', 'Komik Filmlere'],
      correct_index: 2,
      created_by: 'partner1',
    },
  ],
  quiz_partner2: [
    {
      id: 'q2-1',
      question: 'Benim en çok sevdiğim yemek nedir?',
      options: ['Mantı / Lahmacun', 'Burger & Patates', 'Ev Yemeği / Kuru Fasulye', 'Pizza'],
      correct_index: 0,
      created_by: 'partner2',
    },
    {
      id: 'q2-2',
      question: 'Yoğun bir günün ardından akşam en sevdiğim aktivite nedir?',
      options: ['Kitap Okumak', 'Birlikte Dizi/Film İzlemek', 'Oyun Oynamak', 'Müzik Dinlemek'],
      correct_index: 1,
      created_by: 'partner2',
    },
    {
      id: 'q2-3',
      question: 'Bana en tatlı ve vazgeçilmez gelen halin hangisi?',
      options: ['Sabah Uykulu Hallerin', 'Bana Sarılman', 'Gülümsemen', 'Hepsi ve Daha Fazlası ❤️'],
      correct_index: 3,
      created_by: 'partner2',
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
          time_capsules: data.time_capsules || DEMO_COUPLE.time_capsules,
          movies: data.movies || DEMO_COUPLE.movies,
          wheel_items: data.wheel_items || DEMO_COUPLE.wheel_items,
          quiz_partner1: data.quiz_partner1 || DEMO_COUPLE.quiz_partner1,
          quiz_partner2: data.quiz_partner2 || DEMO_COUPLE.quiz_partner2,
          partner1_score: data.partner1_score !== undefined ? data.partner1_score : 120,
          partner2_score: data.partner2_score !== undefined ? data.partner2_score : 150,
          quiz_partner1_created_at: data.quiz_partner1_created_at || null,
          quiz_partner2_created_at: data.quiz_partner2_created_at || null,
          quiz_partner1_expires_at: data.quiz_partner1_expires_at || null,
          quiz_partner2_expires_at: data.quiz_partner2_expires_at || null,
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
        time_capsules: config.time_capsules || [],
        movies: config.movies || [],
        wheel_items: config.wheel_items || [],
        quiz_partner1: config.quiz_partner1 || [],
        quiz_partner2: config.quiz_partner2 || [],
        partner1_score: config.partner1_score !== undefined ? config.partner1_score : 120,
        partner2_score: config.partner2_score !== undefined ? config.partner2_score : 150,
        quiz_partner1_created_at: config.quiz_partner1_created_at || null,
        quiz_partner2_created_at: config.quiz_partner2_created_at || null,
        quiz_partner1_expires_at: config.quiz_partner1_expires_at || null,
        quiz_partner2_expires_at: config.quiz_partner2_expires_at || null,
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

export async function deleteMapMarker(coupleId: string, markerId: string): Promise<boolean> {
  if (isFirebaseConfigured && db) {
    try {
      const markerRef = doc(db, `couples/${coupleId}/modules_map_markers`, markerId);
      await deleteDoc(markerRef);
      return true;
    } catch (e) {
      console.error('Error deleting map marker in Firestore:', e);
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

// ================= TIME CAPSULE SERVICES =================
export async function addTimeCapsule(slug: string, capsule: Omit<CapsuleItem, 'id' | 'created_at'>): Promise<boolean> {
  const couple = await getCoupleBySlug(slug);
  if (!couple) return false;

  const newCapsule: CapsuleItem = {
    ...capsule,
    id: `tc-${Date.now()}`,
    created_at: new Date().toISOString(),
    is_opened: false,
  };

  const updatedCapsules = [newCapsule, ...(couple.time_capsules || [])];

  const updated = await saveCoupleConfig({
    ...couple,
    time_capsules: updatedCapsules,
  });

  return !!updated;
}

export async function deleteTimeCapsule(slug: string, capsuleId: string): Promise<boolean> {
  const couple = await getCoupleBySlug(slug);
  if (!couple) return false;

  const updatedCapsules = (couple.time_capsules || []).filter((c) => c.id !== capsuleId);

  const updated = await saveCoupleConfig({
    ...couple,
    time_capsules: updatedCapsules,
  });

  return !!updated;
}

// ================= CINEMA SERVICES =================
export async function addMovie(slug: string, movie: Omit<MovieItem, 'id' | 'created_at'>): Promise<boolean> {
  const couple = await getCoupleBySlug(slug);
  if (!couple) return false;

  const newMovie: MovieItem = {
    ...movie,
    id: `m-${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  const updatedMovies = [newMovie, ...(couple.movies || [])];

  const updated = await saveCoupleConfig({
    ...couple,
    movies: updatedMovies,
  });

  return !!updated;
}

export async function updateMovie(slug: string, updatedMovie: MovieItem): Promise<boolean> {
  const couple = await getCoupleBySlug(slug);
  if (!couple) return false;

  const updatedMovies = (couple.movies || []).map((m) => (m.id === updatedMovie.id ? updatedMovie : m));

  const updated = await saveCoupleConfig({
    ...couple,
    movies: updatedMovies,
  });

  return !!updated;
}

export async function deleteMovie(slug: string, movieId: string): Promise<boolean> {
  const couple = await getCoupleBySlug(slug);
  if (!couple) return false;

  const updatedMovies = (couple.movies || []).filter((m) => m.id !== movieId);

  const updated = await saveCoupleConfig({
    ...couple,
    movies: updatedMovies,
  });

  return !!updated;
}

// ================= WHEEL OF LOVE SERVICES =================
export async function addWheelItem(slug: string, item: string): Promise<boolean> {
  const couple = await getCoupleBySlug(slug);
  if (!couple) return false;

  const updatedItems = [...(couple.wheel_items || []), item];

  const updated = await saveCoupleConfig({
    ...couple,
    wheel_items: updatedItems,
  });

  return !!updated;
}

export async function deleteWheelItem(slug: string, itemIndex: number): Promise<boolean> {
  const couple = await getCoupleBySlug(slug);
  if (!couple) return false;

  const updatedItems = (couple.wheel_items || []).filter((_, idx) => idx !== itemIndex);

  const updated = await saveCoupleConfig({
    ...couple,
    wheel_items: updatedItems,
  });

  return !!updated;
}

// ================= QUIZ SERVICES =================
export async function addQuizQuestion(
  slug: string,
  questionData: Omit<QuizQuestion, 'id'>,
  targetPartner: 'partner1' | 'partner2'
): Promise<boolean> {
  const couple = await getCoupleBySlug(slug);
  if (!couple) return false;

  const nowIso = new Date().toISOString();
  const expiresIso = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const newQuestion: QuizQuestion = {
    ...questionData,
    id: `q-${Date.now()}`,
    created_by: targetPartner,
    points: 10,
    created_at: nowIso,
    expires_at: expiresIso,
  };

  const key = targetPartner === 'partner1' ? 'quiz_partner1' : 'quiz_partner2';
  const updatedQuestions = [...(couple[key] || []), newQuestion];

  const timeKeyCreated = targetPartner === 'partner1' ? 'quiz_partner1_created_at' : 'quiz_partner2_created_at';
  const timeKeyExpires = targetPartner === 'partner1' ? 'quiz_partner1_expires_at' : 'quiz_partner2_expires_at';

  const updated = await saveCoupleConfig({
    ...couple,
    [key]: updatedQuestions,
    [timeKeyCreated]: nowIso,
    [timeKeyExpires]: expiresIso,
  });

  return !!updated;
}

export async function saveQuizScore(
  slug: string,
  solverPartner: 'partner1' | 'partner2',
  pointsEarned: number
): Promise<boolean> {
  const couple = await getCoupleBySlug(slug);
  if (!couple) return false;

  const scoreKey = solverPartner === 'partner1' ? 'partner1_score' : 'partner2_score';
  const currentScore = couple[scoreKey] !== undefined ? couple[scoreKey]! : (solverPartner === 'partner1' ? 120 : 150);
  const newScore = currentScore + pointsEarned;

  const updated = await saveCoupleConfig({
    ...couple,
    [scoreKey]: newScore,
  });

  return !!updated;
}

export async function deleteQuizQuestion(
  slug: string,
  targetPartner: 'partner1' | 'partner2',
  questionId: string
): Promise<boolean> {
  const couple = await getCoupleBySlug(slug);
  if (!couple) return false;

  const key = targetPartner === 'partner1' ? 'quiz_partner1' : 'quiz_partner2';
  const updatedQuestions = (couple[key] || []).filter((q) => q.id !== questionId);

  const updated = await saveCoupleConfig({
    ...couple,
    [key]: updatedQuestions,
  });

  return !!updated;
}

export function formatDiaryDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} - ${hours}:${minutes}`;
  } catch (e) {
    return dateStr;
  }
}
